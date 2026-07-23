import type { ComponentType, ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/utils";

export type CompactMetricCardProps = {
  title: string;
  value: ReactNode;
  icon: ComponentType<{ className?: string }>;
  iconClassName?: string;
  valueClassName?: string;
};

export function CompactMetricCard({
  title,
  value,
  icon: Icon,
  iconClassName,
  valueClassName,
}: CompactMetricCardProps) {
  return (
    <Card className="min-w-0 gap-0 rounded-lg border-muted-foreground/10 bg-card py-2 shadow-sm sm:py-2.5">
      <CardContent className="flex min-w-0 flex-col items-center gap-1 px-1.5 text-center sm:px-2">
        <div
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-md",
            iconClassName,
          )}
        >
          <Icon className="size-3.5" />
        </div>
        <div className={cn("text-lg font-semibold leading-none sm:text-xl", valueClassName)}>
          {value}
        </div>
        <p className="w-full truncate text-[9px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[10px]">
          {title}
        </p>
      </CardContent>
    </Card>
  );
}
