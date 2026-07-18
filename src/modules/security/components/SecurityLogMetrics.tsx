import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";

import { MetricCard } from "@/components/shared/MetricCard";

type SecurityLogMetricsProps = {
  totalItems: number;
  success: number;
  failed: number;
};

export function SecurityLogMetrics({ totalItems, success, failed }: SecurityLogMetricsProps) {
  return (
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard
          title="Total log"
          value={totalItems.toString()}
          description="Semua audit log sesuai filter aktif."
          icon={Activity}
          iconClassName="bg-primary/10 text-primary"
        />
        <MetricCard
          title="Berhasil"
          value={success.toString()}
          description="Log berhasil pada halaman ini."
          icon={CheckCircle2}
          iconClassName="bg-success/10 text-success"
        />
        <MetricCard
          title="Gagal"
          value={failed.toString()}
          description="Log gagal pada halaman ini."
          icon={AlertTriangle}
          iconClassName="bg-destructive/10 text-destructive"
        />
      </div>
  );
}
