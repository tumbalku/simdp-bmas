import crypto from "crypto";
import path from "path";

import type { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { storage } from "@/lib/storage";
import { normalizeStoragePath } from "@/lib/storage/path";
import { STORAGE_PROVIDER_VALUE } from "@/modules/document";
import { createNotification } from "@/modules/notification/server";
import {
  NOTIFICATION_RELATED_ENTITY_TYPE,
  NOTIFICATION_TYPE,
} from "@/modules/notification";
import { getSystemSettingValue } from "@/modules/settings/server";
import { PAGINATION } from "@/constants";
import {
  DEFAULT_POST_ATTACHMENT_LIMITS,
  POST_ATTACHMENT_SETTING_KEYS,
  POST_STATUS,
  POST_VISIBILITY_TYPE,
  type PostAttachmentLimits,
} from "../constants";
import type {
  PostDetail,
  PostFeedItem,
  PostListMeta,
  PostSummary,
  PostTargetInput,
  PostVisibilityContext,
  PostAttachmentSummary,
} from "../types";
import * as repo from "../repositories/post.repository";

const FEED_PAGE_SIZE = 9;

function getAuthorName(post: { author?: { employee?: { name: string } | null; email?: string } | null }): string {
  return post.author?.employee?.name || post.author?.email || "Pegawai";
}

function getActiveStorageProviderValue() {
  const value = env.STORAGE_PROVIDER.toLowerCase();
  if (value === "supabase") return STORAGE_PROVIDER_VALUE.SUPABASE;
  if (value === "s3") return STORAGE_PROVIDER_VALUE.S3;
  return STORAGE_PROVIDER_VALUE.LOCAL;
}

function sanitizeFileName(value: string) {
  const sanitized = value.replace(/[^A-Za-z0-9._-]/g, "-").replace(/-+/g, "-");
  return sanitized || "attachment";
}

function formatAttachmentSize(value: bigint | number) {
  return typeof value === "bigint" ? Number(value) : value;
}

function parsePositiveInteger(value: string, fallback: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return parsed;
}

export async function getAnnouncementAttachmentLimits(): Promise<PostAttachmentLimits> {
  const [maxFiles, maxFileSizeMb] = await Promise.all([
    getSystemSettingValue(
      POST_ATTACHMENT_SETTING_KEYS.maxFiles,
      String(DEFAULT_POST_ATTACHMENT_LIMITS.maxFiles),
    ),
    getSystemSettingValue(
      POST_ATTACHMENT_SETTING_KEYS.maxFileSizeMb,
      String(DEFAULT_POST_ATTACHMENT_LIMITS.maxFileSizeMb),
    ),
  ]);

  return {
    maxFiles: parsePositiveInteger(maxFiles, DEFAULT_POST_ATTACHMENT_LIMITS.maxFiles),
    maxFileSizeMb: parsePositiveInteger(maxFileSizeMb, DEFAULT_POST_ATTACHMENT_LIMITS.maxFileSizeMb),
  };
}

async function assertAttachmentsAllowed(files: File[]) {
  if (!files.length) return;

  const limits = await getAnnouncementAttachmentLimits();
  const maxBytes = limits.maxFileSizeMb * 1024 * 1024;

  if (files.length > limits.maxFiles) {
    throw new AppError(
      "VALIDATION_ERROR",
      `Maksimal ${limits.maxFiles} lampiran per pengumuman.`,
      400,
    );
  }

  const oversized = files.find((file) => file.size > maxBytes);
  if (oversized) {
    throw new AppError(
      "PAYLOAD_TOO_LARGE",
      `Ukuran lampiran maksimal ${limits.maxFileSizeMb} MB per file.`,
      413,
    );
  }
}

function mapAttachments(post: { attachments?: Array<{ id: string; storedFile: { fileName: string; fileSize: bigint | number; mimeType: string } }> }): PostAttachmentSummary[] {
  return (post.attachments ?? []).map((attachment) => ({
    id: attachment.id,
    fileName: attachment.storedFile.fileName,
    fileSize: formatAttachmentSize(attachment.storedFile.fileSize),
    mimeType: attachment.storedFile.mimeType,
    url: `/api/v1/posts/attachments/${attachment.id}`,
  }));
}

function mapSummary(post: repo.PostWithTargets): PostSummary {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    status: post.status,
    visibilityType: post.visibilityType,
    isPinned: post.isPinned,
    authorId: post.authorId,
    authorName: getAuthorName(post),
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    attachments: mapAttachments(post),
  };
}

function mapTargets(post: repo.PostWithTargets) {
  return {
    roles: post.visibilityRoles.map((t) => t.role),
    workplaceIds: post.visibilityWorkplaces.map((t) => t.workplaceId),
    employeeGroupIds: post.visibilityEmployeeGroups.map((t) => t.employeeGroupId),
    userIds: post.visibilityUsers.map((t) => t.userId),
  };
}

export function mapPostDetail(post: repo.PostWithTargets): PostDetail {
  return { ...mapSummary(post), targets: mapTargets(post) };
}

function hasTargets(targets: PostTargetInput): boolean {
  return Boolean(
    targets.roles?.length ||
      targets.workplaceIds?.length ||
      targets.employeeGroupIds?.length ||
      targets.userIds?.length,
  );
}

function assertTargetsValid(visibilityType: string, targets: PostTargetInput) {
  if (visibilityType === POST_VISIBILITY_TYPE.TARGETED && !hasTargets(targets)) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Pengumuman tertarget wajib memiliki minimal 1 target (role, unit kerja, kelompok pegawai, atau user).",
      400,
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  Admin/staff management                                                    */
/* -------------------------------------------------------------------------- */

export async function getPosts(input: {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}): Promise<{ data: PostSummary[]; meta: PostListMeta }> {
  const page = input.page || PAGINATION.defaultPage;
  const pageSize = input.pageSize || PAGINATION.defaultPageSize;

  const where: Record<string, unknown> = { deletedAt: null };
  if (input.status) {
    where.status = input.status;
  }
  if (input.search) {
    where.OR = [{ title: { contains: input.search, mode: "insensitive" } }];
  }

  const [posts, totalItems] = await Promise.all([
    repo.findPosts({
      where,
      page,
      pageSize,
      orderBy: [
        { isPinned: "desc" },
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ] as Prisma.PostOrderByWithRelationInput[],
    }),
    repo.countPosts(where),
  ]);

  return {
    data: posts.map(mapSummary),
    meta: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize) || 0,
    },
  };
}

export async function getPostById(id: string): Promise<PostDetail | null> {
  const post = await repo.findPostById(id);
  if (!post) return null;
  return mapPostDetail(post);
}

function isPostVisibleToContext(post: PostDetail, context: PostVisibilityContext): boolean {
  if (post.visibilityType === POST_VISIBILITY_TYPE.PUBLIC) return true;

  return (
    post.targets.userIds.includes(context.userId) ||
    post.targets.roles.includes(context.role) ||
    (context.workplaceId ? post.targets.workplaceIds.includes(context.workplaceId) : false) ||
    (context.employeeGroupId ? post.targets.employeeGroupIds.includes(context.employeeGroupId) : false)
  );
}

export async function getPostByIdForUser(
  id: string,
  context: PostVisibilityContext,
): Promise<PostDetail | null> {
  const post = await repo.findPostById(id);
  if (!post || post.status !== POST_STATUS.PUBLISHED) return null;

  const resolvedContext = await resolveVisibilityContext(context);
  const detail = mapPostDetail(post);
  if (!isPostVisibleToContext(detail, resolvedContext)) return null;

  return detail;
}

export async function createPost(input: {
  authorId: string;
  title: string;
  content: string;
  visibilityType: string;
  status: string;
  isPinned?: boolean;
  sendEmail?: boolean;
  targets: PostTargetInput;
  files?: File[];
}): Promise<PostDetail> {
  assertTargetsValid(input.visibilityType, input.targets);
  await assertAttachmentsAllowed(input.files ?? []);

  const isPublishing = input.status === POST_STATUS.PUBLISHED;
  const now = new Date();
  const id = crypto.randomUUID();
  const uploadedAttachments: Array<{
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
  }> = [];

  for (const [index, file] of (input.files ?? []).entries()) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = sanitizeFileName(file.name);
    const filePath = normalizeStoragePath(path.posix.join("posts", id, `${index + 1}-${safeName}`));
    const savedPath = await storage.upload(filePath, buffer, file.type || "application/octet-stream");
    uploadedAttachments.push({
      id: crypto.randomUUID(),
      storedFileId: crypto.randomUUID(),
      fileName: safeName,
      filePath: savedPath,
      fileSize: BigInt(buffer.length),
      mimeType: file.type || "application/octet-stream",
      fileHash: crypto.createHash("sha256").update(buffer).digest("hex"),
      storageProvider: getActiveStorageProviderValue(),
      uploadedBy: input.authorId,
      displayOrder: index,
    });
  }

  let saved: repo.PostWithTargets | null;
  try {
    saved = await repo.createPostWithTargets({
      post: {
        id,
        title: input.title,
        content: input.content,
        visibilityType: input.visibilityType as never,
        status: input.status as never,
        isPinned: input.isPinned ?? false,
        authorId: input.authorId,
        publishedAt: isPublishing ? now : null,
      },
      targets: input.visibilityType === POST_VISIBILITY_TYPE.TARGETED ? input.targets : {},
      attachments: uploadedAttachments,
    });
  } catch (error) {
    await Promise.all(uploadedAttachments.map((attachment) => storage.delete(attachment.filePath).catch(() => undefined)));
    throw error;
  }

  if (isPublishing) {
    await publishNotifications(id, input.title, { sendEmail: input.sendEmail ?? false });
  }

  if (!saved) {
    throw new AppError("INTERNAL_ERROR", "Pengumuman gagal disimpan.", 500);
  }
  return mapPostDetail(saved);
}

export async function updatePost(input: {
  id: string;
  title: string;
  content: string;
  visibilityType: string;
  status: string;
  isPinned?: boolean;
  sendEmail?: boolean;
  targets: PostTargetInput;
}): Promise<PostDetail> {
  const existing = await repo.findPostById(input.id);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Pengumuman tidak ditemukan.", 404);
  }
  assertTargetsValid(input.visibilityType, input.targets);

  const wasPublished = existing.status === POST_STATUS.PUBLISHED;
  const becomingPublished = !wasPublished && input.status === POST_STATUS.PUBLISHED;
  const now = new Date();

  const saved = await repo.updatePostWithTargets({
    id: input.id,
    post: {
      title: input.title,
      content: input.content,
      visibilityType: input.visibilityType as never,
      status: input.status as never,
      isPinned: input.isPinned ?? false,
      publishedAt: becomingPublished ? now : existing.publishedAt,
    },
    targets: input.visibilityType === POST_VISIBILITY_TYPE.TARGETED ? input.targets : {},
  });

  if (becomingPublished) {
    await publishNotifications(input.id, input.title, { sendEmail: input.sendEmail ?? false });
  }

  if (!saved) {
    throw new AppError("INTERNAL_ERROR", "Pengumuman gagal diperbarui.", 500);
  }
  return mapPostDetail(saved);
}

export async function archivePost(id: string): Promise<PostDetail> {
  const existing = await repo.findPostById(id);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Pengumuman tidak ditemukan.", 404);
  }
  if (existing.status === POST_STATUS.ARCHIVED) return mapPostDetail(existing);

  await repo.updatePostRecord(id, { status: POST_STATUS.ARCHIVED as never });
  const saved = (await repo.findPostById(id)) as repo.PostWithTargets;
  return mapPostDetail(saved);
}

export async function deletePost(id: string): Promise<void> {
  const existing = await repo.findPostById(id);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Pengumuman tidak ditemukan.", 404);
  }

  await repo.softDeletePostRecord(id, new Date());
}

/* -------------------------------------------------------------------------- */
/*  Notification fan-out                                                      */
/* -------------------------------------------------------------------------- */

export async function resolvePostTargetUserIds(input: {
  targets: PostTargetInput;
}): Promise<string[]> {
  const users = await repo.findTargetUserIds(input.targets);
  return users.map((user) => user.id);
}

async function publishNotifications(
  postId: string,
  title: string,
  options: { sendEmail: boolean },
): Promise<void> {
  try {
    const post = await repo.findPostById(postId);
    if (!post) return;

    const targets: PostTargetInput = mapTargets(post);
    let userIds: string[] = [];

    if (post.visibilityType === POST_VISIBILITY_TYPE.PUBLIC) {
      const users = await repo.findTargetUserIds({ roles: ["ADMIN", "STAFF", "EMPLOYEE"] });
      userIds = users.map((user) => user.id);
    } else {
      userIds = await resolvePostTargetUserIds({ targets });
    }

    await Promise.all(
      userIds.map((userId) =>
        createNotification({
          userId,
          type: NOTIFICATION_TYPE.ANNOUNCEMENT,
          title: "Pengumuman baru",
          message: title,
          relatedEntityType: NOTIFICATION_RELATED_ENTITY_TYPE.POST,
          relatedEntityId: postId,
          sendEmail: options.sendEmail,
        }),
      ),
    );
  } catch (error) {
    console.error("publishNotifications error:", error);
  }
}

/* -------------------------------------------------------------------------- */
/*  User feed + visibility resolution                                          */
/* -------------------------------------------------------------------------- */

async function resolveVisibilityContext(
  context: PostVisibilityContext,
): Promise<PostVisibilityContext> {
  // Callers from the REST layer only have the session; the employee profile is
  // the source of truth for workplace / employee group targeting.
  if (context.workplaceId || context.employeeGroupId) {
    return context;
  }

  const employee = await repo.findEmployeeByUserId(context.userId);

  return {
    ...context,
    workplaceId: employee?.workplaceId ?? null,
    employeeGroupId: employee?.employeeGroupId ?? null,
  };
}

export async function getPostFeed(input: {
  context: PostVisibilityContext;
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<{ data: PostFeedItem[]; meta: PostListMeta }> {
  const page = input.page || PAGINATION.defaultPage;
  const pageSize = input.pageSize || FEED_PAGE_SIZE;

  // Resolve the recipient's employee profile so workplace/group targeting works
  // even when the caller (e.g. the REST route) only has the session.
  const context = await resolveVisibilityContext(input.context);

  const [posts, totalItems] = await Promise.all([
    repo.findVisiblePosts({
      userId: context.userId,
      role: context.role,
      workplaceId: context.workplaceId,
      employeeGroupId: context.employeeGroupId,
      page,
      pageSize,
      search: input.search,
    }),
    repo.countVisiblePosts({
      userId: context.userId,
      role: context.role,
      workplaceId: context.workplaceId,
      employeeGroupId: context.employeeGroupId,
      search: input.search,
    }),
  ]);

  const postIds = posts.map((post) => post.id);
  const readStates = await repo.findPostReadStates({
    userId: input.context.userId,
    postIds,
  });
  const readMap = new Map(readStates.map((state) => [state.relatedEntityId, state.isRead]));

  const totalPages = Math.ceil(totalItems / pageSize) || 0;

  return {
    data: posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      authorName: getAuthorName(post),
      publishedAt: post.publishedAt ? post.publishedAt.toISOString() : post.createdAt.toISOString(),
      isRead: readMap.get(post.id) ?? false,
      isPinned: post.isPinned,
      attachments: mapAttachments(post),
    })),
    meta: {
      page,
      pageSize,
      totalItems,
      totalPages,
    },
  };
}

export async function getPostAttachmentForUser(input: {
  attachmentId: string;
  context: PostVisibilityContext;
}) {
  const attachment = await repo.findPostAttachmentById(input.attachmentId);
  if (!attachment || attachment.post.deletedAt || attachment.post.status !== POST_STATUS.PUBLISHED) {
    throw new AppError("NOT_FOUND", "Lampiran tidak ditemukan.", 404);
  }

  const context = await resolveVisibilityContext(input.context);
  const visible = await getPostFeed({
    context,
    page: 1,
    pageSize: 1,
  });

  if (!visible.data.some((post) => post.id === attachment.postId)) {
    const detail = mapPostDetail(attachment.post);
    if (!isPostVisibleToContext(detail, context)) {
      throw new AppError("FORBIDDEN", "Anda tidak memiliki akses ke lampiran ini.", 403);
    }
  }

  return {
    fileName: attachment.storedFile.fileName,
    filePath: attachment.storedFile.filePath,
    mimeType: attachment.storedFile.mimeType,
    storageProvider: attachment.storedFile.storageProvider,
  };
}

/* -------------------------------------------------------------------------- */
/*  Audience target options                                                    */
/* -------------------------------------------------------------------------- */

export async function getPostTargetOptions() {
  const [workplaces, groups, users] = await Promise.all([
    repo.findAllWorkplaces(),
    repo.findAllEmployeeGroups(),
    repo.findAllEmployeesWithUser(),
  ]);

  return {
    roles: ROLE_TARGET_OPTIONS,
    workplaces: workplaces.map((workplace) => ({ id: workplace.id, name: workplace.name })),
    employeeGroups: groups.map((group) => ({ id: group.id, name: group.name })),
    users: users.map((user) => ({
      id: user.id,
      name: user.employee?.name || user.email,
    })),
  };
}

const ROLE_TARGET_OPTIONS = [
  { id: "ADMIN", name: "Admin" },
  { id: "STAFF", name: "Staf" },
  { id: "EMPLOYEE", name: "Pegawai" },
];
