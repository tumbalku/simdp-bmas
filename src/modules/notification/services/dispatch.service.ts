import { realtimeProvider, emailProvider } from "@/lib/notifications";
import {
  NOTIFICATION_RELATED_ENTITY_TYPE,
  NOTIFICATION_TYPE,
} from "../constants";
import * as repo from "../repositories/common";

export async function dispatchNotification(input: {
  notificationId: string;
  email?: string;
}) {
  const notification = await repo.findNotificationById(input.notificationId);

  if (!notification) {
    throw new Error(`Notification with ID ${input.notificationId} not found.`);
  }

  await realtimeProvider.publishToUser(notification.userId, {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    relatedEntityType: notification.relatedEntityType,
    relatedEntityId: notification.relatedEntityId,
    createdAt: notification.createdAt.toISOString(),
  });

  const user = await repo.findUserWithEmployeeById(notification.userId);
  const recipientEmail = input.email || user?.email;
  if (recipientEmail) {
    let html = "";
    const {
      renderDocumentStatusEmail,
      renderGeneralNotificationEmail,
    } = await import("@/lib/notifications/email-renderer");

    if (
      (notification.type === NOTIFICATION_TYPE.DOCUMENT_STATUS ||
        notification.type === NOTIFICATION_TYPE.DOCUMENT_VERIFICATION) &&
      notification.relatedEntityType === NOTIFICATION_RELATED_ENTITY_TYPE.DOCUMENT_RECORD &&
      notification.relatedEntityId
    ) {
      const doc = await repo.findDocumentWithTypeAndOwnerById(notification.relatedEntityId);

      if (doc && (doc.status === "APPROVED" || doc.status === "REJECTED")) {
        const history = await repo.findLatestVerificationHistory(doc.id);

        html = await renderDocumentStatusEmail({
          ownerName: doc.owner.name,
          documentTypeName: doc.documentType.name,
          status: doc.status as "APPROVED" | "REJECTED",
          note: history?.reviewNote,
        });
      }
    }

    if (!html) {
      html = await renderGeneralNotificationEmail({
        title: notification.title,
        message: notification.message || "",
      });
    }

    await emailProvider.sendEmail({
      to: recipientEmail,
      subject: notification.title,
      html,
    });
  }
}
