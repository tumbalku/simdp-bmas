import { useQuery } from "@tanstack/react-query";
import { fetchStatisticsCharts } from "./api";

export function useStatisticsCharts(enabled = true) {
  return useQuery({
    queryKey: ["statistics", "charts"],
    queryFn: fetchStatisticsCharts,
    enabled,
  });
}
