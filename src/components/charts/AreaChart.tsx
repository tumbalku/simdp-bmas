"use client";

import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  chartTooltipStyle,
  compactNumberFormatter,
  getChartColor,
  toNumber,
  type ChartValue,
} from "@/utils/chart";
import { cn } from "@/utils";

type AreaChartDatum = Record<string, ChartValue>;

type AreaChartValueChange = {
  category: string;
  value: number;
  payload: AreaChartDatum;
} | null;

type AreaChartProps = {
  className?: string;
  data: AreaChartDatum[];
  index: string;
  categories: string[];
  valueFormatter?: (value: number) => string;
  onValueChange?: (value: AreaChartValueChange) => void;
  showLegend?: boolean;
  showGridLines?: boolean;
  yAxisWidth?: number;
};

export function AreaChart({
  className,
  data,
  index,
  categories,
  valueFormatter = compactNumberFormatter,
  onValueChange,
  showLegend = true,
  showGridLines = true,
  yAxisWidth = 44,
}: AreaChartProps) {
  return (
    <div
      className={cn("h-80 w-full", className)}
      data-chart-library="tremor-raw-recharts"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
          <defs>
            {categories.map((category, categoryIndex) => (
              <linearGradient
                key={category}
                id={`area-gradient-${category}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={getChartColor(categoryIndex)}
                  stopOpacity={0.28}
                />
                <stop
                  offset="95%"
                  stopColor={getChartColor(categoryIndex)}
                  stopOpacity={0}
                />
              </linearGradient>
            ))}
          </defs>

          {showGridLines ? (
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="3 3"
            />
          ) : null}

          <XAxis
            dataKey={index}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            stroke="var(--muted-foreground)"
            fontSize={12}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={yAxisWidth}
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickFormatter={(value) => valueFormatter(Number(value))}
          />
          <Tooltip
            formatter={(value) => valueFormatter(toNumber(value as ChartValue))}
            contentStyle={chartTooltipStyle}
          />
          {showLegend ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}

          {categories.map((category, categoryIndex) => (
            <Area
              key={category}
              type="monotone"
              dataKey={category}
              stroke={getChartColor(categoryIndex)}
              fill={`url(#area-gradient-${category})`}
              strokeWidth={2}
              onClick={(payload) => {
                const datum = (payload as unknown as { payload: AreaChartDatum })
                  .payload;

                onValueChange?.({
                  category,
                  value: toNumber(datum[category]),
                  payload: datum,
                });
              }}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
