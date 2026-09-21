export const POST_CONTENT_MAX_CHARACTERS = 10000;

type RichTextNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type?: string; attrs?: Record<string, unknown> }>;
  content?: RichTextNode[];
};

export type RichTextDocument = {
  type: "doc";
  content?: RichTextNode[];
};

function createRichTextDocumentFromText(text: string): RichTextDocument {
  const paragraphs = text.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);

  return {
    type: "doc",
    content: paragraphs.length
      ? paragraphs.map((paragraph) => ({
          type: "paragraph",
          content: [{ type: "text", text: paragraph }],
        }))
      : [{ type: "paragraph" }],
  };
}

export function parseRichTextDocument(content: string): RichTextDocument | null {
  try {
    const parsed = JSON.parse(content) as RichTextDocument;
    if (parsed && parsed.type === "doc" && Array.isArray(parsed.content)) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export function toEditorDocument(content: string): RichTextDocument {
  return parseRichTextDocument(content) ?? createRichTextDocumentFromText(content);
}

export function getPostContentText(content: string): string {
  const document = parseRichTextDocument(content);
  if (!document) return content;

  return extractText(document).replace(/\s+/g, " ").trim();
}

export const POST_EXCERPT_DEFAULT_LENGTH = 180;

const MAX_WORD_LENGTH = 32;
const ZERO_WIDTH_SPACE = "​";

/**
 * Menyisipkan zero-width space setiap MAX_WORD_LENGTH karakter pada kata yang
 * sangat panjang (tanpa spasi). Browser tetap merender teks seperti semula,
 * tetapi mendapatkan titik pemutusan yang sah sehingga konten tidak
 * meluap keluar dari kartu.
 */
export function breakLongWords(text: string): string {
  return text.replace(/\S+/g, (word) => {
    if (word.length <= MAX_WORD_LENGTH) return word;

    let result = "";
    let rest = word;
    while (rest.length > MAX_WORD_LENGTH) {
      result += rest.slice(0, MAX_WORD_LENGTH) + ZERO_WIDTH_SPACE;
      rest = rest.slice(MAX_WORD_LENGTH);
    }
    return result + rest;
  });
}

/**
 * Membuat ringkasan singkat dari konten pengumuman (rich text JSON atau teks
 * biasa) untuk ditampilkan di feed pengumuman. Pemotongan dilakukan pada batas
 * kata terakhir sebelum panjang maksimum agar tidak memotong kata di tengah.
 */
export function getPostExcerpt(
  content: string,
  maxLength: number = POST_EXCERPT_DEFAULT_LENGTH,
): string {
  const raw = getPostContentText(content);
  if (raw.length <= maxLength) return breakLongWords(raw);

  const truncated = raw.slice(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(" ");
  const excerpt = lastSpaceIndex > 0 ? truncated.slice(0, lastSpaceIndex) : truncated;

  return `${breakLongWords(excerpt.trimEnd())}…`;
}

export function isPostContentEmpty(content: string): boolean {
  return getPostContentText(content).trim().length === 0;
}

export function isSafePostLink(href: string): boolean {
  if (href.startsWith("/") || href.startsWith("#")) return true;

  try {
    const url = new URL(href);
    return ["http:", "https:", "mailto:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function extractText(node: RichTextNode): string {
  if (node.type === "text") return node.text ?? "";
  if (!node.content?.length) return "";

  const separator = node.type === "paragraph" || node.type === "heading" || node.type === "listItem" ? " " : "";
  return node.content.map(extractText).join(separator);
}
