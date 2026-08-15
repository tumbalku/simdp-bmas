"use client";

import { Briefcase, FileCheck2, TrendingUp, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart } from "@/components/charts/AreaChart";
import { DonutChart } from "@/components/charts/DonutChart";
import type { StatisticsChartsDto } from "../types";
import { EmptyState, SimpleBarChart, StackedBarChart, type ChartDatum } from "./StatisticsCharts";

type StatisticsTabsProps = {
  data: StatisticsChartsDto;
  totalEmployees: number;
};

export function StatisticsTabs({ data, totalEmployees }: StatisticsTabsProps) {
  return (
    <>
      {/* Main Tabbed Analytics Layout */}
      <Tabs defaultValue="demographics" className="space-y-4">
        <TabsList className="w-full grid grid-cols-4 sm:flex sm:w-auto">
          <TabsTrigger value="demographics" className="gap-2">
            <Users className="size-4" />
            <span className="hidden sm:inline">Demografi</span>
          </TabsTrigger>
          <TabsTrigger value="employment" className="gap-2">
            <Briefcase className="size-4" />
            <span className="hidden sm:inline">Status & Jabatan</span>
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-2">
            <FileCheck2 className="size-4" />
            <span className="hidden sm:inline">Kepatuhan & Dokumen</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="size-4" />
            <span className="hidden sm:inline">Tren Upload</span>
          </TabsTrigger>
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
    </>
  );
}
