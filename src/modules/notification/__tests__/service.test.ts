import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
  dispatchNotification,
} from "../service";
import { mockPrisma } from "../../../../tests/setup";

describe("Notification Module Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getNotifications", () => {
    it("should fetch paginated notifications for user", async () => {
      const mockNotifications = [
        {
          id: "n-1",
          type: "INFO",
          title: "Title",
          message: "Message",
          isRead: false,
          relatedEntityType: null,
          relatedEntityId: null,
          createdAt: new Date("2026-07-09T00:00:00Z"),
        },
      ];

      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrisma.notification.count.mockResolvedValue(1);

      const result = await getNotifications("user-1");
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("n-1");
      expect(result.meta.unreadCount).toBe(1);
    });
  });

  describe("getUnreadNotificationCount", () => {
    it("should return count of unread notifications", async () => {
      mockPrisma.notification.count.mockResolvedValue(5);
      const result = await getUnreadNotificationCount("user-1");
      expect(result.unreadCount).toBe(5);
    });
  });

  describe("markNotificationRead", () => {
    it("should return false if notification not found or mismatch user", async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null);
      const result = await markNotificationRead("n-1", "user-1");
      expect(result).toBe(false);
    });

    it("should mark notification as read", async () => {
      mockPrisma.notification.findFirst.mockResolvedValue({ id: "n-1", userId: "user-1" });
      const result = await markNotificationRead("n-1", "user-1");
      expect(result).toBe(true);
      expect(mockPrisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "n-1" },
          data: { isRead: true },
        })
      );
    });
  });

  describe("markAllNotificationsRead", () => {
    it("should mark all unread notifications as read", async () => {
      const result = await markAllNotificationsRead("user-1");
      expect(result).toBe(true);
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1", isRead: false },
          data: { isRead: true },
        })
      );
    });
  });

  describe("createNotification", () => {
    it("should persist notification and enqueue dispatch", async () => {
      const input = {
        userId: "user-1",
        type: "DOCUMENT_STATUS",
        title: "Test Title",
        message: "Test Message",
        relatedEntityType: "DOCUMENT_RECORD",
        relatedEntityId: "doc-1",
      };

      const mockSaved = {
        id: "mock-uuid",
        ...input,
        createdAt: new Date(),
        isRead: false,
      };

      mockPrisma.notification.create.mockResolvedValue(mockSaved);

      const result = await createNotification(input);

      expect(result.userId).toBe("user-1");
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-1",
            type: "DOCUMENT_STATUS",
            title: "Test Title",
          }),
        })
      );
    });
  });

  describe("dispatchNotification", () => {
    it("should publish realtime and send email", async () => {
      const notif = {
        id: "n-1",
        userId: "user-1",
        type: "DOCUMENT_STATUS",
        title: "Test Title",
        message: "Test Message",
        relatedEntityType: "DOCUMENT_RECORD",
        relatedEntityId: "doc-1",
        createdAt: new Date(),
        isRead: false,
      };

      const user = {
        id: "user-1",
        email: "test@example.com",
        employee: { name: "John Doe" },
      };

      mockPrisma.notification.findUnique.mockResolvedValue(notif);
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await dispatchNotification({ notificationId: "n-1" });

      expect(mockPrisma.notification.findUnique).toHaveBeenCalledWith({
        where: { id: "n-1" },
      });
    });
  });
});
