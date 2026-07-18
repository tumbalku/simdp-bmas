import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  dispatchNotification: vi.fn(),
  send: vi.fn(),
}));

vi.mock("@/lib/notifications/providers/inngest-job-provider", () => ({
  inngest: {
    send: mocks.send,
  },
}));

describe("event publisher", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("publishes typed events through the shared Inngest client", async () => {
    vi.doMock("@/lib/env", () => ({
      env: {
        INNGEST_EVENT_KEY: "test-event-key",
      },
    }));

    const { EVENT_NAMES } = await import("../names");
    const { publishEvent } = await import("../publisher");

    await publishEvent(EVENT_NAMES.NOTIFICATION_DISPATCH_REQUESTED, {
      notificationId: "notification-1",
      userId: "user-1",
    });

    expect(mocks.send).toHaveBeenCalledWith({
      name: EVENT_NAMES.NOTIFICATION_DISPATCH_REQUESTED,
      data: {
        notificationId: "notification-1",
        userId: "user-1",
      },
    });
  });

  it("dispatches events locally when Inngest is not configured", async () => {
    vi.doMock("@/lib/env", () => ({
      env: {
        INNGEST_EVENT_KEY: undefined,
      },
    }));
    vi.doMock("../subscribers", () => ({
      handleDocumentExpiryReminderCreated: vi.fn(),
      handleDocumentVerificationRequested: vi.fn(),
      handleEmailSendRequested: vi.fn(),
      handleNotificationDispatchRequested: mocks.dispatchNotification,
      handleVerificationApproved: vi.fn(),
      handleVerificationRejected: vi.fn(),
    }));

    const { EVENT_NAMES } = await import("../names");
    const { publishEvent } = await import("../publisher");

    await publishEvent(EVENT_NAMES.NOTIFICATION_DISPATCH_REQUESTED, {
      notificationId: "notification-1",
      userId: "user-1",
    });

    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.dispatchNotification).toHaveBeenCalledWith({
      notificationId: "notification-1",
      userId: "user-1",
    });
  });
});
