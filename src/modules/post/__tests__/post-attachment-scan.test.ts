import { describe, it, expect, vi, beforeEach } from "vitest";

import { mockPrisma } from "../../../../tests/setup";
import { createPost } from "../server";
import {
  POST_ATTACHMENT_ALLOWED_MIME_TYPES,
  sniffAttachmentMimeType,
} from "../utils/file-content";

vi.mock("@/modules/notification/server", () => ({
  createNotification: vi.fn().mockResolvedValue({ id: "notif-1" }),
}));

vi.mock("@/modules/settings/server", () => ({
  getSystemSettingValue: vi.fn().mockResolvedValue("5"),
}));

vi.mock("@/lib/storage", () => ({
  storage: {
    upload: vi.fn().mockResolvedValue("uploads/posts/post-1/1-gambar.png"),
    getTemporaryUrl: vi.fn().mockResolvedValue("/api/v1/posts/attachments/x"),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/lib/malware-scanner", () => ({
  scanFileBuffer: vi.fn().mockResolvedValue({ status: "CLEAN", provider: "noop" }),
}));

vi.mock("@/modules/employee/server", () => ({
  getActorDisplayName: vi.fn().mockResolvedValue("Admin Bahteramas"),
}));

import { scanFileBuffer } from "@/lib/malware-scanner";
import { storage } from "@/lib/storage";

const PDF_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37];
const PNG_BYTES = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00];
const JPEG_BYTES = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10];
const WEBP_BYTES = [
  0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20,
];

function createFile(bytes: number[], name: string, type: string): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

const basePost = {
  id: "post-1",
  title: "Pengumuman",
  content: "Isi",
  visibilityType: "PUBLIC",
  status: "DRAFT",
  isPinned: false,
  authorId: "author-1",
  publishedAt: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  deletedAt: null,
  author: { id: "author-1", email: "admin@rsud.go.id", employee: { name: "Admin" } },
  visibilityRoles: [],
  visibilityWorkplaces: [],
  visibilityEmployeeGroups: [],
  visibilityUsers: [],
  attachments: [],
};

describe("createPost attachment validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(scanFileBuffer).mockResolvedValue({ status: "CLEAN", provider: "noop" });
    mockPrisma.post.create.mockResolvedValue(basePost);
    mockPrisma.post.findUnique.mockResolvedValue(basePost);
  });

  it("accepts a valid PNG and stores the sniffed mime type", async () => {
    await createPost({
      authorId: "author-1",
      title: "Pengumuman",
      content: "Isi",
      visibilityType: "PUBLIC",
      status: "DRAFT",
      targets: {},
      files: [createFile(PNG_BYTES, "gambar.png", "image/png")],
    });

    const storedFileCall = mockPrisma.storedFile.create.mock.calls[0][0];
    expect(storedFileCall.data.mimeType).toBe("image/png");
    expect(vi.mocked(storage.upload)).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Buffer),
      "image/png",
    );
  });

  it("accepts a valid PDF and stores the sniffed mime type", async () => {
    await createPost({
      authorId: "author-1",
      title: "Pengumuman",
      content: "Isi",
      visibilityType: "PUBLIC",
      status: "DRAFT",
      targets: {},
      files: [createFile(PDF_BYTES, "dokumen.pdf", "application/pdf")],
    });

    expect(mockPrisma.storedFile.create.mock.calls[0][0].data.mimeType).toBe("application/pdf");
  });

  it("accepts valid WEBP and JPEG attachments", async () => {
    await createPost({
      authorId: "author-1",
      title: "Pengumuman",
      content: "Isi",
      visibilityType: "PUBLIC",
      status: "DRAFT",
      targets: {},
      files: [
        createFile(WEBP_BYTES, "foto.webp", "image/webp"),
        createFile(JPEG_BYTES, "foto.jpg", "image/jpeg"),
      ],
    });

    const mimeTypes = mockPrisma.storedFile.create.mock.calls.map(
      (call) => call[0].data.mimeType,
    );
    expect(mimeTypes).toEqual(["image/webp", "image/jpeg"]);
  });

  it("rejects a file whose content does not match the declared mime type", async () => {
    await expect(
      createPost({
        authorId: "author-1",
        title: "Pengumuman",
        content: "Isi",
        visibilityType: "PUBLIC",
        status: "DRAFT",
        targets: {},
        files: [createFile([0x49, 0x6d, 0x61, 0x20, 0x66, 0x61, 0x6b, 0x65], "gambar.png", "image/png")],
      }),
    ).rejects.toThrow(/Tipe file lampiran tidak didukung/);

    expect(vi.mocked(storage.upload)).not.toHaveBeenCalled();
    expect(mockPrisma.storedFile.create).not.toHaveBeenCalled();
    expect(mockPrisma.post.create).not.toHaveBeenCalled();
  });

  it("validates attachments before writing any file to storage", async () => {
    await expect(
      createPost({
        authorId: "author-1",
        title: "Pengumuman",
        content: "Isi",
        visibilityType: "PUBLIC",
        status: "DRAFT",
        targets: {},
        files: [
          createFile(PNG_BYTES, "ok.png", "image/png"),
          createFile([0x00, 0x01, 0x02, 0x03], "buruk.png", "image/png"),
        ],
      }),
    ).rejects.toThrow(/Tipe file lampiran tidak didukung/);

    expect(vi.mocked(storage.upload)).not.toHaveBeenCalled();
  });

  it("runs every attachment through the malware scanner", async () => {
    await createPost({
      authorId: "author-1",
      title: "Pengumuman",
      content: "Isi",
      visibilityType: "PUBLIC",
      status: "DRAFT",
      targets: {},
      files: [
        createFile(PNG_BYTES, "a.png", "image/png"),
        createFile(PDF_BYTES, "b.pdf", "application/pdf"),
      ],
    });

    expect(vi.mocked(scanFileBuffer)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(scanFileBuffer)).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.objectContaining({ fileName: "a.png", mimeType: "image/png" }),
    );
    expect(vi.mocked(scanFileBuffer)).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.objectContaining({ fileName: "b.pdf", mimeType: "application/pdf" }),
    );
  });

  it("fails closed with 422 and does not store an infected attachment", async () => {
    vi.mocked(scanFileBuffer).mockResolvedValue({
      status: "INFECTED",
      provider: "clamav",
      signature: "Eicar-Test-Signature",
    });

    await expect(
      createPost({
        authorId: "author-1",
        title: "Pengumuman",
        content: "Isi",
        visibilityType: "PUBLIC",
        status: "DRAFT",
        targets: {},
        files: [createFile(PNG_BYTES, "jahat.png", "image/png")],
      }),
    ).rejects.toThrow(/Upload lampiran ditolak karena file terdeteksi berbahaya/);

    expect(vi.mocked(storage.upload)).not.toHaveBeenCalled();
    expect(mockPrisma.storedFile.create).not.toHaveBeenCalled();

    const securityLogCall = mockPrisma.securityLog.create.mock.calls[0][0];
    expect(securityLogCall.data.eventType).toBe("DOCUMENT_MALWARE_DETECTED");
    expect(securityLogCall.data.status).toBe("FAILED");
    expect(securityLogCall.data.resource).toMatch(/PostAttachment:/);
    expect(securityLogCall.data.metadata).toMatchObject({
      signature: "Eicar-Test-Signature",
      mimeType: "image/png",
      fileName: "jahat.png",
    });
  });

  it("fails closed with 503 when the scanner is unavailable", async () => {
    vi.mocked(scanFileBuffer).mockResolvedValue({
      status: "ERROR",
      provider: "clamav",
      errorMessage: "connect ECONNREFUSED 127.0.0.1:3310",
    });

    await expect(
      createPost({
        authorId: "author-1",
        title: "Pengumuman",
        content: "Isi",
        visibilityType: "PUBLIC",
        status: "DRAFT",
        targets: {},
        files: [createFile(PDF_BYTES, "dokumen.pdf", "application/pdf")],
      }),
    ).rejects.toThrow(/pemeriksaan keamanan tidak tersedia/);

    expect(vi.mocked(storage.upload)).not.toHaveBeenCalled();
    expect(mockPrisma.securityLog.create.mock.calls[0][0].data.eventType).toBe(
      "DOCUMENT_MALWARE_SCAN_FAILED",
    );
  });

  it("ignores the client-declared mime type when sniffing", async () => {
    await createPost({
      authorId: "author-1",
      title: "Pengumuman",
      content: "Isi",
      visibilityType: "PUBLIC",
      status: "DRAFT",
      targets: {},
      files: [createFile(PNG_BYTES, "gambar.jpg", "image/jpeg")],
    });

    expect(mockPrisma.storedFile.create.mock.calls[0][0].data.mimeType).toBe("image/png");
  });
});

describe("sniffAttachmentMimeType", () => {
  it("detects supported formats from their magic bytes", () => {
    expect(sniffAttachmentMimeType(Buffer.from(PNG_BYTES))).toBe("image/png");
    expect(sniffAttachmentMimeType(Buffer.from(PDF_BYTES))).toBe("application/pdf");
    expect(sniffAttachmentMimeType(Buffer.from(JPEG_BYTES))).toBe("image/jpeg");
    expect(sniffAttachmentMimeType(Buffer.from(WEBP_BYTES))).toBe("image/webp");
  });

  it("requires the WEBP continuation bytes, not just the RIFF header", () => {
    const riffOnly = [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x41, 0x56, 0x49, 0x20];

    expect(() => sniffAttachmentMimeType(Buffer.from(riffOnly))).toThrow(
      /Tipe file lampiran tidak didukung/,
    );
  });

  it("throws for empty buffers and unknown content", () => {
    expect(() => sniffAttachmentMimeType(Buffer.alloc(0))).toThrow();
    expect(() => sniffAttachmentMimeType(Buffer.from("not an image"))).toThrow();
  });

  it("exposes the allowed mime types used by the inline serving allowlist", () => {
    expect(POST_ATTACHMENT_ALLOWED_MIME_TYPES).toEqual([
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
    ]);
  });
});
