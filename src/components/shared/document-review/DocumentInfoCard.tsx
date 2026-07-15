import type { ComponentType } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DocumentInfoField } from "./DocumentInfoField";
import type { ReviewInfoField } from "./types";

export type DocumentInfoCardProps = {
  title: string;
  description?: string;
  icon: ComponentType<{ className?: string }>;
  fields: ReviewInfoField[];
  columns?: 1 | 2;
};

export function DocumentInfoCard({
  title,
  description,
  icon: Icon,
  fields,
  columns = 1,
}: DocumentInfoCardProps) {
  const visibleFields = fields.filter((field) => !field.hidden);

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="size-4" />
          {title}
        </CardTitle>
        {description ? <CardDescription className="text-xs">{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="pt-0">
        <div className={cn(columns === 2 ? "grid gap-2 sm:grid-cols-2" : "space-y-2")}>
          {visibleFields.map((field) => (
            <DocumentInfoField
              key={field.key}
              icon={field.icon}
              label={field.label}
              value={field.value}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
