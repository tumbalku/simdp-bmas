import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDashboardStats } from "../service";
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

      // Mock docs list for categories count
      mockPrisma.documentRecord.findMany.mockResolvedValue([
        { documentType: { archiveCategory: "PERSONAL" } },
        { documentType: { archiveCategory: "EDUCATION" } },
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
    });
  });
});
