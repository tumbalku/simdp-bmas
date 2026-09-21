import { z } from "zod";

import { USER_ROLES } from "@/constants/roles";
import { PAGINATION } from "@/constants";
import { POST_STATUS, POST_VISIBILITY_TYPE } from "../constants";
import { getPostContentText, isPostContentEmpty, POST_CONTENT_MAX_CHARACTERS } from "../utils/rich-content";

const uuidLike = z.string().trim().min(1).max(100);

const targetIds = z.array(uuidLike).default([]).optional();

export const postTargetSchema = z
  .object({
    roles: z.array(z.enum(USER_ROLES)).default([]).optional(),
    workplaceIds: targetIds,
    employeeGroupIds: targetIds,
    userIds: targetIds,
  })
  .default({});

export type PostTargetSchema = z.infer<typeof postTargetSchema>;

const postContentSchema = z
  .string()
  .trim()
  .min(1, "Isi pengumuman wajib diisi")
  .max(POST_CONTENT_MAX_CHARACTERS * 4, `Isi pengumuman maksimal ${POST_CONTENT_MAX_CHARACTERS} karakter`);

const postMutationBaseSchema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter").max(200, "Judul maksimal 200 karakter"),
  content: postContentSchema,
  visibilityType: z
    .enum([POST_VISIBILITY_TYPE.PUBLIC, POST_VISIBILITY_TYPE.TARGETED])
    .default(POST_VISIBILITY_TYPE.PUBLIC),
  isPinned: z.boolean().default(false),
  sendEmail: z.boolean().default(false),
  targets: postTargetSchema,
});

function validatePostContent(value: { content: string }, context: z.RefinementCtx) {
  if (isPostContentEmpty(value.content)) {
    context.addIssue({
      code: "custom",
      path: ["content"],
      message: "Isi pengumuman wajib diisi",
    });
    return;
  }

  if (getPostContentText(value.content).length > POST_CONTENT_MAX_CHARACTERS) {
    context.addIssue({
      code: "custom",
      path: ["content"],
      message: `Isi pengumuman maksimal ${POST_CONTENT_MAX_CHARACTERS} karakter`,
    });
  }
}

export const createPostSchema = postMutationBaseSchema
  .extend({
    status: z.enum([POST_STATUS.DRAFT, POST_STATUS.PUBLISHED]).default(POST_STATUS.DRAFT),
  })
  .superRefine(validatePostContent);

export type CreatePostSchema = z.infer<typeof createPostSchema>;

export const updatePostSchema = postMutationBaseSchema
  .extend({
    id: z.string().trim().min(1).max(100),
    status: z.enum([POST_STATUS.DRAFT, POST_STATUS.PUBLISHED, POST_STATUS.ARCHIVED]),
  })
  .superRefine(validatePostContent);
export type UpdatePostSchema = z.infer<typeof updatePostSchema>;

export const postStatusFilterSchema = z
  .enum([POST_STATUS.DRAFT, POST_STATUS.PUBLISHED, POST_STATUS.ARCHIVED])
  .optional();

export const postListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .max(PAGINATION.pageSizeOptions[PAGINATION.pageSizeOptions.length - 1])
    .optional(),
  status: postStatusFilterSchema,
  search: z.string().trim().max(200).optional(),
});

export type PostListQuerySchema = z.infer<typeof postListQuerySchema>;

export const postFeedQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .max(PAGINATION.pageSizeOptions[PAGINATION.pageSizeOptions.length - 1])
    .optional(),
  search: z.string().trim().max(200).optional(),
});

export type PostFeedQuerySchema = z.infer<typeof postFeedQuerySchema>;

export const postIdSchema = z.object({
  id: uuidLike,
});

export type PostIdSchema = z.infer<typeof postIdSchema>;
