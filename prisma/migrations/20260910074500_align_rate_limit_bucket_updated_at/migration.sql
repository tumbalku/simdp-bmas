-- Align existing databases with the Prisma schema.
-- Prisma manages this field with @updatedAt, so the database column should not
-- carry its own default value.

ALTER TABLE "RateLimitBucket"
  ALTER COLUMN "updatedAt" DROP DEFAULT;
