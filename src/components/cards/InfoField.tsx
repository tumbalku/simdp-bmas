import type { ComponentType, ReactNode } from "react";

import { cn } from "@/utils";

export type InfoFieldVariant = "stacked" | "inline";

export type InfoFieldProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
  variant?: InfoFieldVariant;
  truncate?: boolean;
  className?: string;
};

export function InfoField({
  icon: Icon,
  label,
  value,
  variant = "stacked",
  truncate = true,
  className,
}: InfoFieldProps) {
  const displayValue = value || "-";
  const title = typeof displayValue === "string" ? displayValue : undefined;

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex min-w-0 items-start gap-2 rounded-lg border bg-muted/20 p-2",
          className,
        )}
      >
        <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div
            className={cn(
              "text-xs font-medium text-foreground",
              truncate ? "truncate" : "break-words leading-5",
            )}
            title={title}
          >
            {displayValue}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border bg-muted/25 p-2.5", className)}>
      <div className="flex min-w-0 items-center gap-1.5">
        <Icon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <div
        className={cn(
          "mt-0.5 text-xs font-medium text-foreground",
          truncate ? "truncate" : "break-words leading-5",
        )}
        title={title}
      >
        {displayValue}
      </div>
    </div>
  );
}
