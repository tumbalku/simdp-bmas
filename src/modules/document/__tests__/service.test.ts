import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  handleDocumentTypeCrud,
  uploadDocumentRecord,
  generateDownloadUrl,
  restoreDocument,
  permanentlyDeleteDocument,
  processExpiredDocumentsAndReminders,
  getDocumentRecordsForSession,
  getDocumentRecordDetailForSession,
  getAvailableDocumentTypes,
} from "../service";
import { mockPrisma } from "../../../../tests/setup";
import { storage } from "@/lib/storage";

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
        fileName: "PDF-1-empId-1.pdf",
        filePath: "uploads/PDF/PDF-1-empId-1.pdf",
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
        },
        session
      );

      expect(result).toBeDefined();
      expect(storage.upload).toHaveBeenCalled();
      expect(mockPrisma.documentRecord.create).toHaveBeenCalled();
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

  describe("restoreDocument", () => {
    it("should allow ADMIN to restore document", async () => {
      const doc = { id: "doc-1", owner: { name: "John" } };
      mockPrisma.documentRecord.findUnique.mockResolvedValue(doc);

      const session = { userId: "admin-1", role: "ADMIN", employeeId: null };
      const success = await restoreDocument("doc-1", session);
      expect(success).toBe(true);
      expect(mockPrisma.documentRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "doc-1" },
          data: { deletedAt: null, isCurrent: true },
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
        where: { relatedEntityType: "DocumentRecord", relatedEntityId: "doc-1" },
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

      const h30Date = new Date("2026-08-08T00:00:00Z"); // +30 days
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
      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });
  });
});
