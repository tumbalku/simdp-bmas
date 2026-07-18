export interface StatisticsChartItem {
  label: string;
  value: number;
}

export interface StatisticsGroupedChartItem {
  category: string;
  [key: string]: string | number;
}

export interface StatisticsMonthlyUploadByType {
  month: string;
  [documentType: string]: string | number;
}

export interface StatisticsUploadTrendItem {
  month: string;
  total: number;
}

export interface StatisticsExpiringSummaryItem {
  label: string;
  days: number;
  value: number;
}

export interface StatisticsChartsDto {
  employeeByEmploymentStatus: StatisticsChartItem[];
  employeeByEmployeeGroup: StatisticsChartItem[];
  employeeByGender: StatisticsChartItem[];
  employeeByWorkplace: StatisticsChartItem[];
  employeeByRank: StatisticsChartItem[];
  employeeByPosition: StatisticsChartItem[];
  employeeByProfessionGroup: StatisticsChartItem[];
  employeeByEducation: StatisticsChartItem[];
  employeeByReligion: StatisticsChartItem[];
  employeeByMaritalStatus: StatisticsChartItem[];
  employeeByAgeGroup: StatisticsChartItem[];
  employeeByGenderAndEmployeeGroup: StatisticsGroupedChartItem[];
  employeeByGenderAndEmploymentStatus: StatisticsGroupedChartItem[];
  documentsByArchiveCategory: StatisticsChartItem[];
  documentUploadsByTypeLastSixMonths: StatisticsMonthlyUploadByType[];
  documentUploadTypeKeys: string[];
  monthlyUploadTrend: StatisticsUploadTrendItem[];
  verificationStatusSummary: StatisticsChartItem[];
  missingMandatoryDocumentsTop: StatisticsChartItem[];
  expiringDocumentsSummary: StatisticsExpiringSummaryItem[];
  generatedAt: string;
}

export type StatisticsChartsResponse = {
  ok: true;
  data: StatisticsChartsDto;
  meta: {
    timestamp: string;
  };
};
