-- Add public document verification records for issued SIMDP documents.

CREATE TYPE "DocumentVerificationType" AS ENUM ('EMPLOYEE_PROFILE');

CREATE TABLE "DocumentVerification" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "documentType" "DocumentVerificationType" NOT NULL,
  "subjectEmployeeId" TEXT NOT NULL,
  "issuedByUserId" TEXT,
  "fileHash" TEXT,
  "metadata" JSONB,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "revokedByUserId" TEXT,
  "revokeReason" TEXT,

  CONSTRAINT "DocumentVerification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DocumentVerification_code_key" ON "DocumentVerification"("code");
CREATE INDEX "idx_documentverification_subject" ON "DocumentVerification"("subjectEmployeeId");
CREATE INDEX "idx_documentverification_issued_at" ON "DocumentVerification"("issuedAt");

ALTER TABLE "DocumentVerification"
  ADD CONSTRAINT "DocumentVerification_subjectEmployeeId_fkey"
  FOREIGN KEY ("subjectEmployeeId") REFERENCES "Employee"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DocumentVerification"
  ADD CONSTRAINT "DocumentVerification_issuedByUserId_fkey"
  FOREIGN KEY ("issuedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DocumentVerification"
  ADD CONSTRAINT "DocumentVerification_revokedByUserId_fkey"
  FOREIGN KEY ("revokedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
