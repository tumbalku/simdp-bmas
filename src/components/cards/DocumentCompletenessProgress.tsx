import { FileCheck2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressValue } from "@/components/ui/progress";

type DocumentCompletenessProgressProps = {
  completed: number;
  total: number;
};

export function DocumentCompletenessProgress({ completed, total }: DocumentCompletenessProgressProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card className="border-muted-foreground/10 bg-card shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold">Kelengkapan dokumen wajib</CardTitle>
          <CardDescription className="text-xs">
            {total > 0
              ? `${percentage}% dokumen wajib sudah diunggah.`
              : "Belum ada jenis dokumen wajib yang ditetapkan untuk Anda."}
          </CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-bold tabular-nums text-primary">
            {completed}/{total}
          </span>
          <FileCheck2 className="size-5 text-primary" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={percentage} aria-label={`Kelengkapan dokumen ${percentage}%`} className="gap-2">
          <ProgressValue className="text-xs font-semibold text-foreground" />
        </Progress>
      </CardContent>
    </Card>
  );
}
