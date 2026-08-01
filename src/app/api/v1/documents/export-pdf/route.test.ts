import { describe, expect, it, vi, beforeEach } from "vitest";

import { AppError } from "@/lib/errors";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  enforceApiRateLimit: vi.fn(),
  getMasterDataDocumentsPdfData: vi.fn(),
  renderMasterDataDocumentsPdfHtml: vi.fn(),
  attachDocumentVerificationFileHash: vi.fn(),
  getActorDisplayName: vi.fn(),
  issueMasterDataDocumentsVerification: vi.fn(),
  renderHtmlToPdfBuffer: vi.fn(),
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

vi.mock("@/modules/document/server", () => ({
  getMasterDataDocumentsPdfData: mocks.getMasterDataDocumentsPdfData,
  renderMasterDataDocumentsPdfHtml: mocks.renderMasterDataDocumentsPdfHtml,
}));

vi.mock("@/modules/document-verification/server", () => ({
  attachDocumentVerificationFileHash: mocks.attachDocumentVerificationFileHash,
  issueMasterDataDocumentsVerification: mocks.issueMasterDataDocumentsVerification,
}));

vi.mock("@/modules/employee/server", () => ({
  getActorDisplayName: mocks.getActorDisplayName,
  renderHtmlToPdfBuffer: mocks.renderHtmlToPdfBuffer,
}));

vi.mock("@/modules/security/server", () => ({
  logActivity: mocks.logActivity,
  SECURITY_EVENT_TYPE: {
    DOCUMENT_EXPORTED: "DOCUMENT_EXPORTED",
  },
  SECURITY_LOG_STATUS: {
    SUCCESS: "SUCCESS",
  },
}));

import { GET } from "./route";

describe("GET /api/v1/documents/export-pdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockResolvedValue({ userId: "admin-1", role: "ADMIN", employeeId: "admin-emp" });
    mocks.enforceApiRateLimit.mockResolvedValue(null);
    mocks.getActorDisplayName.mockResolvedValue("Admin SIMDP");
    mocks.getMasterDataDocumentsPdfData.mockResolvedValue({
      title: "Laporan Dokumen KTP (Personal) Pegawai",
      archiveView: "active",
      rowCount: 2,
      rows: [],
    });
    mocks.issueMasterDataDocumentsVerification.mockResolvedValue({
      id: "verification-1",
      code: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
      verifyUrl: "http://localhost:3000/verify-document?code=SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
      qrCodeDataUrl: "data:image/png;base64,qr",
    });
    mocks.renderMasterDataDocumentsPdfHtml.mockReturnValue("<html>pdf</html>");
    mocks.renderHtmlToPdfBuffer.mockResolvedValue(Buffer.from("document report pdf"));
    mocks.attachDocumentVerificationFileHash.mockResolvedValue(undefined);
    mocks.logActivity.mockResolvedValue(undefined);
  });

  it("exports an admin PDF using the active filters and safe attachment headers", async () => {
    const request = new Request(
      "http://localhost/api/v1/documents/export-pdf?documentTypeId=type-ktp&archiveCategory=PERSONAL&search=siti",
    );

    const response = await GET(request);
    const body = Buffer.from(await response.arrayBuffer()).toString("utf8");

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Length")).toBe(String(Buffer.from("document report pdf").byteLength));
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Content-Disposition")).toMatch(
      /^attachment; filename="Laporan-Dokumen-KTP-Personal-Pegawai_\d{8}_\d{4}\.pdf"$/,
    );
    expect(body).toBe("document report pdf");

    expect(mocks.requireAuth).toHaveBeenCalledWith("ADMIN");
    expect(mocks.enforceApiRateLimit).toHaveBeenCalledWith(request, "EXPORT", {
      actorId: "admin-1",
      actorRole: "ADMIN",
      scope: "master-data-documents-pdf",
    });
    expect(mocks.getMasterDataDocumentsPdfData).toHaveBeenCalledWith(
      {
        archiveView: "active",
        documentTypeId: "type-ktp",
        archiveCategory: "PERSONAL",
        search: "siti",
      },
      { userId: "admin-1", role: "ADMIN", employeeId: "admin-emp" },
    );
    expect(mocks.issueMasterDataDocumentsVerification).toHaveBeenCalledWith({
      issuedByUserId: "admin-1",
      metadata: {
        reportType: "MASTER_DATA_DOCUMENTS",
        title: "Laporan Dokumen KTP (Personal) Pegawai",
        rowCount: 2,
        archiveView: "active",
        filters: {
          archiveView: "active",
          documentTypeId: "type-ktp",
          archiveCategory: "PERSONAL",
          search: "siti",
        },
      },
    });
    expect(mocks.renderMasterDataDocumentsPdfHtml).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Laporan Dokumen KTP (Personal) Pegawai" }),
      expect.objectContaining({
        verification: expect.objectContaining({
          code: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
          qrCodeDataUrl: "data:image/png;base64,qr",
        }),
      }),
    );
    expect(mocks.attachDocumentVerificationFileHash).toHaveBeenCalledWith("verification-1", expect.any(String));
    expect(mocks.logActivity).toHaveBeenCalledWith({
      actorId: "admin-1",
      actorName: "Admin SIMDP",
      actorRole: "ADMIN",
      eventType: "DOCUMENT_EXPORTED",
      resource: "MasterDataDocumentsPdf",
      status: "SUCCESS",
      metadata: {
        title: "Laporan Dokumen KTP (Personal) Pegawai",
        rowCount: 2,
        archiveView: "active",
        filters: {
          archiveView: "active",
          documentTypeId: "type-ktp",
          archiveCategory: "PERSONAL",
          search: "siti",
        },
        verificationCode: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
      },
    });
  });

  it("rejects non-admin requests before building PDF data", async () => {
    mocks.requireAuth.mockRejectedValue(new AppError("FORBIDDEN", "Forbidden", 403));

    const response = await GET(new Request("http://localhost/api/v1/documents/export-pdf"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toEqual({
      code: "FORBIDDEN",
      message: "Anda tidak memiliki akses untuk export PDF dokumen pegawai.",
    });
    expect(mocks.getMasterDataDocumentsPdfData).not.toHaveBeenCalled();
    expect(mocks.issueMasterDataDocumentsVerification).not.toHaveBeenCalled();
    expect(mocks.renderHtmlToPdfBuffer).not.toHaveBeenCalled();
  });

  it("rejects invalid archive category filters", async () => {
    const response = await GET(new Request("http://localhost/api/v1/documents/export-pdf?archiveCategory=INVALID"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toEqual(
      expect.objectContaining({
        code: "VALIDATION_ERROR",
        message: "Filter export PDF dokumen tidak valid.",
      }),
    );
    expect(mocks.getMasterDataDocumentsPdfData).not.toHaveBeenCalled();
    expect(mocks.issueMasterDataDocumentsVerification).not.toHaveBeenCalled();
    expect(mocks.renderHtmlToPdfBuffer).not.toHaveBeenCalled();
  });
});
