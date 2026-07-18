import { prisma } from "@/lib/prisma";

export function findSystemSettings() {
  return prisma.systemSetting.findMany();
}

export function createDefaultSystemSettings(
  defaults: Array<{ key: string; value: string; label: string; description: string }>
) {
  return prisma.systemSetting.createMany({
    data: defaults,
  });
}

export function updateSystemSettings(
  settingsList: Array<{ key: string; value: string }>,
  userId: string
) {
  return prisma.$transaction(
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
}

export function findUserWithEmployeeById(userId: string) {
  return prisma.user.findFirst({
    where: { id: userId },
    include: { employee: true },
  });
}
