"use client";

import { Download, MoreVertical, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  return (
    <div className="flex items-center gap-2">
      {isArchiveView && selectedDocCount > 0 && (
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
      )}
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
        <DropdownMenuContent align="end" className="w-48 mt-1 rounded-lg">
          <DropdownMenuItem onClick={onDownloadPdf}>
            <Download className="size-4 mr-2" />
            Download PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
