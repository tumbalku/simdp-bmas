"use client";

import type { ReactNode } from "react";
import { Filter, Search } from "lucide-react";

import { CardContainer } from "@/components/cards/CardContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type SearchFilterCardProps = {
  title?: string;
  description?: string;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  onApply: () => void;
  onReset: () => void;
};

export function SearchFilterCard({
  title = "Filter & Pencarian",
  description,
  search,
  onSearchChange,
  searchPlaceholder = "Cari...",
  filters,
  onApply,
  onReset,
}: SearchFilterCardProps) {
  return (
    <CardContainer
      icon={<Filter className="size-4 shrink-0 text-primary" />}
      title={title}
      description={description}
      descriptionClassName="hidden sm:block"
      headerClassName="pb-2"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onApply();
            }}
          />
        </div>

        {filters ? (
          <div className="grid grid-cols-2 gap-3 md:flex md:items-center">{filters}</div>
        ) : null}

        <div className="grid grid-cols-2 gap-2 md:flex md:flex-row md:items-center">
          <Button type="button" className="gap-2 md:w-auto" onClick={onApply}>
            <Search className="size-4" />
            Terapkan
          </Button>
          <Button type="button" variant="outline" className="md:w-auto" onClick={onReset}>
            Reset
          </Button>
        </div>
      </div>
    </CardContainer>
  );
}
