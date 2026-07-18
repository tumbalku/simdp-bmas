import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
}));

vi.mock("@/lib/notifications/providers/inngest-job-provider", () => ({
  inngest: {
    send: mocks.send,
  },
}));

import { EVENT_NAMES } from "../names";
import { publishEvent } from "../publisher";

describe("event publisher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("publishes typed events through the shared Inngest client", async () => {
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
});
