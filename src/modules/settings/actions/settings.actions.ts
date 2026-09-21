/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { POST_ATTACHMENT_SETTING_KEYS } from "@/modules/post";
import { getSystemSettings as getSettingsService, updateSettings } from "../service";
import { findUserWithEmployeeById } from "../repositories/common";

const updateSettingsSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string().min(1, "Key wajib diisi"),
      value: z.string().min(1, "Value wajib diisi"),
    })
  ),
});

const positiveIntegerSettingKeys = new Set<string>([
  POST_ATTACHMENT_SETTING_KEYS.maxFiles,
  POST_ATTACHMENT_SETTING_KEYS.maxFileSizeMb,
]);

function validateSettingValues(settings: Array<{ key: string; value: string }>) {
  return settings.flatMap((setting) => {
    if (!positiveIntegerSettingKeys.has(setting.key)) return [];

    const value = Number(setting.value);
    if (Number.isInteger(value) && value >= 1) return [];

    return [
      {
        path: setting.key,
        message: "Nilai wajib berupa angka bulat minimal 1.",
      },
    ];
  });
}

export async function getSystemSettings() {
  try {
    await requireAuth("ADMIN");

    const result = await getSettingsService();

    return { ok: true as const, data: result };
  } catch (error: any) {
    console.error("getSystemSettings error:", error);
    return {
      ok: false as const,
      error: {
        code:
          error.message === "UNAUTHENTICATED"
            ? "UNAUTHENTICATED"
            : error.message === "FORBIDDEN"
            ? "FORBIDDEN"
            : "INTERNAL_ERROR",
        message: error.message,
      },
    };
  }
}

export async function updateSystemSettingAction(data: unknown) {
  try {
    const session = await requireAuth("ADMIN");

    const parsed = updateSettingsSchema.safeParse(data);
    if (!parsed.success) {
      return {
        ok: false as const,
        error: {
          code: "VALIDATION_ERROR",
          message: "Input tidak valid.",
          details: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
      };
    }

    const invalidValues = validateSettingValues(parsed.data.settings);
    if (invalidValues.length > 0) {
      return {
        ok: false as const,
        error: {
          code: "VALIDATION_ERROR",
          message: "Input tidak valid.",
          details: invalidValues,
        },
      };
    }

    const user = await findUserWithEmployeeById(session.userId);
    const actorName = user?.employee?.name || user?.email || "Admin";

    await updateSettings(parsed.data.settings, session.userId, actorName, session.role);

    return { ok: true as const, data: { success: true } };
  } catch (error: any) {
    console.error("updateSystemSettingAction error:", error);
    return {
      ok: false as const,
      error: {
        code:
          error.message === "UNAUTHENTICATED"
            ? "UNAUTHENTICATED"
            : error.message === "FORBIDDEN"
            ? "FORBIDDEN"
            : "INTERNAL_ERROR",
        message: error.message,
      },
    };
  }
}
