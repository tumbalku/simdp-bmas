"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Archive, FileText, RotateCcw, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { verifyCurrentPasswordAction } from "@/modules/auth";
import { downloadMasterDataDocumentsPdf } from "../api";
import { DocumentFilterCard } from "@/components/tables/DocumentFilterCard";
import { PageHeader } from "@/components/navigation/PageHeader";
import { RowsPerPageControl } from "@/components/tables/RowsPerPageControl";
import { ViewModeToggle } from "@/components/tables/ViewModeToggle";
import { CriticalActionVerificationDialog } from "@/components/verification/CriticalActionVerificationDialog";
import { buttonVariants } from "@/components/ui/button";
import { PAGINATION, ROUTES } from "@/constants";
import { generateAlphanumericKey } from "@/utils/crypto";
import {
  ARCHIVE_CATEGORY_OPTIONS,
  type DocumentTypeOption,
  adminSoftDeleteDocumentAction,
  permanentDeleteDocumentAction,
  restoreDocumentAction,
} from "@/modules/document";
import { useDocumentsViewState } from "../hooks/useDocumentsViewState";
import { DocumentBulkActionsBar } from "./DocumentBulkActionsBar";
import { DocumentGridView } from "./DocumentGridView";
import {
  DocumentTableView,
  type CriticalActionTarget,
  type DocumentRecord,
} from "./DocumentTableView";
import { type PaginationMeta } from "@/types/pagination";

export type { DocumentRecord, CriticalActionTarget };

type MasterDataDocumentsViewProps = {
  documents: DocumentRecord[];
  pagination: PaginationMeta;
  archiveView: "active" | "archived";
  documentTypes: DocumentTypeOption[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

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

  const {
    selectedDocIds,
    setSelectedDocIds,
    search,
    setSearch,
    documentTypeId,
    archiveCategory,
    rowsPerPage,
    viewMode,
    isArchiveView,
    buildPageUrl,
    buildArchiveViewUrl,
    buildExportPdfUrl,
    handleSortChange,
    handleDocumentTypeChange,
    handleArchiveCategoryChange,
    handleViewModeChange,
    handleFilter,
    handleRowsPerPageChange,
    handleResetFilter,
  } = useDocumentsViewState({
    paginationLimit: pagination.pageSize,
    paginationPage: pagination.page,
    archiveView,
    sortBy,
    sortOrder,
  });

  const [bulkSecretKey, setBulkSecretKey] = useState("");
  const [isBulkPending, setIsBulkPending] = useState(false);
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(
    null,
  );
  const [isCriticalActionDialogOpen, setIsCriticalActionDialogOpen] =
    useState(false);
  const [criticalActionTarget, setCriticalActionTarget] =
    useState<CriticalActionTarget | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const isActionPending = pendingDocumentId !== null;

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
    setBulkSecretKey(generateAlphanumericKey(12));
    setCriticalActionTarget({ action: "bulk-delete" });
    setIsCriticalActionDialogOpen(true);
  };

  const handleOpenBulkRestore = () => {
    setBulkSecretKey(generateAlphanumericKey(12));
    setCriticalActionTarget({ action: "bulk-restore" });
    setIsCriticalActionDialogOpen(true);
  };

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

  const bulkActionsBarNode = (
    <DocumentBulkActionsBar
      isArchiveView={isArchiveView}
      selectedDocCount={selectedDocIds.length}
      isBulkPending={isBulkPending}
      isExporting={isExporting}
      onOpenBulkDelete={handleOpenBulkDelete}
      onOpenBulkRestore={handleOpenBulkRestore}
      onDownloadPdf={handleDownloadPdf}
    />
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

      <DocumentFilterCard
        description="Cari berdasarkan nama pegawai, nama file, atau jenis dokumen."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari nama pegawai..."
        documentTypeId={documentTypeId}
        onDocumentTypeChange={handleDocumentTypeChange}
        documentTypes={documentTypes}
        categoryFilter={archiveCategory}
        onCategoryChange={handleArchiveCategoryChange}
        archiveCategoryOptions={ARCHIVE_CATEGORY_OPTIONS}
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
                {bulkActionsBarNode}
              </div>
            ) : null}
          </div>
        }
      />

      {viewMode === "list" ? (
        <DocumentTableView
          documents={documents}
          pagination={pagination}
          isArchiveView={isArchiveView}
          selectedDocIds={selectedDocIds}
          onSelectionChange={setSelectedDocIds}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          extraActions={bulkActionsBarNode}
          buildPageUrl={buildPageUrl}
          searchParamsString={searchParams.toString()}
          isActionPending={isActionPending}
          openCriticalActionDialog={openCriticalActionDialog}
        />
      ) : (
        <DocumentGridView
          documents={documents}
          pagination={pagination}
          isArchiveView={isArchiveView}
          buildPageUrl={buildPageUrl}
          searchParamsString={searchParams.toString()}
          isActionPending={isActionPending}
          openCriticalActionDialog={openCriticalActionDialog}
        />
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
