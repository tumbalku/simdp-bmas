"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/utils";

type RowsPerPageOption = string | number;

export type RowsPerPageControlProps = {
  value: string;
  onValueChange: (value: string | null) => void;
  options: readonly RowsPerPageOption[];
  label?: string;
  suffix?: string;
  variant?: "card" | "table";
};

export function RowsPerPageControl({
  value,
  onValueChange,
  options,
  label = "Tampilkan",
  suffix = "baris",
  variant = "card",
}: RowsPerPageControlProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground sm:justify-end",
        variant === "card"
          ? "border border-muted-foreground/10 bg-card shadow-sm"
          : "border border-transparent bg-transparent shadow-none"
      )}
    >
      <span className="hidden sm:inline">{label}</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-7 w-14 px-2 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={String(option)} value={String(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span>{suffix}</span>
    </div>
  );
}
