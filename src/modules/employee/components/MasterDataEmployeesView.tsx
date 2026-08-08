"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Archive, Eye, FileDown, FileText, Pencil, RotateCcw, Trash2, UserPlus, Users } from "lucide-react";
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
type CriticalEmployeeAction = "archive" | "restore" | "permanent-delete";

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
}: MasterDataEmployeesViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendingEmployeeId, setPendingEmployeeId] = useState<string | null>(null);
  const [isCriticalActionDialogOpen, setIsCriticalActionDialogOpen] = useState(false);
  const [isExportPdfDialogOpen, setIsExportPdfDialogOpen] = useState(false);
  const [criticalActionTarget, setCriticalActionTarget] = useState<CriticalEmployeeActionTarget | null>(null);
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
      impacts={criticalActionDialogProps?.impacts}
      tone={criticalActionDialogProps?.tone}
      icon={criticalActionDialogProps?.icon}
      isPending={pendingEmployeeId === criticalActionTarget?.employee.id}
      onVerifyPassword={(password) => verifyCurrentPasswordAction({ password })}
      onConfirm={criticalActionDialogProps?.onConfirm ?? (() => {})}
    />
  );

  const employeeColumns: DataTableColumn<EmployeeSummary>[] = [
    {
      key: "employee",
      header: "Pegawai",
      headClassName: "w-[300px]",
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
      cell: (emp) => emp.workplace || "-",
    },
    {
      key: "documents",
      header: "Dokumen",
      headClassName: "w-[100px] text-center",
      cellClassName: "text-center font-medium",
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
          <>
            <Link className={buttonVariants({ variant: "outline" })} href="/master-data/employees/imports">
              <FileUp className="size-3.5" />
              Import CSV
            </Link>
            <Link className={buttonVariants({ variant: "outline" })} href={buildExportUrl()}>
              <FileDown className="size-3.5" />
              Export CSV
            </Link>
            <Button type="button" variant="outline" onClick={() => setIsExportPdfDialogOpen(true)}>
              <FileText className="size-3.5" />
              Export PDF
            </Button>
            <Link className={buttonVariants()} href="/master-data/employees/add">
              <UserPlus className="size-3.5" />
              Tambah Pegawai
            </Link>
          </>
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
          tableMinWidthClassName="min-w-[900px]"
          table={
            <DataTable
              data={employees}
              columns={employeeColumns}
              getRowKey={(emp) => emp.id}
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
