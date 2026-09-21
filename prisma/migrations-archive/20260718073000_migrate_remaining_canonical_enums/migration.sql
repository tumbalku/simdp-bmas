-- CreateEnum
CREATE TYPE "EmployeeReligion" AS ENUM ('ISLAM', 'PROTESTANT', 'CATHOLIC', 'HINDU', 'BUDDHIST', 'CONFUCIAN');

-- CreateEnum
CREATE TYPE "StorageProvider" AS ENUM ('local', 'supabase', 's3');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('DOCUMENT_STATUS', 'DOCUMENT_VERIFICATION', 'EXPIRY_REMINDER', 'VERIFICATION_REQUIRED', 'INFO');

-- CreateEnum
CREATE TYPE "NotificationRelatedEntityType" AS ENUM ('DocumentRecord');

-- AlterTable
ALTER TABLE "Employee"
  ALTER COLUMN "religion" TYPE "EmployeeReligion" USING (
    CASE
      WHEN "religion"::text = 'ISLAM' THEN 'ISLAM'
      WHEN "religion"::text = 'Islam' THEN 'ISLAM'
      WHEN "religion"::text = 'PROTESTANT' THEN 'PROTESTANT'
      WHEN "religion"::text = 'Kristen' THEN 'PROTESTANT'
      WHEN "religion"::text = 'Protestan' THEN 'PROTESTANT'
      WHEN "religion"::text = 'Kristen (Protestan)' THEN 'PROTESTANT'
      WHEN "religion"::text = 'CATHOLIC' THEN 'CATHOLIC'
      WHEN "religion"::text = 'Katolik' THEN 'CATHOLIC'
      WHEN "religion"::text = 'HINDU' THEN 'HINDU'
      WHEN "religion"::text = 'Hindu' THEN 'HINDU'
      WHEN "religion"::text = 'BUDDHIST' THEN 'BUDDHIST'
      WHEN "religion"::text = 'Buddha' THEN 'BUDDHIST'
      WHEN "religion"::text = 'CONFUCIAN' THEN 'CONFUCIAN'
      WHEN "religion"::text = 'Khonghucu' THEN 'CONFUCIAN'
      WHEN "religion"::text = 'Konghucu' THEN 'CONFUCIAN'
      ELSE NULL
    END::"EmployeeReligion"
  );

-- AlterTable
ALTER TABLE "DocumentRecord" DROP CONSTRAINT IF EXISTS "DocumentRecord_storageProvider_check";

ALTER TABLE "DocumentRecord"
  ALTER COLUMN "storageProvider" DROP DEFAULT,
  ALTER COLUMN "storageProvider" TYPE "StorageProvider" USING (
    CASE
      WHEN "storageProvider"::text = 'LOCAL' THEN 'local'
      WHEN "storageProvider"::text = 'local' THEN 'local'
      WHEN "storageProvider"::text = 'SUPABASE' THEN 'supabase'
      WHEN "storageProvider"::text = 'supabase' THEN 'supabase'
      WHEN "storageProvider"::text = 'S3' THEN 's3'
      WHEN "storageProvider"::text = 's3' THEN 's3'
      ELSE 'local'
    END::"StorageProvider"
  ),
  ALTER COLUMN "storageProvider" SET DEFAULT 'local';

-- AlterTable
ALTER TABLE "Notification"
  ALTER COLUMN "type" TYPE "NotificationType" USING (
    CASE
      WHEN "type"::text = 'DOCUMENT_STATUS' THEN 'DOCUMENT_STATUS'
      WHEN "type"::text = 'DOCUMENT_VERIFICATION' THEN 'DOCUMENT_VERIFICATION'
      WHEN "type"::text = 'EXPIRY_REMINDER' THEN 'EXPIRY_REMINDER'
      WHEN "type"::text = 'VERIFICATION_REQUIRED' THEN 'VERIFICATION_REQUIRED'
      WHEN "type"::text = 'INFO' THEN 'INFO'
      ELSE 'INFO'
    END::"NotificationType"
  ),
  ALTER COLUMN "relatedEntityType" TYPE "NotificationRelatedEntityType" USING (
    CASE
      WHEN "relatedEntityType"::text = 'DocumentRecord' THEN 'DocumentRecord'
      WHEN "relatedEntityType"::text = 'DOCUMENT_RECORD' THEN 'DocumentRecord'
      ELSE NULL
    END::"NotificationRelatedEntityType"
  );
