-- Create staging table for temporary public user registration requests.
-- This table intentionally has no foreign keys to User, Employee, or Notification
-- so the feature can be disabled or dropped without cascading into core data.

CREATE TABLE "UserRegistrationRequest" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "nik" TEXT,
  "employeeId" TEXT,
  "passwordHash" TEXT NOT NULL,
  "phone" TEXT,
  "workplaceName" TEXT,
  "note" TEXT,
  "status" TEXT NOT NULL DEFAULT 'EMAIL_PENDING',
  "emailOtpHash" TEXT,
  "emailOtpExpiresAt" TIMESTAMP(3),
  "emailOtpAttempts" INTEGER NOT NULL DEFAULT 0,
  "emailOtpSentAt" TIMESTAMP(3),
  "emailVerifiedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "reviewedByAdminId" TEXT,
  "reviewNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserRegistrationRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserRegistrationRequest_email_key" ON "UserRegistrationRequest"("email");
CREATE UNIQUE INDEX "UserRegistrationRequest_nik_key" ON "UserRegistrationRequest"("nik");
CREATE UNIQUE INDEX "UserRegistrationRequest_employeeId_key" ON "UserRegistrationRequest"("employeeId");
CREATE INDEX "idx_userregistration_status_created" ON "UserRegistrationRequest"("status", "createdAt");
CREATE INDEX "idx_userregistration_email_verified" ON "UserRegistrationRequest"("emailVerifiedAt");
