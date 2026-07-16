"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { DataTableCard } from "@/components/shared/DataTableCard";
import { DocumentSearchFilter } from "@/components/shared/DocumentSearchFilter";
import { PageHeader } from "@/components/shared/PageHeader";
import { PaginationItems } from "@/components/shared/PaginationItems";
import { RowsPerPageControl } from "@/components/shared/RowsPerPageControl";
import { ViewModeToggle } from "@/components/shared/ViewModeToggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
import { crudDocumentTypeAction } from "@/modules/document/actions";
import { routeTo } from "@/constants/routes";

type ViewMode = "grid" | "list";

type TargetSummary = {
  employmentStatuses: string[];
  employeeGroups: string[];
  employeePositions: string[];
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
    { label: "Jabatan", values: targetSummary.employeePositions },
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [categoryFilter, setCategoryFilter] = useState<string>(
    () => searchParams.get("archiveCategory") ?? "all",
  );
  const [rowsPerPage, setRowsPerPage] = useState(() =>
    String(pagination.limit || PAGINATION.defaultPageSize),
  );
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    searchParams.get("view") === "grid" ? "grid" : "list",
  );
  const [deleteTarget, setDeleteTarget] = useState<DocumentTypeItem | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const buildPageUrl = (page: number, limit = rowsPerPage, nextViewMode = viewMode) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit);
    if (search) params.set("search", search);
    if (categoryFilter !== "all") params.set("archiveCategory", categoryFilter);
    if (nextViewMode === "grid") params.set("view", nextViewMode);
    return `${ROUTES.masterDataDocumentTypes}?${params.toString()}`;
  };

  const handleViewModeChange = (nextViewMode: ViewMode) => {
    setViewMode(nextViewMode);
    window.history.replaceState(null, "", buildPageUrl(pagination.page, rowsPerPage, nextViewMode));
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

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;

    startDeleteTransition(async () => {
      const result = await crudDocumentTypeAction("DELETE", deleteTarget.id);

      if (!result.ok) {
        toast.error(result.error.message || "Gagal menghapus jenis dokumen.");
        return;
      }

      toast.success(`Jenis dokumen ${deleteTarget.name} berhasil dihapus.`);
      setDeleteTarget(null);
      router.refresh();
    });
  };

  const columns: DataTableColumn<DocumentTypeItem>[] = [
    {
      key: "code",
      header: "Kode",
      cell: (type) => <Badge variant="outline">{type.code}</Badge>,
    },
    {
      key: "name",
      header: "Nama",
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
      header: "Kategori",
      cell: (type) => formatArchiveCategory(type.archiveCategory),
    },
    {
      key: "formats",
      header: "Format",
      cell: (type) => renderCompactBadges(formatAllowedFormats(type.allowedFormats), "Belum diatur"),
    },
    {
      key: "maxSizeMb",
      header: "Ukuran",
      cell: (type) => formatMaxSize(type.maxSizeMb),
    },
    {
      key: "validation",
      header: "Validasi",
      cell: (type) => renderCompactBadges(getValidationRules(type), "Tanpa validasi tambahan"),
    },
    {
      key: "target",
      header: "Target",
      cell: (type) => renderTargetSummary(type.targetSummary),
    },
    {
      key: "mandatory",
      header: "Wajib",
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
      cell: (type) => (
        <div className="flex justify-end gap-1.5">
          <Button
            variant="outline"
            size="xs"
            title={`Edit ${type.name}`}
            aria-label={`Edit ${type.name}`}
            render={<Link href={routeTo.masterDataDocumentTypeEdit(type.id)} />}
            nativeButton={false}
          >
            <Pencil className="size-3" />
            <span className="hidden md:inline">Edit</span>
          </Button>
          <Button
            variant="destructive"
            size="xs"
            title={`Hapus ${type.name}`}
            aria-label={`Hapus ${type.name}`}
            onClick={() => setDeleteTarget(type)}
          >
            <Trash2 className="size-3" />
            <span className="hidden md:inline">Hapus</span>
          </Button>
        </div>
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
      Menampilkan {documentTypes.length} dari {pagination.total} jenis dokumen.
    </p>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Jenis Dokumen"
        description="Atur konfigurasi jenis dokumen, format berkas, validasi, dan target pegawai."
        backHref={ROUTES.masterDataDocuments}
        backLabel="Kembali ke dokumen"
        actions={[
          {
            label: "Tambah Jenis",
            href: ROUTES.masterDataDocumentTypeAdd,
            icon: Plus,
          },
        ]}
      />

      <DocumentSearchFilter
        description="Cari berdasarkan kode, nama, deskripsi, atau kategori arsip."
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
        onApply={handleFilter}
        onReset={handleResetFilter}
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

      {viewMode === "list" ? (
        <DataTableCard
          title="Daftar Jenis Dokumen"
          icon={<FileText className="size-5" />}
          description="Konfigurasi master jenis dokumen pegawai"
          rowsPerPageControl={{
            value: rowsPerPage,
            onValueChange: handleRowsPerPageChange,
            options: PAGINATION.pageSizeOptions,
            label: "Tampilkan",
            suffix: "row",
          }}
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

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Jenis Dokumen</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menghapus jenis dokumen{" "}
              <span className="font-medium text-foreground">
                &ldquo;{deleteTarget?.name}&rdquo;
              </span>
              . Data akan disembunyikan dari daftar aktif dan dapat memengaruhi pilihan upload dokumen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Ya, Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
