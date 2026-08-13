"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  CheckCircle2,
  FileText,
} from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { DataTableCard } from "@/components/tables/DataTableCard";
import { DocumentSearchFilter } from "@/components/tables/DocumentSearchFilter";
import { PaginationItems } from "@/components/tables/PaginationItems";
import { PageHeader } from "@/components/navigation/PageHeader";
import { RowsPerPageControl } from "@/components/tables/RowsPerPageControl";
import { ViewModeToggle, type ViewMode } from "@/components/tables/ViewModeToggle";
import { type PaginationMeta } from "@/types/pagination";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { PAGINATION, ROUTES } from "@/constants";

import { ARCHIVE_CATEGORY_OPTIONS } from "@/modules/document";
import {
  formatEmployeeIdentifier,
  formatVerificationQueueDate,
} from "./VerificationQueueFormatters";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type QueueItem = {
  id: string;
  owner: {
    id: string;
    name: string;
    employeeId: string | null;
    nik: string | null;
    workplace: string | null;
  };
  documentType: {
    id: string;
    name: string;
    archiveCategory: string;
  };
  title: string | null;
  documentNumber: string | null;
  uploadedAt: string;
};

type DocumentTypeOption = {
  id: string;
  code: string;
  name: string;
};

type VerificationQueueViewProps = {
  initialData: QueueItem[];
  /** The nested pagination object from the server action meta */
  initialPagination: PaginationMeta;
  documentTypes: DocumentTypeOption[];
};

/* -------------------------------------------------------------------------- */
/*  Helper                                                                    */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function VerificationQueueView({
  initialData,
  initialPagination,
  documentTypes,
}: VerificationQueueViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  /* data */
  const [items, setItems] = useState<QueueItem[]>(initialData);
  const [pagination, setPagination] = useState<PaginationMeta>(
    initialPagination
  );

  /* filter state */
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [documentTypeId, setDocumentTypeId] = useState(
    () => searchParams.get("documentTypeId") ?? ""
  );
  const [archiveCategory, setArchiveCategory] = useState(
    () => searchParams.get("archiveCategory") ?? ""
  );
  const [page, setPage] = useState(initialPagination.page);
  const [rowsPerPage, setRowsPerPage] = useState(() =>
    searchParams.get("limit") ?? String(initialPagination.pageSize)
  );
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    searchParams.get("view") === "grid" ? "grid" : "list"
  );

  /* error */
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setItems(initialData);
    setPagination(initialPagination);
    setPage(initialPagination.page);
    setSearch(searchParams.get("search") ?? "");
    setDocumentTypeId(searchParams.get("documentTypeId") ?? "");
    setArchiveCategory(searchParams.get("archiveCategory") ?? "");
    setRowsPerPage(searchParams.get("limit") ?? String(initialPagination.pageSize));
    setIsLoading(false);
  }, [initialData, initialPagination, searchParams]);

  /* ------------------------------------------------------------------------ */
  /*  Filter handlers                                                         */
  /* ------------------------------------------------------------------------ */

  const buildPageUrl = useCallback(
    (
      nextPage: number,
      limit = rowsPerPage,
      nextSearch = search,
      nextDocumentTypeId = documentTypeId,
      nextArchiveCategory = archiveCategory,
      nextViewMode = viewMode
    ) => {
      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("limit", limit);
      if (nextSearch.trim()) params.set("search", nextSearch.trim());
      if (nextDocumentTypeId) params.set("documentTypeId", nextDocumentTypeId);
      if (nextArchiveCategory) params.set("archiveCategory", nextArchiveCategory);
      if (nextViewMode === "grid") params.set("view", nextViewMode);

      return `${ROUTES.verification}?${params.toString()}`;
    },
    [archiveCategory, documentTypeId, rowsPerPage, search, viewMode]
  );

  const applyFilters = useCallback(
    ({
      nextPage = PAGINATION.defaultPage,
      nextSearch = search,
      nextDocumentTypeId = documentTypeId,
      nextArchiveCategory = archiveCategory,
      nextRowsPerPage = rowsPerPage,
      nextViewMode = viewMode,
    }: {
      nextPage?: number;
      nextSearch?: string;
      nextDocumentTypeId?: string;
      nextArchiveCategory?: string;
      nextRowsPerPage?: string;
      nextViewMode?: ViewMode;
    } = {}) => {
      setPage(nextPage);
      setSearch(nextSearch);
      setDocumentTypeId(nextDocumentTypeId);
      setArchiveCategory(nextArchiveCategory);
      setRowsPerPage(nextRowsPerPage);
      setViewMode(nextViewMode);
      setIsLoading(true);
      startTransition(() => {
        router.push(
          buildPageUrl(nextPage, nextRowsPerPage, nextSearch, nextDocumentTypeId, nextArchiveCategory, nextViewMode),
        );
      });
    },
    [archiveCategory, buildPageUrl, documentTypeId, router, rowsPerPage, search, startTransition, viewMode]
  );

  const handleViewModeChange = useCallback(
    (nextViewMode: ViewMode) => {
      setViewMode(nextViewMode);
      router.replace(buildPageUrl(page, rowsPerPage, search, documentTypeId, archiveCategory, nextViewMode), {
        scroll: false,
      });
    },
    [archiveCategory, buildPageUrl, documentTypeId, page, router, rowsPerPage, search]
  );

  const handleDocumentTypeChange = useCallback(
    (value: string | null) => {
      setDocumentTypeId(!value || value === "all" ? "" : value);
    },
    []
  );

  const handleArchiveCategoryChange = useCallback(
    (value: string | null) => {
      setArchiveCategory(!value || value === "all" ? "" : value);
    },
    []
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      applyFilters({ nextPage: newPage });
    },
    [applyFilters]
  );

  const handleRowsPerPageChange = useCallback(
    (value: string | null) => {
      applyFilters({
        nextPage: PAGINATION.defaultPage,
        nextRowsPerPage: value ?? String(PAGINATION.defaultPageSize),
      });
    },
    [applyFilters]
  );

  const handleApplyFilters = useCallback(() => {
    applyFilters();
  }, [applyFilters]);

  const handleResetFilters = useCallback(() => {
    applyFilters({
      nextPage: PAGINATION.defaultPage,
      nextSearch: "",
      nextDocumentTypeId: "",
      nextArchiveCategory: "",
      nextRowsPerPage: String(PAGINATION.defaultPageSize),
    });
  }, [applyFilters]);

  const handlePaginationClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, nextPage: number) => {
      event.preventDefault();
      handlePageChange(nextPage);
    },
    [handlePageChange]
  );

  const queueColumns: DataTableColumn<QueueItem>[] = [
    {
      key: "employee",
      header: "Pegawai",
      headClassName: "w-[200px]",
      cell: (item) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 font-medium">
            <span>{item.owner.name}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {formatEmployeeIdentifier(item.owner.employeeId, item.owner.nik)}
          </div>
          {item.owner.workplace && (
            <div className="text-xs text-muted-foreground">
              {item.owner.workplace}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "documentType",
      header: "Jenis Dokumen",
      cell: (item) => (
        <Badge variant="secondary" className="font-normal">
          {item.documentType.name}
        </Badge>
      ),
    },
    {
      key: "documentTitle",
      header: "Judul / No. Dokumen",
      headClassName: "hidden lg:table-cell",
      cellClassName: "hidden lg:table-cell",
      cell: (item) => (
        <div className="space-y-0.5">
          <div>{item.title || item.documentType.name}</div>
          {item.documentNumber && (
            <div className="text-xs text-muted-foreground">
              No: {item.documentNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "uploadedAt",
      header: "Diunggah",
      headClassName: "hidden sm:table-cell",
      cellClassName: "hidden whitespace-nowrap text-muted-foreground sm:table-cell",
      cell: (item) => formatVerificationQueueDate(item.uploadedAt),
    },
    {
      key: "action",
      header: "Aksi",
      headClassName: "text-right",
      cell: (item) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/verification/${item.id}`}
            className={buttonVariants({
              variant: "default",
              size: "xs",
            })}
          >
            <Search className="size-3" />
            Tinjau Berkas
          </Link>
        </div>
      ),
    },
  ];

  const paginationFooter =
    pagination.totalPages > 1 ? (
      <p className="text-xs text-muted-foreground">
        Menampilkan {items.length} dari {pagination.totalItems} dokumen.
      </p>
    ) : null;

  const paginationControls =
    pagination.totalPages > 1 ? (
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          {pagination.page > 1 && (
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => handlePaginationClick(event, pagination.page - 1)}
              />
            </PaginationItem>
          )}
          <PaginationItems
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageClick={handlePaginationClick}
          />
          {pagination.page < pagination.totalPages && (
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => handlePaginationClick(event, pagination.page + 1)}
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    ) : null;

  /* ------------------------------------------------------------------------ */
  /*  Render                                                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="space-y-6">
      {/* Page header */}
      <PageHeader
        title="Verifikasi Dokumen"
        description="Tinjau berkas pegawai yang masih berstatus menunggu pemeriksaan."
      />

      <DocumentSearchFilter
        description="Cari berdasarkan nama pegawai atau jenis dokumen."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari nama pegawai..."
        primaryFilter={{
          value: documentTypeId || "all",
          onValueChange: handleDocumentTypeChange,
          placeholder: "Semua jenis dokumen",
          ariaLabel: "Jenis dokumen",
          options: [
            { value: "all", label: "Semua jenis dokumen" },
            ...documentTypes.map((documentType) => ({
              value: documentType.id,
              label: documentType.name,
            })),
          ],
        }}
        secondaryFilter={{
          value: archiveCategory || "all",
          onValueChange: handleArchiveCategoryChange,
          placeholder: "Semua kategori arsip",
          ariaLabel: "Kategori arsip",
          options: [
            { value: "all", label: "Semua kategori arsip" },
            ...ARCHIVE_CATEGORY_OPTIONS,
          ],
        }}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      <ViewModeToggle
        value={viewMode}
        onValueChange={handleViewModeChange}
        leading={
          viewMode === "grid" ? (
            <RowsPerPageControl
              value={rowsPerPage}
              onValueChange={handleRowsPerPageChange}
              options={PAGINATION.pageSizeOptions}
            />
          ) : undefined
        }
      />

      {/* Error state */}
      {/* Content */}
      {isLoading || isPending ? (
        /* Loading skeleton */
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        /* Empty state */
        <Card className="border-dashed">
          <CardContent className="flex min-h-[280px] items-center justify-center text-center">
            <div className="max-w-md space-y-3">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10">
                {search || documentTypeId || archiveCategory ? (
                  <Search className="size-7 text-muted-foreground" />
                ) : (
                  <CheckCircle2 className="size-7 text-success" />
                )}
              </div>
              <p className="text-base font-semibold text-foreground">
                {search || documentTypeId || archiveCategory
                  ? "Tidak ada hasil"
                  : "Semua Selesai!"}
              </p>
              <p className="text-sm text-muted-foreground">
                {search || documentTypeId || archiveCategory
                  ? "Coba ubah kata kunci atau filter."
                  : "Tidak ada dokumen yang perlu diverifikasi saat ini. Anda telah menyelesaikan semua tugas Anda."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === "list" ? (
            <DataTableCard
              title="Daftar Tunggu Pemeriksaan"
              icon={<FileText className="size-5" />}
              description="Buka tinjauan berkas untuk membaca dokumen dan mengambil keputusan verifikasi."
              rowsPerPageControl={{
                value: rowsPerPage,
                onValueChange: handleRowsPerPageChange,
                options: PAGINATION.pageSizeOptions,
                label: "Tampilkan",
                suffix: "row",
              }}
              tableMinWidthClassName="min-w-[760px]"
              table={
                <DataTable
                  data={items}
                  columns={queueColumns}
                  getRowKey={(item) => item.id}
                  headerClassName="bg-muted/20"
                />
              }
              footerSummary={paginationFooter}
              pagination={paginationControls}
            />
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <Card key={item.id} className="border-muted-foreground/10 shadow-sm">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="truncate font-medium">{item.owner.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatEmployeeIdentifier(
                                item.owner.employeeId,
                                item.owner.nik
                              )}
                            </div>
                            {item.owner.workplace && (
                              <div className="truncate text-xs text-muted-foreground">
                                {item.owner.workplace}
                              </div>
                            )}
                          </div>
                          <Badge variant="secondary" className="shrink-0 font-normal">
                            {item.documentType.name}
                          </Badge>
                        </div>

                        <div className="space-y-1 text-sm">
                          <div className="font-medium">
                            {item.title || item.documentType.name}
                          </div>
                          {item.documentNumber && (
                            <div className="text-xs text-muted-foreground">
                              No: {item.documentNumber}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Diunggah {formatVerificationQueueDate(item.uploadedAt)}
                          </div>
                        </div>

                        <Separator />

                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Link
                            href={`/verification/${item.id}`}
                            className={buttonVariants({
                              variant: "default",
                              size: "xs",
                            })}
                          >
                            <Search className="size-3" />
                            Tinjau Berkas
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {paginationFooter}
                  <div className="flex justify-end sm:ml-auto">{paginationControls}</div>
                </div>
              )}
            </div>
          )}
        </>
      )}

    </div>
  );
}
