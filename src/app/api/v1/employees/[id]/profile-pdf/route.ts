import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { DOCUMENT_STATUS_OPTIONS, type DocumentStatus } from "@/modules/document";
import {
  getActorDisplayName,
  getEmployeeProfilePdfData,
  renderEmployeeProfilePdfHtml,
  renderHtmlToPdfBuffer,
} from "@/modules/employee/server";
import { logActivity, SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";

export const runtime = "nodejs";

const documentStatusValues = DOCUMENT_STATUS_OPTIONS.map((option) => option.value) as [DocumentStatus, ...DocumentStatus[]];

const exportQuerySchema = z
  .object({
    profile: z.enum(["0", "1"]).optional().default("1"),
    documents: z.enum(["none", "all", "status"]).optional().default("all"),
    status: z.array(z.enum(documentStatusValues)).optional().default([]),
  })
  .superRefine((value, ctx) => {
    if (value.profile === "0" && value.documents === "none") {
      ctx.addIssue({
        code: "custom",
        message: "Pilih minimal profil atau dokumen untuk dicetak.",
        path: ["profile"],
      });
    }

    if (value.documents === "status" && value.status.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Pilih minimal satu status dokumen.",
        path: ["status"],
      });
    }
  });

function buildQuery(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return {
    profile: searchParams.get("profile") ?? undefined,
    documents: searchParams.get("documents") ?? undefined,
    status: searchParams.getAll("status"),
  };
}

function sanitizeFilenameSegment(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "pegawai";
}

function buildDocumentStatuses(documents: "none" | "all" | "status", status: DocumentStatus[]) {
  if (documents === "none") return [];
  if (documents === "all") return undefined;
  return status;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    if (session.role === "EMPLOYEE" && session.employeeId !== id) {
      return errorResponse("FORBIDDEN", "Anda hanya bisa mencetak profil sendiri.", undefined, 403);
    }

    const parsed = exportQuerySchema.safeParse(buildQuery(request));
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      return errorResponse("VALIDATION_ERROR", "Opsi cetak tidak valid.", details, 400);
    }

    const includeProfile = parsed.data.profile === "1";
    const documentStatuses = buildDocumentStatuses(parsed.data.documents, parsed.data.status);
    const data = await getEmployeeProfilePdfData(id, {
      includeProfile,
      documentStatuses,
    });

    if (!data) {
      return errorResponse("NOT_FOUND", "Pegawai tidak ditemukan.", undefined, 404);
    }

    const html = renderEmployeeProfilePdfHtml(data, { includeProfile });
    const pdf = await renderHtmlToPdfBuffer(html);
    const actorName = await getActorDisplayName(session.userId, "User");

    await logActivity({
      actorId: session.userId,
      actorName,
      actorRole: session.role,
      eventType: SECURITY_EVENT_TYPE.EMPLOYEE_EXPORTED,
      resource: `EmployeeProfilePdf:${id}`,
      status: SECURITY_LOG_STATUS.SUCCESS,
      metadata: {
        includeProfile,
        documents: parsed.data.documents,
        statuses: documentStatuses ?? "ALL",
      },
    });

    const filename = `Profil-Pegawai_${sanitizeFilenameSegment(data.employee.name)}_${new Date().toISOString().slice(0, 10)}.pdf`;
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("Employee profile PDF export error:", error);
    if (error instanceof AppError) {
      return errorResponse(error.code, error.message, error.details, error.status);
    }
    const message = error instanceof Error ? error.message : "Terjadi kesalahan internal";
    return errorResponse("INTERNAL_ERROR", message, undefined, 500);
  }
}
