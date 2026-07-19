import { describe, expect, it } from "vitest";

import { isConfirmationPhraseMatch } from "../constants";

describe("critical action verification", () => {
  it("should require an exact trimmed confirmation phrase match", () => {
    expect(isConfirmationPhraseMatch("  Dokumen Krusial  ", "Dokumen Krusial")).toBe(true);
    expect(isConfirmationPhraseMatch("dokumen krusial", "Dokumen Krusial")).toBe(false);
    expect(isConfirmationPhraseMatch("Dokumen", "Dokumen Krusial")).toBe(false);
  });
});
