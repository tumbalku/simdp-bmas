import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  handleDocumentTypeCrud,
  uploadDocumentRecord,
  generateDownloadUrl,
  softDeleteDocument,
  replaceDocumentFile,
  restoreDocument,
  permanentlyDeleteDocument,
  processExpiredDocumentsAndReminders,
  getDocumentRecordsForSession,
  getDocumentRecordDetailForSession,
  getAvailableDocumentTypes,
} from "../service";
import { mockPrisma } from "../../../../tests/setup";
import { storage } from "@/lib/storage";

vi.mock("@/lib/events", () => ({
  EVENT_NAMES: {
    DOCUMENT_EXPIRY_REMINDER_CREATED: "document/expiry-reminder.created",
    DOCUMENT_VERIFICATION_REQUESTED: "document/verification.requested",
  },
  publishEvent: vi.fn(),
}));

import { EVENT_NAMES, publishEvent } from "@/lib/events";

// Mock storage
vi.mock("@/lib/storage", () => ({
  storage: {
    upload: vi.fn().mockResolvedValue("uploads/PDF/PDF-1-user-1.pdf"),
    getTemporaryUrl: vi.fn().mockResolvedValue("/api/v1/documents/download/stream?file=PDF-1-user-1.pdf"),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("Document Module Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("document list and detail queries", () => {
    it("should list only owned documents for employee sessions", async () => {
      const session = { userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" };
      mockPrisma.employee.findFirst.mockResolvedValue({ id: "emp-1", userId: "user-1" });
      mockPrisma.documentRecord.findMany.mockResolvedValue([
        {
          id: "doc-1",
          title: "KTP",
          status: "APPROVED",
          uploadedAt: new Date("2026-01-02T00:00:00.000Z"),
          expiryDate: null,
          fileName: "ktp.pdf",
          fileSize: BigInt(1024),
          documentType: { id: "type-1", name: "KTP", archiveCategory: "PERSONAL" },
          owner: { id: "emp-1", name: "John Doe", employeeId: "1990", nik: "7471" },
        },
      ]);

      const result = await getDocumentRecordsForSession(session);

      expect(mockPrisma.documentRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ownerId: "emp-1", deletedAt: null }),
        })
      );
      expect(result).toEqual([
        expect.objectContaining({ id: "doc-1", ownerName: "John Doe", fileSize: 1024 }),
      ]);
    });

    it("should keep employee ownership filter when listing archived documents", async () => {
      const session = { userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" };
      mockPrisma.employee.findFirst.mockResolvedValue({ id: "emp-1", userId: "user-1" });
      mockPrisma.documentRecord.findMany.mockResolvedValue([]);

      await getDocumentRecordsForSession(session, { archiveView: "archived" });

      expect(mockPrisma.documentRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ownerId: "emp-1", deletedAt: { not: null } }),
        })
      );
    });

    it("should also scope admin/staff self-service document lists to their own employee profile", async () => {
      const session = { userId: "admin-user", role: "ADMIN", employeeId: "admin-emp" };
      mockPrisma.employee.findFirst.mockResolvedValue({ id: "admin-emp", userId: "admin-user" });
      mockPrisma.documentRecord.findMany.mockResolvedValue([]);

      await getDocumentRecordsForSession(session);

      expect(mockPrisma.documentRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ownerId: "admin-emp", deletedAt: null }),
        })
      );
    });

    it("should return an empty self-service document list when the user has no employee profile", async () => {
      const session = { userId: "admin-user", role: "ADMIN", employeeId: "admin-emp" };
      mockPrisma.employee.findFirst.mockResolvedValue(null);

      const result = await getDocumentRecordsForSession(session);

      expect(result).toEqual([]);
      expect(mockPrisma.documentRecord.findMany).not.toHaveBeenCalled();
    });

    it("should fetch document detail with ownership guard", async () => {
      const session = { userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" };
      mockPrisma.documentRecord.findUnique.mockResolvedValue({
        id: "doc-1",
        title: "KTP",
        status: "APPROVED",
        uploadedAt: new Date("2026-01-02T00:00:00.000Z"),
        expiryDate: null,
        fileName: "ktp.pdf",
        fileSize: BigInt(1024),
        documentNumber: null,
        issueDate: null,
        mimeType: "application/pdf",
        owner: { id: "emp-1", userId: "user-1", name: "John Doe", employeeId: "1990", nik: "7471" },
        documentType: { id: "type-1", name: "KTP", archiveCategory: "PERSONAL" },
        verificationHistories: [],
      });

      const result = await getDocumentRecordDetailForSession("doc-1", session);

      expect(result).toEqual(expect.objectContaining({ id: "doc-1", ownerName: "John Doe" }));
    });

    it("should list active document types for upload options", async () => {
      mockPrisma.documentType.findMany.mockResolvedValue([
        { id: "type-1", code: "KTP", name: "KTP", archiveCategory: "PERSONAL", isMandatory: true, allowMultiple: false, requiresExpiryDate: false, requiresIssueDate: false, requiresDocumentNumber: false, allowedFormats: "pdf,jpg,png", maxSizeMb: 2 },
      ]);

      const result = await getAvailableDocumentTypes();

      expect(mockPrisma.documentType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null } })
      );
      expect(result[0]).toEqual(expect.objectContaining({ id: "type-1", name: "KTP" }));
    });

    it("should filter employee upload options by target rules", async () => {
      mockPrisma.documentType.findMany.mockResolvedValue([
        {
          id: "type-1",
          code: "ASN",
          name: "Dokumen ASN",
          archiveCategory: "EMPLOYMENT",
          allowedFormats: "pdf",
          maxSizeMb: 2,
          employmentStatuses: [{ employmentStatusId: "status-asn" }],
          employeeGroups: [],
        },
        {
          id: "type-2",
          code: "KONTRAK",
          name: "Dokumen Kontrak",
          archiveCategory: "EMPLOYMENT",
          allowedFormats: "pdf",
          maxSizeMb: 2,
          employmentStatuses: [{ employmentStatusId: "status-kontrak" }],
          employeeGroups: [],
        },
      ]);
      mockPrisma.employee.findUnique.mockResolvedValue({
        id: "emp-1",
        userId: "user-1",
        employmentStatusId: "status-asn",
        employeeGroupId: "group-pns",
        employeePosition: null,
        employeeRankId: null,
        workplaceId: null,
      });

      const result = await getAvailableDocumentTypes({
        userId: "user-1",
        role: "EMPLOYEE",
        employeeId: "emp-1",
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({ id: "type-1" }));
    });

    it("should filter admin/staff upload options by their own employee target rules", async () => {
      mockPrisma.documentType.findMany.mockResolvedValue([
        {
          id: "type-1",
          code: "ASN",
          name: "Dokumen ASN",
          archiveCategory: "EMPLOYMENT",
          allowedFormats: "pdf",
          maxSizeMb: 2,
          employmentStatuses: [{ employmentStatusId: "status-asn" }],
          employeeGroups: [],
        },
        {
          id: "type-2",
          code: "KONTRAK",
          name: "Dokumen Kontrak",
          archiveCategory: "EMPLOYMENT",
          allowedFormats: "pdf",
          maxSizeMb: 2,
          employmentStatuses: [{ employmentStatusId: "status-kontrak" }],
          employeeGroups: [],
        },
      ]);
      mockPrisma.employee.findUnique.mockResolvedValue({
        id: "admin-emp",
        userId: "admin-user",
        employmentStatusId: "status-asn",
        employeeGroupId: "group-pns",
        employeePosition: null,
        employeeRankId: null,
        workplaceId: null,
      });

      const result = await getAvailableDocumentTypes({
        userId: "admin-user",
        role: "ADMIN",
        employeeId: "admin-emp",
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({ id: "type-1" }));
    });
  });

  describe("handleDocumentTypeCrud", () => {
    it("should create document type", async () => {
      const data = {
        code: "PDF",
        name: "PDF Doc",
        archiveCategory: "PERSONAL",
        allowedFormats: "pdf",
        maxSizeMb: "5",
        professionGroupIds: ["prof-1"],
      };

      mockPrisma.documentType.create.mockResolvedValue({ id: "type-1", code: "PDF", name: "PDF Doc" });
      mockPrisma.documentTypeProfessionGroup.createMany.mockResolvedValue({ count: 1 });

      const result = await handleDocumentTypeCrud("CREATE", undefined, data, "admin-1", "Admin User", "ADMIN");
      expect(result).toEqual({ id: "type-1", code: "PDF", name: "PDF Doc" });
      expect(mockPrisma.documentType.create).toHaveBeenCalled();
    });

    it("should restore document type", async () => {
      mockPrisma.documentType.findUnique.mockResolvedValue({ id: "type-1", code: "PDF", name: "PDF Doc" });
      mockPrisma.documentType.update.mockResolvedValue({ id: "type-1", code: "PDF", name: "PDF Doc" });

      const result = await handleDocumentTypeCrud("RESTORE", "type-1", undefined, "admin-1", "Admin User", "ADMIN");
      expect(result).toEqual({ id: "type-1", code: "PDF", name: "PDF Doc" });
      expect(mockPrisma.documentType.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "type-1" },
          data: { deletedAt: null },
        })
      );
    });

    it("should update document type", async () => {
      mockPrisma.documentType.findUnique.mockResolvedValue({ id: "type-1", code: "PDF", name: "PDF Doc" });
      mockPrisma.documentType.update.mockResolvedValue({ id: "type-1", code: "PDF", name: "PDF Doc Updated" });

      const data = {
        code: "PDF",
        name: "PDF Doc Updated",
        archiveCategory: "PERSONAL",
        allowedFormats: "pdf",
        maxSizeMb: "5",
        professionGroupIds: ["prof-1"],
      };

      const result = await handleDocumentTypeCrud("UPDATE", "type-1", data, "admin-1", "Admin User", "ADMIN");
      expect(result).toEqual({ id: "type-1", code: "PDF", name: "PDF Doc Updated" });
      expect(mockPrisma.documentType.update).toHaveBeenCalled();
    });

    it("should delete document type", async () => {
      mockPrisma.documentType.findUnique.mockResolvedValue({ id: "type-1", code: "PDF", name: "PDF Doc" });
      mockPrisma.documentType.update.mockResolvedValue({ id: "type-1", code: "PDF", name: "PDF Doc" });

      const result = await handleDocumentTypeCrud("DELETE", "type-1", undefined, "admin-1", "Admin User", "ADMIN");
      expect(result).toEqual({ id: "type-1", code: "PDF", name: "PDF Doc" });
      expect(mockPrisma.documentType.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "type-1" },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        })
      );
    });

    it("should throw error when CREATE is called with missing required fields", async () => {
      const data = {
        code: "", // Empty
        name: "PDF Doc",
        archiveCategory: "PERSONAL",
        allowedFormats: "pdf",
        maxSizeMb: "5",
      };

      await expect(
        handleDocumentTypeCrud("CREATE", undefined, data, "admin-1", "Admin User", "ADMIN")
      ).rejects.toThrow("Field wajib DocumentType tidak boleh kosong");
    });

    it("should throw error when UPDATE is called without ID", async () => {
      await expect(
        handleDocumentTypeCrud("UPDATE", undefined, {}, "admin-1", "Admin User", "ADMIN")
      ).rejects.toThrow("ID jenis dokumen wajib diisi");
    });

    it("should throw error when UPDATE target document type is not found", async () => {
      mockPrisma.documentType.findUnique.mockResolvedValue(null);

      await expect(
        handleDocumentTypeCrud("UPDATE", "non-existent-id", {}, "admin-1", "Admin User", "ADMIN")
      ).rejects.toThrow("Jenis dokumen tidak ditemukan");
    });

    it("should throw error when DELETE target document type is not found", async () => {
      mockPrisma.documentType.findUnique.mockResolvedValue(null);

      await expect(
        handleDocumentTypeCrud("DELETE", "non-existent-id", undefined, "admin-1", "Admin User", "ADMIN")
      ).rejects.toThrow("Jenis dokumen tidak ditemukan");
    });

    it("should throw error when RESTORE target document type is not found", async () => {
      mockPrisma.documentType.findUnique.mockResolvedValue(null);

      await expect(
        handleDocumentTypeCrud("RESTORE", "non-existent-id", undefined, "admin-1", "Admin User", "ADMIN")
      ).rejects.toThrow("Jenis dokumen tidak ditemukan");
    });

    it("should throw error for unsupported operation", async () => {
      await expect(
        handleDocumentTypeCrud("INVALID_OP" as never, "type-1", undefined, "admin-1", "Admin User", "ADMIN")
      ).rejects.toThrow("Operasi tidak didukung");
    });
  });

  describe("uploadDocumentRecord", () => {
    it("should validate file size and format (magic bytes) and save document record", async () => {
      const docType = {
        id: "type-1",
        code: "PDF",
        name: "PDF Doc",
        archiveCategory: "PERSONAL",
        maxSizeMb: 5,
        allowedFormats: "pdf",
        requiresDocumentNumber: false,
        requiresIssueDate: false,
        requiresExpiryDate: false,
      };

      const employee = {
        id: "emp-1",
        userId: "user-1",
        employeeId: "empId-1",
        nik: "198501012010011001",
        name: "John Doe",
      };

      mockPrisma.documentType.findUnique.mockResolvedValue(docType);
      mockPrisma.employee.findUnique.mockResolvedValue(employee);
      mockPrisma.documentRecord.count.mockResolvedValue(0);
      mockPrisma.documentRecord.findMany.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue([{ id: "admin-1" }]);
      mockPrisma.documentRecord.create.mockResolvedValue({
        id: "doc-1",
        status: "PENDING",
        fileName: "198501012010011001_PERSONAL_PDF_20260115_1.pdf",
        filePath: "uploads/PDF/198501012010011001_PERSONAL_PDF_20260115_1.pdf",
      });
      mockPrisma.documentRecord.update.mockResolvedValue({
        id: "doc-1",
        status: "PENDING",
        fileName: "198501012010011001_PERSONAL_PDF_20260115_1.pdf",
        filePath: "uploads/PDF/PDF-1-user-1.pdf",
      });

      // Valid PDF magic bytes: %PDF (25 50 44 46)
      const mockFile = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x00, 0x00])], "test.pdf", {
        type: "application/pdf",
      });

      const session = { userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" };

      const result = await uploadDocumentRecord(
        {
          documentTypeId: "type-1",
          file: mockFile,
          issueDate: "2026-01-15",
        },
        session
      );

      expect(result).toBeDefined();
      expect(storage.upload).toHaveBeenCalledWith(
        "PDF/198501012010011001_PERSONAL_PDF_20260115_1.pdf",
        expect.any(Buffer),
        "application/pdf"
      );
      expect(mockPrisma.documentRecord.create).toHaveBeenCalled();
      expect(mockPrisma.documentRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fileName: "198501012010011001_PERSONAL_PDF_20260115_1.pdf",
            storageProvider: "LOCAL",
          }),
        })
      );
      expect(publishEvent).toHaveBeenCalledWith(EVENT_NAMES.DOCUMENT_VERIFICATION_REQUESTED, {
        recipientUserIds: ["admin-1"],
        documentRecordId: "doc-1",
        documentTypeName: "PDF Doc",
        ownerName: "John Doe",
        action: "UPLOADED",
      });
    });

    it("should throw error for invalid magic bytes", async () => {
      const docType = {
        id: "type-1",
        code: "PDF",
        name: "PDF Doc",
        maxSizeMb: 5,
        allowedFormats: "pdf",
      };

      const employee = { id: "emp-1", userId: "user-1", name: "John" };

      mockPrisma.documentType.findUnique.mockResolvedValue(docType);
      mockPrisma.employee.findUnique.mockResolvedValue(employee);

      // Plain text instead of PDF magic bytes
      const mockFile = new File([new Uint8Array([1, 2, 3, 4, 5])], "test.pdf", {
        type: "application/pdf",
      });

      const session = { userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" };

      await expect(
        uploadDocumentRecord(
          {
            documentTypeId: "type-1",
            file: mockFile,
          },
          session
        )
      ).rejects.toThrow("Format file tidak dikenal atau tidak didukung");
    });

    it("should reject upload when document type does not target the employee", async () => {
      const docType = {
        id: "type-1",
        code: "ASN",
        name: "Dokumen ASN",
        maxSizeMb: 5,
        allowedFormats: "pdf",
        deletedAt: null,
        employmentStatuses: [{ employmentStatusId: "status-asn" }],
        employeeGroups: [{ employeeGroupId: "group-pppk" }],
      };

      const employee = {
        id: "emp-1",
        userId: "user-1",
        employeeId: "empId-1",
        name: "John Doe",
        employmentStatusId: "status-asn",
        employeeGroupId: "group-pns",
        employeePosition: null,
        employeeRankId: null,
        workplaceId: null,
      };

      mockPrisma.documentType.findUnique.mockResolvedValue(docType);
      mockPrisma.employee.findUnique.mockResolvedValue(employee);

      const mockFile = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "test.pdf", {
        type: "application/pdf",
      });

      await expect(
        uploadDocumentRecord(
          {
            documentTypeId: "type-1",
            file: mockFile,
          },
          { userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" }
        )
      ).rejects.toThrow("Jenis dokumen ini tidak berlaku");
    });

    it("should reject adding another active document for a non-multiple document type", async () => {
      const docType = {
        id: "type-1",
        code: "KTP",
        name: "KTP",
        maxSizeMb: 5,
        allowedFormats: "pdf",
        allowMultiple: false,
        deletedAt: null,
        employmentStatuses: [],
        employeeGroups: [],
      };
      const employee = { id: "emp-1", userId: "user-1", employeeId: "empId-1", name: "John Doe" };

      mockPrisma.documentType.findUnique.mockResolvedValue(docType);
      mockPrisma.employee.findUnique.mockResolvedValue(employee);
      mockPrisma.documentRecord.count.mockResolvedValueOnce(1);

      const mockFile = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "test.pdf", {
        type: "application/pdf",
      });

      await expect(
        uploadDocumentRecord(
          {
            documentTypeId: "type-1",
            file: mockFile,
          },
          { userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" }
        )
      ).rejects.toThrow("Gunakan tombol Ganti");

      expect(mockPrisma.documentRecord.create).not.toHaveBeenCalled();
    });
  });

  describe("replaceDocumentFile", () => {
    it("should replace file metadata on the same document id and add verification history", async () => {
      const doc = {
        id: "doc-1",
        ownerId: "emp-1",
        documentTypeId: "type-1",
        status: "APPROVED",
        filePath: "uploads/KTP/KTP-1-empId-1.pdf",
        owner: {
          id: "emp-1",
          userId: "user-1",
        employeeId: "empId-1",
          nik: "198501012010011001",
          name: "John Doe",
          employeePosition: null,
        },
        documentType: {
          id: "type-1",
          code: "KTP",
          name: "KTP",
          archiveCategory: "PERSONAL",
          maxSizeMb: 5,
          allowedFormats: "pdf",
          deletedAt: null,
          employmentStatuses: [],
          employeeGroups: [],
          professionGroups: [],
          employeePositions: [],
          employeeRanks: [],
          workplaces: [],
        },
      };

      mockPrisma.documentRecord.findUnique.mockResolvedValue(doc);
      mockPrisma.documentRecord.findUniqueOrThrow.mockResolvedValue({
        title: null,
        status: "APPROVED",
        isCurrent: true,
        fileName: "KTP-1-empId-1.pdf",
        filePath: "uploads/KTP/KTP-1-empId-1.pdf",
        fileSize: BigInt(10),
        mimeType: "application/pdf",
        fileHash: "old-hash",
        storageProvider: "LOCAL",
        documentNumber: null,
        issueDate: null,
        expiryDate: null,
        updatedBy: null,
        uploadedAt: new Date("2026-01-01T00:00:00.000Z"),
        reminderH30SentAt: null,
        reminderH7SentAt: null,
        reminderH1SentAt: null,
      });
      mockPrisma.documentRecord.count.mockResolvedValue(1);
      mockPrisma.user.findMany.mockResolvedValue([{ id: "admin-1" }]);
      mockPrisma.documentRecord.update.mockResolvedValue({
        id: "doc-1",
        status: "PENDING",
        fileName: "198501012010011001_PERSONAL_KTP_20260115_2.pdf",
        filePath: "uploads/KTP/198501012010011001_PERSONAL_KTP_20260115_2.pdf",
      });
      mockPrisma.securityLog.create.mockResolvedValue({});

      const mockFile = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "ktp-baru.pdf", {
        type: "application/pdf",
      });

      const result = await replaceDocumentFile(
        { documentId: "doc-1", file: mockFile, issueDate: "2026-01-15" },
        { userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" }
      );

      expect(result.id).toBe("doc-1");
      expect(storage.upload).toHaveBeenCalledWith(
        "KTP/198501012010011001_PERSONAL_KTP_20260115_2.pdf",
        expect.any(Buffer),
        "application/pdf"
      );
      expect(mockPrisma.documentRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "doc-1" },
          data: expect.objectContaining({
            status: "PENDING",
            fileName: "198501012010011001_PERSONAL_KTP_20260115_2.pdf",
            storageProvider: "LOCAL",
          }),
        })
      );
      expect(mockPrisma.verificationHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            documentRecordId: "doc-1",
            status: "PENDING",
            reviewNote: expect.stringContaining("diganti"),
          }),
        })
      );
      expect(publishEvent).toHaveBeenCalledWith(EVENT_NAMES.DOCUMENT_VERIFICATION_REQUESTED, {
        recipientUserIds: ["admin-1"],
        documentRecordId: "doc-1",
        documentTypeName: "KTP",
        ownerName: "John Doe",
        action: "REPLACED",
      });
    });

    it("should reject replacing expired documents", async () => {
      mockPrisma.documentRecord.findUnique.mockResolvedValue({
        id: "doc-1",
        ownerId: "emp-1",
        documentTypeId: "type-1",
        status: "EXPIRED",
        owner: {
          userId: "user-1",
          employeePosition: null,
        },
        documentType: {
          deletedAt: null,
          employmentStatuses: [],
          employeeGroups: [],
          professionGroups: [],
          employeePositions: [],
          employeeRanks: [],
          workplaces: [],
        },
      });

      const mockFile = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "test.pdf", {
        type: "application/pdf",
      });

      await expect(
        replaceDocumentFile(
          { documentId: "doc-1", file: mockFile },
          { userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" }
        )
      ).rejects.toThrow("Status dokumen tidak dapat diganti file.");

      expect(mockPrisma.documentRecord.update).not.toHaveBeenCalled();
    });

    it("should reject replacing another user's document", async () => {
      mockPrisma.documentRecord.findUnique.mockResolvedValue({
        id: "doc-1",
        owner: { userId: "user-2" },
        documentType: { deletedAt: null },
      });

      const mockFile = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "test.pdf", {
        type: "application/pdf",
      });

      await expect(
        replaceDocumentFile(
          { documentId: "doc-1", file: mockFile },
          { userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" }
        )
      ).rejects.toThrow("OWNERSHIP_REQUIRED");

      expect(mockPrisma.documentRecord.update).not.toHaveBeenCalled();
    });
  });

  describe("generateDownloadUrl & ownership check", () => {
    it("should allow owner to download document", async () => {
      const doc = {
        id: "doc-1",
        filePath: "uploads/PDF/PDF-1-empId-1.pdf",
        owner: { userId: "user-1", name: "John Doe" },
      };
      mockPrisma.documentRecord.findUnique.mockResolvedValue(doc);

      const session = { userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" };
      const url = await generateDownloadUrl("doc-1", session);
      expect(url).toBeDefined();
    });

    it("should reject non-owner EMPLOYEE from downloading document", async () => {
      const doc = {
        id: "doc-1",
        filePath: "uploads/PDF/PDF-1-empId-1.pdf",
        owner: { userId: "user-2", name: "John Doe" },
      };
      mockPrisma.documentRecord.findUnique.mockResolvedValue(doc);

      const session = { userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" };
      await expect(generateDownloadUrl("doc-1", session)).rejects.toThrow("OWNERSHIP_REQUIRED");
    });

    it("should allow ADMIN to generate download URL for document owned by another employee", async () => {
      const doc = {
        id: "doc-1",
        filePath: "uploads/PDF/PDF-1-empId-2.pdf",
        owner: { userId: "user-2", name: "Other Employee" },
      };
      mockPrisma.documentRecord.findUnique.mockResolvedValue(doc);
      mockPrisma.securityLog.create.mockResolvedValue({});

      const session = { userId: "admin-1", role: "ADMIN", employeeId: null };
      const url = await generateDownloadUrl("doc-1", session);
      expect(url).toBeDefined();
    });

    it("should allow STAFF to generate download URL for document owned by another employee", async () => {
      const doc = {
        id: "doc-1",
        filePath: "uploads/PDF/PDF-1-empId-2.pdf",
        owner: { userId: "user-2", name: "Other Employee" },
      };
      mockPrisma.documentRecord.findUnique.mockResolvedValue(doc);
      mockPrisma.securityLog.create.mockResolvedValue({});

      const session = { userId: "staff-1", role: "STAFF", employeeId: "emp-2" };
      const url = await generateDownloadUrl("doc-1", session);
      expect(url).toBeDefined();
    });
  });

  describe("softDeleteDocument", () => {
    it("should archive an owned pending employee document and create an audit log", async () => {
      mockPrisma.documentRecord.findUnique.mockResolvedValue({
        id: "doc-1",
        status: "PENDING",
        owner: { userId: "user-1", name: "John Doe" },
      });
      mockPrisma.documentRecord.update.mockResolvedValue({ id: "doc-1", deletedAt: new Date() });
      mockPrisma.securityLog.create.mockResolvedValue({});

      const success = await softDeleteDocument("doc-1", {
        userId: "user-1",
        role: "EMPLOYEE",
        employeeId: "emp-1",
      });

      expect(success).toBe(true);
      expect(mockPrisma.documentRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "doc-1" },
          data: expect.objectContaining({ deletedAt: expect.any(Date), isCurrent: false }),
        })
      );
      expect(mockPrisma.securityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actorId: "user-1",
            actorName: "John Doe",
            actorRole: "EMPLOYEE",
            eventType: "DOCUMENT_DELETED",
            resource: "DocumentRecord:doc-1",
            status: "SUCCESS",
          }),
        })
      );
    });

    it("should allow an employee to archive an owned approved document", async () => {
      mockPrisma.documentRecord.findUnique.mockResolvedValue({
        id: "doc-1",
        status: "APPROVED",
        owner: { userId: "user-1", name: "John Doe" },
      });
      mockPrisma.documentRecord.update.mockResolvedValue({ id: "doc-1", deletedAt: new Date() });
      mockPrisma.securityLog.create.mockResolvedValue({});

      const success = await softDeleteDocument("doc-1", {
        userId: "user-1",
        role: "EMPLOYEE",
        employeeId: "emp-1",
      });

      expect(success).toBe(true);
      expect(mockPrisma.documentRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "doc-1" },
          data: expect.objectContaining({ deletedAt: expect.any(Date), isCurrent: false }),
        })
      );
    });

    it("should reject employee soft delete for another employee document", async () => {
      mockPrisma.documentRecord.findUnique.mockResolvedValue({
        id: "doc-1",
        status: "PENDING",
        owner: { userId: "user-2", name: "Other Employee" },
      });

      await expect(
        softDeleteDocument("doc-1", {
          userId: "user-1",
          role: "EMPLOYEE",
          employeeId: "emp-1",
        })
      ).rejects.toThrow("OWNERSHIP_REQUIRED");

      expect(mockPrisma.documentRecord.update).not.toHaveBeenCalled();
    });
  });

  describe("restoreDocument", () => {
    it("should allow ADMIN to restore document", async () => {
      const doc = {
        id: "doc-1",
        ownerId: "emp-1",
        documentTypeId: "type-1",
        deletedAt: new Date("2026-07-17T00:00:00.000Z"),
        owner: { name: "John" },
        documentType: { allowMultiple: false },
      };
      mockPrisma.documentRecord.findUnique.mockResolvedValue(doc);
      mockPrisma.documentRecord.findFirst.mockResolvedValue(null);

      const session = { userId: "admin-1", role: "ADMIN", employeeId: null };
      const success = await restoreDocument("doc-1", session);
      expect(success).toBe(true);
      expect(mockPrisma.documentRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "doc-1" },
          data: { deletedAt: null, isCurrent: true, allowMultipleSnapshot: false },
        })
      );
    });

    it("should reject restore for single-document types when an active document already exists", async () => {
      mockPrisma.documentRecord.findUnique.mockResolvedValue({
        id: "archived-doc",
        ownerId: "emp-1",
        documentTypeId: "type-1",
        deletedAt: new Date("2026-07-17T00:00:00.000Z"),
        owner: { name: "John" },
        documentType: { allowMultiple: false },
      });
      mockPrisma.documentRecord.findFirst.mockResolvedValue({
        id: "active-doc",
        title: "KTP aktif",
        fileName: "KTP-active.pdf",
      });

      await expect(
        restoreDocument("archived-doc", { userId: "admin-1", role: "ADMIN", employeeId: null })
      ).rejects.toThrow("Dokumen tidak bisa dipulihkan");

      expect(mockPrisma.documentRecord.update).not.toHaveBeenCalled();
    });

    it("should allow restore for multi-document types even when another active document exists", async () => {
      mockPrisma.documentRecord.findUnique.mockResolvedValue({
        id: "archived-doc",
        ownerId: "emp-1",
        documentTypeId: "type-1",
        deletedAt: new Date("2026-07-17T00:00:00.000Z"),
        owner: { name: "John" },
        documentType: { allowMultiple: true },
      });
      mockPrisma.documentRecord.update.mockResolvedValue({ id: "archived-doc", deletedAt: null });
      mockPrisma.securityLog.create.mockResolvedValue({});

      const success = await restoreDocument("archived-doc", {
        userId: "admin-1",
        role: "ADMIN",
        employeeId: null,
      });

      expect(success).toBe(true);
      expect(mockPrisma.documentRecord.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.documentRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "archived-doc" },
          data: { deletedAt: null, isCurrent: true, allowMultipleSnapshot: true },
        })
      );
    });

    it("should reject non-ADMIN from restoring document", async () => {
      const session = { userId: "staff-1", role: "STAFF", employeeId: null };
      await expect(restoreDocument("doc-1", session)).rejects.toThrow("FORBIDDEN");
    });
  });

  describe("permanentlyDeleteDocument", () => {
    it("should delete archived document metadata, related notifications, file storage, and audit", async () => {
      mockPrisma.documentRecord.findUnique.mockResolvedValue({
        id: "doc-1",
        ownerId: "emp-1",
        fileName: "KTP-1-1990.pdf",
        filePath: "uploads/KTP/KTP-1-1990.pdf",
        deletedAt: new Date("2026-07-17T00:00:00.000Z"),
        owner: { name: "John" },
      });

      const session = { userId: "admin-1", role: "ADMIN", employeeId: null };
      const success = await permanentlyDeleteDocument("doc-1", session);

      expect(success).toBe(true);
      expect(storage.delete).toHaveBeenCalledWith("uploads/KTP/KTP-1-1990.pdf");
      expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({
        where: { relatedEntityType: "DOCUMENT_RECORD", relatedEntityId: "doc-1" },
      });
      expect(mockPrisma.documentRecord.delete).toHaveBeenCalledWith({ where: { id: "doc-1" } });
      expect(mockPrisma.securityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: "DOCUMENT_PERMANENTLY_DELETED",
            resource: "DocumentRecord:doc-1",
          }),
        })
      );
    });

    it("should reject permanent delete for active documents", async () => {
      mockPrisma.documentRecord.findUnique.mockResolvedValue({
        id: "doc-active",
        ownerId: "emp-1",
        filePath: "uploads/KTP/KTP-1-1990.pdf",
        deletedAt: null,
        owner: { name: "John" },
      });

      await expect(
        permanentlyDeleteDocument("doc-active", { userId: "admin-1", role: "ADMIN", employeeId: null })
      ).rejects.toThrow("Dokumen aktif harus diarsipkan terlebih dahulu sebelum dihapus permanen.");

      expect(storage.delete).not.toHaveBeenCalled();
      expect(mockPrisma.documentRecord.delete).not.toHaveBeenCalled();
    });
  });

  describe("processExpiredDocumentsAndReminders with fake timers", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should transition matching documents to expired and trigger reminders", async () => {
      // Freeze date at 2026-07-09 UTC
      const frozenDate = new Date("2026-07-09T00:00:00Z");
      vi.setSystemTime(frozenDate);

      mockPrisma.documentRecord.findMany.mockResolvedValueOnce([
        { id: "doc-expired", ownerId: "emp-1", documentType: { code: "DOC" } },
      ]);
      mockPrisma.systemSetting.findMany.mockResolvedValue([
        { key: "reminder_days_h30", value: "30" },
        { key: "reminder_days_h7", value: "7" },
        { key: "reminder_days_h1", value: "1" },
      ]);

      const h30Date = new Date("2026-08-08T12:34:56Z"); // +30 days, non-midnight
      mockPrisma.documentRecord.findMany.mockResolvedValueOnce([
        {
          id: "doc-remind-h30",
          expiryDate: h30Date,
          owner: { userId: "user-1" },
          documentType: { name: "Ijazah" },
          reminderH30SentAt: null,
        },
      ]);

      const result = await processExpiredDocumentsAndReminders();
      expect(result.expiredCount).toBe(1);
      expect(result.remindersSent.H30).toBe(1);
      expect(mockPrisma.documentRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "doc-expired" },
          data: { status: "EXPIRED" },
        })
      );
      expect(publishEvent).toHaveBeenCalledWith(
        EVENT_NAMES.DOCUMENT_EXPIRY_REMINDER_CREATED,
        expect.objectContaining({
          userId: "user-1",
          documentRecordId: "doc-remind-h30",
          reminderStage: "H30",
        })
      );
    });
  });
});
