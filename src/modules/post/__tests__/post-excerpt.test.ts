import { describe, it, expect } from "vitest";

import {
  POST_EXCERPT_DEFAULT_LENGTH,
  breakLongWords,
  getPostExcerpt,
} from "../utils/rich-content";

describe("getPostExcerpt", () => {
  it("returns plain text unchanged when shorter than the limit", () => {
    expect(getPostExcerpt("Pengumuman libur nasional")).toBe("Pengumuman libur nasional");
  });

  it("returns plain text unchanged when exactly at the limit", () => {
    const text = "a".repeat(POST_EXCERPT_DEFAULT_LENGTH);
    // Teks yang pas di batas tidak terpotong, tetap di-break agar tidak meluap.
    expect(getPostExcerpt(text)).toBe(breakLongWords(text));
    expect(getPostExcerpt(text)).not.toContain("…");
  });

  it("extracts text from a Tiptap JSON document before truncating", () => {
    const content = JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Menindaklanjuti surat edaran nomor 123, seluruh pegawai wajib mematuhi ketentuan baru yang berlaku mulai bulan depan." }],
        },
      ],
    });

    const excerpt = getPostExcerpt(content, 60);
    expect(excerpt.endsWith("…")).toBe(true);
    // Teks hasil ekstrak dimulai dari kata pertama paragraf, bukan dari JSON.
    expect(excerpt.startsWith("Menindaklanjuti")).toBe(true);
    // Bagian akhir dokumen tidak ikut dalam excerpt.
    expect(excerpt).not.toContain("bulan depan");
    expect(excerpt).not.toContain('"type"');
  });

  it("truncates at the last word boundary and appends an ellipsis", () => {
    const text = "Pengumuman resmi tentang jadwal kerja baru yang akan diterapkan pada bulan Oktober tahun ini oleh Bagian Kepegawaian RSUD Bahteramas.";
    const excerpt = getPostExcerpt(text, 40);

    expect(excerpt.endsWith("…")).toBe(true);
    expect(excerpt).not.toBe(text);
    // Pemotongan tidak boleh memotong kata di tengah.
    expect(excerpt.slice(0, -1)).toBe(breakLongWords(text).slice(0, excerpt.length - 1));
  });

  it("falls back to the raw string when content is not valid JSON", () => {
    const text = "Konten teks biasa tanpa format JSON apa pun di dalamnya.";
    expect(getPostExcerpt(text, 20)).toBe("Konten teks biasa…");
  });

  it("handles multibyte characters without splitting a character", () => {
    const text = "ការប្រកាសផ្លូវការ".repeat(20);
    const excerpt = getPostExcerpt(text, 10);
    expect(excerpt.endsWith("…")).toBe(true);
  });

  it("collapses whitespace from rich text content before truncating", () => {
    const content = JSON.stringify({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Paragraf pertama." }] },
        { type: "paragraph", content: [{ type: "text", text: "Paragraf kedua." }] },
      ],
    });

    const excerpt = getPostExcerpt(content, 30);
    expect(excerpt).not.toContain("\n");
    expect(excerpt).not.toContain("\r");
  });
});

describe("breakLongWords", () => {
  it("leaves short words untouched", () => {
    expect(breakLongWords("Pengumuman libur nasional")).toBe("Pengumuman libur nasional");
  });

  it("leaves words at the maximum boundary untouched", () => {
    const word = "a".repeat(32);
    expect(breakLongWords(word)).toBe(word);
  });

  it("inserts zero-width spaces into long unbroken words", () => {
    const word = "a".repeat(64);
    const result = breakLongWords(word);

    expect(result).toContain("​");
    // Teks asli tetap utuh setelah zero-width space dibuang.
    expect(result.replaceAll("​", "")).toBe(word);
  });

  it("preserves the visible text of long words", () => {
    const text = "hahahaaasdfasdfdsasdfsaodfasdsatsubu,atjgaasdfasdf";
    expect(breakLongWords(text).replaceAll("​", "")).toBe(text);
  });
});
