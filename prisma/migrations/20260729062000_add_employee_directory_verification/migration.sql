ALTER TYPE "DocumentVerificationType" ADD VALUE IF NOT EXISTS 'EMPLOYEE_DIRECTORY';

ALTER TABLE "DocumentVerification"
  ALTER COLUMN "subjectEmployeeId" DROP NOT NULL;
