/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { PAGINATION } from "@/constants/pagination";
import {
  normalizeSecurityActorRole,
  normalizeSecurityLogStatus,
  type SecurityActorRole,
  type SecurityLogStatus,
} from "./constants";

export type LogActivityInput = {
  actorId?: string | null;
  actorName: string;
  actorRole: SecurityActorRole | string;
  eventType: string;
  resource: string;
  ipAddress?: string | null;
  status: SecurityLogStatus | string;
  metadata?: Record<string, any>;
};

export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    await prisma.securityLog.create({
      data: {
        id: crypto.randomUUID(),
        actorId: input.actorId || null,
        actorName: input.actorName,
        actorRole: normalizeSecurityActorRole(input.actorRole),
        eventType: input.eventType,
        resource: input.resource,
        ipAddress: input.ipAddress || null,
        status: normalizeSecurityLogStatus(input.status),
        metadata: input.metadata ?? undefined,
      },
    });
  } catch (error) {
    console.error("Gagal mencatat log aktivitas keamanan:", error);
  }
}

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

  const [items, totalItems] = await prisma.$transaction([
    prisma.securityLog.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { timestamp: "desc" },
    }),
    prisma.securityLog.count({ where }),
  ]);

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

