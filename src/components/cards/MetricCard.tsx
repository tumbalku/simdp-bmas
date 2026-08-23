import type { ComponentType, ReactNode } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/utils";

export type MetricCardProps = {
  title: string;
  compactTitle?: string;
  value: ReactNode;
  icon: ComponentType<{ className?: string }>;
  description: ReactNode;
  iconClassName?: string;
  valueClassName?: string;
};

export function MetricCard({
  title,
  compactTitle,
  value,
  icon: Icon,
  description,
  iconClassName,
  valueClassName,
}: MetricCardProps) {
  return (
    <Card size="sm" className="gap-1 border-muted-foreground/10 bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-center space-y-0 sm:justify-between">
        <CardTitle className="hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:block">
          {title}
        </CardTitle>
        <div
          className={cn(
            "flex size-6 items-center justify-center rounded-md",
            iconClassName,
          )}
        >
          <Icon className="size-3.5" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center text-center sm:block sm:text-left">
        <div className={cn("text-lg font-semibold sm:text-xl", valueClassName)}>
          {value}
        </div>
        <p className="w-full truncate text-[9px] font-semibold uppercase tracking-wide text-muted-foreground sm:hidden">
          {compactTitle ?? title}
        </p>
        <p className="mt-1 hidden text-[10px] font-medium text-muted-foreground sm:block">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
