"use client";

import { Search, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FilterOption = {
  value: string;
  label: string;
};

type SelectFilter = {
  value: string;
  onValueChange: (value: string | null) => void;
  options: readonly FilterOption[];
  placeholder: string;
  ariaLabel: string;
};

type DocumentSearchFilterProps = {
  description: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  primaryFilter: SelectFilter;
  rowsPerPage: string;
  onRowsPerPageChange: (value: string | null) => void;
  pageSizeOptions: readonly number[];
  onApply: () => void;
  onReset: () => void;
  title?: string;
};

export function DocumentSearchFilter({
  title = "Filter & Pencarian",
  description,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  primaryFilter,
  rowsPerPage,
  onRowsPerPageChange,
  pageSizeOptions,
  onApply,
  onReset,
}: DocumentSearchFilterProps) {
  return (
    <Card className="border-muted-foreground/10 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="size-4" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(220px,0.8fr)_180px_auto] lg:items-center">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onApply();
              }}
            />
          </div>

          <Select
            value={primaryFilter.value}
            onValueChange={primaryFilter.onValueChange}
          >
            <SelectTrigger className="w-full" aria-label={primaryFilter.ariaLabel}>
              <SelectValue placeholder={primaryFilter.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {primaryFilter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={rowsPerPage} onValueChange={onRowsPerPageChange}>
            <SelectTrigger className="w-full" aria-label="Row per halaman">
              <SelectValue placeholder="Row per halaman" />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option} row
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
            <Button type="button" className="gap-2" onClick={onApply}>
              <Search className="size-4" />
              Terapkan
            </Button>
            <Button type="button" variant="outline" onClick={onReset}>
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
