import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { DocumentStatusChart } from "./DocumentStatusChart";
import { UploadTrendChart } from "./UploadTrendChart";

const uploadTrendData = [
  { month: "Jan", Uploaded: 42, Verified: 35 },
  { month: "Feb", Uploaded: 58, Verified: 49 },
  { month: "Mar", Uploaded: 64, Verified: 57 },
  { month: "Apr", Uploaded: 73, Verified: 61 },
  { month: "Mei", Uploaded: 81, Verified: 70 },
  { month: "Jun", Uploaded: 96, Verified: 88 },
];

const documentStatusData = [
  { status: "Pending", total: 24 },
  { status: "Approved", total: 168 },
  { status: "Rejected", total: 7 },
  { status: "Expired", total: 13 },
];

const metricCards = [
  {
    label: "Total dokumen",
    value: "212",
    description: "+18 bulan ini",
  },
  {
    label: "Compliance rate",
    value: "84%",
    description: "Target awal 90%",
  },
  {
    label: "Antrian verifikasi",
    value: "24",
    description: "Butuh review Staff/Admin",
  },
];

export function StatisticsDashboardPreview() {
  return (
    <section className="space-y-4" aria-labelledby="statistics-preview-title">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Dashboard statistics</p>
        <h2
          id="statistics-preview-title"
          className="text-2xl font-bold tracking-tight text-balance"
        >
          Fondasi chart Tremor untuk statistik SIMDP
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Preview ini memakai data contoh agar wrapper chart, token warna, dan
          container shadcn/ui siap sebelum data asli dari modul statistics dibuat.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {metricCards.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {metric.value}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Tren upload dan verifikasi</CardTitle>
            <CardDescription>
              Area chart Tremor untuk melihat ritme upload dokumen per bulan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadTrendChart data={uploadTrendData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status dokumen</CardTitle>
            <CardDescription>
              Donut chart Tremor untuk distribusi status dokumen pegawai.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentStatusChart data={documentStatusData} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
