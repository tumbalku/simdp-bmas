import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";

import { errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { API_RATE_LIMIT_CATEGORY, enforceApiRateLimit } from "@/lib/rate-limit";
import {
  getMasterDataDocumentsPdfData,
  renderMasterDataDocumentsPdfHtml,
} from "@/modules/document/server";
import {
  attachDocumentVerificationFileHash,
  issueMasterDataDocumentsVerification,
} from "@/modules/document-verification/server";
import {
  getActorDisplayName,
  renderHtmlToPdfBuffer,
} from "@/modules/employee/server";
import {
  logActivity,
  SECURITY_EVENT_TYPE,
  SECURITY_LOG_STATUS,
} from "@/modules/security/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const archiveCategories = [
  "PERSONAL",
  "EDUCATION",
  "EMPLOYMENT",
  "CERTIFICATION",
  "LEGAL",
] as const;

const exportQuerySchema = z.object({
  archiveView: z.enum(["active", "archived"]).optional().default("active"),
  search: z.string().trim().max(120).optional(),
  documentTypeId: z.string().trim().max(120).optional(),
  archiveCategory: z.enum(archiveCategories).optional(),
  sortBy: z.enum(["uploadedAt", "expiryDate", "title", "status", "name", "documentType"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

function parseFilter(searchParams: URLSearchParams) {
  return exportQuerySchema.safeParse({
    archiveView:
      searchParams.get("archiveView") === "archived" ? "archived" : "active",
    search: searchParams.get("search") || undefined,
    documentTypeId: searchParams.get("documentTypeId") || undefined,
    archiveCategory: searchParams.get("archiveCategory") || undefined,
    sortBy: searchParams.get("sortBy") || undefined,
    sortOrder: searchParams.get("sortOrder") || undefined,
  });
}

function getTimestamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
}

function sanitizeFilenameSegment(value: string) {
  return (
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100) || "Laporan-Dokumen"
  );
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth("ADMIN");
    const rateLimitResponse = await enforceApiRateLimit(
      request,
      API_RATE_LIMIT_CATEGORY.EXPORT,
      {
        actorId: session.userId,
        actorRole: session.role,
        scope: "master-data-documents-pdf",
      },
    );
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const parsed = parseFilter(searchParams);

    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Filter export PDF dokumen tidak valid.",
        parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
        400,
      );
    }

    const data = await getMasterDataDocumentsPdfData(parsed.data, session);
    const verification = await issueMasterDataDocumentsVerification({
      issuedByUserId: session.userId,
      metadata: {
        reportType: "MASTER_DATA_DOCUMENTS",
        title: data.title,
        rowCount: data.rowCount,
        archiveView: data.archiveView,
        filters: parsed.data,
      },
    });
    const html = renderMasterDataDocumentsPdfHtml(data, { verification });
    const pdf = await renderHtmlToPdfBuffer(html);
    const fileHash = crypto.createHash("sha256").update(pdf).digest("hex");
    await attachDocumentVerificationFileHash(verification.id, fileHash);
    const actorName = await getActorDisplayName(session.userId, "Admin");

    await logActivity({
      actorId: session.userId,
      actorName,
      actorRole: session.role,
      eventType: SECURITY_EVENT_TYPE.DOCUMENT_EXPORTED,
      resource: "MasterDataDocumentsPdf",
      status: SECURITY_LOG_STATUS.SUCCESS,
      metadata: {
        title: data.title,
        rowCount: data.rowCount,
        archiveView: data.archiveView,
        filters: parsed.data,
        verificationCode: verification.code,
      },
    });

    const filename = `${sanitizeFilenameSegment(data.title)}_${getTimestamp()}.pdf`;

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdf.byteLength),
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/v1/documents/export-pdf error:", error);

    if (error instanceof AppError) {
      const message =
        error.code === "UNAUTHENTICATED"
          ? "Sesi tidak valid atau telah berakhir."
          : error.code === "FORBIDDEN"
            ? "Anda tidak memiliki akses untuk export PDF dokumen pegawai."
            : error.message;

      return errorResponse(error.code, message, error.details, error.status);
    }

    return errorResponse(
      "INTERNAL_ERROR",
      "Terjadi kesalahan internal saat export PDF dokumen pegawai.",
      undefined,
      500,
    );
  }
}
