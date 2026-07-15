import type { ReactNode } from "react";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type RowsPerPageOption = string | number;

type RowsPerPageControl = {
  value: string;
  onValueChange: (value: string | null) => void;
  options: readonly RowsPerPageOption[];
  label?: string;
  suffix?: string;
};

type DataTableCardProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  rowsPerPageControl?: RowsPerPageControl;
  table: ReactNode;
  tableMinWidthClassName?: string;
  footerSummary?: ReactNode;
  pagination?: ReactNode;
  emptyState?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function DataTableCard({
  title,
  description,
  icon,
  rowsPerPageControl,
  table,
  tableMinWidthClassName,
  footerSummary,
  pagination,
  emptyState,
  className,
  contentClassName,
}: DataTableCardProps) {
  return (
    <Card className={cn("border-muted-foreground/10 shadow-sm", className)}>
      <CardHeader className="gap-3">
        <div className="min-w-0 space-y-0.5">
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {rowsPerPageControl ? (
          <CardAction>
            <RowsPerPageSelect control={rowsPerPageControl} />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className={cn("space-y-4", contentClassName)}>
        <div className="overflow-x-auto rounded-lg border">
          <div className={cn("w-full", tableMinWidthClassName)}>{table}</div>
        </div>

        {emptyState}

        {footerSummary || pagination ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {footerSummary ? <div>{footerSummary}</div> : null}
            {pagination ? <div className="flex justify-end sm:ml-auto">{pagination}</div> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function RowsPerPageSelect({ control }: { control: RowsPerPageControl }) {
  return (
    <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground sm:justify-end">
      <span>{control.label ?? "Tampilkan"}</span>
      <Select value={control.value} onValueChange={control.onValueChange}>
        <SelectTrigger className="h-8 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {control.options.map((option) => (
            <SelectItem key={String(option)} value={String(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span>{control.suffix ?? "row"}</span>
    </div>
  );
}
