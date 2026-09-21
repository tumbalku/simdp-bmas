import { describe, it, expect, vi, beforeEach } from "vitest";

import { mockPrisma } from "../../tests/setup";
import { getPostFeed } from "@/modules/post/server";

/**
 * Integration test: visibility resolution dari Post feed.
 *
 * Mensimulasikan kombinasi targeting PUBLIC vs TARGETED dan memverifikasi
 * bahwa query Prisma yang dibangun hanya memuat post yang ditujukan untuk
 * user context tertentu.
 */

vi.mock("@/modules/notification/server", () => ({
  createNotification: vi.fn().mockResolvedValue({ id: "notif-1" }),
}));

const samplePosts = [
  {
    id: "public-1",
    title: "Publik",
    content: "Isi",
    status: "PUBLISHED",
    visibilityType: "PUBLIC",
    isPinned: false,
    authorId: "author-1",
    publishedAt: new Date("2026-02-01T00:00:00Z"),
    createdAt: new Date("2026-02-01T00:00:00Z"),
    updatedAt: new Date("2026-02-01T00:00:00Z"),
    deletedAt: null,
    author: { email: "admin@rsud.go.id", employee: { name: "Admin" } },
  },
  {
    id: "role-1",
    title: "Role",
    content: "Isi",
    status: "PUBLISHED",
    visibilityType: "TARGETED",
    isPinned: false,
    authorId: "author-1",
    publishedAt: new Date("2026-02-02T00:00:00Z"),
    createdAt: new Date("2026-02-02T00:00:00Z"),
    updatedAt: new Date("2026-02-02T00:00:00Z"),
    deletedAt: null,
    author: { email: "admin@rsud.go.id", employee: { name: "Admin" } },
  },
];

function captureWhere() {
  return mockPrisma.post.findMany.mock.calls[0]?.[0]?.where;
}

describe("Post visibility resolution (integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.post.findMany.mockResolvedValue(samplePosts);
    mockPrisma.post.count.mockResolvedValue(samplePosts.length);
    mockPrisma.notification.findMany.mockResolvedValue([]);
  });

  it("includes PUBLIC posts for any authenticated user", async () => {
    await getPostFeed({
      context: {
        userId: "u-1",
        role: "EMPLOYEE",
        employeeId: null,
        workplaceId: null,
        employeeGroupId: null,
      },
    });

    const where = captureWhere();
    expect(where.OR).toContainEqual({ visibilityType: "PUBLIC" });
  });

  it("matches posts targeted to the user's role", async () => {
    await getPostFeed({
      context: {
        userId: "u-1",
        role: "STAFF",
        employeeId: null,
        workplaceId: null,
        employeeGroupId: null,
      },
    });

    const where = captureWhere();
    expect(where.OR).toContainEqual({ visibilityRoles: { some: { role: "STAFF" } } });
  });

  it("matches posts targeted to the user's workplace", async () => {
    await getPostFeed({
      context: {
        userId: "u-1",
        role: "EMPLOYEE",
        employeeId: "emp-1",
        workplaceId: "wp-1",
        employeeGroupId: null,
      },
    });

    const where = captureWhere();
    expect(where.OR).toContainEqual({
      visibilityWorkplaces: { some: { workplaceId: "wp-1" } },
    });
  });

  it("matches posts targeted to the user's employee group", async () => {
    await getPostFeed({
      context: {
        userId: "u-1",
        role: "EMPLOYEE",
        employeeId: "emp-1",
        workplaceId: null,
        employeeGroupId: "eg-1",
      },
    });

    const where = captureWhere();
    expect(where.OR).toContainEqual({
      visibilityEmployeeGroups: { some: { employeeGroupId: "eg-1" } },
    });
  });

  it("omits workplace/group conditions when the user has neither", async () => {
    await getPostFeed({
      context: {
        userId: "u-1",
        role: "EMPLOYEE",
        employeeId: null,
        workplaceId: null,
        employeeGroupId: null,
      },
    });

    const where = captureWhere();
    expect(where.OR).toHaveLength(3);
    expect(where.OR).not.toContainEqual(
      expect.objectContaining({ visibilityWorkplaces: expect.anything() }),
    );
  });

  it("never returns DRAFT or soft-deleted posts", async () => {
    await getPostFeed({
      context: {
        userId: "u-1",
        role: "ADMIN",
        employeeId: null,
        workplaceId: null,
        employeeGroupId: null,
      },
    });

    const where = captureWhere();
    expect(where.status).toBe("PUBLISHED");
    expect(where.publishedAt).toEqual({ not: null });
    expect(where.deletedAt).toBe(null);
  });
});
