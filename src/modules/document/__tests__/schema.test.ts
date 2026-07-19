import { describe, it, expect } from "vitest";
import {
  crudDocumentTypeSchema,
  uploadDocumentSchema,
  documentRecordsQuerySchema,
  documentRecordsWithPaginationQuerySchema,
} from "../schema";

describe("Document Module Schemas", () => {
  describe("crudDocumentTypeSchema", () => {
    it("should validate a valid CREATE operation", () => {
      const payload = {
        operation: "CREATE",
        data: {
          code: "DOC-01",
          name: "KTP",
          archiveCategory: "PERSONAL",
        },
      };
      const result = crudDocumentTypeSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should fail when operation is invalid", () => {
      const payload = {
        operation: "INVALID_OP",
      };
      const result = crudDocumentTypeSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("uploadDocumentSchema", () => {
    it("should validate a correct upload document payload", () => {
      const payload = {
        documentTypeId: "doc-type-123",
        title: "My Passport",
      };
      const result = uploadDocumentSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should fail when documentTypeId is empty", () => {
      const payload = {
        documentTypeId: "",
      };
      const result = uploadDocumentSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Jenis dokumen wajib dipilih");
      }
    });
  });

  describe("documentRecordsQuerySchema", () => {
    it("should validate status filter and search query", () => {
      const result = documentRecordsQuerySchema.safeParse({
        status: "APPROVED",
        documentTypeId: "type-1",
        archiveCategory: "CERTIFICATION",
        search: "contract",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("documentRecordsWithPaginationQuerySchema", () => {
    it("should validate valid pagination parameters", () => {
      const result = documentRecordsWithPaginationQuerySchema.safeParse({
        status: "PENDING",
        page: 2,
        limit: 50,
      });
      expect(result.success).toBe(true);
    });

    it("should fail when limit exceeds 100", () => {
      const result = documentRecordsWithPaginationQuerySchema.safeParse({
        limit: 101,
      });
      expect(result.success).toBe(false);
    });
  });
});
