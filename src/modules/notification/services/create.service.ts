import crypto from "crypto";
import { jobProvider } from "@/lib/notifications";
import {
  mapNotificationRelatedEntityTypeLegacyToCanonical,
  mapNotificationTypeToCanonical,
} from "../constants";
import * as repo from "../repositories/common";

export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  message?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
}) {
  const id = crypto.randomUUID();
  const notif = await repo.createNotificationRecord({
    id,
    userId: input.userId,
    type: mapNotificationTypeToCanonical(input.type),
    title: input.title,
    message: input.message || null,
    relatedEntityType: mapNotificationRelatedEntityTypeLegacyToCanonical(input.relatedEntityType),
    relatedEntityId: input.relatedEntityId || null,
  });

  await enqueueNotificationDispatch({
    notificationId: notif.id,
    userId: notif.userId,
  });

  return notif;
}

export async function enqueueNotificationDispatch(input: {
  notificationId: string;
  userId: string;
}) {
  await jobProvider.enqueueNotification(input);
}
