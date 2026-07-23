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
  value: ReactNode;
  description: ReactNode;
  icon: ComponentType<{ className?: string }>;
  iconClassName?: string;
  valueClassName?: string;
};

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
  valueClassName,
}: MetricCardProps) {
  return (
    <Card size="sm" className="gap-1 border-muted-foreground/10 bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
      <CardContent>
        <div className={cn("text-xl font-semibold", valueClassName)}>{value}</div>
        <p className="mt-1 text-[10px] font-medium text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
