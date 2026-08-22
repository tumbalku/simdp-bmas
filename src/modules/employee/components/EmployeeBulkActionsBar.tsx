"use client";

import { useRouter } from "next/navigation";
import { Archive, FileDown, FileText, FileUp, MoreVertical, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type EmployeeBulkActionsBarProps = {
  selectedCount: number;
  isArchiveView: boolean;
  isBulkPending: boolean;
  exportUrl: string;
  exportPdfUrl?: string;
  onOpenBulkDelete: () => void;
  onOpenBulkRestore: () => void;
  onOpenBulkArchive: () => void;
  onOpenExportPdfDialog?: () => void;
};

export function EmployeeBulkActionsBar({
  selectedCount,
  isArchiveView,
  isBulkPending,
  exportUrl,
  exportPdfUrl,
  onOpenBulkDelete,
  onOpenBulkRestore,
  onOpenBulkArchive,
  onOpenExportPdfDialog,
}: EmployeeBulkActionsBarProps) {
  const router = useRouter();
  const hasSelection = selectedCount > 0;
  const canExportPdf = Boolean(exportPdfUrl || onOpenExportPdfDialog);

  const handleExportPdfClick = () => {
    if (exportPdfUrl) {
      router.push(exportPdfUrl);
    } else if (onOpenExportPdfDialog) {
      onOpenExportPdfDialog();
    }
  };

  return (
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
      <DropdownMenuContent align="end" className="w-52 mt-1 rounded-lg">
        {hasSelection && (
          <>
            {isArchiveView ? (
              <>
                <DropdownMenuItem
                  disabled={isBulkPending}
                  onClick={onOpenBulkRestore}
                  className="text-success focus:text-success focus:bg-success/10 cursor-pointer"
                >
                  <RotateCcw className="size-4 mr-2 text-success" />
                  Pulihkan Semua ({selectedCount})
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  disabled={isBulkPending}
                  onClick={onOpenBulkDelete}
                  className="cursor-pointer"
                >
                  <Trash2 className="size-4 mr-2" />
                  Hapus Semua ({selectedCount})
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem
                variant="destructive"
                disabled={isBulkPending}
                onClick={onOpenBulkArchive}
                className="cursor-pointer"
              >
                <Archive className="size-4 mr-2" />
                Arsipkan Semua ({selectedCount})
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => router.push("/master-data/employees/imports")} className="cursor-pointer">
          <FileUp className="size-4 mr-2" />
          Import CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(exportUrl)} className="cursor-pointer">
          <FileDown className="size-4 mr-2" />
          Export CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!canExportPdf}
          onClick={handleExportPdfClick}
          className={canExportPdf ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
        >
          <FileText className="size-4 mr-2" />
          Export PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
