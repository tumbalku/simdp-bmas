import { PAGINATION } from "@/constants";
import type {
  PostDetail,
  PostFeedItem,
  PostListMeta,
  PostStatus,
  PostSummary,
} from "./types";

export type PostTargetOptions = {
  roles: Array<{ id: string; name: string }>;
  workplaces: Array<{ id: string; name: string }>;
  employeeGroups: Array<{ id: string; name: string }>;
  users: Array<{ id: string; name: string }>;
};

type ListPayload<T> = {
  ok: true;
  data: T[];
  meta: PostListMeta;
};

type DetailPayload = {
  ok: true;
  data: PostDetail;
};

type OptionsPayload = {
  ok: true;
  data: PostTargetOptions;
};

type SuccessPayload<T> = {
  ok: true;
  data: T;
  meta?: PostListMeta;
};

type ErrorEnvelope = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ path: string; message: string }>;
  };
};

type Envelope<T> = ListPayload<T> | DetailPayload | OptionsPayload | SuccessPayload<T> | ErrorEnvelope;

async function parseEnvelope<T>(response: Response): Promise<{ data: T; meta?: PostListMeta }> {
  const payload = (await response.json()) as Envelope<T> & { meta?: PostListMeta };

  if (!response.ok) {
    const message = !payload.ok ? payload.error.message : "Permintaan gagal.";
    throw new Error(message);
  }

  if (!payload.ok) {
    throw new Error(payload.error.message);
  }

  return { data: payload.data as T, meta: payload.meta };
}

function buildPaginationParams(page?: number, pageSize?: number) {
  const params = new URLSearchParams();
  params.set("page", String(page ?? PAGINATION.defaultPage));
  params.set("pageSize", String(pageSize ?? PAGINATION.defaultPageSize));
  return params;
}

export async function fetchPostFeed(filter: {
  page?: number;
  pageSize?: number;
  search?: string;
} = {}): Promise<{ data: PostFeedItem[]; meta: PostListMeta }> {
  const params = buildPaginationParams(filter.page, filter.pageSize);
  if (filter.search) params.set("search", filter.search);
  const response = await fetch(`/api/v1/posts?${params.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });

  const { data, meta } = await parseEnvelope<PostFeedItem[]>(response);
  return { data, meta: meta ?? { page: 1, pageSize: PAGINATION.defaultPageSize, totalItems: 0, totalPages: 0 } };
}

export async function fetchPosts(filter: {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
} = {}): Promise<{ data: PostSummary[]; meta: PostListMeta }> {
  const params = buildPaginationParams(filter.page, filter.pageSize);
  if (filter.status) params.set("status", filter.status);
  if (filter.search) params.set("search", filter.search);

  const response = await fetch(`/api/v1/posts/manage?${params.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });

  const { data, meta } = await parseEnvelope<PostSummary[]>(response);
  return { data, meta: meta ?? { page: 1, pageSize: PAGINATION.defaultPageSize, totalItems: 0, totalPages: 0 } };
}

export async function fetchPostTargetOptions(): Promise<PostTargetOptions> {
  const response = await fetch("/api/v1/posts/target-options", {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });

  const { data } = await parseEnvelope<PostTargetOptions>(response);
  return data;
}

async function sendJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init.headers,
    },
    credentials: "same-origin",
  });

  const { data } = await parseEnvelope<T>(response);
  return data;
}

export async function createPostRequest(values: {
  title: string;
  content: string;
  visibilityType: string;
  status: PostStatus;
  isPinned: boolean;
  sendEmail: boolean;
  targets: unknown;
  files?: File[];
}): Promise<PostDetail> {
  const formData = new FormData();
  formData.set("payload", JSON.stringify({
    title: values.title,
    content: values.content,
    visibilityType: values.visibilityType,
    status: values.status,
    isPinned: values.isPinned,
    sendEmail: values.sendEmail,
    targets: values.targets,
  }));
  for (const file of values.files ?? []) {
    formData.append("files", file);
  }

  const response = await fetch("/api/v1/posts/manage", {
    method: "POST",
    body: formData,
    credentials: "same-origin",
  });

  const { data } = await parseEnvelope<PostDetail>(response);
  return data;
}

export async function updatePostRequest(values: {
  id: string;
  title: string;
  content: string;
  visibilityType: string;
  status: PostStatus;
  isPinned: boolean;
  sendEmail: boolean;
  targets: unknown;
}): Promise<PostDetail> {
  const { id, ...payload } = values;
  return sendJson<PostDetail>(`/api/v1/posts/manage/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function archivePostRequest(id: string): Promise<PostDetail> {
  return sendJson<PostDetail>(`/api/v1/posts/manage/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "archive" }),
  });
}

export async function deletePostRequest(id: string): Promise<{ success: true }> {
  return sendJson<{ success: true }>(`/api/v1/posts/manage/${id}`, {
    method: "DELETE",
  });
}
