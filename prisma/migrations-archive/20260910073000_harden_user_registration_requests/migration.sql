-- Keep existing databases aligned with the hardened registration workflow.
-- Earlier local databases may already have this table with passwordHash NOT NULL
-- and global unique indexes from the initial draft migration.

ALTER TABLE "UserRegistrationRequest"
  ALTER COLUMN "passwordHash" DROP NOT NULL;

DROP INDEX IF EXISTS "UserRegistrationRequest_email_key";
DROP INDEX IF EXISTS "UserRegistrationRequest_nik_key";
DROP INDEX IF EXISTS "UserRegistrationRequest_employeeId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_userregistration_active_email"
  ON "UserRegistrationRequest"("email")
  WHERE "status" IN ('EMAIL_PENDING', 'PENDING_ADMIN_REVIEW');

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_userregistration_active_nik"
  ON "UserRegistrationRequest"("nik")
  WHERE "nik" IS NOT NULL AND "status" IN ('EMAIL_PENDING', 'PENDING_ADMIN_REVIEW');

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_userregistration_active_employee_id"
  ON "UserRegistrationRequest"("employeeId")
  WHERE "employeeId" IS NOT NULL AND "status" IN ('EMAIL_PENDING', 'PENDING_ADMIN_REVIEW');

CREATE INDEX IF NOT EXISTS "idx_userregistration_email"
  ON "UserRegistrationRequest"("email");

CREATE INDEX IF NOT EXISTS "idx_userregistration_nik"
  ON "UserRegistrationRequest"("nik");

CREATE INDEX IF NOT EXISTS "idx_userregistration_employee_id"
  ON "UserRegistrationRequest"("employeeId");
