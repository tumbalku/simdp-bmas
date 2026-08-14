"use client";

import { useStatisticsCharts } from "../hooks";
import { AlertCircle, AlertTriangle, Clock, FileText, RefreshCw, ShieldCheck, TrendingUp, Users } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/navigation/PageHeader";
import { ResponsiveMetricCard } from "@/components/cards/ResponsiveMetricCard";
import { EmptyState } from "./StatisticsCharts";
import { StatisticsSkeleton } from "./StatisticsSkeleton";
import { StatisticsTabs } from "./StatisticsTabs";

export default function StatisticsView() {
  const { data, isLoading, error, refetch } = useStatisticsCharts(true);

  if (isLoading) {
    return <StatisticsSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Statistik Kepegawaian"
          description="Gagal memuat visualisasi statistik data pegawai."
        />
        <Alert variant="destructive" className="my-6">
          <AlertCircle className="size-4" />
          <AlertTitle>Gagal Memuat Statistik</AlertTitle>
          <AlertDescription className="flex flex-col gap-4 mt-2 items-start">
            <span>{error instanceof Error ? error.message : "Terjadi kesalahan saat memuat data statistik."}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="bg-background text-foreground">
              <RefreshCw className="size-3 mr-2" /> Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Statistik Kepegawaian"
          description="Visualisasi data demografi, status kepegawaian, dan kepatuhan arsip dokumen pegawai RSUD Bahteramas."
        />
        <EmptyState message="Data statistik tidak ditemukan atau kosong." />
      </div>
    );
  }

  // Calculate stats from DTO
  const totalEmployees = data.employeeByGender.reduce((sum, item) => sum + item.value, 0);
  const totalDocuments = data.documentsByArchiveCategory.reduce((sum, item) => sum + item.value, 0);
  const totalUploadsLastSixMonths = data.monthlyUploadTrend.reduce((sum, item) => sum + item.total, 0);
  
  // Total verifications from summary
  const totalVerifications = data.verificationStatusSummary.reduce((sum, item) => sum + item.value, 0);
  
  // Total missing mandatory documents from top missing DTO
  const totalMissingMandatory = data.missingMandatoryDocumentsTop.reduce((sum, item) => sum + item.value, 0);
  
  // Total expiring in next 30 days
  const expiringWithin30Days = data.expiringDocumentsSummary.find(item => item.days === 30)?.value ?? 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Statistik Kepegawaian"
        description="Visualisasi data demografi, status kepegawaian, dan kepatuhan arsip dokumen pegawai RSUD Bahteramas."
        className="pb-0"
      />

      {/* KPI Cards Grid */}
      <div className="flex flex-wrap justify-center gap-1.5 sm:grid sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 [&>div]:w-[calc(25%-0.375rem)] sm:[&>div]:w-auto">
        <ResponsiveMetricCard
          title="Total Pegawai"
          compactTitle="Pegawai"
          value={totalEmployees}
          description="Pegawai aktif terdaftar"
          icon={Users}
          iconClassName="bg-teal-500/10 text-teal-600 dark:text-teal-400"
        />
        <ResponsiveMetricCard
          title="Total Dokumen"
          compactTitle="Dokumen"
          value={totalDocuments}
          description="Berkas digital terunggah"
          icon={FileText}
          iconClassName="bg-sky-500/10 text-sky-600 dark:text-sky-400"
        />
        <ResponsiveMetricCard
          title="Upload (6 Bln)"
          compactTitle="Upload"
          value={totalUploadsLastSixMonths}
          description="Berkas baru diunggah"
          icon={TrendingUp}
          iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <ResponsiveMetricCard
          title="Riwayat Verifikasi"
          compactTitle="Verifikasi"
          value={totalVerifications}
          description="Total dokumen ditinjau"
          icon={ShieldCheck}
          iconClassName="bg-purple-500/10 text-purple-600 dark:text-purple-400"
        />
        <ResponsiveMetricCard
          title="Kekurangan Dokumen"
          compactTitle="Kurang"
          value={totalMissingMandatory}
          description="Kekurangan berkas wajib"
          icon={AlertTriangle}
          iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          valueClassName={totalMissingMandatory > 0 ? "text-amber-600 dark:text-amber-400" : ""}
        />
        <ResponsiveMetricCard
          title="Hampir Kedaluwarsa"
          compactTitle="Expired"
          value={expiringWithin30Days}
          description="Masa berlaku ≤ 30 hari"
          icon={Clock}
          iconClassName="bg-rose-500/10 text-rose-600 dark:text-rose-400"
          valueClassName={expiringWithin30Days > 0 ? "text-rose-600 dark:text-rose-400" : ""}
        />
      </div>

      <StatisticsTabs data={data} totalEmployees={totalEmployees} />
    </div>
  );
}
