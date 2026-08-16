"use client";

import type { ReactNode } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/utils";

export type DataTableColumn<T> = {
  key?: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  headClassName?: string;
  cellClassName?: string;
  sortable?: boolean;
  sortKey?: string;
};

type DataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => string;
  emptyMessage?: ReactNode;
  tableClassName?: string;
  headerClassName?: string;
  rowClassName?: string | ((row: T) => string);
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  currentSortBy?: string;
  currentSortOrder?: "asc" | "desc";
  onSortChange?: (sortBy: string, sortOrder: "asc" | "desc") => void;
};

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  emptyMessage = "Tidak ada data.",
  tableClassName,
  headerClassName,
  rowClassName,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  currentSortBy,
  currentSortOrder,
  onSortChange,
}: DataTableProps<T>) {
  const getRowClassName = (row: T) =>
    typeof rowClassName === "function" ? rowClassName(row) : rowClassName;

  const allKeys = data.map(getRowKey);
  const isAllSelected =
    data.length > 0 &&
    data.every((row) => selectedIds.includes(getRowKey(row)));

  const handleSelectAllChange = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      const newSelection = Array.from(new Set([...selectedIds, ...allKeys]));
      onSelectionChange(newSelection);
    } else {
      const newSelection = selectedIds.filter((id) => !allKeys.includes(id));
      onSelectionChange(newSelection);
    }
  };

  const handleSelectRowChange = (rowKey: string, checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange([...selectedIds, rowKey]);
    } else {
      onSelectionChange(selectedIds.filter((id) => id !== rowKey));
    }
  };

  const renderSortIcon = (column: DataTableColumn<T>) => {
    if (!column.sortable || !column.sortKey) return null;
    const isActive = currentSortBy === column.sortKey;
    if (!isActive) {
      return (
        <ChevronsUpDown className="ml-1.5 size-3 text-muted-foreground/50 shrink-0" />
      );
    }
    return currentSortOrder === "asc" ? (
      <ChevronUp className="ml-1.5 size-3 text-primary shrink-0" />
    ) : (
      <ChevronDown className="ml-1.5 size-3 text-primary shrink-0" />
    );
  };

  return (
    <Table className={tableClassName}>
      <TableHeader className={headerClassName}>
        <TableRow>
          {selectable && (
            <TableHead className="w-[48px] px-4 text-center">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAllChange}
                aria-label="Pilih semua baris"
              />
            </TableHead>
          )}
          {columns.map((column, index) => {
            const isSortable =
              column.sortable && column.sortKey && onSortChange;
            const handleSort = () => {
              if (!isSortable || !column.sortKey) return;
              const nextOrder =
                currentSortBy === column.sortKey && currentSortOrder === "asc"
                  ? "desc"
                  : "asc";
              onSortChange(column.sortKey, nextOrder);
            };

            return (
              <TableHead
                key={column.key ?? index}
                className={cn(
                  column.headClassName,
                  isSortable && "cursor-pointer select-none",
                )}
                onClick={isSortable ? handleSort : undefined}
              >
                {isSortable ? (
                  <div className="inline-flex items-center hover:text-foreground">
                    {column.header}
                    {renderSortIcon(column)}
                  </div>
                ) : (
                  column.header
                )}
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => {
          const rowKey = getRowKey(row);
          return (
            <TableRow key={rowKey} className={cn(getRowClassName(row))}>
              {selectable && (
                <TableCell className="w-[48px] px-4 text-center">
                  <Checkbox
                    checked={selectedIds.includes(rowKey)}
                    onCheckedChange={(checked) =>
                      handleSelectRowChange(rowKey, checked)
                    }
                    aria-label={`Pilih baris ${rowKey}`}
                  />
                </TableCell>
              )}
              {columns.map((column, index) => (
                <TableCell
                  key={column.key ?? index}
                  className={column.cellClassName}
                >
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          );
        })}
        {data.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={selectable ? columns.length + 1 : columns.length}
              className="h-24 text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}
