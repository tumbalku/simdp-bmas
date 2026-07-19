import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import { getStorageProvider } from "@/lib/storage";
import { env } from "@/lib/env";

vi.mock("fs/promises", () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("storage provider helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe("LocalStorageProvider (via getStorageProvider)", () => {
    it("should upload files to local filesystem", async () => {
      // Set to local provider
      const origProvider = env.STORAGE_PROVIDER;
      env.STORAGE_PROVIDER = "local";
      const provider = getStorageProvider();

      const buffer = Buffer.from("hello world");
      const pathArg = "docs/file.pdf";
      const result = await provider.upload(pathArg, buffer);

      expect(result).toBe("uploads/docs/file.pdf");
      expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining(path.join("uploads", "docs")), { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(expect.stringContaining(path.join("uploads", "docs", "file.pdf")), buffer);

      env.STORAGE_PROVIDER = origProvider;
    });

    it("should generate a temporary url linking to streaming route", async () => {
      const origProvider = env.STORAGE_PROVIDER;
      env.STORAGE_PROVIDER = "local";
      const provider = getStorageProvider();

      const url = await provider.getTemporaryUrl("uploads/docs/file.pdf");
      expect(url).toBe("/api/v1/documents/download/stream?file=docs%2Ffile.pdf");

      const url2 = await provider.getTemporaryUrl("docs/file.pdf");
      expect(url2).toBe("/api/v1/documents/download/stream?file=docs%2Ffile.pdf");

      env.STORAGE_PROVIDER = origProvider;
    });

    it("should delete local files", async () => {
      const origProvider = env.STORAGE_PROVIDER;
      env.STORAGE_PROVIDER = "local";
      const provider = getStorageProvider();

      await provider.delete("uploads/docs/file.pdf");
      expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining(path.join("uploads", "docs", "file.pdf")));

      env.STORAGE_PROVIDER = origProvider;
    });
  });

  describe("getStorageProvider", () => {
    it("should return the provider based on env configuration", () => {
      const origProvider = env.STORAGE_PROVIDER;

      env.STORAGE_PROVIDER = "supabase";
      const sup = getStorageProvider();
      expect(sup.constructor.name).toBe("SupabaseStorageProvider");

      env.STORAGE_PROVIDER = "s3";
      const s3 = getStorageProvider();
      expect(s3.constructor.name).toBe("S3StorageProvider");

      env.STORAGE_PROVIDER = "local";
      const local = getStorageProvider();
      expect(local.constructor.name).toBe("LocalStorageProvider");

      env.STORAGE_PROVIDER = origProvider;
    });
  });

  describe("SupabaseStorageProvider", () => {
    it("should upload files and return a normalized supabase storage path", async () => {
      const origProvider = env.STORAGE_PROVIDER;
      const origUrl = env.SUPABASE_URL;
      const origKey = env.SUPABASE_SERVICE_ROLE_KEY;
      const origBucket = env.SUPABASE_STORAGE_BUCKET;
      env.STORAGE_PROVIDER = "supabase";
      env.SUPABASE_URL = "https://project.supabase.co";
      env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
      env.SUPABASE_STORAGE_BUCKET = "employee-documents";
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal("fetch", fetchMock);

      const provider = getStorageProvider();
      const result = await provider.upload("KK/file name.pdf", Buffer.from("pdf"), "application/pdf");

      expect(result).toBe("supabase/KK/file name.pdf");
      expect(fetchMock).toHaveBeenCalledWith(
        "https://project.supabase.co/storage/v1/object/employee-documents/KK/file%20name.pdf",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            apikey: "service-role-key",
            authorization: "Bearer service-role-key",
            "content-type": "application/pdf",
            "x-upsert": "true",
          }),
        }),
      );

      env.STORAGE_PROVIDER = origProvider;
      env.SUPABASE_URL = origUrl;
      env.SUPABASE_SERVICE_ROLE_KEY = origKey;
      env.SUPABASE_STORAGE_BUCKET = origBucket;
    });

    it("should generate a signed url for normalized supabase paths", async () => {
      const origProvider = env.STORAGE_PROVIDER;
      const origUrl = env.SUPABASE_URL;
      const origKey = env.SUPABASE_SERVICE_ROLE_KEY;
      const origBucket = env.SUPABASE_STORAGE_BUCKET;
      env.STORAGE_PROVIDER = "supabase";
      env.SUPABASE_URL = "https://project.supabase.co/";
      env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
      env.SUPABASE_STORAGE_BUCKET = "employee-documents";
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          signedURL: "/object/sign/employee-documents/KK/file.pdf?token=abc",
        }),
      });
      vi.stubGlobal("fetch", fetchMock);

      const provider = getStorageProvider();
      const url = await provider.getTemporaryUrl("supabase/KK/file.pdf?size=123");

      expect(url).toBe("https://project.supabase.co/storage/v1/object/sign/employee-documents/KK/file.pdf?token=abc");
      expect(fetchMock).toHaveBeenCalledWith(
        "https://project.supabase.co/storage/v1/object/sign/employee-documents/KK/file.pdf",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ expiresIn: 300 }),
        }),
      );

      env.STORAGE_PROVIDER = origProvider;
      env.SUPABASE_URL = origUrl;
      env.SUPABASE_SERVICE_ROLE_KEY = origKey;
      env.SUPABASE_STORAGE_BUCKET = origBucket;
    });
  });
});
