"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";

import { PAGINATION } from "@/constants";
import {
  archivePostRequest,
  createPostRequest,
  deletePostRequest,
  fetchPostFeed,
  fetchPosts,
  fetchPostTargetOptions,
  updatePostRequest,
  type PostTargetOptions,
} from "../api";
import type {
  PostDetail,
  PostFeedItem,
  PostListMeta,
  PostSummary,
  PostStatus,
  PostTargetInput,
} from "../types";

export const POST_QUERY_KEYS = {
  feed: (page: number, pageSize: number, search?: string) => ["posts", "feed", { page, pageSize, search }] as const,
  manage: (filter: { page: number; pageSize: number; status?: string; search?: string }) =>
    ["posts", "manage", filter] as const,
  targetOptions: ["posts", "target-options"] as const,
};

export type PostFormValues = {
  title: string;
  content: string;
  visibilityType: string;
  status: PostStatus;
  isPinned: boolean;
  sendEmail: boolean;
  targets: PostTargetInput;
  files?: File[];
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Terjadi kesalahan saat memproses permintaan.";
}

export function usePostFeed(
  page: number = PAGINATION.defaultPage,
  pageSize: number = PAGINATION.defaultPageSize,
  search?: string,
) {
  return useQuery({
    queryKey: POST_QUERY_KEYS.feed(page, pageSize, search),
    queryFn: () => fetchPostFeed({ page, pageSize, search }),
    placeholderData: keepPreviousData,
  });
}

export function usePosts(filter: {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
} = {}) {
  const query = {
    page: filter.page ?? PAGINATION.defaultPage,
    pageSize: filter.pageSize ?? PAGINATION.defaultPageSize,
    status: filter.status,
    search: filter.search,
  };

  return useQuery({
    queryKey: POST_QUERY_KEYS.manage(query),
    queryFn: () => fetchPosts(query),
    placeholderData: keepPreviousData,
  });
}

export function usePostTargetOptions(enabled = true) {
  return useQuery<PostTargetOptions>({
    queryKey: POST_QUERY_KEYS.targetOptions,
    queryFn: fetchPostTargetOptions,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

function invalidatePostQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["posts"] }),
    queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  ]);
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: PostFormValues) => {
      return createPostRequest(values);
    },
    onSuccess: async (data) => {
      await invalidatePostQueries(queryClient);
      return data;
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: PostFormValues & { id: string }) => {
      return updatePostRequest(values);
    },
    onSuccess: async (data) => {
      await invalidatePostQueries(queryClient);
      return data;
    },
  });
}

export function useArchivePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await archivePostRequest(id);
      return id;
    },
    onSuccess: async (id) => {
      await invalidatePostQueries(queryClient);
      return id;
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await deletePostRequest(id);
      return id;
    },
    onSuccess: async (id) => {
      await invalidatePostQueries(queryClient);
      return id;
    },
  });
}

export function getPostFormError(error: unknown): string {
  return toErrorMessage(error);
}

export type { PostDetail, PostFeedItem, PostListMeta, PostSummary, PostTargetInput };
