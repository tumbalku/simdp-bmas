import { describe, it, expect, vi, beforeEach } from "vitest";
import { logActivity, getSecurityLogs } from "../service";
import { mockPrisma } from "../../../../tests/setup";

describe("Security Module Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("logActivity", () => {
    it("should create a security log record", async () => {
      await logActivity({
        actorName: "John Doe",
        actorRole: "EMPLOYEE",
        eventType: "TEST_EVENT",
        resource: "TestResource",
        status: "SUCCESS",
      });

      expect(mockPrisma.securityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actorName: "John Doe",
            actorRole: "EMPLOYEE",
            eventType: "TEST_EVENT",
            resource: "TestResource",
            status: "SUCCESS",
          }),
        })
      );
    });
  });

  describe("getSecurityLogs", () => {
    it("should query logs and count with filters", async () => {
      const mockLogs = [
        {
          id: "log-1",
          actorName: "John Doe",
          actorRole: "EMPLOYEE",
          eventType: "TEST_EVENT",
          resource: "TestResource",
          status: "SUCCESS",
          timestamp: new Date(),
        },
      ];

      mockPrisma.securityLog.count.mockResolvedValue(1);
      mockPrisma.securityLog.findMany.mockResolvedValue(mockLogs);

      const result = await getSecurityLogs({
        page: 1,
        pageSize: 10,
        search: "John",
        status: "SUCCESS",
      });

      expect(result.data).toEqual(mockLogs);
      expect(result.meta.pagination.totalItems).toBe(1);
      expect(mockPrisma.securityLog.findMany).toHaveBeenCalled();
      expect(mockPrisma.securityLog.count).toHaveBeenCalled();
    });
  });
});
