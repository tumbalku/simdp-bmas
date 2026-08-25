"use client";

import { Button } from "@/components/ui/button";
import { CardContainer } from "@/components/cards/CardContainer";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Search } from "lucide-react";

export type DocumentFilterCardProps = {
  title?: string;
  description?: string;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  documentTypeId?: string;
  onDocumentTypeChange?: (value: string) => void;
  documentTypes?: { id: string; name: string }[];
  categoryFilter?: string;
  onCategoryChange?: (value: string) => void;
  archiveCategoryOptions?: readonly { value: string; label: string }[];
  onApply: () => void;
  onReset: () => void;
};

export function DocumentFilterCard({
  title = "Filter & Pencarian",
  description,
  search,
  onSearchChange,
  searchPlaceholder = "Cari...",
  documentTypeId,
  onDocumentTypeChange,
  documentTypes,
  categoryFilter,
  onCategoryChange,
  archiveCategoryOptions,
  onApply,
  onReset,
}: DocumentFilterCardProps) {
  const hasDocumentType = onDocumentTypeChange !== undefined;
  const hasCategory = onCategoryChange !== undefined;

  return (
    <CardContainer
      icon={<Filter className="size-4 shrink-0 text-primary" />}
      title={title}
      description={description}
      descriptionClassName="hidden sm:block"
      headerClassName="pb-2"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onApply();
            }}
          />
        </div>

        {/* Select Controls Container */}
        {(hasDocumentType || hasCategory) && (
          <div className="grid grid-cols-2 gap-3 md:flex md:items-center">
            {hasDocumentType && (
              <Select
                value={documentTypeId || "all"}
                onValueChange={(val) => onDocumentTypeChange(val ?? "all")}
              >
                <SelectTrigger className="w-full md:w-[200px]" aria-label="Jenis dokumen">
                  <SelectValue placeholder="Jenis dokumen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Jenis dokumen</SelectItem>
                  {documentTypes?.map((dt) => (
                    <SelectItem key={dt.id} value={dt.id}>
                      {dt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {hasCategory && (
              <Select
                value={categoryFilter || "all"}
                onValueChange={(val) => onCategoryChange(val || "all")}
              >
                <SelectTrigger className="w-full md:w-[190px]" aria-label="Kategori arsip">
                  <SelectValue placeholder="Kategori arsip" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Kategori arsip</SelectItem>
                  {archiveCategoryOptions?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Action Buttons */}
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
