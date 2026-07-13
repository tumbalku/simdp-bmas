import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  findManyAvailableDocumentTypes,
  findEmployeeByUserId,
  findDocumentRecords,
  findDocumentRecordDetailById,
  findDocumentTypeById,
  softDeleteDocumentType,
  restoreDocumentType,
} from "../repository";
import { mockPrisma } from "../../../../tests/setup";

describe("Document Module Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Document Types", () => {
    it("should find available document types ordered properly", async () => {
      mockPrisma.documentType.findMany.mockResolvedValue([
        { id: "type-1", code: "KTP", name: "Kartu Tanda Penduduk" },
      ]);

      const result = await findManyAvailableDocumentTypes();

      expect(mockPrisma.documentType.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: [{ isMandatory: "desc" }, { name: "asc" }],
      });
      expect(result).toEqual([{ id: "type-1", code: "KTP", name: "Kartu Tanda Penduduk" }]);
    });

    it("should find document type by id", async () => {
      mockPrisma.documentType.findUnique.mockResolvedValue({ id: "type-1", code: "KTP" });

      const result = await findDocumentTypeById("type-1");

      expect(mockPrisma.documentType.findUnique).toHaveBeenCalledWith({
        where: { id: "type-1" },
      });
      expect(result).toEqual({ id: "type-1", code: "KTP" });
    });

    it("should soft delete document type", async () => {
      mockPrisma.documentType.update.mockResolvedValue({ id: "type-1", deletedAt: new Date() });

      await softDeleteDocumentType("type-1");

      expect(mockPrisma.documentType.update).toHaveBeenCalledWith({
        where: { id: "type-1" },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      });
    });

    it("should restore document type", async () => {
      mockPrisma.documentType.update.mockResolvedValue({ id: "type-1", deletedAt: null });

      await restoreDocumentType("type-1");

      expect(mockPrisma.documentType.update).toHaveBeenCalledWith({
        where: { id: "type-1" },
        data: { deletedAt: null },
      });
    });
  });

  describe("Employees", () => {
    it("should find employee by user id", async () => {
      mockPrisma.employee.findFirst.mockResolvedValue({ id: "emp-1", userId: "user-1" });

      const result = await findEmployeeByUserId("user-1");

      expect(mockPrisma.employee.findFirst).toHaveBeenCalledWith({
        where: { userId: "user-1", deletedAt: null },
        select: { id: true, userId: true },
      });
      expect(result).toEqual({ id: "emp-1", userId: "user-1" });
    });
  });

  describe("Document Records Queries", () => {
    it("should find document records with filter", async () => {
      mockPrisma.documentRecord.findMany.mockResolvedValue([]);

      const where = { ownerId: "emp-1", deletedAt: null };
      await findDocumentRecords(where);

      expect(mockPrisma.documentRecord.findMany).toHaveBeenCalledWith({
        where,
        include: {
          documentType: { select: { id: true, name: true, archiveCategory: true } },
          owner: { select: { id: true, name: true, employeeId: true, nik: true } },
        },
        orderBy: { uploadedAt: "desc" },
      });
    });

    it("should find document record detail by id", async () => {
      mockPrisma.documentRecord.findUnique.mockResolvedValue({ id: "doc-1" });

      await findDocumentRecordDetailById("doc-1");

      expect(mockPrisma.documentRecord.findUnique).toHaveBeenCalledWith({
        where: { id: "doc-1", deletedAt: null },
        include: expect.any(Object),
      });
    });
  });
});
