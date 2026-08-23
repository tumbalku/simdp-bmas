import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";

import { MetricCard } from "@/components/cards/MetricCard";

type SecurityLogMetricsProps = {
  totalItems: number;
  success: number;
  failed: number;
};

export function SecurityLogMetrics({ totalItems, success, failed }: SecurityLogMetricsProps) {
  return (
      <div className="grid grid-cols-3 gap-1.5 sm:gap-4 sm:grid-cols-3">
        <MetricCard
          title="Total log"
          compactTitle="Total"
          value={totalItems.toString()}
          description="Semua audit log sesuai filter aktif."
          icon={Activity}
          iconClassName="bg-primary/10 text-primary"
        />
        <MetricCard
          title="Berhasil"
          compactTitle="Berhasil"
          value={success.toString()}
          description="Log berhasil pada halaman ini."
          icon={CheckCircle2}
          iconClassName="bg-success/10 text-success"
        />
        <MetricCard
          title="Gagal"
          compactTitle="Gagal"
          value={failed.toString()}
          description="Log gagal pada halaman ini."
          icon={AlertTriangle}
          iconClassName="bg-destructive/10 text-destructive"
        />
      </div>
  );
}
