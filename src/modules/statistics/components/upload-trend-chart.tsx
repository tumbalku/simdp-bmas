"use client";

import { AreaChart } from "@/components/charts/AreaChart";

type UploadTrendDatum = {
  month: string;
  Uploaded: number;
  Verified: number;
};

type UploadTrendChartProps = {
  data: UploadTrendDatum[];
};

export function UploadTrendChart({ data }: UploadTrendChartProps) {
  return (
    <AreaChart
      className="h-72"
      data={data}
      index="month"
      categories={["Uploaded", "Verified"]}
    />
  );
}
