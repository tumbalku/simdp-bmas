"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Archive, Download, Eye, FileText, RotateCcw, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { verifyCurrentPasswordAction } from "@/modules/auth";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { DataTableCard } from "@/components/tables/DataTableCard";
import { DocumentSearchFilter } from "@/components/tables/DocumentSearchFilter";
import { PaginationItems } from "@/components/tables/PaginationItems";
import { PageHeader } from "@/components/navigation/PageHeader";
import { RowsPerPageControl } from "@/components/tables/RowsPerPageControl";
import { ViewModeToggle } from "@/components/tables/ViewModeToggle";
import { CriticalActionVerificationDialog } from "@/components/verification/CriticalActionVerificationDialog";
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
import { DATE_FORMATS, DATE_LOCALE, PAGINATION, ROUTES, routeTo } from "@/constants";
import {
  ARCHIVE_CATEGORY_OPTIONS,
  DOCUMENT_STATUS_OPTIONS,
  DOCUMENT_STATUS_VARIANTS,
  type DocumentTypeOption,
} from "@/modules/document";
import {
  permanentDeleteDocumentAction,
  restoreDocumentAction,
  adminSoftDeleteDocumentAction,
} from "@/modules/document";

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

type CriticalDocumentAction = "archive" | "permanent-delete" | "restore";

type CriticalActionTarget = {
  doc: DocumentRecord;
  action: CriticalDocumentAction;
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
  archiveView: "active" | "archived";
  documentTypes: DocumentTypeOption[];
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

export function MasterDataDocumentsView({ documents, pagination, archiveView, documentTypes }: MasterDataDocumentsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(null);
  const [isCriticalActionDialogOpen, setIsCriticalActionDialogOpen] = useState(false);
  const [criticalActionTarget, setCriticalActionTarget] = useState<CriticalActionTarget | null>(null);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [documentTypeId, setDocumentTypeId] = useState(() => searchParams.get("documentTypeId") ?? "");
  const [archiveCategory, setArchiveCategory] = useState(() => searchParams.get("archiveCategory") ?? "");
  const [rowsPerPage, setRowsPerPage] = useState(() =>
    String(pagination.limit || PAGINATION.defaultPageSize),
  );
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    searchParams.get("view") === "grid" ? "grid" : "list",
  );
  const isArchiveView = archiveView === "archived";
  const isActionPending = pendingDocumentId !== null;

  const openCriticalActionDialog = (target: CriticalActionTarget) => {
    setCriticalActionTarget(target);
    setIsCriticalActionDialogOpen(true);
  };

  const handleCriticalActionDialogOpenChange = (open: boolean) => {
    setIsCriticalActionDialogOpen(open);
  };

  const buildPageUrl = (page: number, limit = rowsPerPage, nextViewMode = viewMode) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit);
    if (isArchiveView) params.set("archiveView", "archived");
    if (search.trim()) params.set("search", search.trim());
    if (documentTypeId) params.set("documentTypeId", documentTypeId);
    if (archiveCategory) params.set("archiveCategory", archiveCategory);
    if (nextViewMode === "grid") params.set("view", nextViewMode);
    return `${ROUTES.masterDataDocuments}?${params.toString()}`;
  };

  const buildArchiveViewUrl = (nextArchiveView: "active" | "archived") => {
    const params = new URLSearchParams();
    params.set("page", String(PAGINATION.defaultPage));
    params.set("limit", rowsPerPage);
    if (nextArchiveView === "archived") params.set("archiveView", "archived");
    if (search.trim()) params.set("search", search.trim());
    if (documentTypeId) params.set("documentTypeId", documentTypeId);
    if (archiveCategory) params.set("archiveCategory", archiveCategory);
    if (viewMode === "grid") params.set("view", "grid");
    return `${ROUTES.masterDataDocuments}?${params.toString()}`;
  };

  const buildExportPdfUrl = () => {
    const params = new URLSearchParams();
    if (isArchiveView) params.set("archiveView", "archived");
    if (search.trim()) params.set("search", search.trim());
    if (documentTypeId) params.set("documentTypeId", documentTypeId);
    if (archiveCategory) params.set("archiveCategory", archiveCategory);
    const query = params.toString();

    return `/api/v1/documents/export-pdf${query ? `?${query}` : ""}`;
  };

  const handleDocumentTypeChange = (value: string | null) => {
    setDocumentTypeId(!value || value === "all" ? "" : value);
  };

  const handleArchiveCategoryChange = (value: string | null) => {
    setArchiveCategory(!value || value === "all" ? "" : value);
  };

  const handleViewModeChange = (nextViewMode: ViewMode) => {
    setViewMode(nextViewMode);
    window.history.replaceState(null, "", buildPageUrl(pagination.page, rowsPerPage, nextViewMode));
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
    router.push(buildPageUrl(PAGINATION.defaultPage));
  };

  const handleRowsPerPageChange = (value: string | null) => {
    const nextLimit = value ?? rowsPerPage;
    setRowsPerPage(nextLimit);
    router.push(buildPageUrl(PAGINATION.defaultPage, nextLimit));
  };

  const handleResetFilter = () => {
    const defaultLimit = String(PAGINATION.defaultPageSize);
    setSearch("");
    setDocumentTypeId("");
    setArchiveCategory("");
    setRowsPerPage(defaultLimit);
    const params = new URLSearchParams();
    params.set("page", String(PAGINATION.defaultPage));
    params.set("limit", defaultLimit);
    if (isArchiveView) params.set("archiveView", "archived");
    router.push(`${ROUTES.masterDataDocuments}?${params.toString()}`);
  };

  const handleArchiveAction = async (doc: DocumentRecord) => {
    setPendingDocumentId(doc.id);
    try {
      const result = isArchiveView
        ? await restoreDocumentAction(doc.id)
        : await adminSoftDeleteDocumentAction(doc.id);

      if (result.ok) {
        toast.success(
          isArchiveView
            ? `Dokumen "${doc.title}" berhasil dipulihkan.`
            : `Dokumen "${doc.title}" berhasil dihapus.`,
        );
        setIsCriticalActionDialogOpen(false);
        window.setTimeout(() => {
          router.refresh();
        }, 100);
        return result;
      }

      toast.error(result.error.message);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Aksi dokumen gagal dijalankan.";
      toast.error(message);
      return { ok: false as const, error: { message } };
    } finally {
      setPendingDocumentId(null);
    }
  };

  const handlePermanentDeleteAction = async (doc: DocumentRecord) => {
    setPendingDocumentId(doc.id);
    try {
      const result = await permanentDeleteDocumentAction(doc.id);

      if (result.ok) {
        toast.success(`Dokumen "${doc.title}" berhasil dihapus permanen.`);
        setIsCriticalActionDialogOpen(false);
        window.setTimeout(() => {
          router.refresh();
        }, 100);
        return result;
      }

      toast.error(result.error.message);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Aksi hapus permanen gagal dijalankan.";
      toast.error(message);
      return { ok: false as const, error: { message } };
    } finally {
      setPendingDocumentId(null);
    }
  };

  const buildCriticalActionDialogProps = (target: CriticalActionTarget) => {
    if (target.action === "permanent-delete") {
      return {
        title: "Verifikasi hapus permanen dokumen",
        description: "Tindakan ini membutuhkan verifikasi berlapis sebelum file arsip dihapus permanen.",
        actionLabel: "Hapus Permanen",
        tone: "destructive" as const,
        icon: <Trash2 className="size-4" />,
        targetLabel: "file arsip",
        targetValue: target.doc.fileName,
        confirmationPhrase: target.doc.fileName,
        impacts: [
          "Metadata dokumen akan dihapus permanen dari database.",
          "File fisik di storage ikut dihapus dan tidak bisa dipulihkan dari sistem.",
          "Notifikasi terkait dokumen ini akan dibersihkan.",
        ],
        onConfirm: () => handlePermanentDeleteAction(target.doc),
      };
    }

    if (target.action === "restore") {
      return {
        title: "Verifikasi pulihkan dokumen",
        description: "Tindakan ini membutuhkan verifikasi sebelum dokumen arsip dikembalikan ke daftar aktif.",
        actionLabel: "Pulihkan Dokumen",
        tone: "success" as const,
        icon: <RotateCcw className="size-4" />,
        targetLabel: "file arsip",
        targetValue: target.doc.fileName,
        confirmationPhrase: target.doc.fileName,
        impacts: [
          "Dokumen akan kembali muncul di daftar aktif.",
          "Metadata arsip dipulihkan tanpa mengubah file fisik di storage.",
          "Aktivitas pemulihan akan dicatat di audit log.",
        ],
        onConfirm: () => handleArchiveAction(target.doc),
      };
    }

    return {
      title: "Verifikasi hapus dokumen aktif",
      description: "Tindakan ini membutuhkan verifikasi sebelum dokumen dihapus.",
      actionLabel: "Hapus",
      tone: "destructive" as const,
      icon: <Trash2 className="size-4" />,
      targetLabel: "dokumen aktif",
      targetValue: target.doc.fileName,
      confirmationPhrase: target.doc.fileName,
      impacts: [
        "Dokumen akan terhapus.",
        "Harus menghubungi ADMIN jika tidak sengaja menghapus dokumen.",
        "Aktivitas penghapusan akan dicatat di audit.",
      ],
      onConfirm: () => handleArchiveAction(target.doc),
    };
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
          onClick={() => openCriticalActionDialog({ doc, action: "permanent-delete" })}
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
      headClassName: "w-[260px] text-right",
      cellClassName: "text-right",
      cell: (doc) => renderDocumentActions(doc),
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
      Menampilkan {documents.length} dari {pagination.total} dokumen {isArchiveView ? "arsip" : "aktif"}.
    </p>
  );

  const criticalActionDialogProps = criticalActionTarget
    ? buildCriticalActionDialogProps(criticalActionTarget)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dokumen Pegawai"
        description="Pantau seluruh dokumen pegawai, status verifikasi, dan metadata berkas."
        actions={[
          {
            label: "Download PDF",
            href: buildExportPdfUrl(),
            icon: Download,
            prefetch: false,
            variant: "outline",
          },
          {
            label: "Jenis Dokumen",
            href: ROUTES.masterDataDocumentTypes,
            icon: Settings2,
          },
        ]}
      />

      <DocumentSearchFilter
        description="Cari berdasarkan nama pegawai, nama file, atau jenis dokumen."
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
        onApply={handleFilter}
        onReset={handleResetFilter}
      />

      <ViewModeToggle
        value={viewMode}
        onValueChange={handleViewModeChange}
        leading={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="inline-flex w-full rounded-md border border-muted-foreground/10 bg-card p-1 shadow-sm sm:w-auto">
              <Link
                className={buttonVariants({
                  variant: !isArchiveView ? "default" : "ghost",
                  size: "sm",
                  className: "flex-1 gap-2 sm:flex-none",
                })}
                href={buildArchiveViewUrl("active")}
              >
                <FileText className="size-4" />
                Aktif
              </Link>
              <Link
                className={buttonVariants({
                  variant: isArchiveView ? "default" : "ghost",
                  size: "sm",
                  className: "flex-1 gap-2 sm:flex-none",
                })}
                href={buildArchiveViewUrl("archived")}
              >
                <Archive className="size-4" />
                Arsip
              </Link>
            </div>
            {viewMode === "grid" ? (
              <RowsPerPageControl
                value={rowsPerPage}
                onValueChange={handleRowsPerPageChange}
                options={PAGINATION.pageSizeOptions}
              />
            ) : null}
          </div>
        }
      />

      {viewMode === "list" ? (
        <DataTableCard
          title="Daftar Dokumen"
          icon={<FileText className="size-5" />}
          description={`Total ${pagination.total} dokumen ${isArchiveView ? "arsip" : "aktif"} - Halaman ${pagination.page} dari ${pagination.totalPages || 1}`}
          rowsPerPageControl={{
            value: rowsPerPage,
            onValueChange: handleRowsPerPageChange,
            options: PAGINATION.pageSizeOptions,
            label: "Tampilkan",
            suffix: "row",
          }}
          tableMinWidthClassName="min-w-[980px]"
          table={
            <DataTable
              data={documents}
              columns={documentColumns}
              getRowKey={(doc) => doc.id}
              emptyMessage={isArchiveView ? "Tidak ada dokumen arsip yang sesuai filter." : "Tidak ada dokumen aktif yang sesuai filter."}
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
              <div className="flex justify-end sm:ml-auto">{paginationControls}</div>
            )}
          </div>
        </div>
      )}

      <CriticalActionVerificationDialog
        open={isCriticalActionDialogOpen}
        onOpenChange={handleCriticalActionDialogOpenChange}
        isPending={isActionPending}
        onVerifyPassword={(password) => verifyCurrentPasswordAction({ password })}
        title={criticalActionDialogProps?.title ?? ""}
        description={criticalActionDialogProps?.description ?? ""}
        actionLabel={criticalActionDialogProps?.actionLabel ?? ""}
        targetLabel={criticalActionDialogProps?.targetLabel ?? ""}
        targetValue={criticalActionDialogProps?.targetValue ?? ""}
        confirmationPhrase={criticalActionDialogProps?.confirmationPhrase ?? ""}
        impacts={criticalActionDialogProps?.impacts}
        tone={criticalActionDialogProps?.tone}
        icon={criticalActionDialogProps?.icon}
        onConfirm={criticalActionDialogProps?.onConfirm ?? (() => {})}
      />
    </div>
  );
}
