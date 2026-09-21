"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, Filter, Megaphone, Pencil, Pin, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CardContainer } from "@/components/cards/CardContainer";
import { PageHeader } from "@/components/navigation/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { DataTableCard } from "@/components/tables/DataTableCard";
import { PaginationItems } from "@/components/tables/PaginationItems";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  POST_STATUS,
  POST_STATUS_LABELS,
  POST_VISIBILITY_TYPE_LABELS,
  type PostAttachmentLimits,
} from "@/modules/post";
import { routeTo } from "@/constants";
import {
  useArchivePost,
  useDeletePost,
  usePosts,
} from "../hooks";
import type { PostSummary } from "../types";
import { PostComposer } from "./PostComposer";

const ALL_STATUSES = "ALL";

type ManagePostsViewProps = {
  attachmentLimits: PostAttachmentLimits;
};

export function ManagePostsView({ attachmentLimits }: ManagePostsViewProps) {
  const [draftSearch, setDraftSearch] = useState("");
  const [draftStatusFilter, setDraftStatusFilter] = useState<string>(ALL_STATUSES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<PostSummary | null>(null);

  const { data, error, isError, isLoading, isFetching } = usePosts({
    page,
    search,
    status: statusFilter === ALL_STATUSES ? undefined : statusFilter,
  });
  const archivePost = useArchivePost();
  const deletePost = useDeletePost();

  const items = data?.data ?? [];
  const meta = data?.meta;
  const busy = archivePost.isPending || deletePost.isPending;

  function handleApplyFilter() {
    setSearch(draftSearch.trim());
    setStatusFilter(draftStatusFilter);
    setPage(1);
  }

  function handleResetFilter() {
    setDraftSearch("");
    setDraftStatusFilter(ALL_STATUSES);
    setSearch("");
    setStatusFilter(ALL_STATUSES);
    setPage(1);
  }

  async function handleArchive(id: string, title: string) {
    try {
      await archivePost.mutateAsync(id);
      toast.success("Pengumuman diarsipkan", { description: title });
    } catch (archiveError) {
      toast.error("Gagal mengarsipkan", {
        description: archiveError instanceof Error ? archiveError.message : undefined,
      });
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;

    try {
      await deletePost.mutateAsync(deleteTarget.id);
      toast.success("Pengumuman dihapus", { description: deleteTarget.title });
      setDeleteTarget(null);
    } catch (deleteError) {
      toast.error("Gagal menghapus", {
        description: deleteError instanceof Error ? deleteError.message : undefined,
      });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Info"
        title="Pengumuman"
        description="Buat, publikasikan, dan arsipkan pengumuman untuk pegawai."
      />

      <PostComposer attachmentLimits={attachmentLimits} />

      <AnnouncementFilterCard
        search={draftSearch}
        statusFilter={draftStatusFilter}
        onSearchChange={setDraftSearch}
        onStatusChange={setDraftStatusFilter}
        onApply={handleApplyFilter}
        onReset={handleResetFilter}
      />

      <DataTableCard
        title="Daftar Pengumuman"
        description={
          meta
            ? `Total ${meta.totalItems} pengumuman - Halaman ${meta.page} dari ${meta.totalPages || 1}`
            : "Pantau draft, publikasi, dan arsip pengumuman internal."
        }
        icon={<Megaphone className="size-4" />}
        table={renderTable({
          items,
          loading: isLoading || isFetching,
          busy,
          onArchive: handleArchive,
          onDelete: setDeleteTarget,
        })}
        tableMinWidthClassName="min-w-[900px]"
        emptyState={
          !isLoading && !isFetching && !isError && items.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="font-medium">Belum ada pengumuman</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Buat pengumuman pertama untuk membagikan informasi ke pegawai.
              </p>
            </div>
          ) : null
        }
        footerSummary={
          meta ? (
            <p className="text-xs text-muted-foreground">
              Menampilkan {items.length} dari {meta.totalItems} pengumuman.
            </p>
          ) : null
        }
        pagination={
          meta && meta.totalPages > 1 ? (
            <PostPagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
          ) : null
        }
      />

      {isError ? (
        <ErrorState
          compact
          title="Gagal memuat pengumuman"
          description={error instanceof Error ? error.message : "Coba muat ulang halaman."}
        />
      ) : null}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2 className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle>Hapus pengumuman?</AlertDialogTitle>
            <AlertDialogDescription>
              Pengumuman &quot;{deleteTarget?.title}&quot; akan dihapus dari daftar aktif.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePost.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deletePost.isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteConfirmed();
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function renderTable(input: {
  items: PostSummary[];
  loading: boolean;
  busy: boolean;
  onArchive: (id: string, title: string) => Promise<void>;
  onDelete: (post: PostSummary) => void;
}) {
  const columns: DataTableColumn<PostSummary>[] = [
    {
      key: "title",
      header: "Pengumuman",
      headClassName: "w-[360px]",
      cell: (post) => (
        <div className="min-w-0 space-y-1">
          <div className="flex min-w-0 items-center gap-2">
            {post.isPinned ? (
              <Badge variant="secondary" className="shrink-0 gap-1 px-1.5 py-0 text-[10px]">
                <Pin className="size-3" />
                Pin
              </Badge>
            ) : null}
            <span className="truncate font-semibold text-foreground">{post.title}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDate(post.createdAt)} oleh {post.authorName}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      headClassName: "w-[140px]",
      cell: (post) => <StatusBadge status={post.status} />,
    },
    {
      key: "visibility",
      header: "Visibilitas",
      headClassName: "w-[160px]",
      cellClassName: "text-muted-foreground",
      cell: (post) =>
        POST_VISIBILITY_TYPE_LABELS[post.visibilityType as keyof typeof POST_VISIBILITY_TYPE_LABELS] ??
        post.visibilityType,
    },
    {
      key: "attachments",
      header: "Lampiran",
      headClassName: "w-[110px] text-center",
      cellClassName: "text-center text-muted-foreground",
      cell: (post) => post.attachments.length,
    },
    {
      key: "action",
      header: "Aksi",
      headClassName: "w-[260px] text-right",
      cellClassName: "text-right",
      cell: (post) => (
        <div className="flex justify-end gap-2">
          <Link
            className={buttonVariants({ variant: "outline", size: "xs" })}
            href={routeTo.announcementsManageEdit(post.id)}
          >
            <Pencil className="size-3.5" />
            <span className="hidden md:inline">Edit</span>
          </Link>
          {post.status !== POST_STATUS.ARCHIVED ? (
            <Button
              variant="outline"
              size="xs"
              onClick={() => void input.onArchive(post.id, post.title)}
              disabled={input.busy}
            >
              <Archive className="size-3.5" />
              <span className="hidden md:inline">Arsipkan</span>
            </Button>
          ) : null}
          <Button
            variant="destructive"
            size="xs"
            onClick={() => input.onDelete(post)}
            disabled={input.busy}
          >
            <Trash2 className="size-3.5" />
            <span className="hidden md:inline">Hapus</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={input.loading ? [] : input.items}
      columns={columns}
      getRowKey={(post) => post.id}
      emptyMessage={input.loading ? "Memuat pengumuman..." : "Tidak ada pengumuman yang sesuai filter."}
    />
  );
}

function AnnouncementFilterCard({
  search,
  statusFilter,
  onSearchChange,
  onStatusChange,
  onApply,
  onReset,
}: {
  search: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  return (
    <CardContainer
      icon={<Filter className="size-4 shrink-0 text-primary" />}
      title="Filter & Pencarian"
      description="Cari dan saring pengumuman berdasarkan status publikasi."
      descriptionClassName="hidden sm:block"
      headerClassName="pb-2"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari judul pengumuman..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onApply();
            }}
          />
        </div>

        <Select value={statusFilter} onValueChange={(value) => onStatusChange(value ?? ALL_STATUSES)}>
          <SelectTrigger className="w-full md:w-[200px]" aria-label="Status pengumuman">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>Semua status</SelectItem>
            <SelectItem value={POST_STATUS.DRAFT}>Draft</SelectItem>
            <SelectItem value={POST_STATUS.PUBLISHED}>Dipublikasikan</SelectItem>
            <SelectItem value={POST_STATUS.ARCHIVED}>Diarsipkan</SelectItem>
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-2 md:flex md:flex-row md:items-center">
          <Button type="button" className="gap-2 md:w-auto" onClick={onApply}>
            <Search className="size-4" />
            Terapkan
          </Button>
          <Button type="button" variant="outline" className="md:w-auto" onClick={onReset}>
            Reset
          </Button>
        </div>
      </div>
    </CardContainer>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = POST_STATUS_LABELS[status as keyof typeof POST_STATUS_LABELS] ?? status;
  const variant = status === POST_STATUS.PUBLISHED ? "default" : "secondary";
  return <Badge variant={variant}>{label}</Badge>;
}

function formatDate(iso: string) {
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

function PostPagination({
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
