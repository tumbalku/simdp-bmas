/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto";
import { getSystemSettingValue } from "@/modules/settings/server";
import {
  DEFAULT_ENABLED_EVENTS,
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

// 60-second in-memory TTL cache to eliminate DB queries on every logActivity call
let cachedEnabledEvents: { data: string[]; expiresAt: number } | null = null;

export function invalidateEnabledSecurityEventsCache(): void {
  cachedEnabledEvents = null;
}

async function getEnabledSecurityEvents(): Promise<string[]> {
  const now = Date.now();
  if (cachedEnabledEvents && now < cachedEnabledEvents.expiresAt) {
    return cachedEnabledEvents.data;
  }

  try {
    const rawSetting = await getSystemSettingValue(
      "security_log_enabled_events",
      JSON.stringify(DEFAULT_ENABLED_EVENTS)
    );
    const parsed = JSON.parse(rawSetting);
    const data = Array.isArray(parsed) ? parsed.map((item) => String(item)) : DEFAULT_ENABLED_EVENTS;
    cachedEnabledEvents = { data, expiresAt: now + 60_000 };
    return data;
  } catch {
    cachedEnabledEvents = { data: DEFAULT_ENABLED_EVENTS, expiresAt: now + 60_000 };
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
