"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Archive, Eye, FileDown, Pencil, RotateCcw, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { PaginationItems } from "@/components/shared/PaginationItems";
import { PageHeader } from "@/components/shared/PageHeader";
import { RowsPerPageControl } from "@/components/shared/RowsPerPageControl";
import { ViewModeToggle } from "@/components/shared/ViewModeToggle";
import { DataTableCard } from "@/components/shared/DataTableCard";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PAGINATION } from "@/constants";
import { routeTo } from "@/constants/routes";
import { crudEmployeeAction } from "@/modules/employee/actions";
import {
  EmployeeDirectoryFilter,
  type EmployeeDirectoryFilterOptions,
  type EmployeeDirectoryFilterValues,
} from "./EmployeeDirectoryFilter";
import { EmployeeCsvImportDialog } from "./EmployeeCsvImportDialog";

type ViewMode = "grid" | "list";

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
}: MasterDataEmployeesViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pendingEmployeeId, setPendingEmployeeId] = useState<string | null>(null);
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

  const handleArchiveAction = (employee: EmployeeSummary) => {
    setPendingEmployeeId(employee.id);
    startTransition(async () => {
      const result = await crudEmployeeAction(isArchiveView ? "RESTORE" : "DELETE", employee.id);

      if (result.ok) {
        toast.success(
          isArchiveView
            ? `Pegawai "${employee.name}" berhasil dipulihkan.`
            : `Pegawai "${employee.name}" berhasil diarsipkan.`,
        );
        router.refresh();
        setPendingEmployeeId(null);
        return;
      }

      toast.error(result.error.message);
      setPendingEmployeeId(null);
    });
  };

  const handlePermanentDeleteAction = (employee: EmployeeSummary) => {
    setPendingEmployeeId(employee.id);
    startTransition(async () => {
      const result = await crudEmployeeAction("PERMANENT_DELETE", employee.id);

      if (result.ok) {
        toast.success(`Pegawai "${employee.name}" berhasil dihapus permanen.`);
        router.refresh();
        setPendingEmployeeId(null);
        return;
      }

      toast.error(result.error.message);
      setPendingEmployeeId(null);
    });
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
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="destructive"
                size="xs"
                disabled={isPending && pendingEmployeeId === emp.id}
              />
            }
          >
            <Trash2 className="size-3.5" />
            <span className="hidden md:inline">Hapus permanen</span>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus permanen pegawai?</AlertDialogTitle>
              <AlertDialogDescription>
                {`Pegawai "${emp.name}" akan dihapus permanen dari database beserta relasi akun, sesi, riwayat karier, dokumen, verifikasi, dan notifikasi. Aksi ini tidak dapat dibatalkan.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => handlePermanentDeleteAction(emp)}
              >
                Hapus Permanen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              variant={isArchiveView ? "outline" : "destructive"}
              size="xs"
              disabled={isPending && pendingEmployeeId === emp.id}
            />
          }
        >
          {isArchiveView ? <RotateCcw className="size-3.5" /> : <Trash2 className="size-3.5" />}
          <span className="hidden md:inline">{isArchiveView ? "Pulihkan" : "Hapus"}</span>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isArchiveView ? "Pulihkan pegawai?" : "Arsipkan pegawai?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isArchiveView
                ? `Pegawai "${emp.name}" akan dikembalikan ke daftar aktif.`
                : `Pegawai "${emp.name}" akan dipindahkan ke arsip dan akun terkait dinonaktifkan.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant={isArchiveView ? "default" : "destructive"}
              onClick={() => handleArchiveAction(emp)}
            >
              {isArchiveView ? "Pulihkan" : "Arsipkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
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
      <PageHeader
        title="Data Pegawai"
        description="Kelola direktori pegawai, akun, unit kerja, dan ringkasan dokumen."
        trailing={
          <>
            <EmployeeCsvImportDialog />
            <Link className={buttonVariants({ variant: "outline" })} href={buildExportUrl()}>
              <FileDown className="size-3.5" />
              Export CSV
            </Link>
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
