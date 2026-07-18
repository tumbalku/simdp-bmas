import { logActivity } from "@/modules/security/server";
import { SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import * as repo from "../repositories/common";

const DEFAULTS = [
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
    key: "soft_delete_retention_days",
    value: "30",
    label: "Masa Retensi Sampah (Hari)",
    description: "Batas waktu pemulihan dokumen/pegawai yang telah dihapus",
  },
];

export async function getSystemSettings() {
  let settings = await repo.findSystemSettings();

  if (settings.length === 0) {
    await repo.createDefaultSystemSettings(DEFAULTS);
    settings = await repo.findSystemSettings();
  }

  return settings;
}

export async function updateSettings(
  settingsList: Array<{ key: string; value: string }>,
  userId: string,
  actorName: string,
  actorRole: string
) {
  await repo.updateSystemSettings(settingsList, userId);

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
