"use client";

import type { ReactNode } from "react";
import { Filter, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/utils";

export type FilterOption = {
  value: string;
  label: string;
};

export type SelectFilterConfig = {
  key: string;
  value: string;
  onValueChange: (value: string | null) => void;
  options: readonly FilterOption[];
  placeholder: string;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
};

export type CustomFieldConfig = {
  key: string;
  label?: string;
  ariaLabel?: string;
  type: "date" | "number";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: number;
  inputMode?: "search" | "text" | "none" | "tel" | "url" | "email" | "numeric" | "decimal";
};

export type DataFilterCardProps = {
  title?: string;
  description?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  selectFilters?: SelectFilterConfig[];
  customFields?: CustomFieldConfig[];
  children?: ReactNode;
  onApply: () => void;
  onReset: () => void;
  className?: string;
};

export function DataFilterCard({
  title = "Filter & Pencarian",
  description,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Cari...",
  selectFilters = [],
  customFields = [],
  children,
  onApply,
  onReset,
  className,
}: DataFilterCardProps) {
  const hasSearch = searchValue !== undefined && onSearchChange !== undefined;
  const isInlineDesktop =
    hasSearch && selectFilters.length <= 2 && customFields.length === 0;

  const renderSearchInput = () => {
    if (!onSearchChange) return null;
    return (
      <div className={cn("relative", isInlineDesktop && "col-span-2 md:col-span-1")}>
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
    );
  };

  return (
    <Card className={cn("border-muted-foreground/10 shadow-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="size-4" />
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="hidden sm:block">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {isInlineDesktop ? (
          /* Smart Auto Layout: <= 2 select & no custom fields -> 3-col inline layout on desktop */
          <div className="grid gap-3 grid-cols-2 md:grid-cols-[minmax(200px,1.2fr)_minmax(160px,1fr)_minmax(160px,1fr)_auto] md:items-end">
            {renderSearchInput()}
            {selectFilters.map((filter) => (
              <div key={filter.key} className={cn(filter.label && "space-y-1.5")}>
                {filter.label ? (
                  <Label htmlFor={filter.key} className="text-[11px] font-medium text-muted-foreground">
                    {filter.label}
                  </Label>
                ) : null}
                <Select
                  value={filter.value}
                  onValueChange={filter.onValueChange}
                  disabled={filter.disabled}
                >
                  <SelectTrigger id={filter.label ? filter.key : undefined} className="w-full" aria-label={filter.ariaLabel ?? filter.placeholder}>
                    <SelectValue placeholder={filter.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <div className="grid col-span-2 grid-cols-2 gap-2 md:col-span-1 md:flex md:flex-row md:justify-end">
              <Button type="button" className="gap-2 md:w-auto" onClick={onApply}>
                <Search className="size-4" />
                Terapkan
              </Button>
              <Button type="button" variant="outline" className="md:w-auto" onClick={onReset}>
                Reset
              </Button>
            </div>
          </div>
        ) : (
          /* Standard Layout: > 2 selects or has custom fields -> search full width on top */
          <>
            {hasSearch ? renderSearchInput() : null}

            {selectFilters.length > 0 ? (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
                {selectFilters.map((filter) => (
                  <div key={filter.key} className={cn(filter.label && "space-y-1.5")}>
                    {filter.label ? (
                      <Label htmlFor={filter.key} className="text-[11px] font-medium text-muted-foreground">
                        {filter.label}
                      </Label>
                    ) : null}
                    <Select
                      value={filter.value}
                      onValueChange={filter.onValueChange}
                      disabled={filter.disabled}
                    >
                      <SelectTrigger id={filter.label ? filter.key : undefined} className="w-full" aria-label={filter.ariaLabel ?? filter.placeholder}>
                        <SelectValue placeholder={filter.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {filter.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            ) : null}

            {customFields.length > 0 ? (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
                {customFields.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    {field.label ? (
                      <span className="text-[11px] font-medium text-muted-foreground">{field.label}</span>
                    ) : null}
                    <Input
                      id={field.key}
                      className="px-2 text-xs"
                      aria-label={field.ariaLabel ?? field.label}
                      type={field.type}
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.value)}
                      placeholder={field.placeholder}
                      min={field.min}
                      inputMode={field.inputMode}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            {children}

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:justify-end">
              <Button type="button" className="gap-2 sm:w-auto" onClick={onApply}>
                <Search className="size-4" />
                Terapkan
              </Button>
              <Button type="button" variant="outline" className="sm:w-auto" onClick={onReset}>
                Reset
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
