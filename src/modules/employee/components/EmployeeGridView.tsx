"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Eye, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { routeTo } from "@/constants/routes";
import type { CriticalEmployeeActionTarget, EmployeeSummary } from "./EmployeeTableView";

export type EmployeeGridViewProps = {
  employees: EmployeeSummary[];
  isArchiveView: boolean;
  pendingEmployeeId: string | null;
  onOpenCriticalActionDialog: (target: CriticalEmployeeActionTarget) => void;
  footerSummary: ReactNode;
  paginationControls: ReactNode;
};

export function EmployeeGridView({
  employees,
  isArchiveView,
  pendingEmployeeId,
  onOpenCriticalActionDialog,
  footerSummary,
  paginationControls,
}: EmployeeGridViewProps) {
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

  return (
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
                        {emp.role}
                        {!emp.isActive ? " • Akun nonaktif" : ""}
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
  );
}
