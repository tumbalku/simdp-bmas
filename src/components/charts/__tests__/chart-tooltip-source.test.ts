import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("chart tooltip layering", () => {
  it("keeps shared chart tooltip content above chart surfaces", () => {
    const chartUtils = readSource("src/utils/chart.ts");

    expect(chartUtils).toContain("chartTooltipStyle");
    expect(chartUtils).toContain("zIndex: 80");
    expect(chartUtils).toContain("chartTooltipWrapperStyle");
  });

  it("applies elevated tooltip wrapper style on donut charts", () => {
    const donutChart = readSource("src/components/charts/DonutChart.tsx");

    expect(donutChart).toContain("chartTooltipWrapperStyle");
    expect(donutChart).toContain("wrapperStyle={chartTooltipWrapperStyle}");
  });
});
