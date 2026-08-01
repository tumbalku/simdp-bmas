import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { requireAuth } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { API_RATE_LIMIT_CATEGORY, enforceApiRateLimit } from "@/lib/rate-limit";
import {
  getActorDisplayName,
  getEmployeeProfilePdfData,
  renderEmployeeDocumentsPdfHtml,
  renderHtmlToPdfBuffer,
} from "@/modules/employee/server";
import {
  attachDocumentVerificationFileHash,
  issueEmployeeDocumentsVerification,
} from "@/modules/document-verification/server";
import { logActivity, SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitizeFilenameSegment(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "pegawai";
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const rateLimitResponse = await enforceApiRateLimit(request, API_RATE_LIMIT_CATEGORY.EXPORT, {
      actorId: session.userId,
      actorRole: session.role,
      scope: "employee-documents-pdf",
    });
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const isOwner = session.employeeId === id;
    const isAdmin = session.role === "ADMIN";

    if (!isAdmin && !isOwner) {
      return errorResponse(
        "FORBIDDEN",
        "Anda hanya dapat mengunduh laporan dokumen milik sendiri.",
        undefined,
        403,
      );
    }

    const data = await getEmployeeProfilePdfData(id, {
      includeProfile: false,
      documentStatuses: undefined,
    });

    if (!data) {
      return errorResponse("NOT_FOUND", "Pegawai tidak ditemukan.", undefined, 404);
    }

    const verification = await issueEmployeeDocumentsVerification({
      employeeId: id,
      issuedByUserId: session.userId,
      metadata: {
        reportType: "EMPLOYEE_DOCUMENTS",
        documentCount: data.documents.length,
      },
    });
    const html = renderEmployeeDocumentsPdfHtml(data, { verification });
    const pdf = await renderHtmlToPdfBuffer(html);
    const fileHash = crypto.createHash("sha256").update(pdf).digest("hex");
    await attachDocumentVerificationFileHash(verification.id, fileHash);

    const actorName = await getActorDisplayName(session.userId, "User");
    await logActivity({
      actorId: session.userId,
      actorName,
      actorRole: session.role,
      eventType: SECURITY_EVENT_TYPE.EMPLOYEE_EXPORTED,
      resource: `EmployeeDocumentsPdf:${id}`,
      status: SECURITY_LOG_STATUS.SUCCESS,
      metadata: {
        employeeId: id,
        documentCount: data.documents.length,
        verificationCode: verification.code,
      },
    });

    const filename = `Laporan-Dokumen_${sanitizeFilenameSegment(data.employee.name)}_${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`;

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdf.byteLength),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/v1/employees/[id]/documents-pdf error:", error);

    if (error instanceof AppError) {
      const message =
        error.code === "UNAUTHENTICATED"
          ? "Sesi tidak valid atau telah berakhir."
          : error.code === "FORBIDDEN"
            ? "Anda tidak memiliki akses untuk mengunduh laporan dokumen pegawai."
            : error.message;

      return errorResponse(error.code, message, error.details, error.status);
    }

    return errorResponse("INTERNAL_ERROR", "Terjadi kesalahan internal saat membuat PDF dokumen pegawai.", undefined, 500);
  }
}
