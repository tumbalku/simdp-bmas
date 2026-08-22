"use client";

import Link from "next/link";
import { AlertTriangle, Clock3, Eye, FileText, RotateCcw, Trash2 } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { DataTableCard } from "@/components/tables/DataTableCard";
import { PaginationItems } from "@/components/tables/PaginationItems";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DATE_FORMATS,
  DATE_LOCALE,
  PAGINATION,
  ROUTES,
  routeTo,
} from "@/constants";
import { type PaginationMeta } from "@/types/pagination";
import {
  DOCUMENT_STATUS_OPTIONS,
  DOCUMENT_STATUS_VARIANTS,
} from "@/modules/document";
import { getExpiryStatusInfo } from "../utils/expiry-status";

export type DocumentRecord = {
  id: string;
  title: string;
  status: string;
  uploadedAt: string;
  expiryDate: string | null;
  fileName: string;
  fileSize: number | null;
  documentTypeName: string;
  archiveCategory: string;
  ownerName: string;
  ownerEmployeeId: string | null;
};

export type CriticalDocumentAction =
  | "archive"
  | "permanent-delete"
  | "restore"
  | "bulk-delete"
  | "bulk-restore";

export type CriticalActionTarget = {
  doc?: DocumentRecord;
  action: CriticalDocumentAction;
};

export type DocumentTableViewProps = {
  documents: DocumentRecord[];
  pagination: PaginationMeta;
  isArchiveView: boolean;
  selectedDocIds: string[];
  onSelectionChange: (ids: string[]) => void;
  rowsPerPage: string;
  onRowsPerPageChange: (value: string | null) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
  extraActions?: React.ReactNode;
  buildPageUrl: (page: number) => string;
  searchParamsString: string;
  isActionPending: boolean;
  openCriticalActionDialog: (target: CriticalActionTarget) => void;
};

const statusConfig = Object.fromEntries(
  DOCUMENT_STATUS_OPTIONS.map(({ value, label }) => [
    value,
    { label, variant: DOCUMENT_STATUS_VARIANTS[value] },
  ]),
) as Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
>;

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(DATE_LOCALE, DATE_FORMATS.date).format(
    new Date(value),
  );
}

function formatFileSize(value: number | null) {
  if (!value) return "-";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentTableView({
  documents,
  pagination,
  isArchiveView,
  selectedDocIds,
  onSelectionChange,
  rowsPerPage,
  onRowsPerPageChange,
  sortBy,
  sortOrder,
  onSortChange,
  extraActions,
  buildPageUrl,
  searchParamsString,
  isActionPending,
  openCriticalActionDialog,
}: DocumentTableViewProps) {
  const buildDocumentDetailUrl = (documentId: string) => {
    const returnTo = searchParamsString
      ? `${ROUTES.masterDataDocuments}?${searchParamsString}`
      : ROUTES.masterDataDocuments;
    const detailParams = new URLSearchParams({ returnTo });

    return `${routeTo.documentDetail(documentId)}?${detailParams.toString()}`;
  };

  const renderDocumentActions = (doc: DocumentRecord) => (
    <div className="flex justify-end gap-2">
      {!isArchiveView ? (
        <Link
          className={buttonVariants({ variant: "outline", size: "xs" })}
          href={buildDocumentDetailUrl(doc.id)}
        >
          <Eye className="size-3.5" />
          <span className="hidden md:inline">Detail</span>
        </Link>
      ) : null}
      {isArchiveView ? (
        <Button
          variant="destructive"
          size="xs"
          disabled={isActionPending}
          onClick={() =>
            openCriticalActionDialog({ doc, action: "permanent-delete" })
          }
        >
          <Trash2 className="size-3.5" />
          <span className="hidden md:inline">Hapus permanen</span>
        </Button>
      ) : null}
      {isArchiveView ? (
        <Button
          variant="outline"
          size="xs"
          className="border-success/30 text-success hover:bg-success/10 hover:text-success"
          disabled={isActionPending}
          onClick={() => openCriticalActionDialog({ doc, action: "restore" })}
        >
          <RotateCcw className="size-3.5" />
          <span className="hidden md:inline">Pulihkan</span>
        </Button>
      ) : (
        <Button
          variant="destructive"
          size="xs"
          disabled={isActionPending}
          onClick={() => openCriticalActionDialog({ doc, action: "archive" })}
        >
          <Trash2 className="size-3.5" />
          <span className="hidden md:inline">Hapus</span>
        </Button>
      )}
    </div>
  );

  const documentColumns: DataTableColumn<DocumentRecord>[] = [
    {
      key: "document",
      header: "Dokumen",
      headClassName: "max-w-[220px] md:max-w-[280px]",
      cellClassName: "max-w-[220px] md:max-w-[280px]",
      cell: (doc) => (
        <div className="max-w-[220px] md:max-w-[280px]">
          <div className="truncate font-medium text-foreground" title={doc.title}>
            {doc.title}
          </div>
          <div
            className="truncate text-xs text-muted-foreground"
            title={`${doc.fileName} - ${formatFileSize(doc.fileSize)}`}
          >
            {doc.fileName} - {formatFileSize(doc.fileSize)}
          </div>
        </div>
      ),
    },
    {
      key: "owner",
      header: "Pemilik",
      sortable: true,
      sortKey: "name",
      cell: (doc) => (
        <div className="max-w-[200px]">
          <div className="truncate font-medium" title={doc.ownerName}>
            {doc.ownerName}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {doc.ownerEmployeeId || "NIP belum ada"}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Jenis",
      headClassName: "max-w-[180px]",
      cellClassName: "max-w-[180px]",
      cell: (doc) => (
        <div className="max-w-[180px]">
          <div className="truncate" title={doc.documentTypeName}>
            {doc.documentTypeName}
          </div>
          <div
            className="truncate text-xs text-muted-foreground"
            title={doc.archiveCategory}
          >
            {doc.archiveCategory}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (doc) => {
        const config = statusConfig[doc.status] ?? statusConfig.PENDING;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: "uploadedAt",
      header: "Upload",
      sortable: true,
      sortKey: "uploadedAt",
      cell: (doc) => formatDate(doc.uploadedAt),
    },
    {
      key: "expiryDate",
      header: "Kedaluwarsa",
      sortable: true,
      sortKey: "expiryDate",
      cell: (doc) => {
        const expiry = getExpiryStatusInfo(doc.expiryDate);
        if (!expiry) return "-";
        if (expiry.type === "EXPIRED") {
          return (
            <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium" title={expiry.label}>
              <AlertTriangle className="size-3 shrink-0" />
              <span>{expiry.formattedDate}</span>
            </div>
          );
        }
        if (expiry.type === "EXPIRING_SOON") {
          return (
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium" title={expiry.label}>
              <Clock3 className="size-3 shrink-0" />
              <span>{expiry.formattedDate}</span>
            </div>
          );
        }
        return expiry.formattedDate;
      },
    },
    {
      key: "action",
      header: "Aksi",
      headClassName: "w-[260px] text-right",
      cellClassName: "text-right",
      cell: (doc) => renderDocumentActions(doc),
    },
  ];

  const paginationControls =
    pagination.totalPages > 1 ? (
      <Pagination className="sm:ml-auto sm:w-auto">
        <PaginationContent>
          {pagination.page > 1 && (
            <PaginationItem>
              <PaginationPrevious href={buildPageUrl(pagination.page - 1)} />
            </PaginationItem>
          )}
          <PaginationItems
            page={pagination.page}
            totalPages={pagination.totalPages}
            getHref={buildPageUrl}
          />
          {pagination.page < pagination.totalPages && (
            <PaginationItem>
              <PaginationNext href={buildPageUrl(pagination.page + 1)} />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    ) : null;

  const footerSummary = (
    <p className="text-xs text-muted-foreground">
      Menampilkan {documents.length} dari {pagination.totalItems} dokumen{" "}
      {isArchiveView ? "arsip" : "aktif"}.
    </p>
  );

  return (
    <DataTableCard
      title="Daftar Dokumen"
      icon={<FileText className="size-5" />}
      description={`Total ${pagination.totalItems} dokumen ${isArchiveView ? "arsip" : "aktif"} - Halaman ${pagination.page} dari ${pagination.totalPages || 1}`}
      rowsPerPageControl={{
        value: rowsPerPage,
        onValueChange: onRowsPerPageChange,
        options: PAGINATION.pageSizeOptions,
        label: "Tampilkan",
        suffix: "baris",
      }}
      extraActions={extraActions}
      tableMinWidthClassName="min-w-[980px]"
      table={
        <DataTable
          data={documents}
          columns={documentColumns}
          getRowKey={(doc) => doc.id}
          selectable={isArchiveView}
          selectedIds={selectedDocIds}
          onSelectionChange={onSelectionChange}
          currentSortBy={sortBy}
          currentSortOrder={sortOrder}
          onSortChange={onSortChange}
          emptyMessage={
            isArchiveView
              ? "Tidak ada dokumen arsip yang sesuai filter."
              : "Tidak ada dokumen aktif yang sesuai filter."
          }
        />
      }
      pagination={paginationControls}
      footerSummary={footerSummary}
    />
  );
}
