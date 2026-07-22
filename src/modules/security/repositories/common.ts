import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { SecurityActorRole, SecurityLogStatus } from "../constants";

export function createSecurityLog(input: {
  id: string;
  actorId: string | null;
  actorName: string;
  actorRole: SecurityActorRole;
  eventType: string;
  resource: string;
  ipAddress: string | null;
  status: SecurityLogStatus;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.securityLog.create({
    data: {
      id: input.id,
      actorId: input.actorId,
      actorName: input.actorName,
      actorRole: input.actorRole,
      eventType: input.eventType,
      resource: input.resource,
      ipAddress: input.ipAddress,
      status: input.status,
      metadata: input.metadata ?? undefined,
    },
  });
}

export function findSecurityLogsWithCount(input: {
  where: Record<string, unknown>;
  page: number;
  pageSize: number;
}) {
  return prisma.$transaction([
    prisma.securityLog.findMany({
      where: input.where,
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      orderBy: { timestamp: "desc" },
    }),
    prisma.securityLog.count({ where: input.where }),
  ]);
}

export function countRecentFailedLoginAttemptsByIp(input: {
  ipAddress: string;
  since: Date;
  eventType: string;
  status: SecurityLogStatus;
}) {
  return prisma.securityLog.count({
    where: {
      ipAddress: input.ipAddress,
      eventType: input.eventType,
      status: input.status,
      timestamp: {
        gte: input.since,
      },
    },
  });
}
