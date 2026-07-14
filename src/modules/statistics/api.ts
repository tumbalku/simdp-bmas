import type { StatisticsChartsDto, StatisticsChartsResponse } from "./types";

type ErrorEnvelope = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

export async function fetchStatisticsCharts(): Promise<StatisticsChartsDto> {
  const response = await fetch("/api/v1/statistics/charts", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "same-origin",
  });

  const payload = (await response.json()) as StatisticsChartsResponse | ErrorEnvelope;

  if (!response.ok) {
    const message = payload.ok ? "Gagal memuat statistik." : payload.error.message;
    throw new Error(message);
  }

  if (!payload.ok) {
    throw new Error(payload.error.message);
  }

  return payload.data;
}
