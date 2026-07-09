import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs/promises";
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
  });

  describe("LocalStorageProvider (via getStorageProvider)", () => {
    it("should upload files to local filesystem", async () => {
      // Set to local provider
      const origProvider = env.STORAGE_PROVIDER;
      env.STORAGE_PROVIDER = "local";
      const provider = getStorageProvider();

      const buffer = Buffer.from("hello world");
      const path = "docs/file.pdf";
      const result = await provider.upload(path, buffer);

      expect(result).toBe("uploads/docs/file.pdf");
      expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining("uploads\\docs"), { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(expect.stringContaining("uploads\\docs\\file.pdf"), buffer);

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
      expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining("uploads\\docs\\file.pdf"));

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
});
