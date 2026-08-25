import { prisma } from "@/lib/prisma";
import { matchesDocumentTypeTarget } from "@/modules/document";

import type {
  StatisticsChartItem,
  StatisticsChartsDto,
  StatisticsExpiringSummaryItem,
  StatisticsGroupedChartItem,
  StatisticsMonthlyUploadByType,
  StatisticsUploadTrendItem,
} from "./types";

export function findDashboardEmployees(filter: { workplaceId?: string }) {
  return prisma.employee.findMany({
    where: {
      deletedAt: null,
      workplaceId: filter.workplaceId || undefined,
    },
    include: {
      employeePosition: { select: { professionGroupId: true } },
      documentRecords: {
        where: {
          status: "APPROVED",
          deletedAt: null,
        },
        select: {
          documentTypeId: true,
        },
      },
    },
  });
}

export function findMandatoryDocumentTypesForStatistics() {
  return prisma.documentType.findMany({
    where: {
      isMandatory: true,
      deletedAt: null,
    },
    select: {
      id: true,
      isMandatory: true,
      employmentStatuses: { select: { employmentStatusId: true } },
      employeeGroups: { select: { employeeGroupId: true } },
      employeePositions: { select: { employeePositionId: true } },
      professionGroups: { select: { professionGroupId: true } },
      employeeRanks: { select: { employeeRankId: true } },
      workplaces: { select: { workplaceId: true } },
    },
  });
}

function workplaceOwnerWhere(workplaceId?: string) {
  return workplaceId
    ? {
        workplaceId,
        deletedAt: null,
      }
    : {
        deletedAt: null,
      };
}

export function groupDocumentRecordsByStatus(filter: { workplaceId?: string }) {
  return prisma.documentRecord.groupBy({
    by: ["status"],
    where: {
      deletedAt: null,
      owner: workplaceOwnerWhere(filter.workplaceId),
    },
    _count: {
      _all: true,
    },
  });
}

export function findDashboardDocumentRecords(filter: { workplaceId?: string }) {
  return prisma.documentRecord.findMany({
    where: {
      deletedAt: null,
      owner: workplaceOwnerWhere(filter.workplaceId),
    },
    select: {
      uploadedAt: true,
      documentType: {
        select: {
          archiveCategory: true,
        },
      },
    },
  });
}

export function findApprovedVerificationHistoriesSince(input: {
  startOfPeriod: Date;
  workplaceId?: string;
}) {
  return prisma.verificationHistory.findMany({
    where: {
      status: "APPROVED",
      reviewedAt: {
        gte: input.startOfPeriod,
      },
      documentRecord: {
        deletedAt: null,
        owner: workplaceOwnerWhere(input.workplaceId),
      },
    },
    select: {
      reviewedAt: true,
    },
  });
}

export function findEmployeeTargetProfileForStatistics(userId: string) {
  return prisma.employee.findFirst({
    where: { userId, deletedAt: null },
    include: {
      employeePosition: { select: { professionGroupId: true } },
    },
  });
}

export function countEmployeeDocumentsByStatus(input: {
  employeeId: string;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
}) {
  return prisma.documentRecord.count({
    where: { ownerId: input.employeeId, status: input.status, deletedAt: null },
  });
}

export function findEmployeeDocumentTypeIds(employeeId: string) {
  return prisma.documentRecord.findMany({
    where: { ownerId: employeeId, deletedAt: null },
    select: { documentTypeId: true, status: true },
  });
}

export function findExpiringEmployeeDocuments(input: {
  employeeId: string;
  now: Date;
  until: Date;
}) {
  return prisma.documentRecord.findMany({
    where: {
      ownerId: input.employeeId,
      deletedAt: null,
      status: "APPROVED",
      expiryDate: {
        gt: input.now,
        lte: input.until,
      },
    },
    orderBy: { expiryDate: "asc" },
    include: {
      documentType: {
        select: {
          name: true,
        },
      },
    },
  });
}

export function findRecentEmployeeUploads(employeeId: string) {
  return prisma.documentRecord.findMany({
    where: { ownerId: employeeId, deletedAt: null },
    orderBy: { uploadedAt: "desc" },
    take: 5,
    include: {
      documentType: {
        select: {
          name: true,
          archiveCategory: true,
        },
      },
    },
  });
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
const GENDER_KEYS = ["Laki-laki", "Perempuan", "Belum Diisi"] as const;

function normalizeGender(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return "Belum Diisi";
  if (["l", "laki-laki", "laki laki", "male", "pria"].includes(normalized)) return "Laki-laki";
  if (["p", "perempuan", "female", "wanita"].includes(normalized)) return "Perempuan";
  return value ?? "Belum Diisi";
}

function filledLabel(value: string | null | undefined, fallback = "Belum Diisi") {
  const label = value?.trim();
  return label && label.length > 0 ? label : fallback;
}

function increment(map: Map<string, number>, label: string) {
  map.set(label, (map.get(label) ?? 0) + 1);
}

function toChartItems(map: Map<string, number>): StatisticsChartItem[] {
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function ageGroup(birthDate: Date | null) {
  if (!birthDate) return "Belum Diisi";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  if (age < 25) return "< 25";
  if (age <= 34) return "25-34";
  if (age <= 44) return "35-44";
  if (age <= 54) return "45-54";
  return ">= 55";
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return `${MONTH_NAMES[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`;
}

function lastSixMonths() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: monthKey(date),
      label: monthLabel(date),
    };
  });
}

function createGroupedGenderMap(categories: string[]): Map<string, StatisticsGroupedChartItem> {
  return new Map(
    categories.map((category) => [
      category,
      {
        category,
        "Laki-laki": 0,
        Perempuan: 0,
        "Belum Diisi": 0,
      } satisfies StatisticsGroupedChartItem,
    ]),
  );
}

function groupedGenderItems(map: Map<string, StatisticsGroupedChartItem>) {
  return Array.from(map.values()).sort((a, b) => {
    const totalA = GENDER_KEYS.reduce((sum, key) => sum + Number(a[key] ?? 0), 0);
    const totalB = GENDER_KEYS.reduce((sum, key) => sum + Number(b[key] ?? 0), 0);
    return totalB - totalA || String(a.category).localeCompare(String(b.category));
  });
}

function countUploadMonth(items: { uploadedAt: Date; documentType: { name: string } | null }[]) {
  const months = lastSixMonths();
  const monthSet = new Set(months.map((item) => item.key));
  const uploadTrend = new Map<string, StatisticsUploadTrendItem>(
    months.map((item) => [item.key, { month: item.label, total: 0 }]),
  );
  const uploadByType = new Map<string, StatisticsMonthlyUploadByType>(
    months.map((item) => [item.key, { month: item.label }]),
  );
  const typeKeys = new Set<string>();

  for (const item of items) {
    const key = monthKey(item.uploadedAt);
    if (!monthSet.has(key)) continue;

    const trend = uploadTrend.get(key);
    if (trend) trend.total += 1;

    const typeName = filledLabel(item.documentType?.name, "Dokumen tanpa tipe");
    typeKeys.add(typeName);
    const bucket = uploadByType.get(key);
    if (bucket) bucket[typeName] = Number(bucket[typeName] ?? 0) + 1;
  }

  const sortedTypeKeys = Array.from(typeKeys).sort((a, b) => a.localeCompare(b));
  for (const bucket of Array.from(uploadByType.values())) {
    for (const key of sortedTypeKeys) {
      bucket[key] = Number(bucket[key] ?? 0);
    }
  }

  return {
    monthlyUploadTrend: Array.from(uploadTrend.values()),
    documentUploadsByTypeLastSixMonths: Array.from(uploadByType.values()),
    documentUploadTypeKeys: sortedTypeKeys,
  };
}

export async function getStatisticsChartsData(): Promise<StatisticsChartsDto> {
  const [employees, documentRecords, verificationSummary, mandatoryDocumentTypes] = await Promise.all([
    prisma.employee.findMany({
      where: { deletedAt: null },
      select: {
        employmentStatusId: true,
        employeeGroupId: true,
        employeePositionId: true,
        employeeRankId: true,
        workplaceId: true,
        gender: true,
        birthDate: true,
        lastEducation: true,
        religion: true,
        maritalStatus: true,
        employmentStatus: { select: { name: true } },
        employeeGroup: { select: { name: true } },
        employeeRank: { select: { name: true } },
        employeePosition: {
          select: {
            name: true,
            professionGroupId: true,
            professionGroup: { select: { name: true } },
          },
        },
        workplace: { select: { name: true } },
        documentRecords: {
          where: {
            deletedAt: null,
            status: "APPROVED",
          },
          select: { documentTypeId: true },
        },
      },
    }),
    prisma.documentRecord.findMany({
      where: { deletedAt: null },
      select: {
        status: true,
        uploadedAt: true,
        expiryDate: true,
        documentType: {
          select: {
            id: true,
            name: true,
            archiveCategory: true,
          },
        },
      },
    }),
    prisma.verificationHistory.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.documentType.findMany({
      where: {
        isMandatory: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        employmentStatuses: { select: { employmentStatusId: true } },
        employeeGroups: { select: { employeeGroupId: true } },
        employeePositions: { select: { employeePositionId: true } },
        professionGroups: { select: { professionGroupId: true } },
        employeeRanks: { select: { employeeRankId: true } },
        workplaces: { select: { workplaceId: true } },
      },
    }),
  ]);

  const employmentStatusMap = new Map<string, number>();
  const employeeGroupMap = new Map<string, number>();
  const genderMap = new Map<string, number>();
  const workplaceMap = new Map<string, number>();
  const rankMap = new Map<string, number>();
  const positionMap = new Map<string, number>();
  const professionGroupMap = new Map<string, number>();
  const educationMap = new Map<string, number>();
  const religionMap = new Map<string, number>();
  const maritalStatusMap = new Map<string, number>();
  const ageGroupMap = new Map<string, number>();
  const genderByGroup = createGroupedGenderMap([]);
  const genderByStatus = createGroupedGenderMap([]);

  for (const employee of employees) {
    const gender = normalizeGender(employee.gender);
    const group = filledLabel(employee.employeeGroup?.name);
    const status = filledLabel(employee.employmentStatus?.name);

    increment(genderMap, gender);
    increment(employeeGroupMap, group);
    increment(employmentStatusMap, status);
    increment(workplaceMap, filledLabel(employee.workplace?.name));
    increment(rankMap, filledLabel(employee.employeeRank?.name));
    increment(positionMap, filledLabel(employee.employeePosition?.name));
    increment(professionGroupMap, filledLabel(employee.employeePosition?.professionGroup?.name));
    increment(educationMap, filledLabel(employee.lastEducation));
    increment(religionMap, filledLabel(employee.religion));
    increment(maritalStatusMap, filledLabel(employee.maritalStatus));
    increment(ageGroupMap, ageGroup(employee.birthDate));

    if (!genderByGroup.has(group)) {
      genderByGroup.set(group, { category: group, "Laki-laki": 0, Perempuan: 0, "Belum Diisi": 0 });
    }
    const groupBucket = genderByGroup.get(group);
    if (groupBucket) groupBucket[gender] = Number(groupBucket[gender] ?? 0) + 1;

    if (!genderByStatus.has(status)) {
      genderByStatus.set(status, { category: status, "Laki-laki": 0, Perempuan: 0, "Belum Diisi": 0 });
    }
    const statusBucket = genderByStatus.get(status);
    if (statusBucket) statusBucket[gender] = Number(statusBucket[gender] ?? 0) + 1;
  }

  const archiveCategoryMap = new Map<string, number>();
  for (const record of documentRecords) {
    increment(archiveCategoryMap, filledLabel(record.documentType?.archiveCategory));
  }

  const { monthlyUploadTrend, documentUploadsByTypeLastSixMonths, documentUploadTypeKeys } =
    countUploadMonth(documentRecords);

  const verificationStatusSummary = verificationSummary
    .map((item) => ({ label: item.status, value: item._count._all }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

  const missingMandatoryDocumentsTop = mandatoryDocumentTypes
    .map((type) => {
      const missingCount = employees.filter((employee) => {
        if (!matchesDocumentTypeTarget(employee, type)) return false;
        const approvedTypeIds = new Set(employee.documentRecords.map((record) => record.documentTypeId));
        return !approvedTypeIds.has(type.id);
      }).length;
      return { label: type.name, value: missingCount };
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, 8);

  const today = new Date();
  let expiredDocumentsCount = 0;
  const expiringDocumentsSummary: StatisticsExpiringSummaryItem[] = [
    { label: "≤ 7 hari", days: 7, value: 0 },
    { label: "≤ 30 hari", days: 30, value: 0 },
    { label: "≤ 90 hari", days: 90, value: 0 },
  ];
  for (const record of documentRecords) {
    if (record.status === "EXPIRED" || (record.expiryDate && record.expiryDate < today && record.status !== "REPLACED")) {
      expiredDocumentsCount += 1;
    }
    if (!record.expiryDate || record.expiryDate < today || record.status !== "APPROVED") continue;
    const diffDays = Math.ceil((record.expiryDate.getTime() - today.getTime()) / 86_400_000);
    for (const bucket of expiringDocumentsSummary) {
      if (diffDays <= bucket.days) bucket.value += 1;
    }
  }

  return {
    employeeByEmploymentStatus: toChartItems(employmentStatusMap),
    employeeByEmployeeGroup: toChartItems(employeeGroupMap),
    employeeByGender: toChartItems(genderMap),
    employeeByWorkplace: toChartItems(workplaceMap),
    employeeByRank: toChartItems(rankMap),
    employeeByPosition: toChartItems(positionMap),
    employeeByProfessionGroup: toChartItems(professionGroupMap),
    employeeByEducation: toChartItems(educationMap),
    employeeByReligion: toChartItems(religionMap),
    employeeByMaritalStatus: toChartItems(maritalStatusMap),
    employeeByAgeGroup: toChartItems(ageGroupMap),
    employeeByGenderAndEmployeeGroup: groupedGenderItems(genderByGroup),
    employeeByGenderAndEmploymentStatus: groupedGenderItems(genderByStatus),
    documentsByArchiveCategory: toChartItems(archiveCategoryMap),
    documentUploadsByTypeLastSixMonths,
    documentUploadTypeKeys,
    monthlyUploadTrend,
    verificationStatusSummary,
    missingMandatoryDocumentsTop,
    expiringDocumentsSummary,
    expiredDocumentsCount,
    generatedAt: new Date().toISOString(),
  };
}
