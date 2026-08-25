import crypto from "crypto";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

import { AppError } from "@/lib/errors";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  enforceApiRateLimit: vi.fn(),
  getActorDisplayName: vi.fn(),
  getEmployeeProfilePdfData: vi.fn(),
  renderEmployeeDocumentsPdfHtml: vi.fn(),
  renderHtmlToPdfBuffer: vi.fn(),
  attachDocumentVerificationFileHash: vi.fn(),
  issueEmployeeDocumentsVerification: vi.fn(),
  logActivity: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/rate-limit", () => ({
  API_RATE_LIMIT_CATEGORY: {
    EXPORT: "EXPORT",
  },
  enforceApiRateLimit: mocks.enforceApiRateLimit,
}));

vi.mock("@/modules/employee/server", () => ({
  getActorDisplayName: mocks.getActorDisplayName,
  getEmployeeProfilePdfData: mocks.getEmployeeProfilePdfData,
  renderEmployeeDocumentsPdfHtml: mocks.renderEmployeeDocumentsPdfHtml,
  renderHtmlToPdfBuffer: mocks.renderHtmlToPdfBuffer,
}));

vi.mock("@/modules/document-verification/server", () => ({
  attachDocumentVerificationFileHash: mocks.attachDocumentVerificationFileHash,
  issueEmployeeDocumentsVerification: mocks.issueEmployeeDocumentsVerification,
}));

vi.mock("@/modules/security/server", () => ({
  logActivity: mocks.logActivity,
  SECURITY_EVENT_TYPE: {
    EMPLOYEE_EXPORTED: "EMPLOYEE_EXPORTED",
  },
  SECURITY_LOG_STATUS: {
    SUCCESS: "SUCCESS",
  },
}));

import { GET } from "./route";

function asNextRequest(request: Request) {
  return request as NextRequest;
}

describe("GET /api/v1/employees/[id]/documents-pdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockResolvedValue({ userId: "admin-1", role: "ADMIN", employeeId: "admin-emp" });
    mocks.enforceApiRateLimit.mockResolvedValue(null);
    mocks.getActorDisplayName.mockResolvedValue("Admin SiCantIK");
    mocks.getEmployeeProfilePdfData.mockResolvedValue({
      employee: {
        id: "emp-1",
        name: "Siti Aminah",
      },
      documents: [{ id: "doc-1" }, { id: "doc-2" }],
    });
    mocks.issueEmployeeDocumentsVerification.mockResolvedValue({
      id: "verification-1",
      code: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
      verifyUrl: "http://localhost:3000/verify-document?code=SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
      qrCodeDataUrl: "data:image/png;base64,qr",
    });
    mocks.renderEmployeeDocumentsPdfHtml.mockReturnValue("<html>pdf</html>");
    mocks.renderHtmlToPdfBuffer.mockResolvedValue(Buffer.from("documents pdf"));
    mocks.attachDocumentVerificationFileHash.mockResolvedValue(undefined);
    mocks.logActivity.mockResolvedValue(undefined);
  });

  it("allows admin to download an employee document report PDF", async () => {
    const request = asNextRequest(new Request("http://localhost/api/v1/employees/emp-1/documents-pdf"));

    const response = await GET(request, { params: Promise.resolve({ id: "emp-1" }) });
    const body = Buffer.from(await response.arrayBuffer()).toString("utf8");
    const expectedHash = crypto.createHash("sha256").update(Buffer.from("documents pdf")).digest("hex");

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Length")).toBe(String(Buffer.from("documents pdf").byteLength));
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Content-Disposition")).toMatch(
      /^attachment; filename="Laporan-Dokumen_Siti-Aminah_\d{4}-\d{2}-\d{2}\.pdf"; filename\*=UTF-8''Laporan-Dokumen_Siti-Aminah_\d{4}-\d{2}-\d{2}\.pdf$/,
    );
    expect(body).toBe("documents pdf");

    expect(mocks.requireAuth).toHaveBeenCalledWith();
    expect(mocks.enforceApiRateLimit).toHaveBeenCalledWith(request, "EXPORT", {
      actorId: "admin-1",
      actorRole: "ADMIN",
      scope: "employee-documents-pdf",
    });
    expect(mocks.getEmployeeProfilePdfData).toHaveBeenCalledWith("emp-1", {
      includeProfile: false,
      documentStatuses: undefined,
    });
    expect(mocks.issueEmployeeDocumentsVerification).toHaveBeenCalledWith({
      employeeId: "emp-1",
      issuedByUserId: "admin-1",
      metadata: {
        reportType: "EMPLOYEE_DOCUMENTS",
        documentCount: 2,
      },
    });
    expect(mocks.renderEmployeeDocumentsPdfHtml).toHaveBeenCalledWith(
      expect.objectContaining({
        employee: expect.objectContaining({ id: "emp-1", name: "Siti Aminah" }),
      }),
      {
        verification: {
          id: "verification-1",
          code: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
          verifyUrl: "http://localhost:3000/verify-document?code=SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
          qrCodeDataUrl: "data:image/png;base64,qr",
        },
      },
    );
    expect(mocks.attachDocumentVerificationFileHash).toHaveBeenCalledWith("verification-1", expectedHash);
    expect(mocks.logActivity).toHaveBeenCalledWith({
      actorId: "admin-1",
      actorName: "Admin SiCantIK",
      actorRole: "ADMIN",
      eventType: "EMPLOYEE_EXPORTED",
      resource: "EmployeeDocumentsPdf:emp-1",
      status: "SUCCESS",
      metadata: {
        employeeId: "emp-1",
        documentCount: 2,
        verificationCode: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
      },
    });
  });

  it("allows the owning employee to download their own document report PDF", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" });

    const response = await GET(asNextRequest(new Request("http://localhost/api/v1/employees/emp-1/documents-pdf")), {
      params: Promise.resolve({ id: "emp-1" }),
    });

    expect(response.status).toBe(200);
    expect(mocks.getEmployeeProfilePdfData).toHaveBeenCalledWith("emp-1", {
      includeProfile: false,
      documentStatuses: undefined,
    });
  });

  it("rejects staff and non-owner employee access before rendering the PDF", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "staff-1", role: "STAFF", employeeId: "staff-emp" });

    const response = await GET(asNextRequest(new Request("http://localhost/api/v1/employees/emp-1/documents-pdf")), {
      params: Promise.resolve({ id: "emp-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toEqual({
      code: "FORBIDDEN",
      message: "Anda hanya dapat mengunduh laporan dokumen milik sendiri.",
    });
    expect(mocks.getEmployeeProfilePdfData).not.toHaveBeenCalled();
    expect(mocks.issueEmployeeDocumentsVerification).not.toHaveBeenCalled();
    expect(mocks.renderHtmlToPdfBuffer).not.toHaveBeenCalled();
    expect(mocks.logActivity).not.toHaveBeenCalled();
  });

  it("returns not found when the employee does not exist", async () => {
    mocks.getEmployeeProfilePdfData.mockResolvedValue(null);

    const response = await GET(asNextRequest(new Request("http://localhost/api/v1/employees/missing/documents-pdf")), {
      params: Promise.resolve({ id: "missing" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toEqual({
      code: "NOT_FOUND",
      message: "Pegawai tidak ditemukan.",
    });
    expect(mocks.issueEmployeeDocumentsVerification).not.toHaveBeenCalled();
    expect(mocks.renderHtmlToPdfBuffer).not.toHaveBeenCalled();
    expect(mocks.logActivity).not.toHaveBeenCalled();
  });

  it("maps auth errors to safe messages", async () => {
    mocks.requireAuth.mockRejectedValue(new AppError("UNAUTHENTICATED", "Unauthenticated", 401));

    const response = await GET(asNextRequest(new Request("http://localhost/api/v1/employees/emp-1/documents-pdf")), {
      params: Promise.resolve({ id: "emp-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toEqual({
      code: "UNAUTHENTICATED",
      message: "Sesi tidak valid atau telah berakhir.",
    });
    expect(mocks.renderHtmlToPdfBuffer).not.toHaveBeenCalled();
  });
});
