import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveEmployeeProfilePdfAvatarDataUrl } from "../service";
import { storage } from "@/lib/storage";
import * as fs from "fs/promises";

vi.mock("@/lib/storage", () => ({
  storage: {
    getTemporaryUrl: vi.fn(),
  },
}));

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
}));

describe("profile PDF avatar assets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("embeds uploaded local profile avatars as data URLs for PDF rendering", async () => {
    vi.mocked(fs.readFile).mockResolvedValue(Buffer.from([0x89, 0x50, 0x4e, 0x47]));

    const result = await resolveEmployeeProfilePdfAvatarDataUrl("uploads/profile/pegawai_avatar.png");

    expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining("profile"));
    expect(result).toBe("data:image/png;base64,iVBORw==");
  });

  it("embeds Supabase profile avatars from signed URLs for PDF rendering", async () => {
    vi.mocked(storage.getTemporaryUrl).mockResolvedValue("https://storage.example/avatar.webp");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: vi.fn().mockReturnValue("image/webp") },
        arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([0x52, 0x49, 0x46, 0x46]).buffer),
      })
    );

    const result = await resolveEmployeeProfilePdfAvatarDataUrl("supabase/profile/pegawai_avatar.webp");

    expect(storage.getTemporaryUrl).toHaveBeenCalledWith("supabase/profile/pegawai_avatar.webp", 300);
    expect(result).toBe("data:image/webp;base64,UklGRg==");
    vi.unstubAllGlobals();
  });
});
