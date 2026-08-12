"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  Download,
  Eye,
  FileText,
  RotateCcw,
  Settings2,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { verifyCurrentPasswordAction } from "@/modules/auth";
import { downloadMasterDataDocumentsPdf } from "../api";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

type CriticalDocumentAction =
  "archive" | "permanent-delete" | "restore" | "bulk-delete" | "bulk-restore";

type CriticalActionTarget = {
  doc?: DocumentRecord;
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
  sortBy?: string;
  sortOrder?: "asc" | "desc";
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

export function MasterDataDocumentsView({
  documents,
  pagination,
  archiveView,
  documentTypes,
  sortBy,
  sortOrder,
}: MasterDataDocumentsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [bulkSecretKey, setBulkSecretKey] = useState("");
  const [isBulkPending, setIsBulkPending] = useState(false);

  const generateRandomSecretKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = "";
    for (let i = 0; i < 12; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const handleBulkConfirmDelete = async () => {
    if (selectedDocIds.length === 0) return;
    setIsBulkPending(true);
    try {
      const results = await Promise.all(
        selectedDocIds.map((id) => permanentDeleteDocumentAction(id)),
      );
      const failed = results.filter((res) => !res.ok);
      if (failed.length > 0) {
        toast.error(`${failed.length} dokumen gagal dihapus permanen.`);
      } else {
        toast.success(
          `${selectedDocIds.length} dokumen berhasil dihapus permanen.`,
        );
      }
      setSelectedDocIds([]);
      router.refresh();
    } catch (err) {
      toast.error("Gagal menjalankan hapus massal.");
      console.error("Bulk delete error:", err);
    } finally {
      setIsBulkPending(false);
    }
  };

  const handleBulkConfirmRestore = async () => {
    if (selectedDocIds.length === 0) return;
    setIsBulkPending(true);
    try {
      const results = await Promise.all(
        selectedDocIds.map((id) => restoreDocumentAction(id)),
      );
      const failed = results.filter((res) => !res.ok);
      if (failed.length > 0) {
        toast.error(`${failed.length} dokumen gagal dipulihkan.`);
      } else {
        toast.success(`${selectedDocIds.length} dokumen berhasil dipulihkan.`);
      }
      setSelectedDocIds([]);
      router.refresh();
    } catch (err) {
      toast.error("Gagal menjalankan pemulihan massal.");
      console.error("Bulk restore error:", err);
    } finally {
      setIsBulkPending(false);
    }
  };
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(
    null,
  );
  const [isCriticalActionDialogOpen, setIsCriticalActionDialogOpen] =
    useState(false);
  const [criticalActionTarget, setCriticalActionTarget] =
    useState<CriticalActionTarget | null>(null);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [documentTypeId, setDocumentTypeId] = useState(
    () => searchParams.get("documentTypeId") ?? "",
  );
  const [archiveCategory, setArchiveCategory] = useState(
    () => searchParams.get("archiveCategory") ?? "",
  );
  const [rowsPerPage, setRowsPerPage] = useState(() =>
    String(pagination.limit || PAGINATION.defaultPageSize),
  );
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    searchParams.get("view") === "grid" ? "grid" : "list",
  );
  const isArchiveView = archiveView === "archived";
  const isActionPending = pendingDocumentId !== null;
  const [isExporting, setIsExporting] = useState(false);

  // Reset selection when archive view changes
  useEffect(() => {
    setSelectedDocIds([]);
  }, [isArchiveView]);

  const handleDownloadPdf = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isExporting) return;

    setIsExporting(true);
    const toastId = toast.loading(
      "Memproses unduhan PDF laporan dokumen pegawai...",
    );

    try {
      const { blob, filename } =
        await downloadMasterDataDocumentsPdf(buildExportPdfUrl());

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("PDF laporan dokumen pegawai berhasil diunduh.", {
        id: toastId,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Gagal terhubung ke server untuk mengunduh PDF.";
      toast.error(errorMessage, {
        id: toastId,
      });
      console.error("PDF download error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenBulkDelete = () => {
    setBulkSecretKey(generateRandomSecretKey());
    setCriticalActionTarget({ action: "bulk-delete" });
    setIsCriticalActionDialogOpen(true);
  };

  const handleOpenBulkRestore = () => {
    setBulkSecretKey(generateRandomSecretKey());
    setCriticalActionTarget({ action: "bulk-restore" });
    setIsCriticalActionDialogOpen(true);
  };

  const renderTableActionsDropdown = () => (
    <div className="flex items-center gap-2">
      {isArchiveView && selectedDocIds.length > 0 && (
        <>
          <Button
            variant="destructive"
            size="sm"
            className="h-8 text-xs gap-1.5"
            disabled={isBulkPending}
            onClick={handleOpenBulkDelete}
          >
            <Trash2 className="size-3.5" />
            Hapus Semua
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 border-success/30 text-success hover:bg-success/10 hover:text-success"
            disabled={isBulkPending}
            onClick={handleOpenBulkRestore}
          >
            <RotateCcw className="size-3.5" />
            Pulihkan Semua
          </Button>
        </>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={isExporting}
            >
              <MoreVertical className="size-4" />
              <span className="sr-only">Menu tabel</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-48 mt-1 rounded-lg">
          <DropdownMenuItem onClick={handleDownloadPdf}>
            <Download className="size-4 mr-2" />
            Download PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const openCriticalActionDialog = (target: CriticalActionTarget) => {
    setCriticalActionTarget(target);
    setIsCriticalActionDialogOpen(true);
  };

  const handleCriticalActionDialogOpenChange = (open: boolean) => {
    setIsCriticalActionDialogOpen(open);
    if (!open) {
      window.setTimeout(() => {
        setCriticalActionTarget(null);
      }, 200);
    }
  };

  const buildPageUrl = (
    page: number,
    limit = rowsPerPage,
    nextViewMode = viewMode,
  ) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit);
    if (isArchiveView) params.set("archiveView", "archived");
    if (search.trim()) params.set("search", search.trim());
    if (documentTypeId) params.set("documentTypeId", documentTypeId);
    if (archiveCategory) params.set("archiveCategory", archiveCategory);
    if (nextViewMode === "grid") params.set("view", nextViewMode);
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);
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
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);
    return `${ROUTES.masterDataDocuments}?${params.toString()}`;
  };

  const handleSortChange = (
    nextSortBy: string,
    nextSortOrder: "asc" | "desc",
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", nextSortBy);
    params.set("sortOrder", nextSortOrder);
    params.set("page", "1");
    router.push(`${ROUTES.masterDataDocuments}?${params.toString()}`);
  };

  const buildExportPdfUrl = () => {
    const params = new URLSearchParams();
    if (isArchiveView) params.set("archiveView", "archived");
    if (search.trim()) params.set("search", search.trim());
    if (documentTypeId) params.set("documentTypeId", documentTypeId);
    if (archiveCategory) params.set("archiveCategory", archiveCategory);
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);
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
    window.history.replaceState(
      null,
      "",
      buildPageUrl(pagination.page, rowsPerPage, nextViewMode),
    );
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
          setCriticalActionTarget(null);
          router.refresh();
        }, 200);
        return result;
      }

      toast.error(result.error.message);
      return result;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Aksi dokumen gagal dijalankan.";
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
          setCriticalActionTarget(null);
          router.refresh();
        }, 200);
        return result;
      }

      toast.error(result.error.message);
      return result;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Aksi hapus permanen gagal dijalankan.";
      toast.error(message);
      return { ok: false as const, error: { message } };
    } finally {
      setPendingDocumentId(null);
    }
  };

  const buildCriticalActionDialogProps = (target: CriticalActionTarget) => {
    if (target.action === "bulk-delete") {
      return {
        title: "Verifikasi hapus massal dokumen",
        description: `Tindakan ini membutuhkan verifikasi sebelum ${selectedDocIds.length} file arsip dihapus permanen.`,
        actionLabel: "Hapus Semua",
        tone: "destructive" as const,
        icon: <Trash2 className="size-4" />,
        targetLabel: "file terpilih",
        targetValue: `${selectedDocIds.length} dokumen`,
        confirmationPhrase: bulkSecretKey,
        allowCopyPhrase: false,
        impacts: [
          `Metadata dari ${selectedDocIds.length} dokumen terpilih akan dihapus permanen dari database.`,
          "File fisik di storage ikut dihapus dan tidak bisa dipulihkan dari sistem.",
          "Notifikasi terkait dokumen-dokumen ini akan dibersihkan.",
        ],
        onConfirm: handleBulkConfirmDelete,
      };
    }

    if (target.action === "bulk-restore") {
      return {
        title: "Verifikasi pulihkan massal dokumen",
        description: `Tindakan ini membutuhkan verifikasi sebelum ${selectedDocIds.length} dokumen arsip dikembalikan ke daftar aktif.`,
        actionLabel: "Pulihkan Semua",
        tone: "success" as const,
        icon: <RotateCcw className="size-4" />,
        targetLabel: "file terpilih",
        targetValue: `${selectedDocIds.length} dokumen`,
        confirmationPhrase: bulkSecretKey,
        allowCopyPhrase: false,
        impacts: [
          `Sebanyak ${selectedDocIds.length} dokumen terpilih akan kembali muncul di daftar aktif.`,
          "Metadata arsip dipulihkan tanpa mengubah file fisik di storage.",
          "Aktivitas pemulihan massal akan dicatat di audit log.",
        ],
        onConfirm: handleBulkConfirmRestore,
      };
    }

    if (target.action === "permanent-delete") {
      return {
        title: "Verifikasi hapus permanen dokumen",
        description:
          "Tindakan ini membutuhkan verifikasi berlapis sebelum file arsip dihapus permanen.",
        actionLabel: "Hapus Permanen",
        tone: "destructive" as const,
        icon: <Trash2 className="size-4" />,
        targetLabel: "file arsip",
        targetValue: target.doc?.fileName ?? "",
        confirmationPhrase: target.doc?.fileName ?? "",
        allowCopyPhrase: true,
        impacts: [
          "Metadata dokumen akan dihapus permanen dari database.",
          "File fisik di storage ikut dihapus dan tidak bisa dipulihkan dari sistem.",
          "Notifikasi terkait dokumen ini akan dibersihkan.",
        ],
        onConfirm: () => {
          if (!target.doc) return { ok: false };
          return handlePermanentDeleteAction(target.doc);
        },
      };
    }

    if (target.action === "restore") {
      return {
        title: "Verifikasi pulihkan dokumen",
        description:
          "Tindakan ini membutuhkan verifikasi sebelum dokumen arsip dikembalikan ke daftar aktif.",
        actionLabel: "Pulihkan Dokumen",
        tone: "success" as const,
        icon: <RotateCcw className="size-4" />,
        targetLabel: "file arsip",
        targetValue: target.doc?.fileName ?? "",
        confirmationPhrase: target.doc?.fileName ?? "",
        allowCopyPhrase: true,
        impacts: [
          "Dokumen akan kembali muncul di daftar aktif.",
          "Metadata arsip dipulihkan tanpa mengubah file fisik di storage.",
          "Aktivitas pemulihan akan dicatat di audit log.",
        ],
        onConfirm: () => {
          if (!target.doc) return { ok: false };
          return handleArchiveAction(target.doc);
        },
      };
    }

    return {
      title: "Verifikasi hapus dokumen aktif",
      description:
        "Tindakan ini membutuhkan verifikasi sebelum dokumen dihapus.",
      actionLabel: "Hapus",
      tone: "destructive" as const,
      icon: <Trash2 className="size-4" />,
      targetLabel: "dokumen aktif",
      targetValue: target.doc?.fileName ?? "",
      confirmationPhrase: target.doc?.fileName ?? "",
      allowCopyPhrase: true,
      impacts: [
        "Dokumen akan terhapus.",
        "Harus menghubungi ADMIN jika tidak sengaja menghapus dokumen.",
        "Aktivitas penghapusan akan dicatat di audit.",
      ],
      onConfirm: () => {
        if (!target.doc) return { ok: false };
        return handleArchiveAction(target.doc);
      },
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
      sortable: true,
      sortKey: "name",
      cell: (doc) => (
        <>
          <div className="truncate max-w-[200px]" title={doc.ownerName}>
            {doc.ownerName}
          </div>
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
          <div className="text-xs text-muted-foreground">
            {doc.archiveCategory}
          </div>
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
      sortable: true,
      sortKey: "uploadedAt",
      cell: (doc) => formatDate(doc.uploadedAt),
    },
    {
      key: "expiryDate",
      header: "Kedaluwarsa",
      sortable: true,
      sortKey: "expiryDate",
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
      Menampilkan {documents.length} dari {pagination.total} dokumen{" "}
      {isArchiveView ? "arsip" : "aktif"}.
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
              <div className="flex items-center gap-2">
                <RowsPerPageControl
                  value={rowsPerPage}
                  onValueChange={handleRowsPerPageChange}
                  options={PAGINATION.pageSizeOptions}
                />
                {renderTableActionsDropdown()}
              </div>
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
          extraActions={renderTableActionsDropdown()}
          tableMinWidthClassName="min-w-[980px]"
          table={
            <DataTable
              data={documents}
              columns={documentColumns}
              getRowKey={(doc) => doc.id}
              selectable={isArchiveView}
              selectedIds={selectedDocIds}
              onSelectionChange={setSelectedDocIds}
              currentSortBy={sortBy}
              currentSortOrder={sortOrder}
              onSortChange={handleSortChange}
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
                  <Card
                    key={doc.id}
                    className="border-muted-foreground/10 shadow-sm"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="truncate font-medium">
                              {doc.title}
                            </div>
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
                            <p className="font-medium truncate" title={doc.ownerName}>
                              {doc.ownerName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {doc.ownerEmployeeId || "NIP belum ada"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Jenis
                            </p>
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
      )}

      <CriticalActionVerificationDialog
        open={isCriticalActionDialogOpen}
        onOpenChange={handleCriticalActionDialogOpenChange}
        isPending={isActionPending || isBulkPending}
        onVerifyPassword={(password) =>
          verifyCurrentPasswordAction({ password })
        }
        title={criticalActionDialogProps?.title ?? ""}
        description={criticalActionDialogProps?.description ?? ""}
        actionLabel={criticalActionDialogProps?.actionLabel ?? ""}
        targetLabel={criticalActionDialogProps?.targetLabel ?? ""}
        targetValue={criticalActionDialogProps?.targetValue ?? ""}
        confirmationPhrase={criticalActionDialogProps?.confirmationPhrase ?? ""}
        allowCopyPhrase={criticalActionDialogProps?.allowCopyPhrase}
        impacts={criticalActionDialogProps?.impacts}
        tone={criticalActionDialogProps?.tone}
        icon={criticalActionDialogProps?.icon}
        onConfirm={criticalActionDialogProps?.onConfirm ?? (() => {})}
      />
    </div>
  );
}
