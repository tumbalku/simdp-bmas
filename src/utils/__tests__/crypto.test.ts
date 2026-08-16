import { describe, expect, it } from "vitest";
import { generateAlphanumericKey, generateRandomKey } from "../crypto";

describe("crypto utility", () => {
  describe("generateRandomKey", () => {
    it("generates hex string of specified length", () => {
      const key = generateRandomKey(16);
      expect(key).toHaveLength(32);
      expect(key).toMatch(/^[0-9a-f]{32}$/);
    });

    it("generates unique values across multiple calls", () => {
      const key1 = generateRandomKey(16);
      const key2 = generateRandomKey(16);
      expect(key1).not.toBe(key2);
    });
  });

  describe("generateAlphanumericKey", () => {
    it("generates uppercase alphanumeric string of specified length", () => {
      const key = generateAlphanumericKey(12);
      expect(key).toHaveLength(12);
      expect(key).toMatch(/^[A-Z0-9]{12}$/);
    });

    it("generates unique values across multiple calls", () => {
      const key1 = generateAlphanumericKey(12);
      const key2 = generateAlphanumericKey(12);
      expect(key1).not.toBe(key2);
    });
  });
});
