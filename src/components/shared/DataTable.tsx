"use client";

import type { ReactNode } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  key?: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  headClassName?: string;
  cellClassName?: string;
};

type DataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => string;
  emptyMessage?: ReactNode;
  tableClassName?: string;
  headerClassName?: string;
  rowClassName?: string | ((row: T) => string);
};

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  emptyMessage = "Tidak ada data.",
  tableClassName,
  headerClassName,
  rowClassName,
}: DataTableProps<T>) {
  const getRowClassName = (row: T) =>
    typeof rowClassName === "function" ? rowClassName(row) : rowClassName;

  return (
    <Table className={tableClassName}>
      <TableHeader className={headerClassName}>
        <TableRow>
          {columns.map((column, index) => (
            <TableHead key={column.key ?? index} className={column.headClassName}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={getRowKey(row)} className={cn(getRowClassName(row))}>
            {columns.map((column, index) => (
              <TableCell key={column.key ?? index} className={column.cellClassName}>
                {column.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}
