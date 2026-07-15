"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, Plus } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { DataTableCard } from "@/components/shared/DataTableCard";
import { DocumentSearchFilter } from "@/components/shared/DocumentSearchFilter";
import { PageHeader } from "@/components/shared/PageHeader";
import { PaginationItems } from "@/components/shared/PaginationItems";
import { ViewModeToggle } from "@/components/shared/ViewModeToggle";
import { Badge } from "@/components/ui/badge";

import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PAGINATION, ROUTES } from "@/constants";
import {
  ARCHIVE_CATEGORY_LABELS,
  ARCHIVE_CATEGORY_OPTIONS,
  type ArchiveCategory,
} from "@/modules/document/constants";

type ViewMode = "grid" | "list";

type TargetSummary = {
  employmentStatuses: string[];
  employeeGroups: string[];
  professionGroups: string[];
  employeeRanks: string[];
  workplaces: string[];
};

type DocumentTypeItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  archiveCategory: ArchiveCategory;
  isMandatory: boolean;
  allowMultiple: boolean;
  requiresExpiryDate: boolean;
  requiresIssueDate: boolean;
  requiresDocumentNumber: boolean;
  allowedFormats: string;
  maxSizeMb: number;
  targetSummary: TargetSummary;
};

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type DocumentTypesPageViewProps = {
  documentTypes: DocumentTypeItem[];
  pagination: PaginationMeta;
};

function formatArchiveCategory(category: ArchiveCategory) {
  return ARCHIVE_CATEGORY_LABELS[category] ?? category;
}

function formatMaxSize(size: number) {
  return `${size.toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`;
}

function formatAllowedFormats(value: string) {
  return value
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

function getValidationRules(type: DocumentTypeItem) {
  return [
    type.requiresExpiryDate ? "Kedaluwarsa" : null,
    type.requiresIssueDate ? "Tanggal terbit" : null,
    type.requiresDocumentNumber ? "Nomor surat" : null,
    type.allowMultiple ? "Multi berkas" : null,
  ].filter(Boolean) as string[];
}

function getTargetGroups(targetSummary: TargetSummary) {
  const groups = [
    { label: "Status", values: targetSummary.employmentStatuses },
    { label: "Jenis", values: targetSummary.employeeGroups },
    { label: "Profesi", values: targetSummary.professionGroups },
    { label: "Golongan", values: targetSummary.employeeRanks },
    { label: "Unit", values: targetSummary.workplaces },
  ];

  return groups.filter((group) => group.values.length > 0);
}

function renderCompactBadges(values: string[], emptyText: string) {
  if (values.length === 0) {
    return <span className="text-xs text-muted-foreground">{emptyText}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {values.slice(0, 3).map((value) => (
        <Badge key={value} variant="secondary" className="font-normal">
          {value}
        </Badge>
      ))}
      {values.length > 3 ? <Badge variant="outline">+{values.length - 3}</Badge> : null}
    </div>
  );
}

function renderTargetSummary(targetSummary: TargetSummary) {
  const groups = getTargetGroups(targetSummary);

  if (groups.length === 0) {
    return <span className="text-xs text-muted-foreground">Semua pegawai</span>;
  }

  return (
    <div className="space-y-1">
      {groups.slice(0, 2).map((group) => (
        <p key={group.label} className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{group.label}:</span> {group.values.slice(0, 2).join(", ")}
          {group.values.length > 2 ? ` +${group.values.length - 2}` : ""}
        </p>
      ))}
      {groups.length > 2 ? (
        <p className="text-xs text-muted-foreground">+{groups.length - 2} target lain</p>
      ) : null}
    </div>
  );
}

export function DocumentTypesPageView({ documentTypes, pagination }: DocumentTypesPageViewProps) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [categoryFilter, setCategoryFilter] = useState<string>(
    () => searchParams.get("archiveCategory") ?? "all",
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
    if (categoryFilter !== "all") params.set("archiveCategory", categoryFilter);
    return `${ROUTES.masterDataDocumentTypes}?${params.toString()}`;
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
    setCategoryFilter("all");
    setRowsPerPage(defaultLimit);
    window.location.href = `${ROUTES.masterDataDocumentTypes}?page=${PAGINATION.defaultPage}&limit=${defaultLimit}`;
  };

  const columns: DataTableColumn<DocumentTypeItem>[] = [
    {
      key: "code",
      header: "Kode Dokumen",
      cell: (type) => <Badge variant="outline">{type.code}</Badge>,
    },
    {
      key: "name",
      header: "Nama Jenis Dokumen",
      cell: (type) => (
        <>
          <div className="font-medium">{type.name}</div>
          {type.description ? (
            <div className="line-clamp-1 text-xs text-muted-foreground">{type.description}</div>
          ) : null}
        </>
      ),
    },
    {
      key: "archiveCategory",
      header: "Kategori Arsip",
      cell: (type) => formatArchiveCategory(type.archiveCategory),
    },
    {
      key: "formats",
      header: "Format Ekstensi",
      cell: (type) => renderCompactBadges(formatAllowedFormats(type.allowedFormats), "Belum diatur"),
    },
    {
      key: "maxSizeMb",
      header: "Maks Ukuran File",
      cell: (type) => formatMaxSize(type.maxSizeMb),
    },
    {
      key: "validation",
      header: "Validasi Tambahan",
      cell: (type) => renderCompactBadges(getValidationRules(type), "Tanpa validasi tambahan"),
    },
    {
      key: "target",
      header: "Target Pegawai",
      cell: (type) => renderTargetSummary(type.targetSummary),
    },
    {
      key: "mandatory",
      header: "Status Wajib",
      cell: (type) => (
        <Badge variant={type.isMandatory ? "default" : "secondary"}>
          {type.isMandatory ? "Wajib" : "Opsional"}
        </Badge>
      ),
    },
    {
      key: "action",
      header: "Aksi",
      headClassName: "text-right",
      cellClassName: "text-right",
      cell: () => <span className="text-xs text-muted-foreground">-</span>,
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
      Menampilkan {documentTypes.length} dari {pagination.total} jenis dokumen.
    </p>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Jenis Dokumen"
        description="Atur konfigurasi jenis dokumen, format berkas, validasi, dan target pegawai."
        actions={[
          {
            label: "Tambah Jenis",
            href: ROUTES.masterDataDocumentTypeAdd,
            icon: Plus,
          },
        ]}
      />

      <DocumentSearchFilter
        description="Cari berdasarkan kode, nama, deskripsi, kategori arsip, atau jumlah baris per halaman."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Kode atau nama jenis dokumen..."
        primaryFilter={{
          value: categoryFilter,
          onValueChange: (value) => setCategoryFilter(value || "all"),
          placeholder: "Semua Kategori",
          ariaLabel: "Kategori arsip",
          options: [
            { value: "all", label: "Semua Kategori" },
            ...ARCHIVE_CATEGORY_OPTIONS,
          ],
        }}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        pageSizeOptions={PAGINATION.pageSizeOptions}
        onApply={handleFilter}
        onReset={handleResetFilter}
      />

      <ViewModeToggle
        value={viewMode}
        onValueChange={setViewMode}
        description="Pilih tampilan kartu atau tabel untuk daftar jenis dokumen."
      />

      {viewMode === "list" ? (
        <DataTableCard
          title="Daftar Jenis Dokumen"
          icon={<FileText className="size-5" />}
          description="Konfigurasi master jenis dokumen pegawai"
          tableMinWidthClassName="min-w-[1180px]"
          table={
            <DataTable
              data={documentTypes}
              columns={columns}
              getRowKey={(type) => type.id}
              emptyMessage="Tidak ada jenis dokumen yang sesuai filter."
            />
          }
          pagination={paginationControls}
          footerSummary={footerSummary}
        />
      ) : (
        <div className="space-y-4">
          {documentTypes.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex min-h-[220px] items-center justify-center text-center">
                <div className="max-w-md space-y-2">
                  <p className="text-base font-semibold text-foreground">Tidak ada jenis dokumen</p>
                  <p className="text-sm text-muted-foreground">
                    Tidak ada konfigurasi jenis dokumen yang sesuai filter.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {documentTypes.map((type) => {
                const validations = getValidationRules(type);
                const formats = formatAllowedFormats(type.allowedFormats);

                return (
                  <Card key={type.id} className="border-muted-foreground/10 shadow-sm">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{type.code}</Badge>
                              <Badge variant={type.isMandatory ? "default" : "secondary"}>
                                {type.isMandatory ? "Wajib" : "Opsional"}
                              </Badge>
                            </div>
                            <p className="truncate font-medium">{type.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatArchiveCategory(type.archiveCategory)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Format & ukuran</p>
                            {renderCompactBadges(formats, "Belum diatur")}
                            <p className="mt-1 text-xs text-muted-foreground">
                              Maksimal {formatMaxSize(type.maxSizeMb)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Validasi Tambahan</p>
                            {renderCompactBadges(validations, "Tanpa validasi tambahan")}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Target Pegawai</p>
                            {renderTargetSummary(type.targetSummary)}
                          </div>
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
