import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { API_RATE_LIMIT_CATEGORY, enforceApiRateLimit } from "@/lib/rate-limit";
import { employeeDirectorySchema } from "@/modules/employee";
import {
  getActorDisplayName,
  getEmployeeDirectoryPdfData,
  renderEmployeeDirectoryPdfHtml,
  renderHtmlToPdfBuffer,
} from "@/modules/employee/server";
import {
  attachDocumentVerificationFileHash,
  issueEmployeeDirectoryVerification,
} from "@/modules/document-verification/server";
import {
  logActivity,
  SECURITY_EVENT_TYPE,
  SECURITY_LOG_STATUS,
} from "@/modules/security/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const officialSchema = z.object({
  name: z.string().trim().min(1, "Nama Pejabat wajib diisi.").max(120),
  position: z.string().trim().min(1, "Jabatan Pejabat wajib diisi.").max(120),
  rank: z
    .string()
    .trim()
    .min(1, "Pangkat/Golongan Pejabat wajib diisi.")
    .max(120),
  nip: z.string().trim().min(1, "NIP Pejabat wajib diisi.").max(40),
});

function parseNonNegativeInt(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function getTimestamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
}

function parseDirectoryFilter(searchParams: URLSearchParams) {
  return employeeDirectorySchema.safeParse({
    archiveView:
      searchParams.get("archiveView") === "archived" ? "archived" : "active",
    search: searchParams.get("search") || undefined,
    employmentStatusId: searchParams.get("employmentStatusId") || undefined,
    employeeGroupId: searchParams.get("employeeGroupId") || undefined,
    professionGroupId: searchParams.get("professionGroupId") || undefined,
    employeePositionId: searchParams.get("employeePositionId") || undefined,
    employeeRankId: searchParams.get("employeeRankId") || undefined,
    workplaceId: searchParams.get("workplaceId") || undefined,
    maritalStatus: searchParams.get("maritalStatus") || undefined,
    lastEducation: searchParams.get("lastEducation") || undefined,
    tmtStartDate: searchParams.get("tmtStartDate") || undefined,
    tmtEndDate: searchParams.get("tmtEndDate") || undefined,
    retirementAgeFrom: parseNonNegativeInt(
      searchParams.get("retirementAgeFrom"),
    ),
    retirementAgeTo: parseNonNegativeInt(searchParams.get("retirementAgeTo")),
    status: searchParams.get("status") || undefined,
  });
}

function parseOfficial(searchParams: URLSearchParams) {
  return officialSchema.safeParse({
    name:
      searchParams.get("officialName") ||
      searchParams.get("directorName") ||
      "",
    position:
      searchParams.get("officialPosition") ||
      searchParams.get("directorPosition") ||
      "",
    rank:
      searchParams.get("officialRank") ||
      searchParams.get("directorRank") ||
      "",
    nip:
      searchParams.get("officialNip") || searchParams.get("directorNip") || "",
  });
}

const paperSizeSchema = z.enum(["A4", "F4", "LEGAL", "LETTER", "A3"]);
const orientationSchema = z.enum(["landscape", "portrait"]);

function parsePdfOptions(searchParams: URLSearchParams) {
  const paperSizeParsed = paperSizeSchema.safeParse(
    (searchParams.get("paperSize") || "A4").toUpperCase(),
  );
  const paperSize = paperSizeParsed.success ? paperSizeParsed.data : "A4";

  const orientationParsed = orientationSchema.safeParse(
    (searchParams.get("orientation") || "landscape").toLowerCase(),
  );
  const orientation = orientationParsed.success ? orientationParsed.data : "landscape";

  const rawSig = searchParams.get("includeSignature");
  const includeSignature = rawSig === null || (rawSig !== "0" && rawSig !== "false");
  const isPreview = searchParams.get("preview") === "1" || searchParams.get("preview") === "true";

  return { paperSize, orientation, includeSignature, isPreview };
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth("ADMIN");

    const { searchParams } = new URL(request.url);
    const parsed = parseDirectoryFilter(searchParams);
    const parsedOfficial = parseOfficial(searchParams);
    const pdfOptions = parsePdfOptions(searchParams);

    // Rate-limit only actual file downloads, not live preview requests
    if (!pdfOptions.isPreview) {
      const rateLimitResponse = await enforceApiRateLimit(
        request,
        API_RATE_LIMIT_CATEGORY.EXPORT,
        {
          actorId: session.userId,
          actorRole: session.role,
          scope: "employee-directory-pdf",
        },
      );
      if (rateLimitResponse) return rateLimitResponse;
    }

    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Filter export PDF tidak valid.",
        parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
        400,
      );
    }

    if (pdfOptions.includeSignature && !parsedOfficial.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Data Pejabat untuk export PDF tidak valid.",
        parsedOfficial.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
        400,
      );
    }

    const officialData = pdfOptions.includeSignature && parsedOfficial.success
      ? parsedOfficial.data
      : undefined;

    const data = await getEmployeeDirectoryPdfData(parsed.data);
    const verification = !pdfOptions.isPreview
      ? await issueEmployeeDirectoryVerification({
          issuedByUserId: session.userId,
          metadata: {
            archiveView: data.archiveView,
            rowCount: data.rowCount,
            filters: parsed.data,
            official: officialData
              ? {
                  name: officialData.name,
                  position: officialData.position,
                  nip: officialData.nip,
                }
              : null,
          },
        })
      : undefined;

    const html = renderEmployeeDirectoryPdfHtml(data, {
      verification,
      paperSize: pdfOptions.paperSize,
      orientation: pdfOptions.orientation,
      includeSignature: pdfOptions.includeSignature,
      official: officialData,
    });
    const pdf = await renderHtmlToPdfBuffer(html);

    // Attach file hash and log security activity only on actual file download (not live preview)
    if (!pdfOptions.isPreview && verification) {
      const fileHash = crypto.createHash("sha256").update(pdf).digest("hex");
      await attachDocumentVerificationFileHash(verification.id, fileHash);

      const actorName = await getActorDisplayName(session.userId, "Admin");
      await logActivity({
        actorId: session.userId,
        actorName,
        actorRole: session.role,
        eventType: SECURITY_EVENT_TYPE.EMPLOYEE_EXPORTED,
        resource: "EmployeeDirectoryPdf",
        status: SECURITY_LOG_STATUS.SUCCESS,
        metadata: {
          rowCount: data.rowCount,
          archiveView: data.archiveView,
          verificationCode: verification.code,
          officialName: officialData?.name ?? null,
          officialPosition: officialData?.position ?? null,
          paperSize: pdfOptions.paperSize,
          orientation: pdfOptions.orientation,
          includeSignature: pdfOptions.includeSignature,
        },
      });
    }

    const filename = `Laporan-Kepegawaian_${data.archiveView}_${getTimestamp()}.pdf`;
    const dispositionType = pdfOptions.isPreview ? "inline" : "attachment";

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdf.byteLength),
        "Content-Disposition": `${dispositionType}; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/v1/employees/export-pdf error:", error);

    if (error instanceof AppError) {
      const message =
        error.code === "UNAUTHENTICATED"
          ? "Sesi tidak valid atau telah berakhir."
          : error.code === "FORBIDDEN"
            ? "Anda tidak memiliki akses untuk export PDF data pegawai."
            : error.message;

      return errorResponse(error.code, message, error.details, error.status);
    }

    return errorResponse(
      "INTERNAL_ERROR",
      "Terjadi kesalahan internal saat export PDF data pegawai.",
      undefined,
      500,
    );
  }
}
