import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createDocumentTypeWithRelations,
  abortDocumentFileReservation,
  finalizeDocumentUploadTransaction,
  reserveDocumentFileTransaction,
  restoreDocumentRecord,
  softDeleteDocumentRecord,
  findDocumentRecords,
  findDocumentRecordsWithPagination,
  findDocumentRecordDetailById,
  findDocumentTypeById,
  findDocumentTypesWithPagination,
  findEmployeeByUserId,
  findManyAvailableDocumentTypes,
  permanentlyDeleteDocumentRecord,
  restoreDocumentType,
  softDeleteDocumentType,
  updateDocumentTypeWithRelations,
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
        include: {
          employmentStatuses: true,
          employeeGroups: true,
          employeePositions: true,
          professionGroups: true,
          employeeRanks: true,
          workplaces: true,
        },
        orderBy: [{ isMandatory: "desc" }, { name: "asc" }],
      });
      expect(result).toEqual([{ id: "type-1", code: "KTP", name: "Kartu Tanda Penduduk" }]);
    });

    it("should find document types with pagination and total count", async () => {
      mockPrisma.documentType.findMany.mockResolvedValue([{ id: "type-1", name: "KTP" }]);
      mockPrisma.documentType.count.mockResolvedValue(1);

      const [types, total] = await findDocumentTypesWithPagination({ deletedAt: null }, 10, 5);

      expect(mockPrisma.documentType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null },
          skip: 10,
          take: 5,
        })
      );
      expect(mockPrisma.documentType.count).toHaveBeenCalledWith({ where: { deletedAt: null } });
      expect(types).toEqual([{ id: "type-1", name: "KTP" }]);
      expect(total).toBe(1);
    });

    it("should find document type by id", async () => {
      mockPrisma.documentType.findUnique.mockResolvedValue({ id: "type-1", code: "KTP" });

      const result = await findDocumentTypeById("type-1");

      expect(mockPrisma.documentType.findUnique).toHaveBeenCalledWith({
        where: { id: "type-1" },
        include: {
          employmentStatuses: true,
          employeeGroups: true,
          employeePositions: true,
          professionGroups: true,
          employeeRanks: true,
          workplaces: true,
        },
      });
      expect(result).toEqual({ id: "type-1", code: "KTP" });
    });

    it("should create document type relations in a transaction", async () => {
      mockPrisma.documentType.create.mockResolvedValue({ id: "type-1" });

      const result = await createDocumentTypeWithRelations(
        "type-1",
        { id: "type-1", name: "STR" },
        { professionGroupIds: ["prof-1"], employeePositionIds: ["pos-1"], workplaceIds: ["work-1"] }
      );

      expect(mockPrisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
      expect(mockPrisma.documentType.create).toHaveBeenCalledWith({ data: { id: "type-1", name: "STR" } });
      expect(mockPrisma.documentTypeProfessionGroup.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ documentTypeId: "type-1", professionGroupId: "prof-1" })],
      });
      expect(mockPrisma.documentTypeWorkplace.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ documentTypeId: "type-1", workplaceId: "work-1" })],
      });
      expect(mockPrisma.documentTypeEmployeePosition.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ documentTypeId: "type-1", employeePositionId: "pos-1" })],
      });
      expect(result).toEqual({ id: "type-1" });
    });

    it("should replace only provided relation groups when updating document type", async () => {
      mockPrisma.documentType.update.mockResolvedValue({ id: "type-1" });

      await updateDocumentTypeWithRelations(
        "type-1",
        { name: "Updated" },
        {
          professionGroupIds: ["prof-1"],
          employmentStatusIds: ["status-1"],
          employeeGroupIds: ["group-1"],
          employeePositionIds: ["pos-1"],
          employeeRankIds: ["rank-1"],
          workplaceIds: ["work-1"],
        }
      );

      expect(mockPrisma.documentType.update).toHaveBeenCalledWith({
        where: { id: "type-1" },
        data: { name: "Updated" },
      });

      // Verification of delete and create operations for relations
      expect(mockPrisma.documentTypeProfessionGroup.deleteMany).toHaveBeenCalledWith({
        where: { documentTypeId: "type-1" },
      });
      expect(mockPrisma.documentTypeProfessionGroup.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ documentTypeId: "type-1", professionGroupId: "prof-1" })],
      });

      expect(mockPrisma.documentTypeEmploymentStatus.deleteMany).toHaveBeenCalledWith({
        where: { documentTypeId: "type-1" },
      });
      expect(mockPrisma.documentTypeEmploymentStatus.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ documentTypeId: "type-1", employmentStatusId: "status-1" })],
      });

      expect(mockPrisma.documentTypeEmployeeGroup.deleteMany).toHaveBeenCalledWith({
        where: { documentTypeId: "type-1" },
      });
      expect(mockPrisma.documentTypeEmployeeGroup.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ documentTypeId: "type-1", employeeGroupId: "group-1" })],
      });

      expect(mockPrisma.documentTypeEmployeePosition.deleteMany).toHaveBeenCalledWith({
        where: { documentTypeId: "type-1" },
      });
      expect(mockPrisma.documentTypeEmployeePosition.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ documentTypeId: "type-1", employeePositionId: "pos-1" })],
      });

      expect(mockPrisma.documentTypeEmployeeRank.deleteMany).toHaveBeenCalledWith({
        where: { documentTypeId: "type-1" },
      });
      expect(mockPrisma.documentTypeEmployeeRank.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ documentTypeId: "type-1", employeeRankId: "rank-1" })],
      });

      expect(mockPrisma.documentTypeWorkplace.deleteMany).toHaveBeenCalledWith({
        where: { documentTypeId: "type-1" },
      });
      expect(mockPrisma.documentTypeWorkplace.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ documentTypeId: "type-1", workplaceId: "work-1" })],
      });
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
    it("should archive the document record and stored file atomically", async () => {
      mockPrisma.documentRecord.findUnique.mockResolvedValue({ storedFileId: "file-1" });

      await softDeleteDocumentRecord("doc-1", "admin-1");

      expect(mockPrisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
      expect(mockPrisma.documentRecord.update).toHaveBeenCalledWith({
        where: { id: "doc-1" },
        data: { deletedAt: expect.any(Date), isCurrent: false, updatedBy: "admin-1" },
      });
      expect(mockPrisma.storedFile.update).toHaveBeenCalledWith({
        where: { id: "file-1" },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it("should restore the document record and stored file atomically", async () => {
      mockPrisma.documentRecord.findUnique.mockResolvedValue({ storedFileId: "file-1" });

      await restoreDocumentRecord("doc-1", false, "admin-1");

      expect(mockPrisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
      expect(mockPrisma.documentRecord.update).toHaveBeenCalledWith({
        where: { id: "doc-1" },
        data: { deletedAt: null, isCurrent: true, allowMultipleSnapshot: false, updatedBy: "admin-1" },
      });
      expect(mockPrisma.storedFile.update).toHaveBeenCalledWith({
        where: { id: "file-1" },
        data: { deletedAt: null },
      });
    });

    it("should find document records with filter", async () => {
      mockPrisma.documentRecord.findMany.mockResolvedValue([]);

      const where = { ownerId: "emp-1", deletedAt: null };
      await findDocumentRecords(where);

      expect(mockPrisma.documentRecord.findMany).toHaveBeenCalledWith({
        where,
        include: {
          storedFile: true,
          documentType: { select: { id: true, name: true, archiveCategory: true } },
          owner: { select: { id: true, name: true, employeeId: true, nik: true } },
        },
        orderBy: { uploadedAt: "desc" },
      });
    });

    it("should find paginated document records and total count together", async () => {
      mockPrisma.documentRecord.findMany.mockResolvedValue([{ id: "doc-1" }]);
      mockPrisma.documentRecord.count.mockResolvedValue(1);

      const result = await findDocumentRecordsWithPagination({ status: "PENDING" }, 10, 5);

      expect(mockPrisma.documentRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: "PENDING" }, skip: 10, take: 5 })
      );
      expect(mockPrisma.documentRecord.count).toHaveBeenCalledWith({ where: { status: "PENDING" } });
      expect(result).toEqual([[{ id: "doc-1" }], 1]);
    });

    it("should find document record detail by id", async () => {
      mockPrisma.documentRecord.findUnique.mockResolvedValue({ id: "doc-1" });

      await findDocumentRecordDetailById("doc-1");

      expect(mockPrisma.documentRecord.findUnique).toHaveBeenCalledWith({
        where: { id: "doc-1", deletedAt: null },
        include: expect.any(Object),
      });
    });

    it("should permanently delete document record, stored file, and related notifications", async () => {
      mockPrisma.documentRecord.findUnique.mockResolvedValue({ storedFileId: "file-1" });

      await permanentlyDeleteDocumentRecord("doc-1");

      expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({
        where: { relatedEntityType: "DOCUMENT_RECORD", relatedEntityId: "doc-1" },
      });
      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
      expect(mockPrisma.verificationHistory.deleteMany).toHaveBeenCalledWith({
        where: { documentRecordId: "doc-1" },
      });
      expect(mockPrisma.documentRecord.delete).toHaveBeenCalledWith({ where: { id: "doc-1" } });
      expect(mockPrisma.storedFile.delete).toHaveBeenCalledWith({ where: { id: "file-1" } });
    });

    it("should reserve physical file metadata without creating a document record", async () => {
      mockPrisma.documentRecord.count.mockResolvedValue(0);
      mockPrisma.storedFile.create.mockResolvedValue({ id: "file-1" });
      const buildFile = vi.fn().mockReturnValue({
        fileName: "sk.pdf",
        uploadPath: "uploads/sk.pdf",
      });

      const result = await reserveDocumentFileTransaction({
        storedFileId: "file-1",
        ownerId: "emp-1",
        documentTypeId: "type-1",
        buildFile,
        fileSize: BigInt(10),
        mimeType: "application/pdf",
        fileHash: "hash",
        storageProvider: "LOCAL",
        uploadedBy: "user-1",
      });

      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
      expect(mockPrisma.documentRecord.count).toHaveBeenCalledWith({
        where: { ownerId: "emp-1", documentTypeId: "type-1" },
      });
      expect(buildFile).toHaveBeenCalledWith(1);
      expect(mockPrisma.storedFile.create).toHaveBeenCalledWith({
        data: {
          id: "file-1",
          fileName: "sk.pdf",
          filePath: "uploads/sk.pdf",
          fileSize: BigInt(10),
          mimeType: "application/pdf",
          fileHash: "hash",
          storageProvider: "LOCAL",
          uploadedBy: "user-1",
        },
      });
      expect(mockPrisma.documentRecord.create).not.toHaveBeenCalled();
      expect(result).toEqual({ storedFileId: "file-1", fileName: "sk.pdf", uploadPath: "uploads/sk.pdf" });
    });

    it("should create document after storage succeeds and let database triggers replace current records", async () => {
      mockPrisma.documentRecord.findMany.mockResolvedValue([{ id: "old-doc", status: "APPROVED" }]);
      mockPrisma.documentRecord.create.mockResolvedValue({ id: "doc-1", status: "PENDING" });
      mockPrisma.storedFile.update.mockResolvedValue({
        id: "file-1",
        fileName: "sk.pdf",
        filePath: "uploads/sk.pdf",
        fileSize: BigInt(10),
        mimeType: "application/pdf",
        fileHash: "hash",
        storageProvider: "LOCAL",
      });
      mockPrisma.user.findMany.mockResolvedValue([{ id: "admin-1" }, { id: "staff-1" }]);

      const result = await finalizeDocumentUploadTransaction({
        docId: "doc-1",
        storedFileId: "file-1",
        savedPath: "uploads/sk.pdf",
        ownerId: "emp-1",
        documentTypeId: "type-1",
        title: "SK Pangkat",
        documentNumber: null,
        issueDate: null,
        expiryDate: null,
        createdBy: "user-1",
        replacesDocumentId: null,
      });

      expect(mockPrisma.documentRecord.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.documentRecord.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: "doc-1",
          storedFileId: "file-1",
          ownerId: "emp-1",
          documentTypeId: "type-1",
          replacesDocumentId: null,
        }),
      });
      expect(mockPrisma.verificationHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ documentRecordId: "doc-1", status: "PENDING" }),
      });
      expect(result).toEqual({
        record: expect.objectContaining({ id: "doc-1", fileName: "sk.pdf", filePath: "uploads/sk.pdf" }),
        replacedDocuments: [{ id: "old-doc", status: "APPROVED" }],
        verificationRecipientUserIds: ["admin-1", "staff-1"],
      });
    });

    it("should remove an unused stored-file reservation after upload failure", async () => {
      await abortDocumentFileReservation("file-1");

      expect(mockPrisma.storedFile.delete).toHaveBeenCalledWith({ where: { id: "file-1" } });
    });
  });
});
