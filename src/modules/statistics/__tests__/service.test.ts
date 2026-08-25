import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDashboardStats, getEmployeeStats, getStatisticsChartsData } from "../service";
import { mockPrisma } from "../../../../tests/setup";

describe("Statistics Module Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDashboardStats", () => {
    it("should calculate compliance rates and aggregate document statistics", async () => {
      // Mock employees
      const mockEmployees = [
        {
          id: "emp-1",
          name: "John Doe",
          documentRecords: [{ documentTypeId: "type-1" }],
        },
        {
          id: "emp-2",
          name: "Jane Doe",
          documentRecords: [],
        },
      ];
      mockPrisma.employee.findMany.mockResolvedValue(mockEmployees);

      // Mock mandatory document types
      mockPrisma.documentType.findMany.mockResolvedValue([{ id: "type-1" }]);

      // Mock groupBy for status count
      mockPrisma.documentRecord.groupBy.mockResolvedValue([
        { status: "APPROVED", _count: { _all: 5 } },
        { status: "PENDING", _count: { _all: 2 } },
      ]);

      const today = new Date();
      const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 15);

      // Mock docs list for categories count
      mockPrisma.documentRecord.findMany.mockResolvedValue([
        { uploadedAt: today, documentType: { archiveCategory: "PERSONAL" } },
        { uploadedAt: twoMonthsAgo, documentType: { archiveCategory: "EDUCATION" } },
      ]);

      // Mock verification history for trend
      mockPrisma.verificationHistory.findMany.mockResolvedValue([
        { reviewedAt: today },
        { reviewedAt: twoMonthsAgo },
      ]);

      const stats = await getDashboardStats({});

      expect(stats.totalEmployees).toBe(2);
      expect(stats.compliantEmployeesCount).toBe(1); // John has type-1, Jane doesn't
      expect(stats.complianceRate).toBe(50.0);
      expect(stats.documentsByStatus.APPROVED).toBe(5);
      expect(stats.documentsByStatus.PENDING).toBe(2);
      expect(stats.documentsByCategory.PERSONAL).toBe(1);
      expect(stats.documentsByCategory.EDUCATION).toBe(1);
      expect(stats.documentsByCategory.LEGAL).toBe(0);

      expect(stats.uploadTrend).toHaveLength(6);
      expect(stats.uploadTrend[5].Uploaded).toBe(1);
      expect(stats.uploadTrend[5].Verified).toBe(1);
      expect(stats.uploadTrend[3].Uploaded).toBe(1);
      expect(stats.uploadTrend[3].Verified).toBe(1);
      expect(stats.uploadTrend[4].Uploaded).toBe(0);
      expect(stats.uploadTrend[4].Verified).toBe(0);
    });
  });

  describe("getEmployeeStats", () => {
    it("uses approved mandatory target documents for employee dashboard progress", async () => {
      mockPrisma.employee.findFirst.mockResolvedValue({
        id: "emp-1",
        userId: "user-1",
        employmentStatusId: "NON_ASN",
        employeeGroupId: null,
        employeePositionId: null,
        employeePosition: null,
        employeeRankId: null,
        workplaceId: null,
      });
      mockPrisma.documentType.findMany.mockResolvedValue([
        {
          id: "str-non-asn",
          isMandatory: true,
          employmentStatuses: [{ employmentStatusId: "NON_ASN" }],
          employeeGroups: [],
          employeePositions: [],
          professionGroups: [],
          employeeRanks: [],
          workplaces: [],
        },
        {
          id: "ktp-asn",
          isMandatory: true,
          employmentStatuses: [{ employmentStatusId: "ASN" }],
          employeeGroups: [],
          employeePositions: [],
          professionGroups: [],
          employeeRanks: [],
          workplaces: [],
        },
      ]);
      mockPrisma.documentRecord.findMany
        .mockResolvedValueOnce([{ documentTypeId: "str-non-asn", status: "PENDING" }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.documentRecord.count.mockResolvedValue(0);

      const stats = await getEmployeeStats("user-1");

      expect(stats.mandatoryDocumentCompleted).toBe(0);
      expect(stats.mandatoryDocumentTotal).toBe(1);
    });
  });

  describe("getStatisticsChartsData", () => {
    it("should calculate expired documents count accurately", async () => {
      mockPrisma.employee.findMany.mockResolvedValue([]);
      const today = new Date();
      const pastDate = new Date(today.getTime() - 86400000 * 5);
      const futureDate = new Date(today.getTime() + 86400000 * 5);

      mockPrisma.documentRecord.findMany.mockResolvedValue([
        {
          status: "EXPIRED",
          uploadedAt: pastDate,
          expiryDate: pastDate,
          documentType: { id: "type-1", name: "STR", archiveCategory: "CERTIFICATION" },
        },
        {
          status: "APPROVED",
          uploadedAt: pastDate,
          expiryDate: pastDate,
          documentType: { id: "type-2", name: "SIP", archiveCategory: "CERTIFICATION" },
        },
        {
          status: "APPROVED",
          uploadedAt: today,
          expiryDate: futureDate,
          documentType: { id: "type-3", name: "Sertifikat", archiveCategory: "CERTIFICATION" },
        },
      ]);
      mockPrisma.verificationHistory.groupBy.mockResolvedValue([]);
      mockPrisma.documentType.findMany.mockResolvedValue([]);

      const data = await getStatisticsChartsData();

      expect(data.expiredDocumentsCount).toBe(2);
      expect(data.expiringDocumentsSummary.find((item) => item.days === 7)?.value).toBe(1);
    });
  });
});
