import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type PrismaClientOrTx = typeof prisma | Prisma.TransactionClient;

export function getClient(tx?: PrismaClientOrTx): PrismaClientOrTx {
  return tx ?? prisma;
}

const postDetailInclude = {
  author: { select: { id: true, email: true, employee: { select: { name: true } } } },
  attachments: {
    include: {
      storedFile: {
        select: { id: true, fileName: true, fileSize: true, mimeType: true },
      },
    },
    orderBy: { displayOrder: "asc" },
  },
  visibilityRoles: { select: { role: true } },
  visibilityWorkplaces: { select: { workplaceId: true, workplace: { select: { name: true } } } },
  visibilityEmployeeGroups: {
    select: { employeeGroupId: true, employeeGroup: { select: { name: true } } },
  },
  visibilityUsers: {
    select: { userId: true, user: { select: { email: true, employee: { select: { name: true } } } } },
  },
} satisfies Prisma.PostInclude;

export type PostWithTargets = Prisma.PostGetPayload<{ include: typeof postDetailInclude }>;
export type PostWithAuthor = Prisma.PostGetPayload<{
  include: { author: { select: { email: true; employee: { select: { name: true } } } } };
}>;

export type PostAttachmentWithFile = Prisma.PostAttachmentGetPayload<{
  include: { storedFile: true; post: true };
}>;

function notDeleted() {
  return { deletedAt: null } as const;
}

export function findPosts(input: {
  where: Prisma.PostWhereInput;
  page: number;
  pageSize: number;
  orderBy?: Prisma.PostOrderByWithRelationInput | Prisma.PostOrderByWithRelationInput[];
  tx?: PrismaClientOrTx;
}) {
  return getClient(input.tx).post.findMany({
    where: input.where,
    include: postDetailInclude,
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
    orderBy: input.orderBy ?? { createdAt: "desc" },
  });
}

export function countPosts(where: Prisma.PostWhereInput, tx?: PrismaClientOrTx) {
  return getClient(tx).post.count({ where });
}

export function findPostById(id: string, tx?: PrismaClientOrTx) {
  return getClient(tx).post.findUnique({
    where: { id, ...notDeleted() },
    include: postDetailInclude,
  });
}

export function createPostRecord(
  data: Prisma.PostUncheckedCreateInput,
  tx?: PrismaClientOrTx,
) {
  return getClient(tx).post.create({ data, include: postDetailInclude });
}

export function updatePostRecord(
  id: string,
  data: Prisma.PostUncheckedUpdateInput,
  tx?: PrismaClientOrTx,
) {
  return getClient(tx).post.update({
    where: { id },
    data,
    include: postDetailInclude,
  });
}

export function deletePostVisibilityTargets(postId: string, tx?: PrismaClientOrTx) {
  return Promise.all([
    getClient(tx).postVisibilityRole.deleteMany({ where: { postId } }),
    getClient(tx).postVisibilityWorkplace.deleteMany({ where: { postId } }),
    getClient(tx).postVisibilityEmployeeGroup.deleteMany({ where: { postId } }),
    getClient(tx).postVisibilityUser.deleteMany({ where: { postId } }),
  ]);
}

export function createPostVisibilityTargets(
  postId: string,
  targets: {
    roles?: string[] | null;
    workplaceIds?: string[] | null;
    employeeGroupIds?: string[] | null;
    userIds?: string[] | null;
  },
  tx?: PrismaClientOrTx,
) {
  const client = getClient(tx);
  const roleCreates = (targets.roles ?? []).map((role) =>
    client.postVisibilityRole.create({ data: { id: crypto.randomUUID(), postId, role: role as never } }),
  );
  const workplaceCreates = (targets.workplaceIds ?? []).map((workplaceId) =>
    client.postVisibilityWorkplace.create({ data: { id: crypto.randomUUID(), postId, workplaceId } }),
  );
  const groupCreates = (targets.employeeGroupIds ?? []).map((employeeGroupId) =>
    client.postVisibilityEmployeeGroup.create({ data: { id: crypto.randomUUID(), postId, employeeGroupId } }),
  );
  const userCreates = (targets.userIds ?? []).map((userId) =>
    client.postVisibilityUser.create({ data: { id: crypto.randomUUID(), postId, userId } }),
  );

  return Promise.all([...roleCreates, ...workplaceCreates, ...groupCreates, ...userCreates]);
}

export function createPostWithTargets(input: {
  post: Prisma.PostUncheckedCreateInput;
  targets: {
    roles?: string[] | null;
    workplaceIds?: string[] | null;
    employeeGroupIds?: string[] | null;
    userIds?: string[] | null;
  };
  attachments?: Array<{
    id: string;
    storedFileId: string;
    fileName: string;
    filePath: string;
    fileSize: bigint;
    mimeType: string;
    fileHash: string;
    storageProvider: "LOCAL" | "SUPABASE" | "S3";
    uploadedBy: string;
    displayOrder: number;
  }>;
}) {
  return prisma.$transaction(async (tx) => {
    await createPostRecord(input.post, tx);
    await createPostVisibilityTargets(input.post.id as string, input.targets, tx);
    for (const attachment of input.attachments ?? []) {
      await tx.storedFile.create({
        data: {
          id: attachment.storedFileId,
          fileName: attachment.fileName,
          filePath: attachment.filePath,
          fileSize: attachment.fileSize,
          mimeType: attachment.mimeType,
          fileHash: attachment.fileHash,
          storageProvider: attachment.storageProvider,
          uploadedBy: attachment.uploadedBy,
        },
      });
      await tx.postAttachment.create({
        data: {
          id: attachment.id,
          postId: input.post.id as string,
          storedFileId: attachment.storedFileId,
          displayOrder: attachment.displayOrder,
        },
      });
    }

    return findPostById(input.post.id as string, tx);
  });
}

export function updatePostWithTargets(input: {
  id: string;
  post: Prisma.PostUncheckedUpdateInput;
  targets: {
    roles?: string[] | null;
    workplaceIds?: string[] | null;
    employeeGroupIds?: string[] | null;
    userIds?: string[] | null;
  };
}) {
  return prisma.$transaction(async (tx) => {
    await deletePostVisibilityTargets(input.id, tx);
    await createPostVisibilityTargets(input.id, input.targets, tx);
    await updatePostRecord(input.id, input.post, tx);

    return findPostById(input.id, tx);
  });
}

export function softDeletePostRecord(id: string, deletedAt: Date) {
  return prisma.$transaction(async (tx) => {
    await updatePostRecord(
      id,
      {
        deletedAt,
        status: "ARCHIVED",
      },
      tx,
    );
  });
}

export function findVisiblePosts(input: {
  userId: string;
  role: string;
  workplaceId: string | null;
  employeeGroupId: string | null;
  page: number;
  pageSize: number;
  search?: string;
  tx?: PrismaClientOrTx;
}) {
  const orConditions: Prisma.PostWhereInput[] = [
    { visibilityType: "PUBLIC" },
    { visibilityUsers: { some: { userId: input.userId } } },
    { visibilityRoles: { some: { role: input.role as never } } },
  ];

  if (input.workplaceId) {
    orConditions.push({ visibilityWorkplaces: { some: { workplaceId: input.workplaceId } } });
  }
  if (input.employeeGroupId) {
    orConditions.push({ visibilityEmployeeGroups: { some: { employeeGroupId: input.employeeGroupId } } });
  }

  // Pencarian hanya pada judul: `content` adalah string JSON Tiptap sehingga
  // `contains` pada JSON mentah memunculkan false positive (nama key struktur
  // seperti "paragraph"/"text" cocok dengan hampir semua post). Lihat #321.
  const searchConditions: Prisma.PostWhereInput[] = input.search
    ? [{ title: { contains: input.search, mode: "insensitive" } }]
    : [];

  return getClient(input.tx).post.findMany({
    where: {
      ...notDeleted(),
      status: "PUBLISHED",
      publishedAt: { not: null },
      OR: orConditions,
      ...(searchConditions.length ? { AND: searchConditions } : {}),
    },
    include: {
      author: { select: { email: true, employee: { select: { name: true } } } },
      attachments: {
        include: {
          storedFile: {
            select: { id: true, fileName: true, fileSize: true, mimeType: true },
          },
        },
        orderBy: { displayOrder: "asc" },
      },
    },
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
  });
}

export function countVisiblePosts(input: {
  userId: string;
  role: string;
  workplaceId: string | null;
  employeeGroupId: string | null;
  search?: string;
  tx?: PrismaClientOrTx;
}) {
  const orConditions: Prisma.PostWhereInput[] = [
    { visibilityType: "PUBLIC" },
    { visibilityUsers: { some: { userId: input.userId } } },
    { visibilityRoles: { some: { role: input.role as never } } },
  ];

  if (input.workplaceId) {
    orConditions.push({ visibilityWorkplaces: { some: { workplaceId: input.workplaceId } } });
  }
  if (input.employeeGroupId) {
    orConditions.push({ visibilityEmployeeGroups: { some: { employeeGroupId: input.employeeGroupId } } });
  }

  // Pencarian hanya pada judul: `content` adalah string JSON Tiptap sehingga
  // `contains` pada JSON mentah memunculkan false positive (nama key struktur
  // seperti "paragraph"/"text" cocok dengan hampir semua post). Lihat #321.
  const searchConditions: Prisma.PostWhereInput[] = input.search
    ? [{ title: { contains: input.search, mode: "insensitive" } }]
    : [];

  return getClient(input.tx).post.count({
    where: {
      ...notDeleted(),
      status: "PUBLISHED",
      publishedAt: { not: null },
      OR: orConditions,
      ...(searchConditions.length ? { AND: searchConditions } : {}),
    },
  });
}

export function findTargetUserIds(input: {
  roles?: string[] | null;
  workplaceIds?: string[] | null;
  employeeGroupIds?: string[] | null;
  userIds?: string[] | null;
  tx?: PrismaClientOrTx;
}): Promise<{ id: string }[]> {
  const orConditions: Prisma.UserWhereInput[] = [];

  if (input.userIds?.length) {
    orConditions.push({ id: { in: input.userIds } });
  }
  if (input.roles?.length) {
    orConditions.push({ role: { in: input.roles as never } });
  }
  if (input.workplaceIds?.length) {
    orConditions.push({ employee: { workplaceId: { in: input.workplaceIds } } });
  }
  if (input.employeeGroupIds?.length) {
    orConditions.push({ employee: { employeeGroupId: { in: input.employeeGroupIds } } });
  }

  if (!orConditions.length) return Promise.resolve([]);

  return getClient(input.tx).user.findMany({
    where: { deletedAt: null, isActive: true, OR: orConditions },
    select: { id: true },
  });
}

export function findPostReadStates(input: {
  userId: string;
  postIds: string[];
  tx?: PrismaClientOrTx;
}) {
  if (!input.postIds.length) return Promise.resolve([]);

  return getClient(input.tx).notification.findMany({
    where: {
      userId: input.userId,
      type: "ANNOUNCEMENT",
      relatedEntityType: "POST",
      relatedEntityId: { in: input.postIds },
    },
    select: { relatedEntityId: true, isRead: true },
  });
}

export function findAllWorkplaces(tx?: PrismaClientOrTx) {
  return getClient(tx).workplace.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export function findAllEmployeeGroups(tx?: PrismaClientOrTx) {
  return getClient(tx).employeeGroup.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export function findAllEmployeesWithUser(tx?: PrismaClientOrTx) {
  return getClient(tx).user.findMany({
    where: { deletedAt: null, isActive: true },
    select: { id: true, email: true, employee: { select: { name: true } } },
    orderBy: { email: "asc" },
  });
}

export async function findEmployeeByUserId(userId: string, tx?: PrismaClientOrTx) {
  return getClient(tx).employee.findFirst({
    where: { userId, deletedAt: null },
    select: { workplaceId: true, employeeGroupId: true },
  });
}

export function findPostAttachmentById(id: string, tx?: PrismaClientOrTx) {
  return getClient(tx).postAttachment.findUnique({
    where: { id },
    include: {
      storedFile: true,
      post: {
        include: postDetailInclude,
      },
    },
  });
}
