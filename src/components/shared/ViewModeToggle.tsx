"use client";

import { LayoutGrid, Table2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type ViewMode = "grid" | "list";

type ViewModeToggleProps = {
  value: ViewMode;
  onValueChange: (value: ViewMode) => void;
  title?: string;
  description?: string;
};

export function ViewModeToggle({
  value,
  onValueChange,
  title = "Mode Tampilan",
  description = "Pilih tampilan kartu atau tabel untuk daftar dokumen.",
}: ViewModeToggleProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="inline-flex w-full rounded-md border bg-muted/30 p-1 sm:w-auto">
        <Button
          type="button"
          size="sm"
          variant={value === "grid" ? "default" : "ghost"}
          className="flex-1 gap-2 sm:flex-none"
          aria-pressed={value === "grid"}
          onClick={() => onValueChange("grid")}
        >
          <LayoutGrid className="size-4" />
          Card
        </Button>
        <Button
          type="button"
          size="sm"
          variant={value === "list" ? "default" : "ghost"}
          className="flex-1 gap-2 sm:flex-none"
          aria-pressed={value === "list"}
          onClick={() => onValueChange("list")}
        >
          <Table2 className="size-4" />
          Table
        </Button>
      </div>
    </div>
  );
}
