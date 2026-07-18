/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto";
import {
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

export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
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
