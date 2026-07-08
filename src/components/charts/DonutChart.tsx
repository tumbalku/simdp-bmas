"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import {
  chartTooltipStyle,
  defaultValueFormatter,
  getChartColor,
  toNumber,
  type ChartValue,
} from "@/lib/chartUtils";
import { cn } from "@/lib/utils";

type DonutChartDatum = Record<string, ChartValue>;

type DonutChartValueChange = {
  category: string;
  value: number;
  payload: DonutChartDatum;
} | null;

type DonutChartProps = {
  className?: string;
  data: DonutChartDatum[];
  index: string;
  category: string;
  valueFormatter?: (value: number) => string;
  onValueChange?: (value: DonutChartValueChange) => void;
  showLabel?: boolean;
  label?: string;
};

export function DonutChart({
  className,
  data,
  index,
  category,
  valueFormatter = defaultValueFormatter,
  onValueChange,
  showLabel = true,
  label,
}: DonutChartProps) {
  const total = data.reduce(
    (sum, item) => sum + toNumber(item[category]),
    0,
  );

  return (
    <div
      className={cn("relative h-72 w-full", className)}
      data-chart-library="tremor-raw-recharts"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={category}
            nameKey={index}
            innerRadius="62%"
            outerRadius="86%"
            paddingAngle={3}
            stroke="var(--card)"
            strokeWidth={3}
            onClick={(payload) => {
              const datum = payload as unknown as DonutChartDatum;

              onValueChange?.({
                category: String(datum[index] ?? ""),
                value: toNumber(datum[category]),
                payload: datum,
              });
            }}
          >
            {data.map((entry, entryIndex) => (
              <Cell
                key={String(entry[index])}
                fill={getChartColor(entryIndex)}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => valueFormatter(toNumber(value as ChartValue))}
            contentStyle={chartTooltipStyle}
          />
        </PieChart>
      </ResponsiveContainer>

      {showLabel ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums">
            {valueFormatter(total)}
          </span>
          {label ? <span className="text-xs text-muted-foreground">{label}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
