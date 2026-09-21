import { describe, it, expect, vi, beforeEach } from "vitest";

import { mockPrisma } from "../../../../tests/setup";
import {
  createPost,
  getAnnouncementAttachmentLimits,
  updatePost,
  archivePost,
  deletePost,
  getPostById,
  getPosts,
  getPostFeed,
  resolvePostTargetUserIds,
} from "../server";

vi.mock("@/modules/notification/server", () => ({
  createNotification: vi.fn().mockResolvedValue({ id: "notif-1" }),
}));

import { createNotification } from "@/modules/notification/server";

const basePost = {
  id: "post-1",
  title: "Judul",
  content: "Isi",
  visibilityType: "PUBLIC",
  status: "DRAFT",
  isPinned: false,
  authorId: "author-1",
  publishedAt: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  deletedAt: null,
  author: { id: "author-1", email: "admin@rsud.go.id", employee: { name: "Admin" } },
  visibilityRoles: [],
  visibilityWorkplaces: [],
  visibilityEmployeeGroups: [],
  visibilityUsers: [],
};

describe("Post Module Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPosts", () => {
    it("should list posts with pagination meta", async () => {
      mockPrisma.post.findMany.mockResolvedValue([basePost]);
      mockPrisma.post.count.mockResolvedValue(1);

      const result = await getPosts({ page: 1, pageSize: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].authorName).toBe("Admin");
      expect(result.meta).toEqual({
        page: 1,
        pageSize: 10,
        totalItems: 1,
        totalPages: 1,
      });
    });

    it("should filter out soft-deleted posts by default", async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);
      mockPrisma.post.count.mockResolvedValue(0);

      await getPosts({});

      const findManyCall = mockPrisma.post.findMany.mock.calls[0][0];
      expect(findManyCall.where).toEqual({ deletedAt: null });
    });
  });

  describe("getPostById", () => {
    it("should return null when post does not exist", async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      const result = await getPostById("missing");

      expect(result).toBeNull();
    });

    it("should map targets from visibility relations", async () => {
      mockPrisma.post.findUnique.mockResolvedValue({
        ...basePost,
        visibilityRoles: [{ role: "ADMIN" }],
        visibilityWorkplaces: [{ workplaceId: "wp-1" }],
        visibilityEmployeeGroups: [{ employeeGroupId: "eg-1" }],
        visibilityUsers: [{ userId: "user-1" }],
      });

      const result = await getPostById("post-1");

      expect(result?.targets).toEqual({
        roles: ["ADMIN"],
        workplaceIds: ["wp-1"],
        employeeGroupIds: ["eg-1"],
        userIds: ["user-1"],
      });
    });
  });

  describe("createPost", () => {
    it("should throw when TARGETED post has no targets", async () => {
      await expect(
        createPost({
          authorId: "author-1",
          title: "Judul",
          content: "Isi",
          visibilityType: "TARGETED",
          status: "DRAFT",
          targets: {},
        }),
      ).rejects.toThrow();
    });

    it("should create draft without publishing or notifying", async () => {
      mockPrisma.post.create.mockResolvedValue(basePost);
      mockPrisma.post.findUnique.mockResolvedValue(basePost);

      const result = await createPost({
        authorId: "author-1",
        title: "Judul",
        content: "Isi",
        visibilityType: "PUBLIC",
        status: "DRAFT",
        targets: {},
      });

      expect(result.status).toBe("DRAFT");
      expect(createNotification).not.toHaveBeenCalled();
    });

    it("should publish and fan out notifications for PUBLIC post", async () => {
      const publishedPost = { ...basePost, status: "PUBLISHED", publishedAt: new Date() };
      mockPrisma.post.create.mockResolvedValue(publishedPost);
      mockPrisma.post.findUnique.mockResolvedValue(publishedPost);
      mockPrisma.user.findMany.mockResolvedValue([{ id: "u-1" }, { id: "u-2" }]);

      await createPost({
        authorId: "author-1",
        title: "Pengumuman",
        content: "Isi",
        visibilityType: "PUBLIC",
        status: "PUBLISHED",
        targets: {},
      });

      expect(createNotification).toHaveBeenCalledTimes(2);
      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "u-1",
          type: "ANNOUNCEMENT",
          sendEmail: false,
          relatedEntityType: "POST",
          relatedEntityId: expect.any(String),
        }),
      );
    });

    it("should request email delivery only when publishing with sendEmail enabled", async () => {
      const publishedPost = { ...basePost, status: "PUBLISHED", publishedAt: new Date() };
      mockPrisma.post.create.mockResolvedValue(publishedPost);
      mockPrisma.post.findUnique.mockResolvedValue(publishedPost);
      mockPrisma.user.findMany.mockResolvedValue([{ id: "u-1" }]);

      await createPost({
        authorId: "author-1",
        title: "Pengumuman",
        content: "Isi",
        visibilityType: "PUBLIC",
        status: "PUBLISHED",
        sendEmail: true,
        targets: {},
      });

      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "u-1",
          type: "ANNOUNCEMENT",
          sendEmail: true,
        }),
      );
    });

    it("should create visibility target rows for TARGETED post", async () => {
      const targetedPost = {
        ...basePost,
        visibilityType: "TARGETED",
        status: "PUBLISHED",
        publishedAt: new Date(),
        visibilityRoles: [{ role: "ADMIN" }],
        visibilityUsers: [{ userId: "u-1" }],
      };
      mockPrisma.post.create.mockResolvedValue(targetedPost);
      mockPrisma.post.findUnique.mockResolvedValue(targetedPost);
      mockPrisma.user.findMany.mockResolvedValue([{ id: "u-1" }]);

      await createPost({
        authorId: "author-1",
        title: "Pengumuman",
        content: "Isi",
        visibilityType: "TARGETED",
        status: "PUBLISHED",
        targets: { roles: ["ADMIN"], userIds: ["u-1"] },
      });

      expect(mockPrisma.postVisibilityRole.create).toHaveBeenCalled();
      expect(mockPrisma.postVisibilityUser.create).toHaveBeenCalled();
      expect(createNotification).toHaveBeenCalledTimes(1);
    });

    it("should create TARGETED published post and visibility rows in one transaction", async () => {
      const targetedPost = {
        ...basePost,
        visibilityType: "TARGETED",
        status: "PUBLISHED",
        publishedAt: new Date(),
        visibilityRoles: [{ role: "ADMIN" }],
      };
      mockPrisma.post.create.mockResolvedValue(targetedPost);
      mockPrisma.post.findUnique.mockResolvedValue(targetedPost);
      mockPrisma.user.findMany.mockResolvedValue([{ id: "u-1" }]);

      await createPost({
        authorId: "author-1",
        title: "Pengumuman",
        content: "Isi",
        visibilityType: "TARGETED",
        status: "PUBLISHED",
        targets: { roles: ["ADMIN"] },
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      const transactionCallOrder = mockPrisma.$transaction.mock.invocationCallOrder[0];
      const postCreateOrder = mockPrisma.post.create.mock.invocationCallOrder[0];
      const targetCreateOrder = mockPrisma.postVisibilityRole.create.mock.invocationCallOrder[0];
      expect(transactionCallOrder).toBeLessThan(postCreateOrder);
      expect(transactionCallOrder).toBeLessThan(targetCreateOrder);
    });

    it("should reject attachments above the configured system setting size", async () => {
      mockPrisma.systemSetting.findMany.mockResolvedValue([
        { key: "announcement_attachment_max_files", value: "2" },
        { key: "announcement_attachment_max_file_mb", value: "1" },
      ]);

      await expect(
        createPost({
          authorId: "author-1",
          title: "Judul",
          content: "Isi",
          visibilityType: "PUBLIC",
          status: "DRAFT",
          targets: {},
          files: [new File([new Uint8Array(1024 * 1024 + 1)], "besar.pdf", { type: "application/pdf" })],
        }),
      ).rejects.toThrow("Ukuran lampiran maksimal 1 MB per file.");
    });
  });

  describe("getAnnouncementAttachmentLimits", () => {
    it("should read announcement attachment limits from system settings", async () => {
      mockPrisma.systemSetting.findMany.mockResolvedValue([
        { key: "announcement_attachment_max_files", value: "3" },
        { key: "announcement_attachment_max_file_mb", value: "7" },
      ]);

      const result = await getAnnouncementAttachmentLimits();

      expect(result).toEqual({ maxFiles: 3, maxFileSizeMb: 7 });
    });
  });

  describe("updatePost", () => {
    it("should allow archived posts to be moved back to draft explicitly", async () => {
      const archived = { ...basePost, status: "ARCHIVED" };
      const draft = { ...basePost, status: "DRAFT" };
      mockPrisma.post.findUnique.mockResolvedValueOnce(archived).mockResolvedValueOnce(draft);
      mockPrisma.post.update.mockResolvedValue(draft);

      const result = await updatePost({
        id: "post-1",
        title: "Judul baru",
        content: "Isi",
        visibilityType: "PUBLIC",
        status: "DRAFT",
        targets: {},
      });

      expect(mockPrisma.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "post-1" },
          data: expect.objectContaining({ status: "DRAFT" }),
        }),
      );
      expect(result.status).toBe("DRAFT");
    });

    it("should replace targets when updating a TARGETED post", async () => {
      const existing = {
        ...basePost,
        visibilityType: "TARGETED",
        visibilityRoles: [{ role: "STAFF" }],
      };
      mockPrisma.post.findUnique.mockResolvedValue(existing);
      mockPrisma.post.update.mockResolvedValue(existing);
      mockPrisma.user.findMany.mockResolvedValue([{ id: "u-1" }]);

      await updatePost({
        id: "post-1",
        title: "Judul",
        content: "Isi",
        visibilityType: "TARGETED",
        status: "DRAFT",
        targets: { roles: ["ADMIN"] },
      });

      expect(mockPrisma.postVisibilityRole.deleteMany).toHaveBeenCalledWith({ where: { postId: "post-1" } });
      expect(mockPrisma.postVisibilityRole.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ postId: "post-1", role: "ADMIN" }),
      });
    });
  });

  describe("archivePost & deletePost", () => {
    it("should archive a published post", async () => {
      const published = { ...basePost, status: "PUBLISHED" };
      const archived = { ...basePost, status: "ARCHIVED" };
      mockPrisma.post.findUnique.mockResolvedValueOnce(published).mockResolvedValueOnce(archived);
      mockPrisma.post.update.mockResolvedValue(archived);

      const result = await archivePost("post-1");

      expect(mockPrisma.post.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "post-1" }, data: { status: "ARCHIVED" } }),
      );
      expect(result.status).toBe("ARCHIVED");
    });

    it("should soft-delete post and clear visibility targets", async () => {
      const deletedAt = new Date();
      mockPrisma.post.findUnique.mockResolvedValue(basePost);
      mockPrisma.post.update.mockResolvedValue({ ...basePost, deletedAt });

      await deletePost("post-1");

      expect(mockPrisma.postVisibilityRole.deleteMany).not.toHaveBeenCalled();
      const updateCall = mockPrisma.post.update.mock.calls[0][0];
      expect(updateCall.where.id).toBe("post-1");
      expect(updateCall.data.deletedAt).toBeInstanceOf(Date);
      expect(updateCall.data.status).toBe("ARCHIVED");
    });

    it("should throw when deleting missing post", async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      await expect(deletePost("missing")).rejects.toThrow();
    });
  });

  describe("resolvePostTargetUserIds", () => {
    it("should resolve users by role, workplace, group, and user id", async () => {
      mockPrisma.user.findMany.mockResolvedValue([{ id: "u-1" }, { id: "u-2" }]);

      const userIds = await resolvePostTargetUserIds({
        targets: { roles: ["STAFF"], workplaceIds: ["wp-1"], userIds: ["u-3"] },
      });

      expect(userIds).toEqual(["u-1", "u-2"]);
      const call = mockPrisma.user.findMany.mock.calls[0][0];
      expect(call.where.OR).toHaveLength(3);
    });

    it("should return empty array when no targets given", async () => {
      const userIds = await resolvePostTargetUserIds({ targets: {} });

      expect(userIds).toEqual([]);
      expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
    });
  });

  describe("getPostFeed (visibility resolution)", () => {
    const publishedPost = {
      ...basePost,
      id: "feed-1",
      status: "PUBLISHED",
      publishedAt: new Date("2026-02-01T00:00:00Z"),
    };

    beforeEach(() => {
      mockPrisma.employee.findFirst.mockResolvedValue({
        workplaceId: "wp-resolved",
        employeeGroupId: "eg-resolved",
      });
    });

    it("should resolve workplace/group from the employee profile when not provided", async () => {
      mockPrisma.post.findMany.mockResolvedValue([publishedPost]);
      mockPrisma.post.count.mockResolvedValue(1);
      mockPrisma.notification.findMany.mockResolvedValue([]);

      await getPostFeed({
        context: {
          userId: "u-1",
          role: "EMPLOYEE",
          employeeId: "emp-1",
          workplaceId: null,
          employeeGroupId: null,
        },
      });

      expect(mockPrisma.employee.findFirst).toHaveBeenCalledWith({
        where: { userId: "u-1", deletedAt: null },
        select: { workplaceId: true, employeeGroupId: true },
      });
      const where = mockPrisma.post.findMany.mock.calls[0][0].where;
      expect(where.OR).toContainEqual({
        visibilityWorkplaces: { some: { workplaceId: "wp-resolved" } },
      });
      expect(where.OR).toContainEqual({
        visibilityEmployeeGroups: { some: { employeeGroupId: "eg-resolved" } },
      });
    });

    it("should keep explicit context values when already provided", async () => {
      mockPrisma.post.findMany.mockResolvedValue([publishedPost]);
      mockPrisma.post.count.mockResolvedValue(1);
      mockPrisma.notification.findMany.mockResolvedValue([]);

      await getPostFeed({
        context: {
          userId: "u-1",
          role: "EMPLOYEE",
          employeeId: "emp-1",
          workplaceId: "wp-explicit",
          employeeGroupId: null,
        },
      });

      expect(mockPrisma.employee.findFirst).not.toHaveBeenCalled();
      const where = mockPrisma.post.findMany.mock.calls[0][0].where;
      expect(where.OR).toContainEqual({
        visibilityWorkplaces: { some: { workplaceId: "wp-explicit" } },
      });
    });

    it("should only return posts visible to the user context", async () => {
      mockPrisma.post.findMany.mockResolvedValue([publishedPost]);
      mockPrisma.post.count.mockResolvedValue(1);
      mockPrisma.notification.findMany.mockResolvedValue([
        { relatedEntityId: "feed-1", isRead: true },
      ]);

      const result = await getPostFeed({
        context: {
          userId: "u-1",
          role: "EMPLOYEE",
          employeeId: "emp-1",
          workplaceId: "wp-1",
          employeeGroupId: "eg-1",
        },
      });

      const where = mockPrisma.post.findMany.mock.calls[0][0].where;
      expect(where.status).toBe("PUBLISHED");
      expect(where.deletedAt).toBe(null);
      expect(where.OR).toContainEqual({ visibilityType: "PUBLIC" });
      expect(where.OR).toContainEqual({ visibilityUsers: { some: { userId: "u-1" } } });
      expect(where.OR).toContainEqual({ visibilityWorkplaces: { some: { workplaceId: "wp-1" } } });
      expect(result.data[0].isRead).toBe(true);
    });

    it("should mark posts as unread when no read receipt exists", async () => {
      mockPrisma.post.findMany.mockResolvedValue([publishedPost]);
      mockPrisma.post.count.mockResolvedValue(1);
      mockPrisma.notification.findMany.mockResolvedValue([]);

      const result = await getPostFeed({
        context: {
          userId: "u-1",
          role: "EMPLOYEE",
          employeeId: null,
          workplaceId: null,
          employeeGroupId: null,
        },
      });

      expect(result.data[0].isRead).toBe(false);
    });
  });
});
