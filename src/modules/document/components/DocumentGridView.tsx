"use client";

import Link from "next/link";
import { Eye, RotateCcw, Trash2 } from "lucide-react";
import { PaginationItems } from "@/components/tables/PaginationItems";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  ROUTES,
  routeTo,
} from "@/constants";
import {
  DOCUMENT_STATUS_OPTIONS,
  DOCUMENT_STATUS_VARIANTS,
} from "@/modules/document";
import type {
  CriticalActionTarget,
  DocumentRecord,
} from "./DocumentTableView";
import { type PaginationMeta } from "@/types/pagination";

export type DocumentGridViewProps = {
  documents: DocumentRecord[];
  pagination: PaginationMeta;
  isArchiveView: boolean;
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

export function DocumentGridView({
  documents,
  pagination,
  isArchiveView,
  buildPageUrl,
  searchParamsString,
  isActionPending,
  openCriticalActionDialog,
}: DocumentGridViewProps) {
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

  const paginationControls =
    pagination.totalPages > 1 ? (
      <Pagination className="mx-0 w-auto justify-end">
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
    <div className="space-y-4">
      {documents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex min-h-[220px] items-center justify-center text-center">
            <div className="max-w-md space-y-2">
              <p className="text-base font-semibold text-foreground">
                Tidak ada dokumen
              </p>
              <p className="text-sm text-muted-foreground">
                {isArchiveView
                  ? "Tidak ada dokumen arsip yang sesuai filter."
                  : "Tidak ada dokumen aktif yang sesuai filter."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {documents.map((doc) => {
            const config = statusConfig[doc.status] ?? statusConfig.PENDING;

            return (
              <Card
                key={doc.id}
                className="border-muted-foreground/10 shadow-sm"
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="truncate font-medium">{doc.title}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {doc.fileName} - {formatFileSize(doc.fileSize)}
                        </div>
                      </div>
                      <Badge variant={config.variant} className="shrink-0">
                        {config.label}
                      </Badge>
                    </div>

                    <div className="grid gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Pemilik
                        </p>
                        <p
                          className="font-medium truncate"
                          title={doc.ownerName}
                        >
                          {doc.ownerName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.ownerEmployeeId || "NIP belum ada"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Jenis</p>
                        <p>{doc.documentTypeName}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.archiveCategory}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Upload
                          </p>
                          <p>{formatDate(doc.uploadedAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Kedaluwarsa
                          </p>
                          <p>{formatDate(doc.expiryDate)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end border-t pt-3">
                      {renderDocumentActions(doc)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {footerSummary}
        {paginationControls && (
          <div className="flex justify-end sm:ml-auto">
            {paginationControls}
          </div>
        )}
      </div>
    </div>
  );
}
