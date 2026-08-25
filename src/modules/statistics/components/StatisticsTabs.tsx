"use client";

import { Briefcase, FileCheck2, TrendingUp, Users } from "lucide-react";

import { CardContainer } from "@/components/cards/CardContainer";
import { Badge } from "@/components/ui/badge";
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
            <CardContainer
              title="Distribusi Jenis Kelamin"
              description="Komposisi pegawai berdasarkan jenis kelamin."
              contentClassName="pb-4"
            >
              <DonutChart
                className="h-56"
                data={data.employeeByGender as unknown as ChartDatum[]}
                index="label"
                category="value"
                label="Pegawai"
              />
            </CardContainer>

            <CardContainer
              title="Distribusi Rentang Usia"
              description="Jumlah pegawai dikelompokkan berdasarkan usia saat ini."
              contentClassName="pb-4"
            >
              <SimpleBarChart data={data.employeeByAgeGroup} barColor="var(--chart-2)" />
            </CardContainer>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <CardContainer
              className="lg:col-span-2"
              title="Sebaran Unit Kerja (Workplace)"
              description="Jumlah pegawai di masing-masing instalasi atau unit kerja."
              contentClassName="pb-4"
            >
              <SimpleBarChart data={data.employeeByWorkplace} layout="horizontal" yAxisWidth={120} barColor="var(--chart-3)" />
            </CardContainer>

            <div className="space-y-4">
              <CardContainer
                title="Tingkat Pendidikan Terakhir"
                description="Profil pendidikan kualifikasi pegawai."
                contentClassName="pb-4"
              >
                <SimpleBarChart data={data.employeeByEducation} layout="horizontal" yAxisWidth={90} barColor="var(--chart-4)" height={170} />
              </CardContainer>

              <CardContainer
                title="Profil Agama & Status Pernikahan"
                description="Demografi pendukung pegawai."
                contentClassName="pb-4 space-y-4"
              >
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
              </CardContainer>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Status & Jabatan */}
        <TabsContent value="employment" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <CardContainer
              title="Status Kepegawaian"
              description="Komposisi pegawai PNS, PPPK, Honorer, dll."
              contentClassName="pb-4"
            >
              <DonutChart
                className="h-56"
                data={data.employeeByEmploymentStatus as unknown as ChartDatum[]}
                index="label"
                category="value"
                label="Pegawai"
              />
            </CardContainer>

            <CardContainer
              title="Golongan / Kelompok Pegawai"
              description="Pembagian pegawai berdasarkan kelompok kerja."
              contentClassName="pb-4"
            >
              <DonutChart
                className="h-56"
                data={data.employeeByEmployeeGroup as unknown as ChartDatum[]}
                index="label"
                category="value"
                label="Pegawai"
              />
            </CardContainer>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <CardContainer
              title="Jenis Kelamin per Golongan"
              description="Statistik gender berdasar kelompok pegawai."
              contentClassName="pb-4"
            >
              <StackedBarChart
                data={data.employeeByGenderAndEmployeeGroup}
                keys={["Laki-laki", "Perempuan", "Belum Diisi"]}
              />
            </CardContainer>

            <CardContainer
              title="Jenis Kelamin per Status Kepegawaian"
              description="Statistik gender berdasar status kepegawaian."
              contentClassName="pb-4"
            >
              <StackedBarChart
                data={data.employeeByGenderAndEmploymentStatus}
                keys={["Laki-laki", "Perempuan", "Belum Diisi"]}
              />
            </CardContainer>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <CardContainer
              title="Distribusi Kelompok Profesi"
              description="Jumlah pegawai berdasarkan kelompok keprofesian."
              contentClassName="pb-4"
            >
              <SimpleBarChart data={data.employeeByProfessionGroup} layout="horizontal" yAxisWidth={90} barColor="var(--chart-1)" height={190} />
            </CardContainer>

            <CardContainer
              title="Sebaran Pangkat/Golongan Ruang"
              description="Jumlah pangkat kepegawaian pegawai."
              contentClassName="pb-4"
            >
              <SimpleBarChart data={data.employeeByRank} layout="horizontal" yAxisWidth={80} barColor="var(--chart-2)" height={190} />
            </CardContainer>

            <CardContainer
              title="Top Jabatan Pegawai"
              description="Sebaran 8 jabatan pegawai terbanyak."
              contentClassName="pb-4"
            >
              <SimpleBarChart data={data.employeeByPosition.slice(0, 8)} layout="horizontal" yAxisWidth={90} barColor="var(--chart-4)" height={190} />
            </CardContainer>
          </div>
        </TabsContent>

        {/* Tab 3: Kepatuhan & Dokumen */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <CardContainer
              title="Dokumen per Kategori Arsip"
              description="Jumlah dokumen kepegawaian berdasar kategori penyimpanan."
              contentClassName="pb-4"
            >
              <DonutChart
                className="h-56"
                data={data.documentsByArchiveCategory as unknown as ChartDatum[]}
                index="label"
                category="value"
                label="Berkas"
              />
            </CardContainer>

            <CardContainer
              title="Status Verifikasi Berkas"
              description="Distribusi status persetujuan dokumen terunggah."
              contentClassName="pb-4"
            >
              <DonutChart
                className="h-56"
                data={data.verificationStatusSummary as unknown as ChartDatum[]}
                index="label"
                category="value"
                label="Verifikasi"
              />
            </CardContainer>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <CardContainer
              title="Kekurangan Berkas Wajib Terbanyak"
              description="Jenis dokumen mandatori yang paling banyak belum diunggah pegawai."
              contentClassName="pb-4 space-y-4"
            >
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
            </CardContainer>

            <CardContainer
              title="Masa Berlaku Dokumen"
              description="Ringkasan dokumen yang mendekati batas waktu dan yang telah kedaluwarsa."
              contentClassName="pb-4 space-y-4"
            >
              <div className="grid gap-3 sm:grid-cols-4">
                {/* Expired Summary Box */}
                <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border text-destructive dark:text-red-400 bg-destructive/10 border-destructive/20 text-center">
                  <span className="text-2xl font-bold tabular-nums">{data.expiredDocumentsCount ?? 0}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider mt-1 text-destructive dark:text-red-400">Kedaluwarsa</span>
                  <span className="text-[9px] text-muted-foreground mt-0.5">(Telah Lewat)</span>
                </div>

                {data.expiringDocumentsSummary.map((item) => {
                  // pick color based on urgency
                  let colorClass = "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                  if (item.days <= 7) {
                    colorClass = "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";
                  } else if (item.days <= 30) {
                    colorClass = "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
                  }

                  return (
                    <div key={item.label} className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border ${colorClass} text-center`}>
                      <span className="text-2xl font-bold tabular-nums">{item.value}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider mt-1 text-muted-foreground">{item.label}</span>
                      <span className="text-[9px] text-muted-foreground mt-0.5">({item.days} hari)</span>
                    </div>
                  );
                })}
              </div>
              <div className="p-3 bg-muted/40 rounded-lg border border-border text-[11px] text-muted-foreground leading-normal">
                <strong>Catatan:</strong> Dokumen yang telah kedaluwarsa memerlukan unggah ulang versi terbaru oleh pegawai bersangkutan untuk menjaga validitas data kepegawaian rumah sakit.
              </div>
            </CardContainer>
          </div>
        </TabsContent>

        {/* Tab 4: Tren Upload */}
        <TabsContent value="trends" className="space-y-4">
          <CardContainer
            title="Tren Unggah & Verifikasi Bulanan"
            description="Volume berkas diunggah vs verifikasi disetujui selama 6 bulan terakhir."
            contentClassName="pb-4"
          >
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
          </CardContainer>

          <CardContainer
            title="Unggahan Berkas Berdasarkan Jenis Dokumen"
            description="Volume aktivitas unggah berkas dirinci berdasarkan tipe dokumen (6 bulan terakhir)."
            contentClassName="pb-4"
          >
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
          </CardContainer>
        </TabsContent>
      </Tabs>
    </>
  );
}
