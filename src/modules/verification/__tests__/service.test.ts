import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyDocument, getVerificationQueue } from "../service";
import { mockPrisma } from "../../../../tests/setup";

vi.mock("@/lib/events", () => ({
  EVENT_NAMES: {
    VERIFICATION_APPROVED: "verification/approved",
    VERIFICATION_REJECTED: "verification/rejected",
  },
  publishEvent: vi.fn(),
}));

import { EVENT_NAMES, publishEvent } from "@/lib/events";

describe("Verification Module Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getVerificationQueue", () => {
    it("should return paginated list of pending documents", async () => {
      const mockDocs = [
        {
          id: "doc-1",
          title: "Ijazah",
          documentNumber: "123",
          uploadedAt: new Date("2026-07-09T00:00:00Z"),
          owner: { id: "emp-1", name: "John Doe", workplace: { name: "Poli Anak" } },
          documentType: { id: "type-1", name: "Ijazah", archiveCategory: "EDUCATION" },
        },
      ];

      mockPrisma.documentRecord.findMany.mockResolvedValue(mockDocs);
      mockPrisma.documentRecord.count.mockResolvedValue(1);

      const queue = await getVerificationQueue({});
      expect(queue.data).toHaveLength(1);
      expect(queue.data[0].id).toBe("doc-1");
      expect(queue.meta.pagination.totalItems).toBe(1);
    });

    it("should filter queue by archive category", async () => {
      mockPrisma.documentRecord.findMany.mockResolvedValue([]);
      mockPrisma.documentRecord.count.mockResolvedValue(0);

      await getVerificationQueue({ archiveCategory: "CERTIFICATION" });

      expect(mockPrisma.documentRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            documentType: { archiveCategory: "CERTIFICATION" },
          }),
        })
      );
    });
  });

  describe("verifyDocument", () => {
    it("should update document status to APPROVED", async () => {
      const doc = {
        id: "doc-1",
        owner: { userId: "user-1" },
        documentType: { name: "Ijazah" },
      };
      mockPrisma.documentRecord.findFirst.mockResolvedValue(doc);
      mockPrisma.documentRecord.update.mockResolvedValue({ id: "doc-1", status: "APPROVED" });

      const result = await verifyDocument("doc-1", "APPROVED", undefined, "staff-1", "Staff User", "STAFF");

      expect(result.status).toBe("APPROVED");
      expect(mockPrisma.documentRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "doc-1" },
          data: expect.objectContaining({ status: "APPROVED" }),
        })
      );
      expect(mockPrisma.verificationHistory.create).toHaveBeenCalled();
      expect(publishEvent).toHaveBeenCalledWith(EVENT_NAMES.VERIFICATION_APPROVED, {
        userId: "user-1",
        documentRecordId: "doc-1",
        documentTypeName: "Ijazah",
      });
    });

    it("should throw error when rejecting without note or note too short", async () => {
      const doc = { id: "doc-1", owner: { userId: "user-1" } };
      mockPrisma.documentRecord.findFirst.mockResolvedValue(doc);

      await expect(
        verifyDocument("doc-1", "REJECTED", "", "staff-1", "Staff User", "STAFF")
      ).rejects.toThrow("Catatan penolakan (note) wajib diisi minimal 5 karakter.");

      await expect(
        verifyDocument("doc-1", "REJECTED", "abc", "staff-1", "Staff User", "STAFF")
      ).rejects.toThrow("Catatan penolakan (note) wajib diisi minimal 5 karakter.");
    });

    it("should successfully reject document when valid note is provided", async () => {
      const doc = {
        id: "doc-1",
        owner: { userId: "user-1" },
        documentType: { name: "Ijazah" },
      };
      mockPrisma.documentRecord.findFirst.mockResolvedValue(doc);
      mockPrisma.documentRecord.update.mockResolvedValue({ id: "doc-1", status: "REJECTED" });

      const result = await verifyDocument("doc-1", "REJECTED", "File blur dan tidak terbaca", "staff-1", "Staff User", "STAFF");
      expect(result.status).toBe("REJECTED");
      expect(publishEvent).toHaveBeenCalledWith(EVENT_NAMES.VERIFICATION_REJECTED, {
        userId: "user-1",
        documentRecordId: "doc-1",
        documentTypeName: "Ijazah",
        note: "File blur dan tidak terbaca",
      });
      expect(mockPrisma.verificationHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "REJECTED", reviewNote: "File blur dan tidak terbaca" }),
        })
      );
    });

    it("should still audit verification when notification publish fails", async () => {
      const doc = {
        id: "doc-1",
        owner: { userId: "user-1" },
        documentType: { name: "Ijazah" },
      };
      mockPrisma.documentRecord.findFirst.mockResolvedValue(doc);
      mockPrisma.documentRecord.update.mockResolvedValue({ id: "doc-1", status: "APPROVED" });
      vi.mocked(publishEvent).mockRejectedValueOnce(new Error("Inngest unavailable"));

      const result = await verifyDocument("doc-1", "APPROVED", undefined, "staff-1", "Staff User", "STAFF");

      expect(result.status).toBe("APPROVED");
      expect(mockPrisma.securityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resource: "DocumentRecord:doc-1",
            metadata: expect.objectContaining({
              notificationPublish: {
                ok: false,
                errorMessage: "Inngest unavailable",
              },
            }),
          }),
        })
      );
    });
  });
});
