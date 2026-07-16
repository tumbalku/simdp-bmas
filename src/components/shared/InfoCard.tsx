import type { ComponentType, ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { InfoField, type InfoFieldVariant } from "./InfoField";

export type InfoCardField = {
  key: string;
  label: string;
  value: ReactNode;
  icon: ComponentType<{ className?: string }>;
  hidden?: boolean;
};

export type InfoCardProps = {
  title: string;
  description?: string;
  icon: ComponentType<{ className?: string }>;
  fields: InfoCardField[];
  columns?: 1 | 2 | 3 | 4;
  fieldVariant?: InfoFieldVariant;
  truncate?: boolean;
  className?: string;
  contentClassName?: string;
};

export function InfoCard({
  title,
  description,
  icon: Icon,
  fields,
  columns = 1,
  fieldVariant = "stacked",
  truncate = true,
  className,
  contentClassName,
}: InfoCardProps) {
  const visibleFields = fields.filter((field) => !field.hidden);
  const gridClassName = {
    1: "space-y-2",
    2: "grid gap-2 md:grid-cols-2",
    3: "grid gap-2 md:grid-cols-2 xl:grid-cols-3",
    4: "grid gap-2 md:grid-cols-2 xl:grid-cols-4",
  }[columns];

  return (
    <Card className={className}>
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="size-4" />
          {title}
        </CardTitle>
        {description ? <CardDescription className="text-xs">{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className={cn("pt-0", contentClassName)}>
        <div className={cn(gridClassName)}>
          {visibleFields.map((field) => (
            <InfoField
              key={field.key}
              icon={field.icon}
              label={field.label}
              value={field.value}
              variant={fieldVariant}
              truncate={truncate}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
