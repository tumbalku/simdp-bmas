import { prisma } from "@/lib/prisma";
import { logActivity } from "@/modules/security/service";
import { SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/constants";

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
  let settings = await prisma.systemSetting.findMany();

  if (settings.length === 0) {
    // Seed defaults
    await prisma.systemSetting.createMany({
      data: DEFAULTS,
    });
    settings = await prisma.systemSetting.findMany();
  }

  return settings;
}

export async function updateSettings(
  settingsList: Array<{ key: string; value: string }>,
  userId: string,
  actorName: string,
  actorRole: string
) {
  await prisma.$transaction(
    settingsList.map((setting) =>
      prisma.systemSetting.update({
        where: { key: setting.key },
        data: {
          value: setting.value,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      })
    )
  );

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
