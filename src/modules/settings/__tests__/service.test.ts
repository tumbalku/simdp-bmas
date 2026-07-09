import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSystemSettings, updateSettings } from "../service";
import { mockPrisma } from "../../../../tests/setup";

describe("Settings Module Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSystemSettings", () => {
    it("should return settings if they exist", async () => {
      const mockSettings = [{ key: "reminder_days_h1", value: "1" }];
      mockPrisma.systemSetting.findMany.mockResolvedValue(mockSettings);

      const settings = await getSystemSettings();
      expect(settings).toEqual(mockSettings);
      expect(mockPrisma.systemSetting.createMany).not.toHaveBeenCalled();
    });

    it("should seed default settings if table is empty", async () => {
      mockPrisma.systemSetting.findMany.mockResolvedValueOnce([]); // first findMany returns empty
      mockPrisma.systemSetting.findMany.mockResolvedValueOnce([{ key: "reminder_days_h1", value: "1" }]); // second returns seeded

      const settings = await getSystemSettings();
      expect(mockPrisma.systemSetting.createMany).toHaveBeenCalled();
      expect(settings).toHaveLength(1);
    });
  });

  describe("updateSettings", () => {
    it("should update settings in transaction and log activity", async () => {
      const settingsList = [
        { key: "reminder_days_h1", value: "2" },
        { key: "reminder_days_h7", value: "8" },
      ];

      const result = await updateSettings(settingsList, "user-1", "Admin User", "ADMIN");
      expect(result).toBe(true);

      // Verify that transaction executed updates for each setting
      expect(mockPrisma.systemSetting.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.securityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: "SYSTEM_SETTING_UPDATED",
          }),
        })
      );
    });
  });
});
