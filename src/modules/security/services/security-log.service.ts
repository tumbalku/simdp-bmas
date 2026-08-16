/* eslint-disable @typescript-eslint/no-explicit-any */
import { PAGINATION } from "@/constants/pagination";
import { getSystemSettingValue } from "@/modules/settings/server";
import {
  SECURITY_EVENT_TYPE,
  SECURITY_LOG_STATUS,
  normalizeSecurityActorRole,
  normalizeSecurityLogStatus,
} from "../constants";
import * as repo from "../repositories/common";

export async function getSecurityLogs(filter: {
  page?: number;
  pageSize?: number;
  search?: string;
  eventType?: string;
  actorRole?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const page = filter.page || PAGINATION.defaultPage;
  const pageSize = filter.pageSize || PAGINATION.defaultSecurityLogPageSize;

  const where: any = {};

  if (filter.eventType) {
    where.eventType = filter.eventType;
  }

  if (filter.actorRole) {
    where.actorRole = normalizeSecurityActorRole(filter.actorRole);
  }

  if (filter.status) {
    where.status = normalizeSecurityLogStatus(filter.status);
  }

  if (filter.dateFrom || filter.dateTo) {
    where.timestamp = {};
    if (filter.dateFrom) {
      where.timestamp.gte = new Date(filter.dateFrom);
    }
    if (filter.dateTo) {
      const toDate = new Date(filter.dateTo);
      toDate.setHours(23, 59, 59, 999);
      where.timestamp.lte = toDate;
    }
  }

  if (filter.search) {
    where.OR = [
      { actorName: { contains: filter.search, mode: "insensitive" } },
      { eventType: { contains: filter.search, mode: "insensitive" } },
      { resource: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  const [items, totalItems] = await repo.findSecurityLogsWithCount({
    where,
    page,
    pageSize,
  });

  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    data: items,
    meta: {
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    },
  };
}

export function countRecentFailedLoginAttemptsByIp(ipAddress: string, since: Date) {
  return repo.countRecentFailedLoginAttemptsByIp({
    ipAddress,
    since,
    eventType: SECURITY_EVENT_TYPE.AUTH_LOGIN_FAILED,
    status: SECURITY_LOG_STATUS.FAILED,
  });
}

export async function cleanupExpiredSecurityLogs(): Promise<{
  deletedCount: number;
  retentionDays: number;
}> {
  const rawDays = await getSystemSettingValue("security_log_retention_days", "30");
  let retentionDays = parseInt(rawDays, 10);
  if (isNaN(retentionDays) || retentionDays <= 0) {
    retentionDays = 30;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const result = await repo.deleteSecurityLogsBeforeDate(cutoffDate);

  return {
    deletedCount: result.count,
    retentionDays,
  };
}
