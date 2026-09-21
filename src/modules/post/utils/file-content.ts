import { AppError } from "@/lib/errors";

export const POST_ATTACHMENT_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type PostAttachmentMimeType = (typeof POST_ATTACHMENT_ALLOWED_MIME_TYPES)[number];

type FileSignature = {
  mimeType: PostAttachmentMimeType;
  /**
   * Offset magic bytes yang harus cocok persis dengan isi buffer.
   */
  offset: number;
  bytes: number[];
  /**
   * Signature tambahan yang harus cocok pada offset berbeda (mis. `WEBPVP8`
   * setelah header `RIFF`). `null` bila tidak ada syarat tambahan.
   */
  continuation?: { offset: number; bytes: number[] };
};

// Lihat RFC 2046 / spesifikasi masing-masing format untuk nilai magic bytes.
const FILE_SIGNATURES: FileSignature[] = [
  { mimeType: "application/pdf", offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF-
  { mimeType: "image/png", offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mimeType: "image/jpeg", offset: 0, bytes: [0xff, 0xd8, 0xff] },
  {
    mimeType: "image/webp",
    offset: 0,
    bytes: [0x52, 0x49, 0x46, 0x46], // RIFF
    continuation: { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // WEBP
  },
];

function matchesAt(buffer: Buffer, offset: number, bytes: number[]) {
  if (buffer.length < offset + bytes.length) return false;
  for (const [index, byte] of bytes.entries()) {
    if (buffer[offset + index] !== byte) return false;
  }
  return true;
}

/**
 * Membaca MIME type asli dari isi buffer (magic bytes) sehingga nilai yang
 * disimpan ke `StoredFile.mimeType` tidak bisa dipalsukan oleh `File.type`
 * yang dikontrol client. `declaredMimeType` hanya dipakai untuk pesan error
 * agar pengguna tahu tipe apa yang diklaim file tersebut.
 */
export function sniffAttachmentMimeType(
  buffer: Buffer,
  declaredMimeType?: string | null,
): PostAttachmentMimeType {
  for (const signature of FILE_SIGNATURES) {
    if (!matchesAt(buffer, signature.offset, signature.bytes)) continue;
    if (signature.continuation && !matchesAt(buffer, signature.continuation.offset, signature.continuation.bytes)) {
      continue;
    }
    return signature.mimeType;
  }

  const allowed = POST_ATTACHMENT_ALLOWED_MIME_TYPES.join(", ");
  const declared = declaredMimeType ? ` (mengklaim "${declaredMimeType}")` : "";

  throw new AppError(
    "VALIDATION_ERROR",
    `Tipe file lampiran tidak didukung atau tidak sesuai isi file${declared}. ` +
      `Jenis yang diizinkan: ${allowed}.`,
    400,
  );
}
