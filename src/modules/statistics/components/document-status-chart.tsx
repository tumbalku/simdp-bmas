"use client";

import { DonutChart } from "@/components/charts/DonutChart";
import { defaultValueFormatter, getChartColor } from "@/lib/chartUtils";

type DocumentStatusDatum = {
  status: string;
  total: number;
};

type DocumentStatusChartProps = {
  data: DocumentStatusDatum[];
};

export function DocumentStatusChart({ data }: DocumentStatusChartProps) {
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px] md:items-center">
      <DonutChart
        data={data}
        index="status"
        category="total"
        valueFormatter={defaultValueFormatter}
        label="dokumen"
      />

      <ul className="space-y-2 text-sm">
        {data.map((item, index) => (
          <li key={item.status} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: getChartColor(index) }}
                aria-hidden="true"
              />
              {item.status}
            </span>
            <span className="font-medium tabular-nums">{item.total}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
