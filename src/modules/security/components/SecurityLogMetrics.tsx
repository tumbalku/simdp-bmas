import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";

import {
  getResponsiveMetricGridClass,
  ResponsiveMetricCard,
} from "@/components/cards/ResponsiveMetricCard";

type SecurityLogMetricsProps = {
  totalItems: number;
  success: number;
  failed: number;
};

export function SecurityLogMetrics({ totalItems, success, failed }: SecurityLogMetricsProps) {
  return (
      <div className={`grid ${getResponsiveMetricGridClass(["Total log", "Berhasil", "Gagal"])} gap-1.5 sm:gap-4 sm:grid-cols-3`}>
        <ResponsiveMetricCard
          title="Total log"
          compactTitle="Total"
          value={totalItems.toString()}
          description="Semua audit log sesuai filter aktif."
          icon={Activity}
          iconClassName="bg-primary/10 text-primary"
        />
        <ResponsiveMetricCard
          title="Berhasil"
          compactTitle="Berhasil"
          value={success.toString()}
          description="Log berhasil pada halaman ini."
          icon={CheckCircle2}
          iconClassName="bg-success/10 text-success"
        />
        <ResponsiveMetricCard
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
