import { Clock3, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ReviewHistoryItem, ReviewStatusConfig } from "./types";

export type DocumentVerificationHistoryProps = {
  histories: ReviewHistoryItem[];
  statusConfig: Record<string, ReviewStatusConfig>;
  formatDate: (value: string | null) => string;
  emptyDescription?: string;
};

export function DocumentVerificationHistory({
  histories,
  statusConfig,
  formatDate,
  emptyDescription,
}: DocumentVerificationHistoryProps) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ShieldCheck className="size-4" />
          Riwayat Verifikasi
        </CardTitle>
        <CardDescription className="text-xs">
          Semua aktivitas verifikasi yang pernah dilakukan pada dokumen ini.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {histories.length === 0 ? (
          <div className="flex min-h-[120px] items-center justify-center text-center">
            <div className="space-y-2">
              <Clock3 className="mx-auto size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Belum ada riwayat verifikasi.</p>
              {emptyDescription ? (
                <p className="text-xs text-muted-foreground">{emptyDescription}</p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {histories.map((history, index) => {
              const historyStatus = statusConfig[history.status] || statusConfig.PENDING;
              const HistoryIcon = historyStatus.icon;
              const iconColor = historyStatus.color.split(" ").slice(0, 2).join(" ");

              return (
                <div key={history.id} className="relative rounded-lg border bg-card p-3">
                  {index > 0 && (
                    <div className="absolute -top-3 left-7 h-3 w-px border-l border-dashed" />
                  )}
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full ${iconColor}`}
                    >
                      <HistoryIcon className="size-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge variant="outline" className={historyStatus.color}>
                          {historyStatus.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(history.reviewedAt)}
                        </span>
                      </div>
                      <p className="text-sm">{history.reviewNote || "Tidak ada catatan."}</p>
                      <p className="text-xs text-muted-foreground">
                        Reviewer: {history.reviewerName}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
