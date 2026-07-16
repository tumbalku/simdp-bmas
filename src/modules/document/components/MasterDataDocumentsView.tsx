"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileText, Settings2 } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { DataTableCard } from "@/components/shared/DataTableCard";
import { DocumentSearchFilter } from "@/components/shared/DocumentSearchFilter";
import { PaginationItems } from "@/components/shared/PaginationItems";
import { PageHeader } from "@/components/shared/PageHeader";
import { ViewModeToggle } from "@/components/shared/ViewModeToggle";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { DATE_FORMATS, DATE_LOCALE, PAGINATION, ROUTES, routeTo } from "@/constants";
import { DOCUMENT_STATUS_OPTIONS, DOCUMENT_STATUS_VARIANTS } from "@/modules/document/constants";

type ViewMode = "grid" | "list";

type DocumentRecord = {
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

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type MasterDataDocumentsViewProps = {
  documents: DocumentRecord[];
  pagination: PaginationMeta;
};

const statusConfig = Object.fromEntries(
  DOCUMENT_STATUS_OPTIONS.map(({ value, label }) => [
    value,
    { label, variant: DOCUMENT_STATUS_VARIANTS[value] },
  ])
) as Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }>;

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(DATE_LOCALE, DATE_FORMATS.date).format(new Date(value));
}

function formatFileSize(value: number | null) {
  if (!value) return "-";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function MasterDataDocumentsView({ documents, pagination }: MasterDataDocumentsViewProps) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [statusFilter, setStatusFilter] = useState<string>(
    () => searchParams.get("status") ?? "all",
  );
  const [rowsPerPage, setRowsPerPage] = useState(() =>
    String(pagination.limit || PAGINATION.defaultPageSize),
  );
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const buildPageUrl = (page: number, limit = rowsPerPage) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit);
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    return `${ROUTES.masterDataDocuments}?${params.toString()}`;
  };

  const buildDocumentDetailUrl = (documentId: string) => {
    const currentParams = searchParams.toString();
    const returnTo = currentParams
      ? `${ROUTES.masterDataDocuments}?${currentParams}`
      : ROUTES.masterDataDocuments;
    const detailParams = new URLSearchParams({ returnTo });

    return `${routeTo.documentDetail(documentId)}?${detailParams.toString()}`;
  };

  const handleFilter = () => {
    window.location.href = buildPageUrl(PAGINATION.defaultPage);
  };

  const handleRowsPerPageChange = (value: string | null) => {
    const nextLimit = value ?? rowsPerPage;
    setRowsPerPage(nextLimit);
    window.location.href = buildPageUrl(PAGINATION.defaultPage, nextLimit);
  };

  const handleResetFilter = () => {
    const defaultLimit = String(PAGINATION.defaultPageSize);
    setSearch("");
    setStatusFilter("all");
    setRowsPerPage(defaultLimit);
    window.location.href = `${ROUTES.masterDataDocuments}?page=${PAGINATION.defaultPage}&limit=${defaultLimit}`;
  };

  const documentColumns: DataTableColumn<DocumentRecord>[] = [
    {
      key: "document",
      header: "Dokumen",
      cell: (doc) => (
        <>
          <div className="font-medium">{doc.title}</div>
          <div className="text-xs text-muted-foreground">
            {doc.fileName} - {formatFileSize(doc.fileSize)}
          </div>
        </>
      ),
    },
    {
      key: "owner",
      header: "Pemilik",
      cell: (doc) => (
        <>
          <div>{doc.ownerName}</div>
          <div className="text-xs text-muted-foreground">
            {doc.ownerEmployeeId || "NIP belum ada"}
          </div>
        </>
      ),
    },
    {
      key: "type",
      header: "Jenis",
      cell: (doc) => (
        <>
          <div>{doc.documentTypeName}</div>
          <div className="text-xs text-muted-foreground">{doc.archiveCategory}</div>
        </>
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
      cell: (doc) => formatDate(doc.uploadedAt),
    },
    {
      key: "expiryDate",
      header: "Kedaluwarsa",
      cell: (doc) => formatDate(doc.expiryDate),
    },
    {
      key: "action",
      header: "Aksi",
      headClassName: "text-right",
      cellClassName: "text-right",
      cell: (doc) => (
        <Link
          className={buttonVariants({ variant: "outline", size: "xs" })}
          href={buildDocumentDetailUrl(doc.id)}
        >
          Detail
        </Link>
      ),
    },
  ];

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
      Menampilkan {documents.length} dari {pagination.total} dokumen.
    </p>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dokumen Pegawai"
        description="Pantau seluruh dokumen pegawai, status verifikasi, dan metadata berkas."
        actions={[
          {
            label: "Jenis Dokumen",
            href: ROUTES.masterDataDocumentTypes,
            icon: Settings2,
          },
        ]}
      />

      <DocumentSearchFilter
        description="Cari dokumen berdasarkan nama file, pemilik, status, atau jumlah baris per halaman."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Nama file, pemilik..."
        primaryFilter={{
          value: statusFilter,
          onValueChange: (value) => setStatusFilter(value || "all"),
          placeholder: "Semua Status",
          ariaLabel: "Status dokumen",
          options: [
            { value: "all", label: "Semua Status" },
            ...DOCUMENT_STATUS_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            })),
          ],
        }}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        pageSizeOptions={PAGINATION.pageSizeOptions}
        onApply={handleFilter}
        onReset={handleResetFilter}
      />

      <ViewModeToggle value={viewMode} onValueChange={setViewMode} />

      {viewMode === "list" ? (
        <DataTableCard
          title="Daftar Dokumen"
          icon={<FileText className="size-5" />}
          description="Buka tinjauan berkas untuk membaca dokumen"
          tableMinWidthClassName="min-w-[920px]"
          table={
            <DataTable
              data={documents}
              columns={documentColumns}
              getRowKey={(doc) => doc.id}
              emptyMessage="Tidak ada dokumen yang sesuai filter."
            />
          }
          pagination={paginationControls}
          footerSummary={footerSummary}
        />
      ) : (
        <div className="space-y-4">
          {documents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex min-h-[220px] items-center justify-center text-center">
                <div className="max-w-md space-y-2">
                  <p className="text-base font-semibold text-foreground">
                    Tidak ada dokumen
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tidak ada dokumen yang sesuai filter.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {documents.map((doc) => {
                const config = statusConfig[doc.status] ?? statusConfig.PENDING;

                return (
                  <Card key={doc.id} className="border-muted-foreground/10 shadow-sm">
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
                            <p className="text-xs text-muted-foreground">Pemilik</p>
                            <p className="font-medium">{doc.ownerName}</p>
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
                              <p className="text-xs text-muted-foreground">Upload</p>
                              <p>{formatDate(doc.uploadedAt)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Kedaluwarsa</p>
                              <p>{formatDate(doc.expiryDate)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end border-t pt-3">
                          <Link
                            className={buttonVariants({ variant: "outline", size: "xs" })}
                            href={buildDocumentDetailUrl(doc.id)}
                          >
                            Detail
                          </Link>
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
              <div className="flex justify-end sm:ml-auto">{paginationControls}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
