import { CompactMetricCard, type CompactMetricCardProps } from "./CompactMetricCard";
import { MetricCard, type MetricCardProps } from "./MetricCard";

export type ResponsiveMetricCardProps = MetricCardProps & {
  compactTitle?: CompactMetricCardProps["title"];
};

export function getResponsiveMetricGridClass(titles: string[]) {
  const hasMultiWordTitle = titles.some((title) => title.trim().split(/\s+/).length > 1);
  return hasMultiWordTitle ? "grid-cols-3" : "grid-cols-4";
}

export function ResponsiveMetricCard({ compactTitle, ...metric }: ResponsiveMetricCardProps) {
  return (
    <>
      <div className="hidden sm:block">
        <MetricCard {...metric} />
      </div>
      <div className="sm:hidden">
        <CompactMetricCard {...metric} title={compactTitle ?? metric.title} />
      </div>
    </>
  );
}
