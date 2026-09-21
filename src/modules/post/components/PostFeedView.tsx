"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CalendarDays, FileText, Megaphone, Pin } from "lucide-react";
import { PageHeader } from "@/components/navigation/PageHeader";
import { PaginationItems } from "@/components/tables/PaginationItems";
import { SearchFilterCard } from "@/components/tables/SearchFilterCard";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES, routeTo } from "@/constants";
import { PAGINATION } from "@/constants/pagination";
import { usePostFeed } from "../hooks";
import type { PostFeedItem } from "../types";
import { getPostExcerpt } from "../utils/rich-content";

const FEED_PAGE_SIZE = 9;

export function PostFeedView({ canManage = false }: { canManage?: boolean }) {
  const [page, setPage] = useState<number>(PAGINATION.defaultPage);
  const [draftSearch, setDraftSearch] = useState("");
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim() || undefined;
  const { data, error, isError, isLoading, isFetching } = usePostFeed(
    page,
    FEED_PAGE_SIZE,
    normalizedSearch,
  );
  const items = data?.data ?? [];
  const meta = data?.meta;
  const [featuredPost, ...latestPosts] = items;
  const loading = isLoading || isFetching;

  function handleApplyFilters() {
    setSearch(draftSearch.trim());
    setPage(1);
  }

  function handleResetFilters() {
    setDraftSearch("");
    setSearch("");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Info"
        title="Pengumuman"
        description="Informasi dan pengumuman resmi internal RSUD Bahteramas."
        actions={
          canManage
            ? [
                {
                  label: "Buat Pengumuman",
                  icon: <Megaphone className="size-4" />,
                  href: ROUTES.announcementsManage,
                },
              ]
            : undefined
        }
      />

      <SearchFilterCard
        description="Cari berdasarkan judul atau isi pengumuman."
        search={draftSearch}
        onSearchChange={setDraftSearch}
        searchPlaceholder="Cari judul atau isi pengumuman..."
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {isError ? (
        <ErrorState
          compact
          title="Gagal memuat pengumuman"
          description={error instanceof Error ? error.message : "Coba muat ulang halaman."}
        />
      ) : loading ? (
        <AnnouncementSkeleton />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="w-full space-y-5">
          {meta ? (
            <p className="text-sm text-muted-foreground">
              Menampilkan {items.length} dari {meta.totalItems} pengumuman
            </p>
          ) : null}

          <FeaturedAnnouncementItem post={featuredPost} />

          {latestPosts.length ? (
            <div className="grid w-full gap-4 lg:grid-cols-2">
              {latestPosts.map((post) => (
                <AnnouncementNewsItem key={post.id} post={post} />
              ))}
            </div>
          ) : null}

          {meta && meta.totalPages > 1 ? (
            <PostFeedPagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
          ) : null}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-card p-10 text-center">
        <Megaphone className="size-10 text-muted-foreground/50" />
        <h2 className="mt-3 text-base font-semibold text-foreground">Belum ada pengumuman</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Saat ini belum ada pengumuman baru untuk Anda.
        </p>
      </div>
    </div>
  );
}

function FeaturedAnnouncementItem({ post }: { post: PostFeedItem }) {
  const imageAttachments = post.attachments.filter((attachment) => attachment.mimeType.startsWith("image/"));
  const fileAttachments = post.attachments.filter((attachment) => !attachment.mimeType.startsWith("image/"));
  const coverImage = imageAttachments[0];
  const excerpt = getPostExcerpt(post.content, 260);

  return (
    <Link
      href={routeTo.announcementsDetail(post.id)}
      className="group block w-full rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="w-full max-w-full overflow-hidden p-0 transition-colors group-hover:border-primary/40">
        <div className="grid min-h-[320px] lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
          {coverImage ? (
            <div className="relative min-h-64 overflow-hidden bg-muted/30 lg:min-h-full">
              <Image
                src={coverImage.url}
                alt={coverImage.fileName}
                width={980}
                height={620}
                unoptimized
                priority
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </div>
          ) : (
            <div className="flex min-h-64 items-center justify-center bg-muted/40 lg:min-h-full">
              <Megaphone className="size-16 text-muted-foreground/40" />
            </div>
          )}

          <div className="flex min-w-0 max-w-full flex-col justify-center gap-4 overflow-hidden p-6 sm:p-8">
            <div className="min-w-0 space-y-1.5 text-xs text-muted-foreground">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {!post.isRead ? <Badge>Baru</Badge> : null}
                <Badge variant="secondary">{post.isPinned ? "Disematkan" : "Utama"}</Badge>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3.5" />
                  {formatPublicationDate(post.publishedAt)}
                </span>
              </div>
              <p className="min-w-0 max-w-full truncate">Oleh {post.authorName}</p>
            </div>

            <h2 className="line-clamp-3 max-w-full text-2xl leading-tight font-bold break-all text-foreground transition-colors group-hover:text-primary sm:text-3xl">
              {post.title}
            </h2>

            <p className="line-clamp-4 max-w-full text-sm leading-7 break-all text-muted-foreground sm:text-base">
              {excerpt}
            </p>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-primary group-hover:underline">Baca selengkapnya</span>
              {fileAttachments.length ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
                  <FileText className="size-3.5" />
                  {fileAttachments.length} lampiran
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function AnnouncementNewsItem({ post }: { post: PostFeedItem }) {
  const imageAttachments = post.attachments.filter((attachment) => attachment.mimeType.startsWith("image/"));
  const fileAttachments = post.attachments.filter((attachment) => !attachment.mimeType.startsWith("image/"));
  const coverImage = imageAttachments[0];
  const excerpt = getPostExcerpt(post.content);

  return (
    <Link
      href={routeTo.announcementsDetail(post.id)}
      className="group block w-full rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full w-full max-w-full gap-0 overflow-hidden p-4 transition-colors group-hover:border-primary/40 sm:p-5">
        <div className="flex min-w-0 max-w-full flex-col gap-4 overflow-hidden sm:flex-row sm:items-start">
          <div className="min-w-0 max-w-full flex-1 space-y-2 overflow-hidden">
            <div className="min-w-0 space-y-1.5 text-xs text-muted-foreground">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {!post.isRead ? (
                  <Badge variant="default" className="shrink-0">
                    Baru
                  </Badge>
                ) : null}
                {post.isPinned ? (
                  <Badge variant="secondary" className="shrink-0 gap-1">
                    <Pin className="size-3" />
                    Disematkan
                  </Badge>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3.5" />
                  {formatPublicationDate(post.publishedAt)}
                </span>
              </div>
              <p className="min-w-0 max-w-full truncate">Oleh {post.authorName}</p>
            </div>

            <h2 className="line-clamp-2 max-w-full text-base leading-snug font-bold break-all text-foreground transition-colors group-hover:text-primary sm:text-lg">
              {post.title}
            </h2>

            <p className="line-clamp-2 max-w-full text-sm leading-relaxed break-all text-muted-foreground sm:line-clamp-3">
              {excerpt}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1.5 text-xs">
              <span className="inline-flex items-center gap-1 font-medium text-primary group-hover:underline">
                Baca selengkapnya
              </span>
              {fileAttachments.length ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-muted-foreground">
                  <FileText className="size-3.5" />
                  {fileAttachments.length} lampiran
                </span>
              ) : null}
            </div>
          </div>

          {coverImage ? (
            <div className="w-full max-w-full shrink-0 self-stretch overflow-hidden rounded-md border bg-muted/20 sm:order-last sm:w-36">
              <Image
                src={coverImage.url}
                alt={coverImage.fileName}
                width={480}
                height={300}
                unoptimized
                className="h-40 w-full max-w-full object-cover transition-transform group-hover:scale-[1.02] sm:h-28"
              />
            </div>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}

function AnnouncementSkeleton() {
  return (
    <div className="w-full space-y-4">
      <Card className="overflow-hidden p-0" data-slot="card">
        <div className="grid min-h-[320px] lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
          <Skeleton className="min-h-64 rounded-none lg:min-h-full" />
          <div className="space-y-4 p-6 sm:p-8">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-9 w-4/5" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </Card>
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="gap-0 p-5 sm:p-6" data-slot="card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-3/4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
            <Skeleton className="hidden h-28 w-44 shrink-0 sm:block" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function PostFeedPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          {page > 1 ? (
            <PaginationPrevious
              href="#"
              onClick={(event) => {
                event.preventDefault();
                onPageChange(page - 1);
              }}
            />
          ) : null}
        </PaginationItem>
        <PaginationItems
          page={page}
          totalPages={totalPages}
          onPageClick={(event, targetPage) => {
            event.preventDefault();
            onPageChange(targetPage);
          }}
        />
        <PaginationItem>
          {page < totalPages ? (
            <PaginationNext
              href="#"
              onClick={(event) => {
                event.preventDefault();
                onPageChange(page + 1);
              }}
            />
          ) : null}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function formatPublicationDate(iso: string) {
  try {
    const date = new Date(iso);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return iso;
  }
}
