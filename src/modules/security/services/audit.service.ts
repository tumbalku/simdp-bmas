/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto";
import { getSystemSettingValue } from "@/modules/settings/server";
import {
  SECURITY_EVENT_TYPE,
  normalizeSecurityActorRole,
  normalizeSecurityLogStatus,
  type SecurityActorRole,
  type SecurityLogStatus,
} from "../constants";
import * as repo from "../repositories/common";

export type LogActivityInput = {
  actorId?: string | null;
  actorName: string;
  actorRole: SecurityActorRole | string;
  eventType: string;
  resource: string;
  ipAddress?: string | null;
  status: SecurityLogStatus | string;
  metadata?: Record<string, any>;
};

const DEFAULT_ENABLED_EVENTS = Object.values(SECURITY_EVENT_TYPE).filter(
  (event) => event !== SECURITY_EVENT_TYPE.AUTH_REFRESH_SUCCESS
);

async function getEnabledSecurityEvents(): Promise<string[]> {
  try {
    const rawSetting = await getSystemSettingValue(
      "security_log_enabled_events",
      JSON.stringify(DEFAULT_ENABLED_EVENTS)
    );
    const parsed = JSON.parse(rawSetting);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item));
    }
    return DEFAULT_ENABLED_EVENTS;
  } catch {
    return DEFAULT_ENABLED_EVENTS;
  }
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    const enabledEvents = await getEnabledSecurityEvents();
    if (!enabledEvents.includes(input.eventType)) {
      return;
    }

    await repo.createSecurityLog({
      id: crypto.randomUUID(),
      actorId: input.actorId || null,
      actorName: input.actorName,
      actorRole: normalizeSecurityActorRole(input.actorRole),
      eventType: input.eventType,
      resource: input.resource,
      ipAddress: input.ipAddress || null,
      status: normalizeSecurityLogStatus(input.status),
      metadata: input.metadata,
    });
  } catch (error) {
    console.error("Gagal mencatat log aktivitas keamanan:", error);
  }
}
