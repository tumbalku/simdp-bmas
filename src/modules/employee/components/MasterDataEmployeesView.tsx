"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Archive, Eye, FileDown, FileText, Pencil, RotateCcw, Trash2, UserPlus, Users, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { CriticalActionVerificationDialog } from "@/components/verification/CriticalActionVerificationDialog";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { PaginationItems } from "@/components/tables/PaginationItems";
import { PageHeader } from "@/components/navigation/PageHeader";
import { RowsPerPageControl } from "@/components/tables/RowsPerPageControl";
import { ViewModeToggle } from "@/components/tables/ViewModeToggle";
import { DataTableCard } from "@/components/tables/DataTableCard";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { PAGINATION } from "@/constants";
import { routeTo } from "@/constants/routes";
import { verifyCurrentPasswordAction } from "@/modules/auth";
import { crudEmployeeAction } from "@/modules/employee";
import {
  EmployeeDirectoryFilter,
  type EmployeeDirectoryFilterOptions,
  type EmployeeDirectoryFilterValues,
} from "./EmployeeDirectoryFilter";
import { FileUp } from "lucide-react";

type ViewMode = "grid" | "list";
type CriticalEmployeeAction = 
  | "archive" 
  | "restore" 
  | "permanent-delete"
  | "bulk-archive"
  | "bulk-restore"
  | "bulk-delete";

type OfficialForm = {
  employeeId: string;
  name: string;
  position: string;
  rank: string;
  nip: string;
};

type CriticalEmployeeActionTarget = {
  action: CriticalEmployeeAction;
  employee: EmployeeSummary;
};

type EmployeeSummary = {
  id: string;
  employeeId: string | null;
  nik: string | null;
  name: string;
  gender: string | null;
  phone: string | null;
  email: string | null;
  role: string;
  status: string;
  isActive: boolean;
  employmentStatus: string | null;
  workplace: string | null;
  documentCount: number;
};

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type MasterDataEmployeesViewProps = {
  employees: EmployeeSummary[];
  pagination: PaginationMeta;
  archiveView: "active" | "archived";
  filterOptions: EmployeeDirectoryFilterOptions;
  directorOptions: Array<{
    id: string;
    name: string;
    nip: string | null;
    position: string | null;
    rank: string | null;
  }>;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

const FILTER_KEYS = [
  "search",
  "employmentStatusId",
  "employeeGroupId",
  "professionGroupId",
  "employeePositionId",
  "employeeRankId",
  "workplaceId",
  "maritalStatus",
  "lastEducation",
  "tmtStartDate",
  "tmtEndDate",
  "retirementAgeFrom",
  "retirementAgeTo",
  "status",
] as const satisfies ReadonlyArray<keyof EmployeeDirectoryFilterValues>;

function getInitialFilterValues(
  searchParams: ReturnType<typeof useSearchParams>,
): EmployeeDirectoryFilterValues {
  return {
    search: searchParams.get("search") ?? "",
    employmentStatusId: searchParams.get("employmentStatusId") ?? "",
    employeeGroupId: searchParams.get("employeeGroupId") ?? "",
    professionGroupId: searchParams.get("professionGroupId") ?? "",
    employeePositionId: searchParams.get("employeePositionId") ?? "",
    employeeRankId: searchParams.get("employeeRankId") ?? "",
    workplaceId: searchParams.get("workplaceId") ?? "",
    maritalStatus: searchParams.get("maritalStatus") ?? "",
    lastEducation: searchParams.get("lastEducation") ?? "",
    tmtStartDate: searchParams.get("tmtStartDate") ?? "",
    tmtEndDate: searchParams.get("tmtEndDate") ?? "",
    retirementAgeFrom: searchParams.get("retirementAgeFrom") ?? "",
    retirementAgeTo: searchParams.get("retirementAgeTo") ?? "",
    status: searchParams.get("status") ?? "",
  };
}

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
  const searchParams = useSearchParams();
  const [pendingEmployeeId, setPendingEmployeeId] = useState<string | null>(null);
  const [isCriticalActionDialogOpen, setIsCriticalActionDialogOpen] = useState(false);
  const [isExportPdfDialogOpen, setIsExportPdfDialogOpen] = useState(false);
  const [criticalActionTarget, setCriticalActionTarget] = useState<CriticalEmployeeActionTarget | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [bulkSecretKey, setBulkSecretKey] = useState("");
  const [isBulkPending, setIsBulkPending] = useState(false);
  const [officialForm, setOfficialForm] = useState<OfficialForm>({
    employeeId: "",
    name: "",
    position: "",
    rank: "",
    nip: "",
  });
  const [filters, setFilters] = useState(() =>
    getInitialFilterValues(searchParams),
  );
  const [rowsPerPage, setRowsPerPage] = useState(() =>
    String(pagination.limit || PAGINATION.defaultPageSize),
  );
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    searchParams.get("view") === "grid" ? "grid" : "list",
  );

  const isArchiveView = archiveView === "archived";

  // Reset selection when archive view changes
  useEffect(() => {
    setSelectedEmployeeIds([]);
  }, [isArchiveView]);

  const generateRandomSecretKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = "";
    for (let i = 0; i < 12; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const handleBulkConfirmArchive = async () => {
    if (selectedEmployeeIds.length === 0) return;
    setIsBulkPending(true);
    try {
      const results = await Promise.all(
        selectedEmployeeIds.map((id) => crudEmployeeAction("DELETE", id)),
      );
      const failed = results.filter((res) => !res.ok);
      if (failed.length > 0) {
        toast.error(`${failed.length} pegawai gagal diarsipkan.`);
      } else {
        toast.success(`${selectedEmployeeIds.length} pegawai berhasil diarsipkan.`);
      }
      setSelectedEmployeeIds([]);
      router.refresh();
    } catch (err) {
      toast.error("Gagal menjalankan pengarsipan massal.");
      console.error("Bulk archive error:", err);
    } finally {
      setIsBulkPending(false);
    }
  };

  const handleBulkConfirmRestore = async () => {
    if (selectedEmployeeIds.length === 0) return;
    setIsBulkPending(true);
    try {
      const results = await Promise.all(
        selectedEmployeeIds.map((id) => crudEmployeeAction("RESTORE", id)),
      );
      const failed = results.filter((res) => !res.ok);
      if (failed.length > 0) {
        toast.error(`${failed.length} pegawai gagal dipulihkan.`);
      } else {
        toast.success(`${selectedEmployeeIds.length} pegawai berhasil dipulihkan.`);
      }
      setSelectedEmployeeIds([]);
      router.refresh();
    } catch (err) {
      toast.error("Gagal menjalankan pemulihan massal.");
      console.error("Bulk restore error:", err);
    } finally {
      setIsBulkPending(false);
    }
  };

  const handleBulkConfirmDelete = async () => {
    if (selectedEmployeeIds.length === 0) return;
    setIsBulkPending(true);
    try {
      const results = await Promise.all(
        selectedEmployeeIds.map((id) => crudEmployeeAction("PERMANENT_DELETE", id)),
      );
      const failed = results.filter((res) => !res.ok);
      if (failed.length > 0) {
        toast.error(`${failed.length} pegawai gagal dihapus permanen.`);
      } else {
        toast.success(`${selectedEmployeeIds.length} pegawai berhasil dihapus permanen.`);
      }
      setSelectedEmployeeIds([]);
      router.refresh();
    } catch (err) {
      toast.error("Gagal menjalankan hapus massal.");
      console.error("Bulk delete error:", err);
    } finally {
      setIsBulkPending(false);
    }
  };

  const handleOpenBulkArchive = () => {
    setBulkSecretKey(generateRandomSecretKey());
    setCriticalActionTarget({
      action: "bulk-archive",
      employee: { id: "", name: "Semua", employeeId: null, nik: null, gender: null, phone: null, email: null, role: "", status: "", isActive: true, employmentStatus: null, workplace: null, documentCount: 0 },
    });
    setIsCriticalActionDialogOpen(true);
  };

  const handleOpenBulkRestore = () => {
    setBulkSecretKey(generateRandomSecretKey());
    setCriticalActionTarget({
      action: "bulk-restore",
      employee: { id: "", name: "Semua", employeeId: null, nik: null, gender: null, phone: null, email: null, role: "", status: "", isActive: true, employmentStatus: null, workplace: null, documentCount: 0 },
    });
    setIsCriticalActionDialogOpen(true);
  };

  const handleOpenBulkDelete = () => {
    setBulkSecretKey(generateRandomSecretKey());
    setCriticalActionTarget({
      action: "bulk-delete",
      employee: { id: "", name: "Semua", employeeId: null, nik: null, gender: null, phone: null, email: null, role: "", status: "", isActive: true, employmentStatus: null, workplace: null, documentCount: 0 },
    });
    setIsCriticalActionDialogOpen(true);
  };

  const handleSortChange = (
    nextSortBy: string,
    nextSortOrder: "asc" | "desc",
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", nextSortBy);
    params.set("sortOrder", nextSortOrder);
    params.set("page", "1");
    router.push(`/master-data/employees?${params.toString()}`);
  };

  const buildPageUrl = (
    page: number,
    nextFilters = filters,
    limit = rowsPerPage,
    nextViewMode = viewMode,
  ) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit);
    if (isArchiveView) params.set("archiveView", "archived");
    if (nextViewMode === "grid") params.set("view", "grid");
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);

    FILTER_KEYS.forEach((key) => {
      const value = nextFilters[key].trim();
      if (value) params.set(key, value);
    });

    return `/master-data/employees?${params.toString()}`;
  };

  const buildArchiveViewUrl = (nextArchiveView: "active" | "archived") => {
    const params = new URLSearchParams();
    params.set("page", String(PAGINATION.defaultPage));
    params.set("limit", rowsPerPage);
    if (nextArchiveView === "archived") params.set("archiveView", "archived");
    if (viewMode === "grid") params.set("view", "grid");
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);

    FILTER_KEYS.forEach((key) => {
      const value = filters[key].trim();
      if (value) params.set(key, value);
    });

    return `/master-data/employees?${params.toString()}`;
  };

  const buildExportUrl = () => {
    const params = new URLSearchParams();
    if (isArchiveView) params.set("archiveView", "archived");

    FILTER_KEYS.forEach((key) => {
      const value = filters[key].trim();
      if (value) params.set(key, value);
    });

    const query = params.toString();
    return `/api/v1/employees/export${query ? `?${query}` : ""}`;
  };

  const buildExportPdfUrl = (official: OfficialForm) => {
    const params = new URLSearchParams();
    if (isArchiveView) params.set("archiveView", "archived");

    FILTER_KEYS.forEach((key) => {
      const value = filters[key].trim();
      if (value) params.set(key, value);
    });

    params.set("officialName", official.name.trim());
    params.set("officialPosition", official.position.trim());
    params.set("officialRank", official.rank.trim());
    params.set("officialNip", official.nip.trim());

    const query = params.toString();
    return `/api/v1/employees/export-pdf${query ? `?${query}` : ""}`;
  };

  const handleValueChange = (key: keyof EmployeeDirectoryFilterValues, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleFilter = () => {
    router.push(buildPageUrl(PAGINATION.defaultPage));
  };

  const handleViewModeChange = (nextViewMode: ViewMode) => {
    setViewMode(nextViewMode);
    window.history.replaceState(null, "", buildPageUrl(pagination.page, filters, rowsPerPage, nextViewMode));
  };

  const handleRowsPerPageChange = (value: string | null) => {
    const nextLimit = value ?? rowsPerPage;
    setRowsPerPage(nextLimit);
    const params = new URLSearchParams();
    params.set("page", String(PAGINATION.defaultPage));
    params.set("limit", nextLimit);
    if (isArchiveView) params.set("archiveView", "archived");
    if (viewMode === "grid") params.set("view", "grid");

    FILTER_KEYS.forEach((key) => {
      const filterValue = filters[key].trim();
      if (filterValue) params.set(key, filterValue);
    });

    router.push(`/master-data/employees?${params.toString()}`);
  };

  const handleResetFilter = () => {
    const resetFilters: EmployeeDirectoryFilterValues = {
      search: "",
      employmentStatusId: "",
      employeeGroupId: "",
      professionGroupId: "",
      employeePositionId: "",
      employeeRankId: "",
      workplaceId: "",
      maritalStatus: "",
      lastEducation: "",
      tmtStartDate: "",
      tmtEndDate: "",
      retirementAgeFrom: "",
      retirementAgeTo: "",
      status: "",
    };
    setFilters(resetFilters);
    setRowsPerPage(String(PAGINATION.defaultPageSize));
    router.push(buildPageUrl(PAGINATION.defaultPage, resetFilters));
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

  const handleExportPdf = () => {
    const normalizedOfficial = {
      employeeId: officialForm.employeeId,
      name: officialForm.name.trim(),
      position: officialForm.position.trim(),
      rank: officialForm.rank.trim(),
      nip: officialForm.nip.trim(),
    };

    if (!normalizedOfficial.name || !normalizedOfficial.position || !normalizedOfficial.rank || !normalizedOfficial.nip) {
      toast.error("Nama, jabatan, pangkat/golongan, dan NIP Pejabat wajib diisi sebelum export PDF.");
      return;
    }

    setIsExportPdfDialogOpen(false);
    const anchor = document.createElement("a");
    anchor.href = buildExportPdfUrl(normalizedOfficial);
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleArchiveAction = async (employee: EmployeeSummary) => {
    setPendingEmployeeId(employee.id);
    try {
      const result = await crudEmployeeAction(isArchiveView ? "RESTORE" : "DELETE", employee.id);

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
      }

      if (!result.ok) {
        toast.error(result.error.message);
      }

      return result;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Aksi pegawai gagal dijalankan.");
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
      }

      if (!result.ok) {
        toast.error(result.error.message);
      }

      return result;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Aksi pegawai gagal dijalankan.");
      return false;
    } finally {
      setPendingEmployeeId(null);
    }
  };

  const buildCriticalActionDialogProps = (target: CriticalEmployeeActionTarget) => {
    const employeeName = target.employee.name;
    const identifier = target.employee.employeeId || target.employee.nik || target.employee.email || target.employee.id;
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
        onConfirm: handleBulkConfirmArchive,
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
        onConfirm: handleBulkConfirmRestore,
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
        onConfirm: handleBulkConfirmDelete,
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

  const renderEmployeeActions = (emp: EmployeeSummary) => (
    <div className="flex justify-end gap-2">
      {!isArchiveView ? (
        <>
          <Link
            className={buttonVariants({ variant: "outline", size: "xs" })}
            href={routeTo.masterDataEmployeeEdit(emp.id)}
          >
            <Pencil className="size-3.5" />
            <span className="hidden md:inline">Edit</span>
          </Link>
          <Link
            className={buttonVariants({ variant: "outline", size: "xs" })}
            href={routeTo.masterDataEmployeeDetail(emp.id)}
          >
            <Eye className="size-3.5" />
            <span className="hidden md:inline">Detail</span>
          </Link>
        </>
      ) : null}
      {isArchiveView ? (
        <Button
          variant="destructive"
          size="xs"
          disabled={pendingEmployeeId === emp.id}
          onClick={() => openCriticalActionDialog({ action: "permanent-delete", employee: emp })}
        >
          <Trash2 className="size-3.5" />
          <span className="hidden md:inline">Hapus permanen</span>
        </Button>
      ) : null}
      <Button
        variant={isArchiveView ? "outline" : "destructive"}
        size="xs"
        className={isArchiveView ? "border-success/30 text-success hover:bg-success/10 hover:text-success" : undefined}
        disabled={pendingEmployeeId === emp.id}
        onClick={() => openCriticalActionDialog({ action: isArchiveView ? "restore" : "archive", employee: emp })}
      >
        {isArchiveView ? <RotateCcw className="size-3.5" /> : <Trash2 className="size-3.5" />}
        <span className="hidden md:inline">{isArchiveView ? "Pulihkan" : "Hapus"}</span>
      </Button>
    </div>
  );

  const verificationDialog = (
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
      isPending={pendingEmployeeId === criticalActionTarget?.employee.id || isBulkPending}
      onVerifyPassword={(password) => verifyCurrentPasswordAction({ password })}
      onConfirm={criticalActionDialogProps?.onConfirm ?? (() => {})}
    />
  );

  const renderTableActionsDropdown = () => (
    <div className="flex items-center gap-2">
      {selectedEmployeeIds.length > 0 && (
        <>
          {isArchiveView ? (
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
          ) : (
            <Button
              variant="destructive"
              size="sm"
              className="h-8 text-xs gap-1.5"
              disabled={isBulkPending}
              onClick={handleOpenBulkArchive}
            >
              <Archive className="size-3.5" />
              Arsipkan Semua
            </Button>
          )}
        </>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <MoreVertical className="size-4" />
              <span className="sr-only">Menu tabel</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-48 mt-1 rounded-lg">
          <DropdownMenuItem onClick={() => router.push("/master-data/employees/imports")}>
            <FileUp className="size-4 mr-2" />
            Import CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(buildExportUrl())}>
            <FileDown className="size-4 mr-2" />
            Export CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsExportPdfDialogOpen(true)}>
            <FileText className="size-4 mr-2" />
            Export PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const employeeColumns: DataTableColumn<EmployeeSummary>[] = [
    {
      key: "employee",
      header: "Pegawai",
      headClassName: "w-[300px]",
      sortable: true,
      sortKey: "name",
      cell: (emp) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground">{emp.name}</div>
          <div className="text-xs text-muted-foreground">
            NIP {emp.employeeId || "-"} • NIK {emp.nik || "-"}
          </div>
        </div>
      ),
    },
    {
      key: "account",
      header: "Akun",
      cell: (emp) => (
        <div className="space-y-0.5">
          <div className="font-medium text-foreground">{emp.email || "-"}</div>
          <div className="text-xs text-muted-foreground">{emp.role}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (emp) => (
        <div className="flex flex-col items-start gap-1">
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            {emp.status}
          </Badge>
          {!emp.isActive ? (
            <span className="text-xs text-muted-foreground">Akun nonaktif</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "workplace",
      header: "Unit Kerja",
      cellClassName: "text-muted-foreground",
      sortable: true,
      sortKey: "workplace",
      cell: (emp) => emp.workplace || "-",
    },
    {
      key: "documents",
      header: "Dokumen",
      headClassName: "w-[100px] text-center",
      cellClassName: "text-center font-medium",
      sortable: true,
      sortKey: "documentCount",
      cell: (emp) => emp.documentCount,
    },
    {
      key: "action",
      header: "Aksi",
      headClassName: "w-[220px] text-right",
      cellClassName: "text-right",
      cell: (emp) => renderEmployeeActions(emp),
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
      Menampilkan {employees.length} dari {pagination.total} pegawai.
    </p>
  );

  return (
    <div className="space-y-6">
      {verificationDialog}
      <Dialog open={isExportPdfDialogOpen} onOpenChange={setIsExportPdfDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Pilih Pejabat</DialogTitle>
            <DialogDescription>
              Data ini akan dipakai pada area tanda tangan PDF laporan kepegawaian.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="export-pdf-official-employee">Pejabat</Label>
              <Select value={officialForm.employeeId || null} onValueChange={handleOfficialSelect}>
                <SelectTrigger id="export-pdf-official-employee">
                  <SelectValue placeholder="Pilih pegawai sebagai pejabat" />
                </SelectTrigger>
                <SelectContent>
                  {directorOptions.map((official) => (
                    <SelectItem key={official.id} value={official.id}>
                      {official.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="export-pdf-official-name">Nama Pejabat</Label>
              <Input
                id="export-pdf-official-name"
                value={officialForm.name}
                onChange={(event) => handleOfficialFieldChange("name", event.target.value)}
                placeholder="Nama lengkap pejabat"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="export-pdf-official-position">Jabatan</Label>
              <Input
                id="export-pdf-official-position"
                value={officialForm.position}
                onChange={(event) => handleOfficialFieldChange("position", event.target.value)}
                placeholder="Contoh: Direktur"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="export-pdf-official-rank">Pangkat/Golongan</Label>
              <Input
                id="export-pdf-official-rank"
                value={officialForm.rank}
                onChange={(event) => handleOfficialFieldChange("rank", event.target.value)}
                placeholder="Contoh: Pembina Utama Muda, Gol.IV/c"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="export-pdf-official-nip">NIP Pejabat</Label>
              <Input
                id="export-pdf-official-nip"
                value={officialForm.nip}
                onChange={(event) => handleOfficialFieldChange("nip", event.target.value)}
                placeholder="NIP Pejabat"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsExportPdfDialogOpen(false)}>
              Batal
            </Button>
            <Button type="button" onClick={handleExportPdf}>
              <FileText className="size-3.5" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PageHeader
        title="Data Pegawai"
        description="Kelola direktori pegawai, akun, unit kerja, dan ringkasan dokumen."
        trailing={
          <Link className={buttonVariants()} href="/master-data/employees/add">
            <UserPlus className="size-3.5" />
            Tambah Pegawai
          </Link>
        }
      />

      <EmployeeDirectoryFilter
        values={filters}
        options={filterOptions}
        onValueChange={handleValueChange}
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
                {renderTableActionsDropdown()}
              </div>
            ) : null}
          </div>
        }
      />

      {viewMode === "list" ? (
        <DataTableCard
          title="Daftar Pegawai"
          description={`Total ${pagination.total} pegawai ${isArchiveView ? "arsip" : "aktif"} - Halaman ${pagination.page} dari ${pagination.totalPages || 1}`}
          icon={<Users className="size-4 text-muted-foreground" />}
          rowsPerPageControl={{
            value: rowsPerPage,
            onValueChange: handleRowsPerPageChange,
            options: PAGINATION.pageSizeOptions,
            label: "Tampilkan",
            suffix: "row",
          }}
          extraActions={renderTableActionsDropdown()}
          tableMinWidthClassName="min-w-[900px]"
          table={
            <DataTable
              data={employees}
              columns={employeeColumns}
              getRowKey={(emp) => emp.id}
              selectable={true}
              selectedIds={selectedEmployeeIds}
              onSelectionChange={setSelectedEmployeeIds}
              currentSortBy={sortBy}
              currentSortOrder={sortOrder}
              onSortChange={handleSortChange}
              emptyMessage={isArchiveView ? "Tidak ada pegawai arsip yang sesuai pencarian." : "Tidak ada pegawai aktif yang sesuai pencarian."}
              headerClassName="bg-muted/20"
            />
          }
          footerSummary={footerSummary}
          pagination={paginationControls ?? undefined}
        />
      ) : (
        <div className="space-y-4">
          {employees.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex min-h-[220px] items-center justify-center text-center">
                <div className="max-w-md space-y-2">
                  <p className="text-base font-semibold text-foreground">
                    Tidak ada pegawai
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isArchiveView
                      ? "Tidak ada pegawai arsip yang sesuai pencarian."
                      : "Tidak ada pegawai aktif yang sesuai pencarian."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {employees.map((emp) => (
                <Card key={emp.id} className="border-muted-foreground/10 shadow-sm">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="truncate font-medium">{emp.name}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            NIP {emp.employeeId || "-"} • NIK {emp.nik || "-"}
                          </div>
                        </div>
                        <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px]">
                          {emp.status}
                        </Badge>
                      </div>

                      <div className="grid gap-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Akun</p>
                          <p className="truncate font-medium">{emp.email || "-"}</p>
                          <p className="text-xs text-muted-foreground">
                            {emp.role}{!emp.isActive ? " • Akun nonaktif" : ""}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Unit Kerja</p>
                            <p className="truncate">{emp.workplace || "-"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Dokumen</p>
                            <p>{emp.documentCount}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end border-t pt-3">
                        {renderEmployeeActions(emp)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {footerSummary}
            {paginationControls ? (
              <div className="flex justify-end sm:ml-auto">{paginationControls}</div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
