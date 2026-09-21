import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  findVisiblePosts,
  countVisiblePosts,
} from "../repositories/post.repository";
import { getPosts, getPostFeed } from "../server";
import { mockPrisma } from "../../../../tests/setup";

// `Post.content` disimpan sebagai string JSON Tiptap. Kunci struktur seperti
// "paragraph" hadir di hampir semua dokumen, jadi pencarian harus mengabaikannya.
const tiptapContent = JSON.stringify({
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Isi pengumuman" }],
    },
  ],
});

const baseContext = {
  userId: "u-1",
  role: "EMPLOYEE" as const,
  workplaceId: null,
  employeeGroupId: null,
};

const feedPost = {
  id: "post-1",
  title: "Libur Nasional",
  content: tiptapContent,
  visibilityType: "PUBLIC",
  status: "PUBLISHED",
  isPinned: false,
  authorId: "author-1",
  publishedAt: new Date("2026-02-01T00:00:00Z"),
  createdAt: new Date("2026-02-01T00:00:00Z"),
  updatedAt: new Date("2026-02-01T00:00:00Z"),
  deletedAt: null,
  author: { id: "author-1", email: "admin@rsud.go.id", employee: { name: "Admin" } },
  visibilityRoles: [],
  visibilityWorkplaces: [],
  visibilityEmployeeGroups: [],
  visibilityUsers: [],
};

function expectTitleOnlySearch(where: unknown) {
  const filters = (where as { AND: unknown[] }).AND as Array<{
    title?: { contains?: string; mode?: string };
    content?: { contains?: string; mode?: string };
  }>;
  expect(Array.isArray(filters)).toBe(true);
  expect(filters).toHaveLength(1);
  expect(filters[0].title).toEqual({
    contains: "paragraph",
    mode: "insensitive",
  });
  expect(filters[0].content).toBeUndefined();
}

describe("Post feed search — title only (#321)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.post.findMany.mockResolvedValue([feedPost]);
    mockPrisma.post.count.mockResolvedValue(1);
    mockPrisma.notification.findMany.mockResolvedValue([]);
    mockPrisma.employee.findFirst.mockResolvedValue({
      workplaceId: null,
      employeeGroupId: null,
    });
  });

  it("does not match the Tiptap JSON structural key 'paragraph' against post content", async () => {
    await findVisiblePosts({ ...baseContext, page: 1, pageSize: 9, search: "paragraph" });

    const { where } = mockPrisma.post.findMany.mock.calls[0][0];
    expectTitleOnlySearch(where);
  });

  it("restricts the count query to title as well", async () => {
    await countVisiblePosts({ ...baseContext, search: "paragraph" });

    const { where } = mockPrisma.post.count.mock.calls[0][0];
    expectTitleOnlySearch(where);
  });

  it("matches a post when the search term appears in the title", async () => {
    await findVisiblePosts({ ...baseContext, page: 1, pageSize: 9, search: "libur" });

    const filters = (mockPrisma.post.findMany.mock.calls[0][0].where.AND ?? []) as Array<{
      title?: { contains?: string };
    }>;
    expect(filters).toHaveLength(1);
    expect(filters[0].title).toEqual({ contains: "libur", mode: "insensitive" });
  });

  it("does not add search filters when no search term is given", async () => {
    await findVisiblePosts({ ...baseContext, page: 1, pageSize: 9 });

    expect(mockPrisma.post.findMany.mock.calls[0][0].where.AND).toBeUndefined();
  });

  it("applies the title-only search to the feed service path", async () => {
    await getPostFeed({ context: { ...baseContext, employeeId: null }, search: "paragraph" });

    expectTitleOnlySearch(mockPrisma.post.findMany.mock.calls[0][0].where);
    expectTitleOnlySearch(mockPrisma.post.count.mock.calls[0][0].where);
  });

  it("applies the title-only search to the admin manage list", async () => {
    await getPosts({ search: "paragraph" });

    const { where } = mockPrisma.post.findMany.mock.calls[0][0];
    expect(where.OR).toEqual([
      { title: { contains: "paragraph", mode: "insensitive" } },
    ]);
  });
});
