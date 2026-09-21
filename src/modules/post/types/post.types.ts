import type {
  PostStatus,
  PostVisibilityType,
} from "../constants";

export type PostTargetInput = {
  roles?: string[] | null;
  workplaceIds?: string[] | null;
  employeeGroupIds?: string[] | null;
  userIds?: string[] | null;
};

export type PostSummary = {
  id: string;
  title: string;
  content: string;
  status: string;
  visibilityType: string;
  isPinned: boolean;
  authorId: string;
  authorName: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  attachments: PostAttachmentSummary[];
};

export type PostDetail = PostSummary & {
  targets: PostTargetDetail;
};

export type PostTargetDetail = {
  roles: string[];
  workplaceIds: string[];
  employeeGroupIds: string[];
  userIds: string[];
};

export type PostFeedItem = {
  id: string;
  title: string;
  content: string;
  authorName: string;
  publishedAt: string;
  isRead: boolean;
  isPinned: boolean;
  attachments: PostAttachmentSummary[];
};

export type PostAttachmentSummary = {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
};

export type PostListMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type PostVisibilityContext = {
  userId: string;
  role: string;
  employeeId: string | null;
  workplaceId: string | null;
  employeeGroupId: string | null;
};

export type { PostStatus, PostVisibilityType };
