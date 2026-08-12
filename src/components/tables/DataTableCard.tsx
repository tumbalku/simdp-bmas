import type { ReactNode } from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/utils";
import {
  RowsPerPageControl,
  type RowsPerPageControlProps,
} from "./RowsPerPageControl";

type DataTableCardProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  rowsPerPageControl?: RowsPerPageControlProps;
  extraActions?: ReactNode;
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
  extraActions,
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
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </div>
        {rowsPerPageControl || extraActions ? (
          <CardAction className="flex items-center gap-2">
            {rowsPerPageControl ? (
              <RowsPerPageControl {...rowsPerPageControl} variant="table" />
            ) : null}
            {extraActions}
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
            {pagination ? (
              <div className="flex justify-end sm:ml-auto">{pagination}</div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
