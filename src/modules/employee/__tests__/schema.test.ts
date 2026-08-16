import { describe, it, expect } from "vitest";
import {
  updateProfileSchema,
  crudEmployeeSchema,
  addCareerHistorySchema,
  employeeDirectorySchema,
  employeeDirectoryWithPaginationSchema,
  masterDataListQuerySchema,
} from "../schema";

describe("Employee Module Schemas", () => {
  describe("updateProfileSchema", () => {
    it("should validate a correct profile update payload", () => {
      const payload = {
        phone: "+628123456789",
        address: "Jalan Sudirman No. 1",
        birthPlace: "Jakarta",
        birthDate: "1990-01-01",
        religion: "ISLAM",
        maritalStatus: "MARRIED",
      };
      const result = updateProfileSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should accept canonical or label profile enum values and normalize to canonical", () => {
      const result = updateProfileSchema.safeParse({
        religion: "Kristen (Protestan)",
        maritalStatus: "Kawin",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.religion).toBe("PROTESTANT");
        expect(result.data.maritalStatus).toBe("MARRIED");
      }
    });

    it("should fail when phone format is invalid", () => {
      const payload = {
        phone: "invalid-phone-number-abc",
      };
      const result = updateProfileSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Format telepon tidak valid");
      }
    });

    it("should fail when birthDate format is invalid", () => {
      const payload = {
        birthDate: "01-01-1990",
      };
      const result = updateProfileSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Format tanggal YYYY-MM-DD");
      }
    });
  });

  describe("crudEmployeeSchema", () => {
    it("should validate a valid CREATE operation", () => {
      const payload = {
        operation: "CREATE",
        data: {
          email: "employee@test.com",
          role: "EMPLOYEE",
          name: "Test Employee",
        },
      };
      const result = crudEmployeeSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should fail when email is invalid", () => {
      const payload = {
        operation: "CREATE",
        data: {
          email: "invalid-email",
        },
      };
      const result = crudEmployeeSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Format email tidak valid");
      }
    });
  });

  describe("addCareerHistorySchema", () => {
    it("should validate a correct career history payload", () => {
      const payload = {
        employeeId: "emp-123",
        effectiveDate: "2026-07-13",
      };
      const result = addCareerHistorySchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should fail when employeeId is empty", () => {
      const payload = {
        employeeId: "",
        effectiveDate: "2026-07-13",
      };
      const result = addCareerHistorySchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("ID pegawai wajib diisi");
      }
    });
  });

  describe("employeeDirectorySchema", () => {
    it("should validate search queries", () => {
      const result = employeeDirectorySchema.safeParse({ search: "John" });
      expect(result.success).toBe(true);
    });
  });

  describe("employeeDirectoryWithPaginationSchema", () => {
    it("should validate valid pagination parameters", () => {
      const result = employeeDirectoryWithPaginationSchema.safeParse({
        search: "John",
        page: 1,
        limit: 10,
      });
      expect(result.success).toBe(true);
    });

    it("should fail when limit exceeds 100", () => {
      const result = employeeDirectoryWithPaginationSchema.safeParse({
        limit: 101,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("masterDataListQuerySchema", () => {
    it("should validate valid limit up to 1000", () => {
      const result = masterDataListQuerySchema.safeParse({
        limit: 1000,
      });
      expect(result.success).toBe(true);
    });

    it("should fail when limit exceeds 1000", () => {
      const result = masterDataListQuerySchema.safeParse({
        limit: 1001,
      });
      expect(result.success).toBe(false);
    });
  });
});
