import type { ComponentType, ReactNode } from "react";

import { CardContainer } from "@/components/cards/CardContainer";
import { cn } from "@/utils";
import {
  RowsPerPageControl,
  type RowsPerPageControlProps,
} from "./RowsPerPageControl";

type DataTableCardProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ComponentType<{ className?: string }> | ReactNode;
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
  const actionContent =
    rowsPerPageControl || extraActions ? (
      <>
        {rowsPerPageControl ? (
          <RowsPerPageControl {...rowsPerPageControl} variant="table" />
        ) : null}
        {extraActions}
      </>
    ) : null;

  return (
    <CardContainer
      title={title}
      description={description}
      descriptionClassName="hidden sm:block"
      icon={icon}
      action={actionContent}
      className={className}
      headerClassName="pb-3"
      contentClassName={cn("space-y-4", contentClassName)}
    >
      <div className="overflow-x-auto rounded-lg border">
        <div className={cn("w-full", tableMinWidthClassName)}>{table}</div>
      </div>

      {emptyState}

      {footerSummary || pagination ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {footerSummary ? <div>{footerSummary}</div> : null}
          {pagination ? (
            <div className="flex justify-center sm:justify-end sm:ml-auto">{pagination}</div>
          ) : null}
        </div>
      ) : null}
    </CardContainer>
  );
}
