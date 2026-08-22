"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Eye, Pencil, RotateCcw, Trash2, Users } from "lucide-react";
import type { PaginationMeta } from "@/types/pagination";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { DataTableCard } from "@/components/tables/DataTableCard";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { routeTo } from "@/constants/routes";

export type EmployeeSummary = {
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

export type CriticalEmployeeAction =
  | "archive"
  | "restore"
  | "permanent-delete"
  | "bulk-archive"
  | "bulk-restore"
  | "bulk-delete";

export type CriticalEmployeeActionTarget = {
  action: CriticalEmployeeAction;
  employee: EmployeeSummary;
};

export type EmployeeTableViewProps = {
  employees: EmployeeSummary[];
  pagination: PaginationMeta;
  isArchiveView: boolean;
  selectedEmployeeIds: string[];
  onSelectionChange: (ids: string[]) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
  rowsPerPage: string;
  onRowsPerPageChange: (value: string | null) => void;
  pageSizeOptions: readonly number[] | number[];
  extraActions: ReactNode;
  footerSummary: ReactNode;
  paginationControls: ReactNode;
  pendingEmployeeId: string | null;
  onOpenCriticalActionDialog: (target: CriticalEmployeeActionTarget) => void;
};

export function EmployeeTableView({
  employees,
  pagination,
  isArchiveView,
  selectedEmployeeIds,
  onSelectionChange,
  sortBy,
  sortOrder,
  onSortChange,
  rowsPerPage,
  onRowsPerPageChange,
  pageSizeOptions,
  extraActions,
  footerSummary,
  paginationControls,
  pendingEmployeeId,
  onOpenCriticalActionDialog,
}: EmployeeTableViewProps) {
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
          onClick={() =>
            onOpenCriticalActionDialog({ action: "permanent-delete", employee: emp })
          }
        >
          <Trash2 className="size-3.5" />
          <span className="hidden md:inline">Hapus permanen</span>
        </Button>
      ) : null}
      <Button
        variant={isArchiveView ? "outline" : "destructive"}
        size="xs"
        className={
          isArchiveView
            ? "border-success/30 text-success hover:bg-success/10 hover:text-success"
            : undefined
        }
        disabled={pendingEmployeeId === emp.id}
        onClick={() =>
          onOpenCriticalActionDialog({
            action: isArchiveView ? "restore" : "archive",
            employee: emp,
          })
        }
      >
        {isArchiveView ? <RotateCcw className="size-3.5" /> : <Trash2 className="size-3.5" />}
        <span className="hidden md:inline">{isArchiveView ? "Pulihkan" : "Hapus"}</span>
      </Button>
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

  return (
    <DataTableCard
      title="Daftar Pegawai"
      description={`Total ${pagination.totalItems} pegawai ${isArchiveView ? "arsip" : "aktif"} - Halaman ${pagination.page} dari ${pagination.totalPages || 1}`}
      icon={<Users className="size-4 text-muted-foreground" />}
      rowsPerPageControl={{
        value: rowsPerPage,
        onValueChange: onRowsPerPageChange,
        options: pageSizeOptions,
        label: "Tampilkan",
        suffix: "baris",
      }}
      extraActions={extraActions}
      tableMinWidthClassName="min-w-[900px]"
      table={
        <DataTable
          data={employees}
          columns={employeeColumns}
          getRowKey={(emp) => emp.id}
          selectable={true}
          selectedIds={selectedEmployeeIds}
          onSelectionChange={onSelectionChange}
          currentSortBy={sortBy}
          currentSortOrder={sortOrder}
          onSortChange={onSortChange}
          emptyMessage={
            isArchiveView
              ? "Tidak ada pegawai arsip yang sesuai pencarian."
              : "Tidak ada pegawai aktif yang sesuai pencarian."
          }
          headerClassName="bg-muted/20"
        />
      }
      footerSummary={footerSummary}
      pagination={paginationControls ?? undefined}
    />
  );
}
