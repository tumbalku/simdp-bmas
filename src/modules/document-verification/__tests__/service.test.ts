import { beforeEach, describe, expect, it, vi } from "vitest";

import { mockPrisma } from "../../../../tests/setup";
import {
  attachDocumentVerificationFileHash,
  issueEmployeeDirectoryVerification,
  issueEmployeeDocumentsVerification,
  issueEmployeeProfileVerification,
  issueMasterDataDocumentsVerification,
  verifyDocumentCode,
} from "../service";

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,qr"),
  },
}));

describe("document verification service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  });

  it("issues an employee profile verification with QR URL only", async () => {
    mockPrisma.documentVerification.create.mockResolvedValue({
      id: "verification-1",
      code: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
    });

    const result = await issueEmployeeProfileVerification({
      employeeId: "emp-1",
      issuedByUserId: "user-1",
      metadata: { includeProfile: true },
    });

    expect(mockPrisma.documentVerification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        documentType: "EMPLOYEE_PROFILE",
        subjectEmployeeId: "emp-1",
        issuedByUserId: "user-1",
        metadata: { includeProfile: true },
      }),
    });
    expect(result).toEqual({
      id: "verification-1",
      code: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
      verifyUrl: "http://localhost:3000/verify-document?code=SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
      qrCodeDataUrl: "data:image/png;base64,qr",
    });
  });

  it("issues an employee directory verification without a subject employee", async () => {
    mockPrisma.documentVerification.create.mockResolvedValue({
      id: "verification-directory",
      code: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
    });

    const result = await issueEmployeeDirectoryVerification({
      issuedByUserId: "admin-1",
      metadata: { rowCount: 12 },
    });

    expect(mockPrisma.documentVerification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        documentType: "EMPLOYEE_DIRECTORY",
        subjectEmployeeId: null,
        issuedByUserId: "admin-1",
        metadata: { rowCount: 12 },
      }),
    });
    expect(result.verifyUrl).toBe(
      "http://localhost:3000/verify-document?code=SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
    );
  });

  it("issues an employee documents verification with a subject employee", async () => {
    mockPrisma.documentVerification.create.mockResolvedValue({
      id: "verification-documents",
      code: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
    });

    const result = await issueEmployeeDocumentsVerification({
      employeeId: "emp-1",
      issuedByUserId: "user-1",
      metadata: { documentCount: 4 },
    });

    expect(mockPrisma.documentVerification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        documentType: "EMPLOYEE_DOCUMENTS",
        subjectEmployeeId: "emp-1",
        issuedByUserId: "user-1",
        metadata: { documentCount: 4 },
      }),
    });
    expect(result.verifyUrl).toBe(
      "http://localhost:3000/verify-document?code=SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
    );
  });

  it("issues a master data documents verification without a subject employee", async () => {
    mockPrisma.documentVerification.create.mockResolvedValue({
      id: "verification-master-documents",
      code: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
    });

    const result = await issueMasterDataDocumentsVerification({
      issuedByUserId: "admin-1",
      metadata: { rowCount: 12 },
    });

    expect(mockPrisma.documentVerification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        documentType: "EMPLOYEE_DOCUMENTS",
        subjectEmployeeId: null,
        issuedByUserId: "admin-1",
        metadata: { rowCount: 12 },
      }),
    });
    expect(result.verifyUrl).toBe(
      "http://localhost:3000/verify-document?code=SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
    );
  });


  it("attaches the generated PDF hash to an issued verification", async () => {
    mockPrisma.documentVerification.update.mockResolvedValue({ id: "verification-1" });

    await attachDocumentVerificationFileHash("verification-1", "sha256");

    expect(mockPrisma.documentVerification.update).toHaveBeenCalledWith({
      where: { id: "verification-1" },
      data: { fileHash: "sha256" },
    });
  });

  it("returns safe public data for a valid code", async () => {
    mockPrisma.documentVerification.findUnique.mockResolvedValue({
      id: "verification-1",
      code: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
      documentType: "EMPLOYEE_PROFILE",
      issuedAt: new Date("2026-07-22T01:00:00.000Z"),
      expiresAt: null,
      revokedAt: null,
      fileHash: "hash-1",
      subjectEmployee: {
        name: "Siti Aminah",
        employeeId: "198501012010011001",
        nik: "7471010101010001",
        employeePosition: { name: "Perawat" },
        workplace: { name: "UGD" },
      },
    });

    const result = await verifyDocumentCode(" SIMDP-ABC123DEF456ABC123DEF456ABC123DE ");

    expect(mockPrisma.documentVerification.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { code: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE" } }),
    );
    expect(result).toEqual({
      code: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
      status: "VALID",
      documentTypeLabel: "Profil Pegawai",
      subjectName: "Siti Aminah",
      subjectIdentifier: "1985****1001",
      workplace: "UGD",
      employeePosition: "Perawat",
      issuedAt: "2026-07-22T01:00:00.000Z",
      expiresAt: null,
      revokedAt: null,
      fileHash: "hash-1",
    });
  });

  it("returns safe public data for a verified employee directory report", async () => {
    mockPrisma.documentVerification.findUnique.mockResolvedValue({
      id: "verification-directory",
      code: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
      documentType: "EMPLOYEE_DIRECTORY",
      issuedAt: new Date("2026-07-29T01:00:00.000Z"),
      expiresAt: null,
      revokedAt: null,
      fileHash: "hash-directory",
      subjectEmployee: null,
    });

    const result = await verifyDocumentCode("SIMDP-ABC123DEF456ABC123DEF456ABC123DE");

    expect(result).toEqual({
      code: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
      status: "VALID",
      documentTypeLabel: "Laporan Kepegawaian",
      subjectName: "Direktori Pegawai RSUD Bahteramas",
      subjectIdentifier: null,
      workplace: null,
      employeePosition: null,
      issuedAt: "2026-07-29T01:00:00.000Z",
      expiresAt: null,
      revokedAt: null,
      fileHash: "hash-directory",
    });
  });

  it("returns safe public data for a verified employee document report", async () => {
    mockPrisma.documentVerification.findUnique.mockResolvedValue({
      id: "verification-documents",
      code: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
      documentType: "EMPLOYEE_DOCUMENTS",
      issuedAt: new Date("2026-08-01T01:00:00.000Z"),
      expiresAt: null,
      revokedAt: null,
      fileHash: "hash-documents",
      subjectEmployee: {
        name: "Siti Aminah",
        employeeId: "198501012010011001",
        nik: "7471010101010001",
        employeePosition: { name: "Perawat" },
        workplace: { name: "UGD" },
      },
    });

    const result = await verifyDocumentCode("SIMDP-ABC123DEF456ABC123DEF456ABC123DE");

    expect(result).toEqual({
      code: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
      status: "VALID",
      documentTypeLabel: "Laporan Dokumen",
      subjectName: "Siti Aminah",
      subjectIdentifier: "1985****1001",
      workplace: "UGD",
      employeePosition: "Perawat",
      issuedAt: "2026-08-01T01:00:00.000Z",
      expiresAt: null,
      revokedAt: null,
      fileHash: "hash-documents",
    });
  });

  it("returns safe public data for a verified master data document report", async () => {
    mockPrisma.documentVerification.findUnique.mockResolvedValue({
      id: "verification-master-documents",
      code: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
      documentType: "EMPLOYEE_DOCUMENTS",
      issuedAt: new Date("2026-08-01T01:00:00.000Z"),
      expiresAt: null,
      revokedAt: null,
      fileHash: "hash-master-documents",
      subjectEmployee: null,
    });

    const result = await verifyDocumentCode("SIMDP-ABC123DEF456ABC123DEF456ABC123DE");

    expect(result).toEqual({
      code: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
      status: "VALID",
      documentTypeLabel: "Laporan Dokumen",
      subjectName: "Laporan Dokumen Pegawai RSUD Bahteramas",
      subjectIdentifier: null,
      workplace: null,
      employeePosition: null,
      issuedAt: "2026-08-01T01:00:00.000Z",
      expiresAt: null,
      revokedAt: null,
      fileHash: "hash-master-documents",
    });
  });


  it("marks revoked codes as revoked", async () => {
    mockPrisma.documentVerification.findUnique.mockResolvedValue({
      code: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
      documentType: "EMPLOYEE_PROFILE",
      issuedAt: new Date("2026-07-22T01:00:00.000Z"),
      expiresAt: null,
      revokedAt: new Date("2026-07-23T01:00:00.000Z"),
      fileHash: null,
      subjectEmployee: {
        name: "Siti Aminah",
        employeeId: null,
        nik: "7471010101010001",
        employeePosition: null,
        workplace: null,
      },
    });

    const result = await verifyDocumentCode("SIMDP-ABC123DEF456ABC123DEF456ABC123DE");

    expect(result.status).toBe("REVOKED");
    expect(result.subjectIdentifier).toBe("7471****0001");
  });

  it("returns not found without exposing database detail", async () => {
    mockPrisma.documentVerification.findUnique.mockResolvedValue(null);

    await expect(verifyDocumentCode("SIMDP-00000000000000000000000000000000")).resolves.toEqual({
      code: "SIMDP-00000000000000000000000000000000",
      status: "NOT_FOUND",
      documentTypeLabel: null,
      subjectName: null,
      subjectIdentifier: null,
      workplace: null,
      employeePosition: null,
      issuedAt: null,
      expiresAt: null,
      revokedAt: null,
      fileHash: null,
    });
  });
});
