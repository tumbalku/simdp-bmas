import { beforeEach, describe, expect, it, vi } from "vitest";

import { mockPrisma } from "../../../../tests/setup";
import {
  attachDocumentVerificationFileHash,
  issueEmployeeProfileVerification,
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
