"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, RotateCcw, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { CriticalActionVerificationDialog } from "@/components/verification/CriticalActionVerificationDialog";
import { PaginationItems } from "@/components/tables/PaginationItems";
import { PageHeader, PageHeaderLink } from "@/components/navigation/PageHeader";
import { RowsPerPageControl } from "@/components/tables/RowsPerPageControl";
import { ViewModeToggle } from "@/components/tables/ViewModeToggle";
import type { PaginationMeta } from "@/types/pagination";
import { buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PAGINATION, ROUTES } from "@/constants";
import { generateAlphanumericKey } from "@/utils/crypto";
import { verifyCurrentPasswordAction } from "@/modules/auth";
import { crudEmployeeAction } from "@/modules/employee";
import { DataFilterCard } from "@/components/tables/DataFilterCard";
import type { EmployeeDirectoryFilterOptions } from "../types/filter.types";
import {
  EDUCATION_OPTIONS,
  EMPLOYEE_STATUS_OPTIONS,
  MARITAL_STATUS_OPTIONS,
} from "@/modules/employee";
import {
  useEmployeesViewState,
  type OfficialForm,
} from "../hooks/useEmployeesViewState";
import { EmployeeBulkActionsBar } from "./EmployeeBulkActionsBar";
import {
  EmployeeTableView,
  type CriticalEmployeeActionTarget,
  type EmployeeSummary,
} from "./EmployeeTableView";
import { EmployeeGridView } from "./EmployeeGridView";
import {
  ExportPdfOfficialDialog,
  type DirectorOption,
} from "./ExportPdfOfficialDialog";

type MasterDataEmployeesViewProps = {
  employees: EmployeeSummary[];
  pagination: PaginationMeta;
  archiveView: "active" | "archived";
  filterOptions: EmployeeDirectoryFilterOptions;
  directorOptions: DirectorOption[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export function MasterDataEmployeesView({
  employees,
  pagination,
  archiveView,
  filterOptions,
  directorOptions,
  sortBy,
  sortOrder,
}: MasterDataEmployeesViewProps) {
  const router = useRouter();

  const {
    selectedEmployeeIds,
    setSelectedEmployeeIds,
    filters,
    rowsPerPage,
    viewMode,
    isArchiveView,
    buildPageUrl,
    buildArchiveViewUrl,
    buildExportUrl,
    buildExportPdfUrl,
    handleSortChange,
    handleValueChange,
    handleFilter,
    handleViewModeChange,
    handleRowsPerPageChange,
    handleResetFilter,
  } = useEmployeesViewState({
    paginationLimit: pagination.pageSize,
    paginationPage: pagination.page,
    archiveView,
    sortBy,
    sortOrder,
  });

  const [pendingEmployeeId, setPendingEmployeeId] = useState<string | null>(null);
  const [isCriticalActionDialogOpen, setIsCriticalActionDialogOpen] = useState(false);
  const [isExportPdfDialogOpen, setIsExportPdfDialogOpen] = useState(false);
  const [criticalActionTarget, setCriticalActionTarget] = useState<CriticalEmployeeActionTarget | null>(null);
  const [bulkSecretKey, setBulkSecretKey] = useState("");
  const [isBulkPending, setIsBulkPending] = useState(false);
  const [officialForm, setOfficialForm] = useState<OfficialForm>({
    employeeId: "",
    name: "",
    position: "",
    rank: "",
    nip: "",
  });



  const handleBulkAction = async (
    action: "DELETE" | "RESTORE" | "PERMANENT_DELETE",
    successMsg: string,
    errorMsg: string,
  ) => {
    if (selectedEmployeeIds.length === 0) return;
    setIsBulkPending(true);
    try {
      const results = await Promise.all(
        selectedEmployeeIds.map((id) => crudEmployeeAction(action, id)),
      );
      const failed = results.filter((res) => !res.ok);
      if (failed.length > 0) {
        toast.error(`${failed.length} ${errorMsg}`);
      } else {
        toast.success(`${selectedEmployeeIds.length} ${successMsg}`);
      }
      setSelectedEmployeeIds([]);
      router.refresh();
    } catch (err) {
      toast.error(`Gagal menjalankan ${errorMsg}`);
      console.error("Bulk action error:", err);
    } finally {
      setIsBulkPending(false);
    }
  };

  const openBulkDialog = (
      action: "bulk-archive" | "bulk-restore" | "bulk-delete",
    ) => {
      setBulkSecretKey(generateAlphanumericKey(12));
    setCriticalActionTarget({
      action,
      employee: {
        id: "",
        name: "Semua",
        employeeId: null,
        nik: null,
        gender: null,
        phone: null,
        email: null,
        role: "",
        status: "",
        isActive: true,
        employmentStatus: null,
        workplace: null,
        documentCount: 0,
      },
    });
    setIsCriticalActionDialogOpen(true);
  };

  const handleOfficialFieldChange = (key: keyof OfficialForm, value: string) => {
    setOfficialForm((current) => ({ ...current, [key]: value }));
  };

  const handleOfficialSelect = (employeeId: string | null) => {
    const official = directorOptions.find((option) => option.id === employeeId);
    setOfficialForm({
      employeeId: official?.id ?? "",
      name: official?.name ?? "",
      position: official?.position ?? "",
      rank: official?.rank ?? "",
      nip: official?.nip ?? "",
    });
  };

  const handleArchiveAction = async (employee: EmployeeSummary) => {
    setPendingEmployeeId(employee.id);
    try {
      const result = await crudEmployeeAction(
        isArchiveView ? "RESTORE" : "DELETE",
        employee.id,
      );
      if (result.ok) {
        toast.success(
          isArchiveView
            ? `Pegawai "${employee.name}" berhasil dipulihkan.`
            : `Pegawai "${employee.name}" berhasil diarsipkan.`,
        );
        setIsCriticalActionDialogOpen(false);
        window.setTimeout(() => {
          setCriticalActionTarget(null);
          router.refresh();
        }, 200);
      } else {
        toast.error(result.error.message);
      }
      return result;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Aksi pegawai gagal dijalankan.",
      );
      return false;
    } finally {
      setPendingEmployeeId(null);
    }
  };

  const handlePermanentDeleteAction = async (employee: EmployeeSummary) => {
    setPendingEmployeeId(employee.id);
    try {
      const result = await crudEmployeeAction("PERMANENT_DELETE", employee.id);
      if (result.ok) {
        toast.success(`Pegawai "${employee.name}" berhasil dihapus permanen.`);
        setIsCriticalActionDialogOpen(false);
        window.setTimeout(() => {
          setCriticalActionTarget(null);
          router.refresh();
        }, 200);
      } else {
        toast.error(result.error.message);
      }
      return result;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Aksi pegawai gagal dijalankan.",
      );
      return false;
    } finally {
      setPendingEmployeeId(null);
    }
  };

  const buildCriticalActionDialogProps = (target: CriticalEmployeeActionTarget) => {
    const employeeName = target.employee.name;
    const identifier =
      target.employee.employeeId ||
      target.employee.nik ||
      target.employee.email ||
      target.employee.id;
    const confirmationPhrase = `${employeeName} (${identifier})`;

    if (target.action === "bulk-archive") {
      return {
        title: "Verifikasi arsipkan massal pegawai",
        description: `Tindakan ini membutuhkan verifikasi sebelum ${selectedEmployeeIds.length} pegawai dipindahkan ke arsip.`,
        actionLabel: "Arsipkan Semua",
        tone: "destructive" as const,
        icon: <Archive className="size-4" />,
        targetLabel: "pegawai terpilih",
        targetValue: `${selectedEmployeeIds.length} pegawai`,
        confirmationPhrase: bulkSecretKey,
        allowCopyPhrase: false,
        impacts: [
          `Sebanyak ${selectedEmployeeIds.length} pegawai akan dipindahkan ke arsip.`,
          "Akun terkait akan dinonaktifkan dan tidak dapat login.",
          "Aktivitas pengarsipan massal akan dicatat di audit log.",
        ],
        onConfirm: () =>
          handleBulkAction(
            "DELETE",
            "pegawai berhasil diarsipkan.",
            "pegawai gagal diarsipkan.",
          ),
      };
    }

    if (target.action === "bulk-restore") {
      return {
        title: "Verifikasi pulihkan massal pegawai",
        description: `Tindakan ini membutuhkan verifikasi sebelum ${selectedEmployeeIds.length} pegawai arsip dikembalikan ke daftar aktif.`,
        actionLabel: "Pulihkan Semua",
        tone: "success" as const,
        icon: <RotateCcw className="size-4" />,
        targetLabel: "pegawai terpilih",
        targetValue: `${selectedEmployeeIds.length} pegawai`,
        confirmationPhrase: bulkSecretKey,
        allowCopyPhrase: false,
        impacts: [
          `Sebanyak ${selectedEmployeeIds.length} pegawai akan kembali muncul di daftar aktif.`,
          "Akun terkait akan dipulihkan sesuai data pegawai.",
          "Aktivitas pemulihan massal akan dicatat di audit log.",
        ],
        onConfirm: () =>
          handleBulkAction(
            "RESTORE",
            "pegawai berhasil dipulihkan.",
            "pegawai gagal dipulihkan.",
          ),
      };
    }

    if (target.action === "bulk-delete") {
      return {
        title: "Verifikasi hapus permanen massal pegawai",
        description: `Tindakan ini membutuhkan verifikasi sebelum ${selectedEmployeeIds.length} pegawai dihapus permanen dari sistem.`,
        actionLabel: "Hapus Semua",
        tone: "destructive" as const,
        icon: <Trash2 className="size-4" />,
        targetLabel: "pegawai terpilih",
        targetValue: `${selectedEmployeeIds.length} pegawai`,
        confirmationPhrase: bulkSecretKey,
        allowCopyPhrase: false,
        impacts: [
          `Data dari ${selectedEmployeeIds.length} pegawai akan dihapus permanen dari database.`,
          "Relasi akun, sesi, riwayat karier, dokumen, verifikasi, dan notifikasi terkait ikut terdampak.",
          "Aksi ini tidak dapat dibatalkan dan akan dicatat di audit log.",
        ],
        onConfirm: () =>
          handleBulkAction(
            "PERMANENT_DELETE",
            "pegawai berhasil dihapus permanen.",
            "pegawai gagal dihapus permanen.",
          ),
      };
    }

    if (target.action === "restore") {
      return {
        title: "Verifikasi pulihkan pegawai",
        description: "Tindakan ini membutuhkan verifikasi sebelum pegawai arsip dikembalikan ke daftar aktif.",
        actionLabel: "Pulihkan Pegawai",
        targetLabel: "pegawai",
        targetValue: confirmationPhrase,
        confirmationPhrase,
        tone: "success" as const,
        icon: <RotateCcw className="size-4" />,
        impacts: [
          "Pegawai akan kembali muncul di daftar aktif.",
          "Akun terkait akan dipulihkan sesuai data pegawai.",
          "Aktivitas pemulihan akan dicatat di audit log.",
        ],
        onConfirm: () => handleArchiveAction(target.employee),
      };
    }

    if (target.action === "permanent-delete") {
      return {
        title: "Verifikasi hapus permanen pegawai",
        description: "Tindakan ini membutuhkan verifikasi sebelum data pegawai dihapus permanen.",
        actionLabel: "Hapus Permanen",
        targetLabel: "pegawai",
        targetValue: confirmationPhrase,
        confirmationPhrase,
        tone: "destructive" as const,
        icon: <Trash2 className="size-4" />,
        impacts: [
          "Data pegawai akan dihapus permanen dari database.",
          "Relasi akun, sesi, riwayat karier, dokumen, verifikasi, dan notifikasi terkait ikut terdampak.",
          "Aksi ini tidak dapat dibatalkan dan akan dicatat di audit log.",
        ],
        onConfirm: () => handlePermanentDeleteAction(target.employee),
      };
    }

    return {
      title: "Verifikasi arsipkan pegawai",
      description: "Tindakan ini membutuhkan verifikasi sebelum pegawai dipindahkan ke arsip.",
      actionLabel: "Arsipkan Pegawai",
      targetLabel: "pegawai",
      targetValue: confirmationPhrase,
      confirmationPhrase,
      tone: "destructive" as const,
      icon: <Trash2 className="size-4" />,
      impacts: [
        "Pegawai akan dipindahkan ke arsip dan tidak tampil di daftar aktif.",
        "Akun terkait akan dinonaktifkan.",
        "Aktivitas arsip akan dicatat di audit log.",
      ],
      onConfirm: () => handleArchiveAction(target.employee),
    };
  };

  const criticalActionDialogProps = criticalActionTarget
    ? buildCriticalActionDialogProps(criticalActionTarget)
    : null;

  const openCriticalActionDialog = (target: CriticalEmployeeActionTarget) => {
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
      Menampilkan {employees.length} dari {pagination.totalItems} pegawai.
    </p>
  );

  const bulkActionsBar = (
    <EmployeeBulkActionsBar
      selectedCount={selectedEmployeeIds.length}
      isArchiveView={isArchiveView}
      isBulkPending={isBulkPending}
      exportUrl={buildExportUrl()}
      onOpenBulkDelete={() => openBulkDialog("bulk-delete")}
      onOpenBulkRestore={() => openBulkDialog("bulk-restore")}
      onOpenBulkArchive={() => openBulkDialog("bulk-archive")}
      onOpenExportPdfDialog={() => setIsExportPdfDialogOpen(true)}
    />
  );

  return (
    <div className="space-y-6">
      <CriticalActionVerificationDialog
        open={isCriticalActionDialogOpen}
        onOpenChange={handleCriticalActionDialogOpenChange}
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
        isPending={
          pendingEmployeeId === criticalActionTarget?.employee.id || isBulkPending
        }
        onVerifyPassword={(password) => verifyCurrentPasswordAction({ password })}
        onConfirm={criticalActionDialogProps?.onConfirm ?? (() => {})}
      />

      <ExportPdfOfficialDialog
        open={isExportPdfDialogOpen}
        onOpenChange={setIsExportPdfDialogOpen}
        officialForm={officialForm}
        onOfficialFieldChange={handleOfficialFieldChange}
        onOfficialSelect={handleOfficialSelect}
        directorOptions={directorOptions}
        buildExportPdfUrl={buildExportPdfUrl}
      />

      <PageHeader
        title="Data Pegawai"
        description="Kelola direktori pegawai, akun, unit kerja, dan ringkasan dokumen."
        trailing={
          <PageHeaderLink
            href={`${ROUTES.masterDataEmployees}/add`}
            icon={UserPlus}
            label="Tambah Pegawai"
          />
        }
      />

      <DataFilterCard
        title="Filter & Pencarian"
        description="Cari dan saring pegawai berdasarkan data kepegawaian, pendidikan, TMT, usia, dan status."
        searchValue={filters.search}
        onSearchChange={(val) => handleValueChange("search", val)}
        searchPlaceholder="Cari nama, NIP, NIK, atau email..."
        selectFilters={[
          {
            key: "employmentStatusId",
            value: filters.employmentStatusId || "all",
            onValueChange: (val) => {
              handleValueChange("employmentStatusId", !val || val === "all" ? "" : val);
              handleValueChange("employeeGroupId", "");
            },
            placeholder: "Status Kepegawaian",
            ariaLabel: "Status kepegawaian",
            options: [
              { value: "all", label: "Status Kepegawaian" },
              ...filterOptions.employmentStatuses.map((opt) => ({ value: opt.id, label: opt.name })),
            ],
          },
          {
            key: "employeeGroupId",
            value: filters.employeeGroupId || "all",
            onValueChange: (val) => handleValueChange("employeeGroupId", !val || val === "all" ? "" : val),
            disabled: !filters.employmentStatusId,
            placeholder: filters.employmentStatusId ? "Jenis Kepegawaian" : "Pilih status dulu",
            ariaLabel: "Jenis kepegawaian",
            options: [
              { value: "all", label: "Jenis Kepegawaian" },
              ...(filters.employmentStatusId
                ? filterOptions.employeeGroups.filter((g) => g.employmentStatusId === filters.employmentStatusId)
                : []
              ).map((opt) => ({ value: opt.id, label: opt.name })),
            ],
          },
          {
            key: "professionGroupId",
            value: filters.professionGroupId || "all",
            onValueChange: (val) => {
              handleValueChange("professionGroupId", !val || val === "all" ? "" : val);
              handleValueChange("employeePositionId", "");
            },
            placeholder: "Kelompok Profesi",
            ariaLabel: "Kelompok profesi",
            options: [
              { value: "all", label: "Kelompok Profesi" },
              ...filterOptions.professionGroups.map((opt) => ({ value: opt.id, label: opt.name })),
            ],
          },
          {
            key: "employeePositionId",
            value: filters.employeePositionId || "all",
            onValueChange: (val) => handleValueChange("employeePositionId", !val || val === "all" ? "" : val),
            disabled: !filters.professionGroupId,
            placeholder: filters.professionGroupId ? "Jabatan Pegawai" : "Pilih profesi dulu",
            ariaLabel: "Jabatan pegawai",
            options: [
              { value: "all", label: "Jabatan Pegawai" },
              ...(filters.professionGroupId
                ? filterOptions.employeePositions.filter((p) => p.professionGroupId === filters.professionGroupId)
                : []
              ).map((opt) => ({ value: opt.id, label: opt.name })),
            ],
          },
          {
            key: "employeeRankId",
            value: filters.employeeRankId || "all",
            onValueChange: (val) => handleValueChange("employeeRankId", !val || val === "all" ? "" : val),
            placeholder: "Golongan",
            ariaLabel: "Golongan",
            options: [
              { value: "all", label: "Golongan" },
              ...filterOptions.employeeRanks.map((opt) => ({ value: opt.id, label: opt.name })),
            ],
          },
          {
            key: "workplaceId",
            value: filters.workplaceId || "all",
            onValueChange: (val) => handleValueChange("workplaceId", !val || val === "all" ? "" : val),
            placeholder: "Unit Kerja",
            ariaLabel: "Unit kerja",
            options: [
              { value: "all", label: "Unit Kerja" },
              ...filterOptions.workplaces.map((opt) => ({ value: opt.id, label: opt.name })),
            ],
          },
          {
            key: "maritalStatus",
            value: filters.maritalStatus || "all",
            onValueChange: (val) => handleValueChange("maritalStatus", !val || val === "all" ? "" : val),
            placeholder: "Status Pernikahan",
            ariaLabel: "Status pernikahan",
            options: [
              { value: "all", label: "Status Pernikahan" },
              ...MARITAL_STATUS_OPTIONS,
            ],
          },
          {
            key: "lastEducation",
            value: filters.lastEducation || "all",
            onValueChange: (val) => handleValueChange("lastEducation", !val || val === "all" ? "" : val),
            placeholder: "Pendidikan Terakhir",
            ariaLabel: "Pendidikan terakhir",
            options: [
              { value: "all", label: "Pendidikan Terakhir" },
              ...EDUCATION_OPTIONS,
            ],
          },
          {
            key: "status",
            value: filters.status || "all",
            onValueChange: (val) => handleValueChange("status", !val || val === "all" ? "" : val),
            placeholder: "Status Pegawai",
            ariaLabel: "Status pegawai",
            options: [
              { value: "all", label: "Status Pegawai" },
              ...EMPLOYEE_STATUS_OPTIONS,
            ],
          },
        ]}
        customFields={[
          {
            key: "tmtStartDate",
            label: "TMT Awal",
            ariaLabel: "TMT awal",
            type: "date",
            value: filters.tmtStartDate,
            onChange: (val) => handleValueChange("tmtStartDate", val),
          },
          {
            key: "tmtEndDate",
            label: "TMT Akhir",
            ariaLabel: "TMT akhir",
            type: "date",
            value: filters.tmtEndDate,
            onChange: (val) => handleValueChange("tmtEndDate", val),
          },
          {
            key: "retirementAgeFrom",
            label: "Usia Pensiun Dari",
            ariaLabel: "Usia pensiun dari",
            type: "number",
            min: 0,
            inputMode: "numeric",
            value: filters.retirementAgeFrom,
            onChange: (val) => handleValueChange("retirementAgeFrom", val),
          },
          {
            key: "retirementAgeTo",
            label: "Usia Pensiun Sampai",
            ariaLabel: "Usia pensiun sampai",
            type: "number",
            min: 0,
            inputMode: "numeric",
            value: filters.retirementAgeTo,
            onChange: (val) => handleValueChange("retirementAgeTo", val),
          },
        ]}
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
                <Users className="size-4" />
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
                {bulkActionsBar}
              </div>
            ) : null}
          </div>
        }
      />

      {viewMode === "list" ? (
        <EmployeeTableView
          employees={employees}
          pagination={pagination}
          isArchiveView={isArchiveView}
          selectedEmployeeIds={selectedEmployeeIds}
          onSelectionChange={setSelectedEmployeeIds}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          pageSizeOptions={PAGINATION.pageSizeOptions}
          extraActions={bulkActionsBar}
          footerSummary={footerSummary}
          paginationControls={paginationControls}
          pendingEmployeeId={pendingEmployeeId}
          onOpenCriticalActionDialog={openCriticalActionDialog}
        />
      ) : (
        <EmployeeGridView
          employees={employees}
          isArchiveView={isArchiveView}
          pendingEmployeeId={pendingEmployeeId}
          onOpenCriticalActionDialog={openCriticalActionDialog}
          footerSummary={footerSummary}
          paginationControls={paginationControls}
        />
      )}
    </div>
  );
}
