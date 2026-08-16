import { describe, it, expect, vi, beforeEach } from "vitest";
import { logActivity, getSecurityLogs, cleanupExpiredSecurityLogs, invalidateEnabledSecurityEventsCache } from "../service";
import { mockPrisma } from "../../../../tests/setup";
import * as settingsServer from "@/modules/settings/server";

vi.mock("@/modules/settings/server", () => ({
  getSystemSettingValue: vi.fn(),
}));

describe("Security Module Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("logActivity", () => {
    it("should create a security log record when eventType is enabled", async () => {
      vi.mocked(settingsServer.getSystemSettingValue).mockResolvedValue(
        JSON.stringify(["AUTH_LOGIN_SUCCESS", "TEST_EVENT"])
      );

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

    it("should bypass creating security log record when eventType is not in enabled list", async () => {
      vi.mocked(settingsServer.getSystemSettingValue).mockResolvedValue(
        JSON.stringify(["AUTH_LOGIN_SUCCESS"])
      );

      await logActivity({
        actorName: "John Doe",
        actorRole: "EMPLOYEE",
        eventType: "AUTH_REFRESH_SUCCESS",
        resource: "Auth",
        status: "SUCCESS",
      });

      expect(mockPrisma.securityLog.create).not.toHaveBeenCalled();
    });

    it("should fallback safely when getSystemSettingValue returns invalid JSON", async () => {
      invalidateEnabledSecurityEventsCache();
      vi.mocked(settingsServer.getSystemSettingValue).mockResolvedValue("invalid json string");

      await logActivity({
        actorName: "John Doe",
        actorRole: "EMPLOYEE",
        eventType: "DOCUMENT_APPROVED",
        resource: "Document",
        status: "SUCCESS",
      });

      expect(mockPrisma.securityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: "DOCUMENT_APPROVED",
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

  describe("cleanupExpiredSecurityLogs", () => {
    it("should delete security logs older than retention days and return deleted count", async () => {
      vi.mocked(settingsServer.getSystemSettingValue).mockResolvedValue("14");
      mockPrisma.securityLog.deleteMany.mockResolvedValue({ count: 25 });

      const result = await cleanupExpiredSecurityLogs();

      expect(result).toEqual({ deletedCount: 25, retentionDays: 14 });
      expect(mockPrisma.securityLog.deleteMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            lt: expect.any(Date),
          },
        },
      });
    });

    it("should fallback to 30 days retention when setting value is invalid", async () => {
      vi.mocked(settingsServer.getSystemSettingValue).mockResolvedValue("invalid");
      mockPrisma.securityLog.deleteMany.mockResolvedValue({ count: 0 });

      const result = await cleanupExpiredSecurityLogs();

      expect(result).toEqual({ deletedCount: 0, retentionDays: 30 });
    });
  });
});
