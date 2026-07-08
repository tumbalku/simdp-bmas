export const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

export type ChartColor = (typeof chartColors)[number];

export type ChartValue = string | number | null | undefined;

export const compactNumberFormatter = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export const defaultValueFormatter = (value: number) =>
  new Intl.NumberFormat("id-ID").format(value);

export const chartTooltipStyle = {
  backgroundColor: "var(--popover)",
  borderColor: "var(--border)",
  borderRadius: "var(--radius)",
  color: "var(--popover-foreground)",
} as const;

export function getChartColor(index: number): ChartColor {
  return chartColors[index % chartColors.length];
}

export function toNumber(value: ChartValue): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}
