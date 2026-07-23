import { beforeEach, describe, expect, it, vi } from "vitest";

import { mockPrisma } from "../../../../tests/setup";
import { getProfileAvatarDisplayUrl, resolveProfileAvatarUrl, uploadProfileAvatar } from "../service";
import { storage } from "@/lib/storage";

vi.mock("@/lib/storage", () => ({
  storage: {
    upload: vi.fn(),
    delete: vi.fn(),
    getTemporaryUrl: vi.fn(),
  },
}));

function makeFile(bytes: number[], name = "avatar.png", type = "image/png") {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("profile avatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prioritizes uploaded avatar, then Google avatar, then initials fallback", () => {
    expect(
      resolveProfileAvatarUrl({ uploadedAvatarUrl: "uploads/profile/manual.png", googleAvatarUrl: "https://lh3.google/avatar.png" })
    ).toBe("uploads/profile/manual.png");

    expect(resolveProfileAvatarUrl({ uploadedAvatarUrl: null, googleAvatarUrl: "https://lh3.google/avatar.png" })).toBe(
      "https://lh3.google/avatar.png"
    );

    expect(resolveProfileAvatarUrl({ uploadedAvatarUrl: null, googleAvatarUrl: null })).toBeNull();
    expect(getProfileAvatarDisplayUrl("uploads/profile/manual.png")).toBe(
      "/api/v1/profile/avatar?file=profile%2Fmanual.png"
    );
  });

  it("stores uploaded avatars under profile/ and saves the uploaded URL on the employee", async () => {
    mockPrisma.employee.findFirst.mockResolvedValue({
      id: "emp-1",
      userId: "user-1",
      name: "John Doe",
      nik: "7471010101010001",
      avatarUrl: null,
    });
    mockPrisma.systemSetting.findMany.mockResolvedValue([
      { key: "reminder_days_h1", value: "1" },
      { key: "reminder_days_h7", value: "7" },
      { key: "reminder_days_h30", value: "30" },
      { key: "default_max_upload_mb", value: "10" },
      { key: "profile_image_max_upload_mb", value: "2" },
      { key: "soft_delete_retention_days", value: "30" },
    ]);
    vi.mocked(storage.upload).mockResolvedValue("uploads/profile/7471010101010001_avatar.png");

    const result = await uploadProfileAvatar(
      { file: makeFile([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
      { userId: "user-1", role: "EMPLOYEE" },
      "John Doe"
    );

    expect(storage.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^profile\/7471010101010001_avatar_\d+\.png$/),
      expect.any(Buffer),
      "image/png"
    );
    expect(mockPrisma.employee.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "emp-1" },
        data: expect.objectContaining({ avatarUrl: "uploads/profile/7471010101010001_avatar.png" }),
      })
    );
    expect(result.avatarUrl).toBe("/api/v1/profile/avatar?file=profile%2F7471010101010001_avatar.png");
  });

  it("rejects profile images above the configured system setting limit", async () => {
    mockPrisma.employee.findFirst.mockResolvedValue({ id: "emp-1", userId: "user-1", name: "John Doe" });
    mockPrisma.systemSetting.findMany.mockResolvedValue([
      { key: "profile_image_max_upload_mb", value: "0.000001" },
    ]);

    await expect(
      uploadProfileAvatar(
        { file: makeFile([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
        { userId: "user-1", role: "EMPLOYEE" },
        "John Doe"
      )
    ).rejects.toThrow("Ukuran foto profil melebihi batas maksimal 0.000001 MB.");

    expect(storage.upload).not.toHaveBeenCalled();
    expect(mockPrisma.employee.update).not.toHaveBeenCalled();
  });
});
