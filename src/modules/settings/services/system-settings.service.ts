import { logActivity, invalidateEnabledSecurityEventsCache, SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS, DEFAULT_ENABLED_EVENTS } from "@/modules/security/server";
import * as repo from "../repositories/common";

function getDefaults() {
  const enabledEvents = JSON.stringify(DEFAULT_ENABLED_EVENTS);

  return [
    {
      key: "reminder_days_h1",
      value: "1",
      label: "Reminder H-1 (Hari)",
      description: "Selisih hari untuk reminder tahap akhir",
    },
    {
      key: "reminder_days_h7",
      value: "7",
      label: "Reminder H-7 (Hari)",
      description: "Selisih hari untuk reminder tahap menengah",
    },
    {
      key: "reminder_days_h30",
      value: "30",
      label: "Reminder H-30 (Hari)",
      description: "Selisih hari untuk reminder tahap awal",
    },
    {
      key: "default_max_upload_mb",
      value: "10",
      label: "Batas Maksimal Upload (MB)",
      description: "Batas ukuran file global jika tidak ditentukan per jenis dokumen",
    },
    {
      key: "profile_image_max_upload_mb",
      value: "2",
      label: "Batas Upload Foto Profil (MB)",
      description: "Batas ukuran file gambar untuk foto profil pegawai",
    },
    {
      key: "soft_delete_retention_days",
      value: "30",
      label: "Masa Retensi Sampah (Hari)",
      description: "Batas waktu pemulihan dokumen/pegawai yang telah dihapus",
    },
    {
      key: "security_log_enabled_events",
      value: enabledEvents,
      label: "Event Log Keamanan Aktif",
      description: "Daftar jenis event keamanan yang dicatat di log (JSON array)",
    },
    {
      key: "security_log_retention_days",
      value: "30",
      label: "Masa Retensi Log Keamanan (Hari)",
      description: "Jumlah hari penyimpanan log aktivitas keamanan sebelum dibersihkan otomatis",
    },
  ];
}

function getMissingDefaultSettings(settings: Array<{ key: string }>) {
  const existingKeys = new Set(settings.map((setting) => setting.key));
  return getDefaults().filter((setting) => !existingKeys.has(setting.key));
}

export async function getSystemSettings() {
  let settings = await repo.findSystemSettings();
  const missingDefaults = getMissingDefaultSettings(settings);

  if (missingDefaults.length > 0) {
    await repo.createDefaultSystemSettings(missingDefaults);
    settings = await repo.findSystemSettings();
  }

  return settings;
}

export async function getSystemSettingValue(key: string, fallback: string) {
  const settings = await getSystemSettings();
  return settings.find((setting) => setting.key === key)?.value ?? fallback;
}

export async function updateSettings(
  settingsList: Array<{ key: string; value: string }>,
  userId: string,
  actorName: string,
  actorRole: string
) {
  await getSystemSettings();

  await repo.updateSystemSettings(settingsList, userId);

  invalidateEnabledSecurityEventsCache();

  await logActivity({
    actorId: userId,
    actorName,
    actorRole,
    eventType: SECURITY_EVENT_TYPE.SYSTEM_SETTING_UPDATED,
    resource: "SystemSetting",
    status: SECURITY_LOG_STATUS.SUCCESS,
    metadata: { updatedKeys: settingsList.map((s) => s.key) },
  });

  return true;
}
