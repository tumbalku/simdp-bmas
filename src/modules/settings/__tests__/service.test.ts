import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSystemSettings, updateSettings } from "../service";
import { mockPrisma } from "../../../../tests/setup";

describe("Settings Module Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSystemSettings", () => {
    it("should return settings if they exist", async () => {
      const mockSettings = [
        { key: "reminder_days_h1", value: "1" },
        { key: "reminder_days_h7", value: "7" },
        { key: "reminder_days_h30", value: "30" },
        { key: "default_max_upload_mb", value: "10" },
        { key: "profile_image_max_upload_mb", value: "2" },
        { key: "soft_delete_retention_days", value: "30" },
        { key: "security_log_enabled_events", value: "[]" },
        { key: "security_log_retention_days", value: "30" },
      ];
      mockPrisma.systemSetting.findMany.mockResolvedValue(mockSettings);

      const settings = await getSystemSettings();
      expect(settings).toEqual(mockSettings);
      expect(mockPrisma.systemSetting.createMany).not.toHaveBeenCalled();
    });

    it("should seed default settings if table is empty", async () => {
      mockPrisma.systemSetting.findMany.mockResolvedValueOnce([]); // first findMany returns empty
      mockPrisma.systemSetting.findMany.mockResolvedValueOnce([{ key: "reminder_days_h1", value: "1" }]); // second returns seeded

      const settings = await getSystemSettings();
      expect(mockPrisma.systemSetting.createMany).toHaveBeenCalledWith(
        expect.objectContaining({ skipDuplicates: true })
      );
      expect(settings).toHaveLength(1);
    });

    it("should seed missing default settings if table is partially seeded", async () => {
      mockPrisma.systemSetting.findMany
        .mockResolvedValueOnce([{ key: "reminder_days_h1", value: "1" }])
        .mockResolvedValueOnce([
          { key: "reminder_days_h1", value: "1" },
          { key: "reminder_days_h7", value: "7" },
        ]);

      const settings = await getSystemSettings();

      expect(mockPrisma.systemSetting.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ key: "reminder_days_h7" }),
            expect.objectContaining({ key: "reminder_days_h30" }),
            expect.objectContaining({ key: "default_max_upload_mb" }),
            expect.objectContaining({ key: "profile_image_max_upload_mb" }),
            expect.objectContaining({ key: "soft_delete_retention_days" }),
          ]),
          skipDuplicates: true,
        })
      );
      expect(settings).toHaveLength(2);
    });
  });

  describe("updateSettings", () => {
    it("should update settings in transaction and log activity", async () => {
      mockPrisma.systemSetting.findMany.mockResolvedValue([
        { key: "reminder_days_h1", value: "1" },
        { key: "reminder_days_h7", value: "7" },
        { key: "reminder_days_h30", value: "30" },
        { key: "default_max_upload_mb", value: "10" },
        { key: "profile_image_max_upload_mb", value: "2" },
        { key: "soft_delete_retention_days", value: "30" },
      ]);
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

    it("should seed missing defaults before updating settings", async () => {
      mockPrisma.systemSetting.findMany
        .mockResolvedValueOnce([{ key: "reminder_days_h1", value: "1" }])
        .mockResolvedValueOnce([
          { key: "reminder_days_h1", value: "1" },
          { key: "reminder_days_h7", value: "7" },
          { key: "reminder_days_h30", value: "30" },
          { key: "default_max_upload_mb", value: "10" },
          { key: "profile_image_max_upload_mb", value: "2" },
          { key: "soft_delete_retention_days", value: "30" },
        ]);

      await updateSettings(
        [{ key: "soft_delete_retention_days", value: "45" }],
        "user-1",
        "Admin User",
        "ADMIN"
      );

      expect(mockPrisma.systemSetting.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([expect.objectContaining({ key: "soft_delete_retention_days" })]),
          skipDuplicates: true,
        })
      );
      expect(mockPrisma.systemSetting.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { key: "soft_delete_retention_days" } })
      );
    });
  });
});
