import crypto from "crypto";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { AppError } from "@/lib/errors";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  enforceApiRateLimit: vi.fn(),
  getActorDisplayName: vi.fn(),
  getEmployeeDirectoryPdfData: vi.fn(),
  renderEmployeeDirectoryPdfHtml: vi.fn(),
  renderHtmlToPdfBuffer: vi.fn(),
  attachDocumentVerificationFileHash: vi.fn(),
  issueEmployeeDirectoryVerification: vi.fn(),
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
  getEmployeeDirectoryPdfData: mocks.getEmployeeDirectoryPdfData,
  renderEmployeeDirectoryPdfHtml: mocks.renderEmployeeDirectoryPdfHtml,
  renderHtmlToPdfBuffer: mocks.renderHtmlToPdfBuffer,
}));

vi.mock("@/modules/document-verification/server", () => ({
  attachDocumentVerificationFileHash: mocks.attachDocumentVerificationFileHash,
  issueEmployeeDirectoryVerification: mocks.issueEmployeeDirectoryVerification,
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

describe("GET /api/v1/employees/export-pdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockResolvedValue({ userId: "admin-1", role: "ADMIN" });
    mocks.enforceApiRateLimit.mockResolvedValue(null);
    mocks.getActorDisplayName.mockResolvedValue("Admin SIMDP");
    mocks.getEmployeeDirectoryPdfData.mockResolvedValue({
      archiveView: "active",
      rowCount: 2,
      rows: [],
    });
    mocks.issueEmployeeDirectoryVerification.mockResolvedValue({
      id: "verification-1",
      code: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
      verifyUrl: "http://localhost:3000/verify-document?code=SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
      qrCodeDataUrl: "data:image/png;base64,qr",
    });
    mocks.renderEmployeeDirectoryPdfHtml.mockReturnValue("<html>pdf</html>");
    mocks.renderHtmlToPdfBuffer.mockResolvedValue(Buffer.from("pdf body"));
    mocks.attachDocumentVerificationFileHash.mockResolvedValue(undefined);
    mocks.logActivity.mockResolvedValue(undefined);
  });

  it("exports an admin PDF with the requested filters, verification hash, audit log, and safe attachment headers", async () => {
    const request = new Request(
      "http://localhost/api/v1/employees/export-pdf?search=siti&archiveView=active&employmentStatusId=status-1&workplaceId=workplace-1&retirementAgeFrom=50&retirementAgeTo=58&officialName=dr.%20Pejabat&officialPosition=Direktur&officialRank=Pembina%20Utama&officialNip=197001012000121001",
      { headers: { "x-forwarded-for": "127.0.0.1" } },
    );

    const response = await GET(request);
    const body = Buffer.from(await response.arrayBuffer()).toString("utf8");
    const expectedHash = crypto.createHash("sha256").update(Buffer.from("pdf body")).digest("hex");

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Length")).toBe(String(Buffer.from("pdf body").byteLength));
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Content-Disposition")).toMatch(
      /^attachment; filename="Laporan-Kepegawaian_active_\d{8}_\d{4}\.pdf"$/,
    );
    expect(body).toBe("pdf body");

    expect(mocks.requireAuth).toHaveBeenCalledWith("ADMIN");
    expect(mocks.enforceApiRateLimit).toHaveBeenCalledWith(request, "EXPORT", {
      actorId: "admin-1",
      actorRole: "ADMIN",
      scope: "employee-directory-pdf",
    });
    expect(mocks.getEmployeeDirectoryPdfData).toHaveBeenCalledWith({
      archiveView: "active",
      search: "siti",
      employmentStatusId: "status-1",
      workplaceId: "workplace-1",
      retirementAgeFrom: 50,
      retirementAgeTo: 58,
    });
    expect(mocks.issueEmployeeDirectoryVerification).toHaveBeenCalledWith({
      issuedByUserId: "admin-1",
      metadata: {
        archiveView: "active",
        rowCount: 2,
        filters: {
          archiveView: "active",
          search: "siti",
          employmentStatusId: "status-1",
          workplaceId: "workplace-1",
          retirementAgeFrom: 50,
          retirementAgeTo: 58,
        },
        official: {
          name: "dr. Pejabat",
          position: "Direktur",
          nip: "197001012000121001",
        },
      },
    });
    expect(mocks.renderEmployeeDirectoryPdfHtml).toHaveBeenCalledWith(
      { archiveView: "active", rowCount: 2, rows: [] },
      {
        verification: expect.objectContaining({
          id: "verification-1",
          code: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
        }),
        official: {
          name: "dr. Pejabat",
          position: "Direktur",
          rank: "Pembina Utama",
          nip: "197001012000121001",
        },
      },
    );
    expect(mocks.attachDocumentVerificationFileHash).toHaveBeenCalledWith("verification-1", expectedHash);
    expect(mocks.logActivity).toHaveBeenCalledWith({
      actorId: "admin-1",
      actorName: "Admin SIMDP",
      actorRole: "ADMIN",
      eventType: "EMPLOYEE_EXPORTED",
      resource: "EmployeeDirectoryPdf",
      status: "SUCCESS",
      metadata: {
        rowCount: 2,
        archiveView: "active",
        verificationCode: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
        officialName: "dr. Pejabat",
        officialPosition: "Direktur",
      },
    });
  });

  it("rejects admin requests without official data before creating a verification", async () => {
    const response = await GET(new Request("http://localhost/api/v1/employees/export-pdf?search=siti"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toEqual(
      expect.objectContaining({
        code: "VALIDATION_ERROR",
        message: "Data Pejabat untuk export PDF tidak valid.",
      }),
    );
    expect(mocks.issueEmployeeDirectoryVerification).not.toHaveBeenCalled();
    expect(mocks.renderHtmlToPdfBuffer).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests without creating a verification", async () => {
    mocks.requireAuth.mockRejectedValue(new AppError("UNAUTHENTICATED", "Unauthenticated", 401));

    const response = await GET(new Request("http://localhost/api/v1/employees/export-pdf"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toEqual({
      code: "UNAUTHENTICATED",
      message: "Sesi tidak valid atau telah berakhir.",
    });
    expect(mocks.issueEmployeeDirectoryVerification).not.toHaveBeenCalled();
    expect(mocks.renderHtmlToPdfBuffer).not.toHaveBeenCalled();
  });

  it("rejects non-admin requests without creating a verification", async () => {
    mocks.requireAuth.mockRejectedValue(new AppError("FORBIDDEN", "Forbidden", 403));

    const response = await GET(new Request("http://localhost/api/v1/employees/export-pdf"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toEqual({
      code: "FORBIDDEN",
      message: "Anda tidak memiliki akses untuk export PDF data pegawai.",
    });
    expect(mocks.issueEmployeeDirectoryVerification).not.toHaveBeenCalled();
    expect(mocks.renderHtmlToPdfBuffer).not.toHaveBeenCalled();
  });
});
