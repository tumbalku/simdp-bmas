import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createNotification: vi.fn(),
  dispatchNotification: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/notifications", () => ({
  emailProvider: {
    sendEmail: mocks.sendEmail,
  },
}));

vi.mock("@/lib/notifications/providers/inngest-job-provider", () => ({
  inngest: {
    createFunction: vi.fn((config, handler) => ({ config, handler })),
  },
}));

vi.mock("@/modules/notification", () => ({
  NOTIFICATION_RELATED_ENTITY_TYPE: {
    DOCUMENT_RECORD: "DOCUMENT_RECORD",
  },
  NOTIFICATION_TYPE: {
    DOCUMENT_STATUS: "DOCUMENT_STATUS",
    EXPIRY_REMINDER: "EXPIRY_REMINDER",
  },
}));

vi.mock("@/modules/notification/server", () => ({
  createNotification: mocks.createNotification,
  dispatchNotification: mocks.dispatchNotification,
}));

import {
  handleDocumentExpiryReminderCreated,
  handleEmailSendRequested,
  handleNotificationDispatchRequested,
  handleVerificationApproved,
  handleVerificationRejected,
} from "..";

describe("event subscribers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates expiry reminder notifications inside the notification module", async () => {
    await handleDocumentExpiryReminderCreated({
      userId: "user-1",
      documentRecordId: "doc-1",
      documentTypeName: "STR",
      title: "Peringatan",
      message: "Dokumen akan kedaluwarsa.",
      reminderStage: "H30",
    });

    expect(mocks.createNotification).toHaveBeenCalledWith({
      userId: "user-1",
      type: "EXPIRY_REMINDER",
      title: "Peringatan",
      message: "Dokumen akan kedaluwarsa.",
      relatedEntityType: "DOCUMENT_RECORD",
      relatedEntityId: "doc-1",
    });
  });

  it("dispatches notifications inside the notification module", async () => {
    await handleNotificationDispatchRequested({
      notificationId: "notification-1",
      userId: "user-1",
    });

    expect(mocks.dispatchNotification).toHaveBeenCalledWith({
      notificationId: "notification-1",
    });
  });

  it("creates verification status notifications", async () => {
    await handleVerificationApproved({
      userId: "user-1",
      documentRecordId: "doc-1",
      documentTypeName: "Ijazah",
    });
    await handleVerificationRejected({
      userId: "user-1",
      documentRecordId: "doc-1",
      documentTypeName: "Ijazah",
      note: "File blur",
    });

    expect(mocks.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Dokumen Disetujui",
        message: "Dokumen Ijazah Anda telah disetujui.",
      })
    );
    expect(mocks.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Dokumen Ditolak",
        message: "Dokumen Ijazah Anda telah ditolak. Catatan: File blur",
      })
    );
  });

  it("sends email through the configured email provider", async () => {
    await handleEmailSendRequested({
      to: "user@example.com",
      subject: "Halo",
      html: "<p>Halo</p>",
    });

    expect(mocks.sendEmail).toHaveBeenCalledWith({
      to: "user@example.com",
      subject: "Halo",
      html: "<p>Halo</p>",
    });
  });
});
