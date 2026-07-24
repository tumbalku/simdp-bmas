import { prisma } from "@/lib/prisma";

export type SharedRateLimitBucket = {
  key: string;
  category: string;
  count: number;
  resetAt: Date;
  limitedLoggedAt: Date | null;
};

const RATE_LIMIT_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const RATE_LIMIT_RETENTION_MS = 24 * 60 * 60 * 1000;

let lastCleanupAt = 0;

export function getSharedRateLimitKey(category: string, resourceKey: string) {
  return `${category}:${resourceKey}`;
}

export async function getSharedRateLimitBucket(key: string): Promise<SharedRateLimitBucket | null> {
  const bucket = await prisma.rateLimitBucket.findUnique({
    where: { key },
  });

  if (!bucket) return null;
  if (bucket.resetAt <= new Date()) return null;

  return bucket;
}

export async function incrementSharedRateLimitBucket(input: {
  key: string;
  category: string;
  windowMs: number;
  now?: Date;
}): Promise<SharedRateLimitBucket> {
  const now = input.now ?? new Date();
  const resetAt = new Date(now.getTime() + input.windowMs);

  const rows = await prisma.$queryRaw<SharedRateLimitBucket[]>`
    INSERT INTO "RateLimitBucket" (
      "key",
      "category",
      "count",
      "resetAt",
      "limitedLoggedAt",
      "createdAt",
      "updatedAt"
    ) VALUES (
      ${input.key},
      ${input.category},
      1,
      ${resetAt},
      NULL,
      ${now},
      ${now}
    )
    ON CONFLICT ("key") DO UPDATE SET
      "category" = EXCLUDED."category",
      "count" = CASE
        WHEN "RateLimitBucket"."resetAt" <= ${now} THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimitBucket"."resetAt" <= ${now} THEN ${resetAt}
        ELSE "RateLimitBucket"."resetAt"
      END,
      "limitedLoggedAt" = CASE
        WHEN "RateLimitBucket"."resetAt" <= ${now} THEN NULL
        ELSE "RateLimitBucket"."limitedLoggedAt"
      END,
      "updatedAt" = ${now}
    RETURNING
      "key",
      "category",
      "count",
      "resetAt",
      "limitedLoggedAt"
  `;

  const bucket = rows[0];
  if (!bucket) {
    throw new Error("Gagal memperbarui bucket rate limit terdistribusi.");
  }

  await cleanupExpiredRateLimitBuckets(now);
  return bucket;
}

export async function claimSharedRateLimitLimitedLog(key: string, now?: Date): Promise<boolean> {
  const current = now ?? new Date();
  const updated = await prisma.rateLimitBucket.updateMany({
    where: {
      key,
      resetAt: {
        gt: current,
      },
      limitedLoggedAt: null,
    },
    data: {
      limitedLoggedAt: current,
      updatedAt: current,
    },
  });

  return updated.count === 1;
}

async function cleanupExpiredRateLimitBuckets(now: Date) {
  if (now.getTime() - lastCleanupAt < RATE_LIMIT_CLEANUP_INTERVAL_MS) return;

  lastCleanupAt = now.getTime();
  await prisma.rateLimitBucket.deleteMany({
    where: {
      resetAt: {
        lt: new Date(now.getTime() - RATE_LIMIT_RETENTION_MS),
      },
    },
  });
}
