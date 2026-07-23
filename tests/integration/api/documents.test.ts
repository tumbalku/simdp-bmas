import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/v1/documents/download/stream/route";
import { POST as uploadPost } from "@/app/api/v1/documents/upload/route";
import { GET as downloadPost } from "@/app/api/v1/documents/download/[id]/route";
import { NextRequest } from "next/server";
import { mockCookieStore, mockPrisma } from "../../../tests/setup";
import { signAccessToken } from "@/lib/auth";
import fs from "fs/promises";

vi.mock("@/lib/storage", () => ({
  storage: {
    upload: vi.fn().mockResolvedValue("uploads/PDF/PDF-1-empId-1.pdf"),
    getTemporaryUrl: vi.fn().mockResolvedValue("http://localhost/temp-url"),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/lib/malware-scanner", () => ({
  scanFileBuffer: vi.fn().mockResolvedValue({ status: "CLEAN", provider: "clamav" }),
}));

import { scanFileBuffer } from "@/lib/malware-scanner";

describe("Documents Stream Integration API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(scanFileBuffer).mockResolvedValue({ status: "CLEAN", provider: "clamav" });
  });

  it("should return 401 if unauthenticated", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCookieStore.get.mockReturnValue(undefined);

    const req = new NextRequest("http://localhost/api/v1/documents/download/stream?file=test.pdf");
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHENTICATED");

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should return 400 if parameter file is missing", async () => {
    const token = await signAccessToken({ userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" });
    mockCookieStore.get.mockReturnValue({ value: token });

    const req = new NextRequest("http://localhost/api/v1/documents/download/stream");
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should reject path traversal attempts with 403", async () => {
    const token = await signAccessToken({ userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" });
    mockCookieStore.get.mockReturnValue({ value: token });

    const traversalPaths = [
      "../.env",
      "docs/../../.env",
      "uploads/../../../etc/passwd",
      "file.pdf\0",
      "..\\..\\.env",
    ];

    for (const filePath of traversalPaths) {
      const req = new NextRequest(
        `http://localhost/api/v1/documents/download/stream?file=${encodeURIComponent(filePath)}`
      );
      const res = await GET(req);

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe("FORBIDDEN");
    }
  });

  it("should stream file successfully if authorized", async () => {
    const token = await signAccessToken({ userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" });
    mockCookieStore.get.mockReturnValue({ value: token });

    mockPrisma.documentRecord.findFirst.mockResolvedValue({
      fileName: "test.pdf",
      mimeType: "application/pdf",
      owner: { userId: "user-1" },
    });

    // Mock fs.readFile to avoid reading real file
    vi.spyOn(fs, "readFile").mockResolvedValue(Buffer.from("dummy pdf content"));

    const req = new NextRequest(
      "http://localhost/api/v1/documents/download/stream?file=test.pdf"
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
  });

  describe("POST /api/v1/documents/upload", () => {
    it("should return 401 if unauthenticated", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockCookieStore.get.mockReturnValue(undefined);

      const req = new NextRequest("http://localhost/api/v1/documents/upload", {
        method: "POST",
      });
      const res = await uploadPost(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe("UNAUTHENTICATED");
      consoleSpy.mockRestore();
    });

    it("should return validation error for missing documentTypeId or file", async () => {
      const token = await signAccessToken({ userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" });
      mockCookieStore.get.mockReturnValue({ value: token });

      const formData = new FormData();
      formData.append("title", "My Doc");

      const req = new NextRequest("http://localhost/api/v1/documents/upload", {
        method: "POST",
        body: formData,
      });
      const res = await uploadPost(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should upload successfully with valid request", async () => {
      const token = await signAccessToken({ userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" });
      mockCookieStore.get.mockImplementation((name) => {
        if (name === "access_token") return { value: token };
        return undefined;
      });

      // Magic bytes for PDF: %PDF (25 50 44 46)
      const fileContent = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x31, 0x32, 0x33]);
      const file = new File([fileContent], "test.pdf", { type: "application/pdf" });

      const formData = new FormData();
      formData.append("documentTypeId", "doc-type-1");
      formData.append("file", file);

      mockPrisma.documentType.findUnique.mockResolvedValue({
        id: "doc-type-1",
        code: "PDF",
        name: "PDF Doc Type",
        archiveCategory: "PERSONAL",
        requiresDocumentNumber: false,
        requiresIssueDate: false,
        requiresExpiryDate: false,
        maxSizeMb: 5,
        allowedFormats: "pdf",
        allowMultiple: true,
      });
      mockPrisma.employee.findUnique.mockResolvedValue({
        id: "emp-1",
        employeeId: "empId-1",
        name: "Test Employee",
      });
      mockPrisma.documentRecord.count.mockResolvedValue(0);
      mockPrisma.documentRecord.findMany.mockResolvedValue([]);
      mockPrisma.documentRecord.create.mockResolvedValue({
        id: "doc-rec-1",
        status: "PENDING",
        fileName: "PDF-1-empId-1.pdf",
        filePath: "uploads/PDF/PDF-1-empId-1.pdf",
      });
      mockPrisma.documentRecord.update.mockResolvedValue({
        id: "doc-rec-1",
        status: "PENDING",
        fileName: "PDF-1-empId-1.pdf",
        filePath: "uploads/PDF/PDF-1-empId-1.pdf",
      });
      mockPrisma.verificationHistory.create.mockResolvedValue({});
      mockPrisma.user.findMany.mockResolvedValue([{ id: "user-admin" }]);
      mockPrisma.notification.createMany.mockResolvedValue({});
      mockPrisma.securityLog.create.mockResolvedValue({});

      const req = new NextRequest("http://localhost/api/v1/documents/upload", {
        method: "POST",
        body: formData,
      });
      const res = await uploadPost(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.id).toBe("doc-rec-1");
    });
  });

  describe("GET /api/v1/documents/download/[id]", () => {
    it("should return 401 if unauthenticated", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockCookieStore.get.mockReturnValue(undefined);

      const req = new NextRequest("http://localhost/api/v1/documents/download/doc-1");
      const res = await downloadPost(req, { params: Promise.resolve({ id: "doc-1" }) });

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe("UNAUTHENTICATED");
      consoleSpy.mockRestore();
    });

    it("should return 403 on ownership error", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const token = await signAccessToken({ userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" });
      mockCookieStore.get.mockImplementation((name) => {
        if (name === "access_token") return { value: token };
        return undefined;
      });

      mockPrisma.documentRecord.findUnique.mockResolvedValue({
        id: "doc-1",
        filePath: "uploads/PDF/PDF-1-empId-2.pdf",
        owner: { userId: "user-2", name: "Other Employee" },
      });
      mockPrisma.securityLog.create.mockResolvedValue({});

      const req = new NextRequest("http://localhost/api/v1/documents/download/doc-1");
      const res = await downloadPost(req, { params: Promise.resolve({ id: "doc-1" }) });

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe("OWNERSHIP_REQUIRED");
      expect(body.error.message).toBe("Anda tidak memiliki akses ke dokumen ini.");
      consoleSpy.mockRestore();
    });

    it("should return 404 if document is not found", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const token = await signAccessToken({ userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" });
      mockCookieStore.get.mockImplementation((name) => {
        if (name === "access_token") return { value: token };
        return undefined;
      });

      mockPrisma.documentRecord.findUnique.mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/v1/documents/download/doc-1");
      const res = await downloadPost(req, { params: Promise.resolve({ id: "doc-1" }) });

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error.code).toBe("NOT_FOUND");
      consoleSpy.mockRestore();
    });

    it("should return download url successfully if owner", async () => {
      const token = await signAccessToken({ userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" });
      mockCookieStore.get.mockImplementation((name) => {
        if (name === "access_token") return { value: token };
        return undefined;
      });

      mockPrisma.documentRecord.findUnique.mockResolvedValue({
        id: "doc-1",
        filePath: "uploads/PDF/PDF-1-empId-1.pdf",
        owner: { userId: "user-1", name: "Test Employee" },
      });
      mockPrisma.securityLog.create.mockResolvedValue({});

      const req = new NextRequest("http://localhost/api/v1/documents/download/doc-1");
      const res = await downloadPost(req, { params: Promise.resolve({ id: "doc-1" }) });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.url).toBe("http://localhost/temp-url");
    });
  });
});
