import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ReviewStatusConfig } from "./types";

export type DocumentStatusCardProps = {
  label: string;
  status: ReviewStatusConfig;
  actions?: ReactNode;
};

export function DocumentStatusCard({ label, status, actions }: DocumentStatusCardProps) {
  const StatusIcon = status.icon;
  const iconColor = status.color.split(" ").slice(0, 2).join(" ");

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className={`flex size-8 items-center justify-center rounded-full ${iconColor}`}>
            <StatusIcon className="size-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <Badge variant="secondary" className="mt-0.5 text-xs font-medium">
              {status.label}
            </Badge>
          </div>
        </div>
        {actions}
      </CardContent>
    </Card>
  );
}
