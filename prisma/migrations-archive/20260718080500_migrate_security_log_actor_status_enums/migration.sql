-- CreateEnum
CREATE TYPE "SecurityLogStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "SecurityActorRole" AS ENUM ('ADMIN', 'STAFF', 'EMPLOYEE', 'PUBLIC', 'SYSTEM');

-- AlterTable
ALTER TABLE "SecurityLog"
  ALTER COLUMN "status" TYPE "SecurityLogStatus" USING (
    CASE
      WHEN UPPER("status"::text) = 'SUCCESS' THEN 'SUCCESS'
      WHEN UPPER("status"::text) = 'FAILED' THEN 'FAILED'
      ELSE 'FAILED'
    END::"SecurityLogStatus"
  ),
  ALTER COLUMN "actorRole" TYPE "SecurityActorRole" USING (
    CASE
      WHEN UPPER("actorRole"::text) = 'ADMIN' THEN 'ADMIN'
      WHEN UPPER("actorRole"::text) = 'STAFF' THEN 'STAFF'
      WHEN UPPER("actorRole"::text) = 'EMPLOYEE' THEN 'EMPLOYEE'
      WHEN UPPER("actorRole"::text) = 'PUBLIC' THEN 'PUBLIC'
      WHEN UPPER("actorRole"::text) = 'SYSTEM' THEN 'SYSTEM'
      ELSE 'SYSTEM'
    END::"SecurityActorRole"
  );
