"use client";

import type { ReactNode } from "react";
import { LayoutGrid, Table2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type ViewMode = "grid" | "list";

type ViewModeToggleProps = {
  value: ViewMode;
  onValueChange: (value: ViewMode) => void;
  leading?: ReactNode;
};

export function ViewModeToggle({
  value,
  onValueChange,
  leading,
}: ViewModeToggleProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {leading ? <div className="flex justify-start">{leading}</div> : <div />}
      <div className="inline-flex w-full rounded-md border border-muted-foreground/10 bg-card p-1 shadow-sm sm:w-auto">
        <Button
          type="button"
          size="sm"
          variant={value === "grid" ? "default" : "ghost"}
          className="flex-1 gap-2 sm:flex-none"
          aria-pressed={value === "grid"}
          onClick={() => onValueChange("grid")}
        >
          <LayoutGrid className="size-4" />
          Grid
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
          List
        </Button>
      </div>
    </div>
  );
}
