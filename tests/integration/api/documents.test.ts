import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/v1/documents/download/stream/route";
import { NextRequest } from "next/server";
import { mockCookieStore, mockPrisma } from "../../../tests/setup";
import { signAccessToken } from "@/lib/auth";
import fs from "fs/promises";

describe("Documents Stream Integration API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
