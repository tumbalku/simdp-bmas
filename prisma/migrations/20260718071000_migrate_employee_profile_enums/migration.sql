-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'RETIRED', 'STUDY_ASSIGNMENT');

-- CreateEnum
CREATE TYPE "EmployeeGender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "EmployeeMaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- AlterTable: migrate legacy Indonesian employee profile strings to English enum values.
ALTER TABLE "Employee"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "EmployeeStatus" USING (
    CASE
      WHEN "status" = 'Aktif' THEN 'ACTIVE'
      WHEN "status" = 'Pensiun' THEN 'RETIRED'
      WHEN "status" = 'Tubel' THEN 'STUDY_ASSIGNMENT'
      WHEN "status" = 'ACTIVE' THEN 'ACTIVE'
      WHEN "status" = 'RETIRED' THEN 'RETIRED'
      WHEN "status" = 'STUDY_ASSIGNMENT' THEN 'STUDY_ASSIGNMENT'
      ELSE 'ACTIVE'
    END::"EmployeeStatus"
  ),
  ALTER COLUMN "status" SET DEFAULT 'ACTIVE',
  ALTER COLUMN "gender" TYPE "EmployeeGender" USING (
    CASE
      WHEN "gender" IN ('Laki-laki', 'LakiLaki', 'Pria', 'MALE') THEN 'MALE'
      WHEN "gender" IN ('Perempuan', 'Wanita', 'FEMALE') THEN 'FEMALE'
      ELSE NULL
    END::"EmployeeGender"
  ),
  ALTER COLUMN "maritalStatus" TYPE "EmployeeMaritalStatus" USING (
    CASE
      WHEN "maritalStatus" IN ('Belum Kawin', 'SINGLE') THEN 'SINGLE'
      WHEN "maritalStatus" IN ('Kawin', 'MARRIED') THEN 'MARRIED'
      WHEN "maritalStatus" IN ('Cerai Hidup', 'DIVORCED') THEN 'DIVORCED'
      WHEN "maritalStatus" IN ('Cerai Meninggal', 'WIDOWED') THEN 'WIDOWED'
      ELSE NULL
    END::"EmployeeMaritalStatus"
  );
