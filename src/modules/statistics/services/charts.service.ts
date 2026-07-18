import { getStatisticsChartsData as getStatsChartsRepo } from "../repository";

export async function getStatisticsChartsData() {
  return getStatsChartsRepo();
}
