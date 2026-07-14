"use client";

import React from "react";
type ChartDatum = Record<string, string | number | null | undefined>;
import { useStatisticsCharts } from "../hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DonutChart } from "@/components/charts/DonutChart";
import { AreaChart } from "@/components/charts/AreaChart";
import {
  Users,
  FileText,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Clock,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  chartTooltipStyle,
  getChartColor,
  defaultValueFormatter,
} from "@/lib/chartUtils";

// Custom empty state component
function EmptyState({ message = "Tidak ada data untuk ditampilkan" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <AlertCircle className="mb-2 size-7 text-muted-foreground/60" />
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

// Custom simple bar chart component (supporting vertical/horizontal layouts)
type SimpleBarChartProps = {
  data: { label: string; value: number }[];
  layout?: "horizontal" | "vertical";
  height?: number;
  barColor?: string;
  yAxisWidth?: number;
};

function SimpleBarChart({
  data,
  layout = "vertical",
  height = 220,
  barColor = "var(--chart-1)",
  yAxisWidth = 100,
}: SimpleBarChartProps) {
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  const isHorizontal = layout === "horizontal";

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          layout={isHorizontal ? "vertical" : "horizontal"}
          margin={{ top: 10, right: 10, left: isHorizontal ? 10 : 0, bottom: 10 }}
        >
          <CartesianGrid
            vertical={isHorizontal}
            horizontal={!isHorizontal}
            stroke="var(--border)"
            strokeDasharray="3 3"
          />
          {isHorizontal ? (
            <>
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                stroke="var(--muted-foreground)"
                fontSize={12}
              />
              <YAxis
                dataKey="label"
                type="category"
                tickLine={false}
                axisLine={false}
                width={yAxisWidth}
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickFormatter={(value) => (value && value.length > 20 ? `${value.slice(0, 18)}...` : value)}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickFormatter={(value) => (value && value.length > 12 ? `${value.slice(0, 10)}...` : value)}
              />
              <YAxis
                type="number"
                tickLine={false}
                axisLine={false}
                stroke="var(--muted-foreground)"
                fontSize={12}
              />
            </>
          )}
          <Tooltip
            formatter={(value) => defaultValueFormatter(Number(value))}
            contentStyle={chartTooltipStyle}
          />
          <Bar
            dataKey="value"
            fill={barColor}
            radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            maxBarSize={32}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Custom stacked/grouped bar chart component for grouped status/demographics
type StackedBarChartProps = {
  data: ChartDatum[];
  keys: string[];
  height?: number;
  yAxisWidth?: number;
};

function StackedBarChart({
  data,
  keys,
  height = 220,
  yAxisWidth = 80,
}: StackedBarChartProps) {
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="category"
            tickLine={false}
            axisLine={false}
            stroke="var(--muted-foreground)"
            fontSize={11}
          />
          <YAxis
            type="number"
            tickLine={false}
            axisLine={false}
            width={yAxisWidth}
            stroke="var(--muted-foreground)"
            fontSize={12}
          />
          <Tooltip
            formatter={(value) => defaultValueFormatter(Number(value))}
            contentStyle={chartTooltipStyle}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {keys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              name={key}
              stackId="a"
              fill={getChartColor(index)}
              maxBarSize={30}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Loading Skeleton UI
function StatisticsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-muted-foreground/10 shadow-sm">
            <CardHeader className="p-4 space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-muted-foreground/10">
            <CardHeader>
              <Skeleton className="h-5 w-40 mb-1" />
              <Skeleton className="h-3 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card className="border-muted-foreground/10">
            <CardHeader>
              <Skeleton className="h-5 w-40 mb-1" />
              <Skeleton className="h-3 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          title="Total Pegawai"
          value={totalEmployees}
          description="Pegawai aktif terdaftar"
          icon={Users}
          iconClassName="bg-teal-500/10 text-teal-600 dark:text-teal-400"
        />
        <MetricCard
          title="Total Dokumen"
          value={totalDocuments}
          description="Berkas digital terunggah"
          icon={FileText}
          iconClassName="bg-sky-500/10 text-sky-600 dark:text-sky-400"
        />
        <MetricCard
          title="Upload (6 Bln)"
          value={totalUploadsLastSixMonths}
          description="Berkas baru diunggah"
          icon={TrendingUp}
          iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          title="Riwayat Verifikasi"
          value={totalVerifications}
          description="Total dokumen ditinjau"
          icon={ShieldCheck}
          iconClassName="bg-purple-500/10 text-purple-600 dark:text-purple-400"
        />
        <MetricCard
          title="Kekurangan Dokumen"
          value={totalMissingMandatory}
          description="Kekurangan berkas wajib"
          icon={AlertTriangle}
          iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          valueClassName={totalMissingMandatory > 0 ? "text-amber-600 dark:text-amber-400" : ""}
        />
        <MetricCard
          title="Hampir Kedaluwarsa"
          value={expiringWithin30Days}
          description="Masa berlaku ≤ 30 hari"
          icon={Clock}
          iconClassName="bg-rose-500/10 text-rose-600 dark:text-rose-400"
          valueClassName={expiringWithin30Days > 0 ? "text-rose-600 dark:text-rose-400" : ""}
        />
      </div>

      {/* Main Tabbed Analytics Layout */}
      <Tabs defaultValue="demographics" className="space-y-4">
        <TabsList className="flex flex-wrap w-fit bg-muted p-1 rounded-lg gap-1">
          <TabsTrigger value="demographics" className="text-xs sm:text-sm">Demografi</TabsTrigger>
          <TabsTrigger value="employment" className="text-xs sm:text-sm">Status & Jabatan</TabsTrigger>
          <TabsTrigger value="compliance" className="text-xs sm:text-sm">Kepatuhan & Dokumen</TabsTrigger>
          <TabsTrigger value="trends" className="text-xs sm:text-sm">Tren Upload</TabsTrigger>
        </TabsList>

        {/* Tab 1: Demografi Pegawai */}
        <TabsContent value="demographics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-muted-foreground/10 bg-card shadow-sm">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-semibold text-foreground">Distribusi Jenis Kelamin</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Komposisi pegawai berdasarkan jenis kelamin.</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <DonutChart
                  className="h-56"
                  data={data.employeeByGender as unknown as ChartDatum[]}
                  index="label"
                  category="value"
                  label="Pegawai"
                />
              </CardContent>
            </Card>

            <Card className="border-muted-foreground/10 bg-card shadow-sm">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-semibold text-foreground">Distribusi Rentang Usia</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Jumlah pegawai dikelompokkan berdasarkan usia saat ini.</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <SimpleBarChart data={data.employeeByAgeGroup} barColor="var(--chart-2)" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-muted-foreground/10 bg-card shadow-sm lg:col-span-2">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-semibold text-foreground">Sebaran Unit Kerja (Workplace)</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Jumlah pegawai di masing-masing instalasi atau unit kerja.</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <SimpleBarChart data={data.employeeByWorkplace} layout="horizontal" yAxisWidth={120} barColor="var(--chart-3)" />
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="border-muted-foreground/10 bg-card shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-semibold text-foreground">Tingkat Pendidikan Terakhir</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Profil pendidikan kualifikasi pegawai.</CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <SimpleBarChart data={data.employeeByEducation} layout="horizontal" yAxisWidth={90} barColor="var(--chart-4)" height={170} />
                </CardContent>
              </Card>

              <Card className="border-muted-foreground/10 bg-card shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-semibold text-foreground">Profil Agama & Status Pernikahan</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Demografi pendukung pegawai.</CardDescription>
                </CardHeader>
                <CardContent className="pb-4 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">Agama</h4>
                    <div className="flex flex-wrap gap-2">
                      {data.employeeByReligion.map((item) => (
                        <Badge key={item.label} variant="outline" className="text-[10px] py-1 border-muted-foreground/10 text-foreground">
                          {item.label}: <span className="font-bold ml-1">{item.value}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">Status Pernikahan</h4>
                    <div className="flex flex-wrap gap-2">
                      {data.employeeByMaritalStatus.map((item) => (
                        <Badge key={item.label} variant="secondary" className="text-[10px] py-1 text-foreground">
                          {item.label}: <span className="font-bold ml-1">{item.value}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Status & Jabatan */}
        <TabsContent value="employment" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-muted-foreground/10 bg-card shadow-sm">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-semibold text-foreground">Status Kepegawaian</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Komposisi pegawai PNS, PPPK, Honorer, dll.</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <DonutChart
                  className="h-56"
                  data={data.employeeByEmploymentStatus as unknown as ChartDatum[]}
                  index="label"
                  category="value"
                  label="Pegawai"
                />
              </CardContent>
            </Card>

            <Card className="border-muted-foreground/10 bg-card shadow-sm">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-semibold text-foreground">Golongan / Kelompok Pegawai</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Pembagian pegawai berdasarkan kelompok kerja.</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <DonutChart
                  className="h-56"
                  data={data.employeeByEmployeeGroup as unknown as ChartDatum[]}
                  index="label"
                  category="value"
                  label="Pegawai"
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-muted-foreground/10 bg-card shadow-sm">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-semibold text-foreground">Jenis Kelamin per Golongan</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Statistik gender berdasar kelompok pegawai.</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <StackedBarChart
                  data={data.employeeByGenderAndEmployeeGroup}
                  keys={["Laki-laki", "Perempuan", "Belum Diisi"]}
                />
              </CardContent>
            </Card>

            <Card className="border-muted-foreground/10 bg-card shadow-sm">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-semibold text-foreground">Jenis Kelamin per Status Kepegawaian</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Statistik gender berdasar status kepegawaian.</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <StackedBarChart
                  data={data.employeeByGenderAndEmploymentStatus}
                  keys={["Laki-laki", "Perempuan", "Belum Diisi"]}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-muted-foreground/10 bg-card shadow-sm">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-semibold text-foreground">Distribusi Kelompok Profesi</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Jumlah pegawai berdasarkan kelompok keprofesian.</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <SimpleBarChart data={data.employeeByProfessionGroup} layout="horizontal" yAxisWidth={90} barColor="var(--chart-1)" height={190} />
              </CardContent>
            </Card>

            <Card className="border-muted-foreground/10 bg-card shadow-sm">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-semibold text-foreground">Sebaran Pangkat/Golongan Ruang</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Jumlah pangkat kepegawaian pegawai.</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <SimpleBarChart data={data.employeeByRank} layout="horizontal" yAxisWidth={80} barColor="var(--chart-2)" height={190} />
              </CardContent>
            </Card>

            <Card className="border-muted-foreground/10 bg-card shadow-sm">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-semibold text-foreground">Top Jabatan Pegawai</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Sebaran 8 jabatan pegawai terbanyak.</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <SimpleBarChart data={data.employeeByPosition.slice(0, 8)} layout="horizontal" yAxisWidth={90} barColor="var(--chart-4)" height={190} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Kepatuhan & Dokumen */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-muted-foreground/10 bg-card shadow-sm">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-semibold text-foreground">Dokumen per Kategori Arsip</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Jumlah dokumen kepegawaian berdasar kategori penyimpanan.</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <DonutChart
                  className="h-56"
                  data={data.documentsByArchiveCategory as unknown as ChartDatum[]}
                  index="label"
                  category="value"
                  label="Berkas"
                />
              </CardContent>
            </Card>

            <Card className="border-muted-foreground/10 bg-card shadow-sm">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-semibold text-foreground">Status Verifikasi Berkas</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Distribusi status persetujuan dokumen terunggah.</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <DonutChart
                  className="h-56"
                  data={data.verificationStatusSummary as unknown as ChartDatum[]}
                  index="label"
                  category="value"
                  label="Verifikasi"
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-muted-foreground/10 bg-card shadow-sm">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-semibold text-foreground">Kekurangan Berkas Wajib Terbanyak</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Jenis dokumen mandatori yang paling banyak belum diunggah pegawai.</CardDescription>
              </CardHeader>
              <CardContent className="pb-4 space-y-4">
                {data.missingMandatoryDocumentsTop.length === 0 ? (
                  <EmptyState message="Semua pegawai telah melengkapi dokumen mandatori." />
                ) : (
                  data.missingMandatoryDocumentsTop.map((item) => {
                    const pct = totalEmployees > 0 ? (item.value / totalEmployees) * 100 : 0;
                    return (
                      <div key={item.label} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium text-foreground truncate max-w-[280px]">{item.label}</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {item.value} <span className="text-[10px] text-muted-foreground font-normal">pegawai ({pct.toFixed(0)}%)</span>
                          </span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card className="border-muted-foreground/10 bg-card shadow-sm">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-semibold text-foreground">Dokumen Hampir Kedaluwarsa</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Jumlah berkas dengan masa aktif yang mendekati batas waktu.</CardDescription>
              </CardHeader>
              <CardContent className="pb-4 space-y-4">
                {data.expiringDocumentsSummary.length === 0 ? (
                  <EmptyState message="Tidak ada dokumen aktif yang akan kedaluwarsa." />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-3">
                    {data.expiringDocumentsSummary.map((item) => {
                      // pick color based on urgency
                      let colorClass = "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                      if (item.days <= 7) {
                        colorClass = "text-destructive dark:text-red-400 bg-destructive/10 border-destructive/20";
                      } else if (item.days <= 30) {
                        colorClass = "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
                      }

                      return (
                        <div key={item.label} className={`flex flex-col items-center justify-center p-4 rounded-xl border ${colorClass} text-center`}>
                          <span className="text-2xl font-bold tabular-nums">{item.value}</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider mt-1 text-muted-foreground">{item.label}</span>
                          <span className="text-[9px] text-muted-foreground mt-0.5">({item.days} hari)</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="p-3 bg-muted/40 rounded-lg border border-border text-[11px] text-muted-foreground leading-normal">
                  <strong>Catatan:</strong> Dokumen yang kedaluwarsa memerlukan unggah ulang versi terbaru oleh pegawai bersangkutan untuk menjaga validitas data kepegawaian rumah sakit.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: Tren Upload */}
        <TabsContent value="trends" className="space-y-4">
          <Card className="border-muted-foreground/10 bg-card shadow-sm">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-semibold text-foreground">Tren Unggah & Verifikasi Bulanan</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Volume berkas diunggah vs verifikasi disetujui selama 6 bulan terakhir.</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              {data.monthlyUploadTrend.length === 0 ? (
                <EmptyState />
              ) : (
                <AreaChart
                  className="h-64"
                  data={data.monthlyUploadTrend as unknown as ChartDatum[]}
                  index="month"
                  categories={["total"]}
                  valueFormatter={(val) => `${val} berkas`}
                />
              )}
            </CardContent>
          </Card>

          <Card className="border-muted-foreground/10 bg-card shadow-sm">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-semibold text-foreground">Unggahan Berkas Berdasarkan Jenis Dokumen</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Volume aktivitas unggah berkas dirinci berdasarkan tipe dokumen (6 bulan terakhir).</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              {data.documentUploadsByTypeLastSixMonths.length === 0 || data.documentUploadTypeKeys.length === 0 ? (
                <EmptyState />
              ) : (
                <AreaChart
                  className="h-64"
                  data={data.documentUploadsByTypeLastSixMonths as unknown as ChartDatum[]}
                  index="month"
                  categories={data.documentUploadTypeKeys}
                  valueFormatter={(val) => `${val} berkas`}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
