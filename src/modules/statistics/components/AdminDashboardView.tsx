"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getResponsiveMetricGridClass,
  ResponsiveMetricCard,
} from "@/components/cards/ResponsiveMetricCard";
import { PageHeader } from "@/components/navigation/PageHeader";
import { Users, FileText, ShieldCheck, FileClock } from "lucide-react";
import { DocumentStatusChart } from "./DocumentStatusChart";
import { UploadTrendChart } from "./UploadTrendChart";

type AdminDashboardStats = {
  totalEmployees: number;
  compliantEmployeesCount: number;
  complianceRate: number;
  documentsByStatus: {
    PENDING: number;
    APPROVED: number;
    REJECTED: number;
    EXPIRED: number;
    REPLACED: number;
  };
  documentsByCategory: {
    PERSONAL: number;
    EDUCATION: number;
    EMPLOYMENT: number;
    CERTIFICATION: number;
    LEGAL: number;
  };
  uploadTrend: Array<{
    month: string;
    Uploaded: number;
    Verified: number;
  }>;
};

type AdminDashboardViewProps = {
  stats: AdminDashboardStats;
};

export function AdminDashboardView({ stats }: AdminDashboardViewProps) {
  const uploadTrendData = stats.uploadTrend;

  const documentStatusData = [
    { status: "Pending", total: stats.documentsByStatus.PENDING },
    { status: "Approved", total: stats.documentsByStatus.APPROVED },
    { status: "Rejected", total: stats.documentsByStatus.REJECTED },
    { status: "Expired", total: stats.documentsByStatus.EXPIRED },
  ];

  const totalDocuments =
    stats.documentsByStatus.PENDING +
    stats.documentsByStatus.APPROVED +
    stats.documentsByStatus.REJECTED +
    stats.documentsByStatus.EXPIRED +
    stats.documentsByStatus.REPLACED;

  const metricCards = [
    {
      title: "Total Pegawai",
      compactTitle: "Pegawai",
      value: stats.totalEmployees,
      description: "Pegawai aktif terdaftar",
      icon: Users,
      iconClassName: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Tingkat Kepatuhan",
      compactTitle: "Patuh",
      value: `${stats.complianceRate}%`,
      description: `${stats.compliantEmployeesCount} dari ${stats.totalEmployees} pegawai patuh dokumen`,
      icon: ShieldCheck,
      iconClassName: "bg-emerald-500/10 text-emerald-500",
      valueClassName: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Total Dokumen",
      compactTitle: "Dokumen",
      value: totalDocuments,
      description: "Total arsip digital terunggah",
      icon: FileText,
      iconClassName: "bg-violet-500/10 text-violet-500",
    },
    {
      title: "Antrian Verifikasi",
      compactTitle: "Antrian",
      value: stats.documentsByStatus.PENDING,
      description: "Dokumen butuh review staf",
      icon: FileClock,
      iconClassName: "bg-amber-500/10 text-amber-500",
      valueClassName: "text-amber-600 dark:text-amber-400",
    },
  ];

  const archiveCategories = [
    { label: "Pribadi (Personal)", value: stats.documentsByCategory.PERSONAL, max: totalDocuments || 1, color: "bg-blue-500" },
    { label: "Pendidikan (Education)", value: stats.documentsByCategory.EDUCATION, max: totalDocuments || 1, color: "bg-emerald-500" },
    { label: "Kepegawaian (Employment)", value: stats.documentsByCategory.EMPLOYMENT, max: totalDocuments || 1, color: "bg-violet-500" },
    { label: "Sertifikasi (Certification)", value: stats.documentsByCategory.CERTIFICATION, max: totalDocuments || 1, color: "bg-amber-500" },
    { label: "Hukum & Regulasi (Legal)", value: stats.documentsByCategory.LEGAL, max: totalDocuments || 1, color: "bg-rose-500" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ringkasan Sistem"
        description="Pantau status kepatuhan dokumen, statistik verifikasi, dan arsip pegawai RSUD Bahteramas."
      />

      {/* Metric Cards Grid */}
      <div className={`grid ${getResponsiveMetricGridClass(metricCards.map((metric) => metric.compactTitle))} gap-4 sm:grid-cols-2 lg:grid-cols-4`}>
        {metricCards.map((metric) => (
          <ResponsiveMetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Main Charts & Breakdown Section */}
      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        {/* Verification Trend Chart */}
        <Card size="sm" className="h-full border-muted-foreground/10 bg-card shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Tren Upload & Verifikasi</CardTitle>
            <CardDescription className="text-xs">Statistik perbandingan ritme upload berkas terhadap hasil verifikasi.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1">
            <UploadTrendChart data={uploadTrendData} />
          </CardContent>
        </Card>

        {/* Document Status Pie Chart */}
        <Card size="sm" className="h-full">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Status dokumen</CardTitle>
            <CardDescription className="text-xs">
              Distribusi status dokumen pegawai.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1">
            <DocumentStatusChart data={documentStatusData} />
          </CardContent>
        </Card>
      </div>

      {/* Category List Progression Section */}
      <Card className="shadow-sm border-muted-foreground/10 bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Sebaran Kategori Dokumen</CardTitle>
          <CardDescription className="text-xs">Jumlah berkas kepegawaian digital berdasarkan kategori arsip.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {archiveCategories.map((cat) => {
              const percentage = totalDocuments > 0 ? (cat.value / totalDocuments) * 100 : 0;
              return (
                <div key={cat.label} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-muted-foreground truncate max-w-[150px]">{cat.label}</span>
                    <span className="font-bold tabular-nums text-foreground">{cat.value}</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${percentage}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-right">{percentage.toFixed(0)}% dari total berkas</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
