"use client";

import { useRouter } from "next/navigation";
import { Archive, FileDown, FileText, FileUp, MoreVertical, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type EmployeeBulkActionsBarProps = {
  selectedCount: number;
  isArchiveView: boolean;
  isBulkPending: boolean;
  exportUrl: string;
  onOpenBulkDelete: () => void;
  onOpenBulkRestore: () => void;
  onOpenBulkArchive: () => void;
  onOpenExportPdfDialog: () => void;
};

export function EmployeeBulkActionsBar({
  selectedCount,
  isArchiveView,
  isBulkPending,
  exportUrl,
  onOpenBulkDelete,
  onOpenBulkRestore,
  onOpenBulkArchive,
  onOpenExportPdfDialog,
}: EmployeeBulkActionsBarProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      {selectedCount > 0 && (
        <>
          {isArchiveView ? (
            <>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 text-xs gap-1.5"
                disabled={isBulkPending}
                onClick={onOpenBulkDelete}
              >
                <Trash2 className="size-3.5" />
                Hapus Semua
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-success/30 text-success hover:bg-success/10 hover:text-success"
                disabled={isBulkPending}
                onClick={onOpenBulkRestore}
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
              onClick={onOpenBulkArchive}
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
          <DropdownMenuItem onClick={() => router.push(exportUrl)}>
            <FileDown className="size-4 mr-2" />
            Export CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onOpenExportPdfDialog}>
            <FileText className="size-4 mr-2" />
            Export PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
