"use client";

import { SearchFilterCard } from "@/components/tables/SearchFilterCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <SearchFilterCard
      title={title}
      description={description}
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={searchPlaceholder}
      onApply={onApply}
      onReset={onReset}
      filters={
        <>
          {hasDocumentType ? (
            <Select
              value={documentTypeId || "all"}
              onValueChange={(value) => onDocumentTypeChange(value ?? "all")}
            >
              <SelectTrigger className="w-full md:w-[200px]" aria-label="Jenis dokumen">
                <SelectValue placeholder="Jenis dokumen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Jenis dokumen</SelectItem>
                {documentTypes?.map((documentType) => (
                  <SelectItem key={documentType.id} value={documentType.id}>
                    {documentType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {hasCategory ? (
            <Select
              value={categoryFilter || "all"}
              onValueChange={(value) => onCategoryChange(value || "all")}
            >
              <SelectTrigger className="w-full md:w-[190px]" aria-label="Kategori arsip">
                <SelectValue placeholder="Kategori arsip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Kategori arsip</SelectItem>
                {archiveCategoryOptions?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </>
      }
    />
  );
}
