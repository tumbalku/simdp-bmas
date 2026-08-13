import crypto from "crypto";
import { EVENT_NAMES, publishEvent } from "@/lib/events";
import {
  NOTIFICATION_RELATED_ENTITY_TYPE,
  mapNotificationTypeToCanonical,
  type NotificationRelatedEntityType,
} from "../constants";
import * as repo from "../repositories/common";

export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  message?: string | null;
  relatedEntityType?: NotificationRelatedEntityType | string | null;
  relatedEntityId?: string | null;
  skipDispatch?: boolean;
}) {
  const id = crypto.randomUUID();
  const normalizedRelatedEntityType =
    input.relatedEntityType && input.relatedEntityType in NOTIFICATION_RELATED_ENTITY_TYPE
      ? (input.relatedEntityType as NotificationRelatedEntityType)
      : null;

  const notif = await repo.createNotificationRecord({
    id,
    userId: input.userId,
    type: mapNotificationTypeToCanonical(input.type),
    title: input.title,
    message: input.message || null,
    relatedEntityType: normalizedRelatedEntityType,
    relatedEntityId: input.relatedEntityId || null,
  });

  if (!input.skipDispatch) {
    await enqueueNotificationDispatch({
      notificationId: notif.id,
      userId: notif.userId,
    });
  }

  return notif;
}

export async function enqueueNotificationDispatch(input: {
  notificationId: string;
  userId: string;
}) {
  await publishEvent(EVENT_NAMES.NOTIFICATION_DISPATCH_REQUESTED, input);
}
