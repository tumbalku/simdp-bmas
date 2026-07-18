"use client";

import { AlertCircle } from "lucide-react";
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

export type ChartDatum = Record<string, string | number | null | undefined>;

export function EmptyState({ message = "Tidak ada data untuk ditampilkan" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <AlertCircle className="mb-2 size-7 text-muted-foreground/60" />
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

type SimpleBarChartProps = {
  data: { label: string; value: number }[];
  layout?: "horizontal" | "vertical";
  height?: number;
  barColor?: string;
  yAxisWidth?: number;
};

export function SimpleBarChart({
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

type StackedBarChartProps = {
  data: ChartDatum[];
  keys: string[];
  height?: number;
  yAxisWidth?: number;
};

export function StackedBarChart({
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

