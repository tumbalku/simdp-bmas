"use client";

import { Download, MoreVertical, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type DocumentBulkActionsBarProps = {
  isArchiveView: boolean;
  selectedDocCount: number;
  isBulkPending: boolean;
  isExporting: boolean;
  onOpenBulkDelete: () => void;
  onOpenBulkRestore: () => void;
  onDownloadPdf: (e: React.MouseEvent) => void;
};

export function DocumentBulkActionsBar({
  isArchiveView,
  selectedDocCount,
  isBulkPending,
  isExporting,
  onOpenBulkDelete,
  onOpenBulkRestore,
  onDownloadPdf,
}: DocumentBulkActionsBarProps) {
  const hasSelection = selectedDocCount > 0;

  return (
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
      <DropdownMenuContent align="end" className="w-52 mt-1 rounded-lg">
        {isArchiveView && hasSelection && (
          <>
            <DropdownMenuItem
              disabled={isBulkPending}
              onClick={onOpenBulkRestore}
              className="text-success focus:text-success focus:bg-success/10 cursor-pointer"
            >
              <RotateCcw className="size-4 mr-2 text-success" />
              Pulihkan Semua ({selectedDocCount})
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              disabled={isBulkPending}
              onClick={onOpenBulkDelete}
              className="cursor-pointer"
            >
              <Trash2 className="size-4 mr-2" />
              Hapus Semua ({selectedDocCount})
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={onDownloadPdf} className="cursor-pointer">
          <Download className="size-4 mr-2" />
          Download PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
