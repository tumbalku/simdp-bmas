-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'REPLACED');

-- CreateEnum
CREATE TYPE "ArchiveCategory" AS ENUM ('PERSONAL', 'EDUCATION', 'EMPLOYMENT', 'CERTIFICATION', 'LEGAL', 'PERIODIC');

-- CreateEnum
CREATE TYPE "StorageProvider" AS ENUM ('local', 'supabase', 's3');

-- CreateEnum
CREATE TYPE "DocumentUploader" AS ENUM ('EMPLOYEE', 'ADMIN', 'BOTH');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('DOCUMENT_STATUS', 'DOCUMENT_VERIFICATION', 'EXPIRY_REMINDER', 'VERIFICATION_REQUIRED', 'ANNOUNCEMENT', 'INFO');

-- CreateEnum
CREATE TYPE "NotificationRelatedEntityType" AS ENUM ('DocumentRecord');

-- CreateEnum
CREATE TYPE "SecurityLogStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "SecurityActorRole" AS ENUM ('ADMIN', 'STAFF', 'EMPLOYEE', 'PUBLIC', 'SYSTEM');

-- CreateEnum
CREATE TYPE "DocumentVerificationType" AS ENUM ('EMPLOYEE_PROFILE', 'EMPLOYEE_DIRECTORY', 'EMPLOYEE_DOCUMENTS', 'MASTER_DATA_DOCUMENTS');

-- CreateEnum
CREATE TYPE "PostVisibilityType" AS ENUM ('PUBLIC', 'TARGETED');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'RETIRED', 'STUDY_ASSIGNMENT');

-- CreateEnum
CREATE TYPE "EmployeeGender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "EmployeeMaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "EmployeeReligion" AS ENUM ('ISLAM', 'PROTESTANT', 'CATHOLIC', 'HINDU', 'BUDDHIST', 'CONFUCIAN');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('EMAIL_PENDING', 'EMAIL_VERIFIED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTwoFactor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "secretEncrypted" TEXT NOT NULL,
    "recoveryCodeHashes" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "emailOtpHash" TEXT,
    "emailOtpExpiresAt" TIMESTAMP(3),
    "emailOtpSentAt" TIMESTAMP(3),
    "emailOtpAttempts" INTEGER NOT NULL DEFAULT 0,
    "emailOtpLockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTwoFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentStatus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmploymentStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "employmentStatusId" TEXT NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfessionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeePosition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "professionGroupId" TEXT NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeePosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeRank" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rankName" TEXT,
    "grade" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeRank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workplace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workplace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT,
    "nik" TEXT,
    "name" TEXT NOT NULL,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "avatarUrl" TEXT,
    "googleAvatarUrl" TEXT,
    "gender" "EmployeeGender",
    "birthDate" DATE,
    "birthPlace" TEXT,
    "academicDegree" TEXT,
    "lastEducation" TEXT,
    "religion" "EmployeeReligion",
    "maritalStatus" "EmployeeMaritalStatus",
    "phone" TEXT,
    "address" TEXT,
    "joinDate" DATE,
    "hasTmt" BOOLEAN NOT NULL DEFAULT false,
    "tmtStartDate" DATE,
    "tmtEndDate" DATE,
    "employmentStatusId" TEXT,
    "employeeGroupId" TEXT,
    "employeePositionId" TEXT,
    "employeeRankId" TEXT,
    "workplaceId" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profileSelfUpdatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeCareerHistory" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "employmentStatusId" TEXT,
    "employeeGroupId" TEXT,
    "employeePositionId" TEXT,
    "employeeRankId" TEXT,
    "workplaceId" TEXT,
    "effectiveDate" DATE NOT NULL,
    "endDate" DATE,
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeCareerHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoredFile" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "storageProvider" "StorageProvider" NOT NULL,
    "uploadedBy" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "archiveCategory" "ArchiveCategory" NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT false,
    "requiresExpiryDate" BOOLEAN NOT NULL DEFAULT false,
    "requiresIssueDate" BOOLEAN NOT NULL DEFAULT false,
    "requiresDocumentNumber" BOOLEAN NOT NULL DEFAULT false,
    "requiresPeriod" BOOLEAN NOT NULL DEFAULT false,
    "uploaderRole" "DocumentUploader" NOT NULL DEFAULT 'BOTH',
    "adminUploadAutoFinal" BOOLEAN NOT NULL DEFAULT false,
    "allowedFormats" TEXT NOT NULL,
    "maxSizeMb" DOUBLE PRECISION NOT NULL,
    "icon" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DocumentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTypeProfessionGroup" (
    "id" TEXT NOT NULL,
    "documentTypeId" TEXT NOT NULL,
    "professionGroupId" TEXT NOT NULL,

    CONSTRAINT "DocumentTypeProfessionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTypeEmploymentStatus" (
    "id" TEXT NOT NULL,
    "documentTypeId" TEXT NOT NULL,
    "employmentStatusId" TEXT NOT NULL,

    CONSTRAINT "DocumentTypeEmploymentStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTypeEmployeeGroup" (
    "id" TEXT NOT NULL,
    "documentTypeId" TEXT NOT NULL,
    "employeeGroupId" TEXT NOT NULL,

    CONSTRAINT "DocumentTypeEmployeeGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTypeEmployeePosition" (
    "id" TEXT NOT NULL,
    "documentTypeId" TEXT NOT NULL,
    "employeePositionId" TEXT NOT NULL,

    CONSTRAINT "DocumentTypeEmployeePosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTypeEmployeeRank" (
    "id" TEXT NOT NULL,
    "documentTypeId" TEXT NOT NULL,
    "employeeRankId" TEXT NOT NULL,

    CONSTRAINT "DocumentTypeEmployeeRank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTypeWorkplace" (
    "id" TEXT NOT NULL,
    "documentTypeId" TEXT NOT NULL,
    "workplaceId" TEXT NOT NULL,

    CONSTRAINT "DocumentTypeWorkplace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRecord" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "documentTypeId" TEXT NOT NULL,
    "storedFileId" TEXT NOT NULL,
    "replacesDocumentId" TEXT,
    "title" TEXT,
    "documentNumber" TEXT,
    "issueDate" DATE,
    "expiryDate" DATE,
    "periodStartDate" DATE,
    "periodEndDate" DATE,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "allowMultipleSnapshot" BOOLEAN NOT NULL DEFAULT false,
    "reminderH30SentAt" TIMESTAMP(3),
    "reminderH7SentAt" TIMESTAMP(3),
    "reminderH1SentAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DocumentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationHistory" (
    "id" TEXT NOT NULL,
    "documentRecordId" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL,
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVerification" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "documentType" "DocumentVerificationType" NOT NULL,
    "subjectEmployeeId" TEXT,
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

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "visibilityType" "PostVisibilityType" NOT NULL DEFAULT 'PUBLIC',
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostAttachment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "storedFileId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostVisibilityRole" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "PostVisibilityRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostVisibilityWorkplace" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "workplaceId" TEXT NOT NULL,

    CONSTRAINT "PostVisibilityWorkplace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostVisibilityEmployeeGroup" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "employeeGroupId" TEXT NOT NULL,

    CONSTRAINT "PostVisibilityEmployeeGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostVisibilityUser" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PostVisibilityUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedEntityType" "NotificationRelatedEntityType",
    "relatedEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "actorName" TEXT NOT NULL,
    "actorRole" "SecurityActorRole" NOT NULL,
    "eventType" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "ipAddress" TEXT,
    "status" "SecurityLogStatus" NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "SecurityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "limitedLoggedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "UserRegistrationRequest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nik" TEXT,
    "claimedNip" TEXT,
    "passwordHash" TEXT,
    "phone" TEXT,
    "workplaceName" TEXT,
    "note" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'EMAIL_PENDING',
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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "idx_user_deleted" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_user_email" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserTwoFactor_userId_key" ON "UserTwoFactor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "idx_refreshtoken_user" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "idx_refreshtoken_expires" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "idx_passwordreset_user" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "idx_passwordreset_token" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "EmploymentStatus_name_key" ON "EmploymentStatus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeGroup_name_employmentStatusId_key" ON "EmployeeGroup"("name", "employmentStatusId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionGroup_name_key" ON "ProfessionGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeePosition_name_professionGroupId_key" ON "EmployeePosition"("name", "professionGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeRank_name_key" ON "EmployeeRank"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Workplace_name_key" ON "Workplace"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeId_key" ON "Employee"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_nik_key" ON "Employee"("nik");

-- CreateIndex
CREATE INDEX "idx_employee_deleted" ON "Employee"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_employee_userid" ON "Employee"("userId");

-- CreateIndex
CREATE INDEX "idx_employee_nip" ON "Employee"("employeeId");

-- CreateIndex
CREATE INDEX "idx_employee_nik" ON "Employee"("nik");

-- CreateIndex
CREATE INDEX "idx_careerhistory_employee" ON "EmployeeCareerHistory"("employeeId", "effectiveDate" DESC);

-- CreateIndex
CREATE INDEX "idx_storedfile_hash" ON "StoredFile"("fileHash");

-- CreateIndex
CREATE INDEX "idx_storedfile_deleted" ON "StoredFile"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_storedfile_uploaded" ON "StoredFile"("uploadedBy");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentType_code_key" ON "DocumentType"("code");

-- CreateIndex
CREATE INDEX "idx_documenttype_category" ON "DocumentType"("archiveCategory");

-- CreateIndex
CREATE INDEX "idx_documenttype_deleted" ON "DocumentType"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTypeProfessionGroup_documentTypeId_professionGroupI_key" ON "DocumentTypeProfessionGroup"("documentTypeId", "professionGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTypeEmploymentStatus_documentTypeId_employmentStatu_key" ON "DocumentTypeEmploymentStatus"("documentTypeId", "employmentStatusId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTypeEmployeeGroup_documentTypeId_employeeGroupId_key" ON "DocumentTypeEmployeeGroup"("documentTypeId", "employeeGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTypeEmployeePosition_documentTypeId_employeePositio_key" ON "DocumentTypeEmployeePosition"("documentTypeId", "employeePositionId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTypeEmployeeRank_documentTypeId_employeeRankId_key" ON "DocumentTypeEmployeeRank"("documentTypeId", "employeeRankId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTypeWorkplace_documentTypeId_workplaceId_key" ON "DocumentTypeWorkplace"("documentTypeId", "workplaceId");

-- CreateIndex
CREATE INDEX "idx_documentrecord_owner_type" ON "DocumentRecord"("ownerId", "documentTypeId");

-- CreateIndex
CREATE INDEX "idx_documentrecord_type" ON "DocumentRecord"("documentTypeId");

-- CreateIndex
CREATE INDEX "idx_documentrecord_expiry" ON "DocumentRecord"("expiryDate");

-- CreateIndex
CREATE INDEX "idx_documentrecord_status" ON "DocumentRecord"("status");

-- CreateIndex
CREATE INDEX "idx_documentrecord_file" ON "DocumentRecord"("storedFileId");

-- CreateIndex
CREATE INDEX "idx_documentrecord_replaces" ON "DocumentRecord"("replacesDocumentId");

-- CreateIndex
CREATE INDEX "idx_documentrecord_deleted" ON "DocumentRecord"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_verificationhistory_document" ON "VerificationHistory"("documentRecordId", "reviewedAt" DESC);

-- CreateIndex
CREATE INDEX "idx_verificationhistory_reviewer" ON "VerificationHistory"("reviewedById");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVerification_code_key" ON "DocumentVerification"("code");

-- CreateIndex
CREATE INDEX "idx_documentverification_subject" ON "DocumentVerification"("subjectEmployeeId");

-- CreateIndex
CREATE INDEX "idx_documentverification_issued_at" ON "DocumentVerification"("issuedAt");

-- CreateIndex
CREATE INDEX "idx_post_status" ON "Post"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "idx_post_author" ON "Post"("authorId");

-- CreateIndex
CREATE INDEX "idx_post_pinned" ON "Post"("isPinned", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "idx_post_deleted" ON "Post"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_postattachment_post" ON "PostAttachment"("postId", "displayOrder");

-- CreateIndex
CREATE INDEX "idx_postattachment_file" ON "PostAttachment"("storedFileId");

-- CreateIndex
CREATE INDEX "idx_postvisibilityrole_post" ON "PostVisibilityRole"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "PostVisibilityRole_postId_role_key" ON "PostVisibilityRole"("postId", "role");

-- CreateIndex
CREATE INDEX "idx_postvisibilityworkplace_post" ON "PostVisibilityWorkplace"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "PostVisibilityWorkplace_postId_workplaceId_key" ON "PostVisibilityWorkplace"("postId", "workplaceId");

-- CreateIndex
CREATE INDEX "idx_postvisibilitygroup_post" ON "PostVisibilityEmployeeGroup"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "PostVisibilityEmployeeGroup_postId_employeeGroupId_key" ON "PostVisibilityEmployeeGroup"("postId", "employeeGroupId");

-- CreateIndex
CREATE INDEX "idx_postvisibilityuser_post" ON "PostVisibilityUser"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "PostVisibilityUser_postId_userId_key" ON "PostVisibilityUser"("postId", "userId");

-- CreateIndex
CREATE INDEX "idx_notification_user_unread" ON "Notification"("userId", "isRead", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_notification_created" ON "Notification"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_securitylog_actor" ON "SecurityLog"("actorId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_securitylog_timestamp" ON "SecurityLog"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_securitylog_event" ON "SecurityLog"("eventType", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_ratelimitbucket_category_reset" ON "RateLimitBucket"("category", "resetAt");

-- CreateIndex
CREATE INDEX "idx_ratelimitbucket_reset" ON "RateLimitBucket"("resetAt");

-- CreateIndex
CREATE INDEX "idx_userregistration_status_created" ON "UserRegistrationRequest"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_userregistration_email_verified" ON "UserRegistrationRequest"("emailVerifiedAt");

-- CreateIndex
CREATE INDEX "idx_userregistration_email" ON "UserRegistrationRequest"("email");

-- CreateIndex
CREATE INDEX "idx_userregistration_nik" ON "UserRegistrationRequest"("nik");

-- CreateIndex
CREATE INDEX "idx_userregistration_claimed_nip" ON "UserRegistrationRequest"("claimedNip");

-- AddForeignKey
ALTER TABLE "UserTwoFactor" ADD CONSTRAINT "UserTwoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentStatus" ADD CONSTRAINT "EmploymentStatus_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentStatus" ADD CONSTRAINT "EmploymentStatus_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeGroup" ADD CONSTRAINT "EmployeeGroup_employmentStatusId_fkey" FOREIGN KEY ("employmentStatusId") REFERENCES "EmploymentStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeGroup" ADD CONSTRAINT "EmployeeGroup_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeGroup" ADD CONSTRAINT "EmployeeGroup_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionGroup" ADD CONSTRAINT "ProfessionGroup_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionGroup" ADD CONSTRAINT "ProfessionGroup_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePosition" ADD CONSTRAINT "EmployeePosition_professionGroupId_fkey" FOREIGN KEY ("professionGroupId") REFERENCES "ProfessionGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePosition" ADD CONSTRAINT "EmployeePosition_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePosition" ADD CONSTRAINT "EmployeePosition_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeRank" ADD CONSTRAINT "EmployeeRank_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeRank" ADD CONSTRAINT "EmployeeRank_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workplace" ADD CONSTRAINT "Workplace_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workplace" ADD CONSTRAINT "Workplace_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_employmentStatusId_fkey" FOREIGN KEY ("employmentStatusId") REFERENCES "EmploymentStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_employeeGroupId_fkey" FOREIGN KEY ("employeeGroupId") REFERENCES "EmployeeGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_employeePositionId_fkey" FOREIGN KEY ("employeePositionId") REFERENCES "EmployeePosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_employeeRankId_fkey" FOREIGN KEY ("employeeRankId") REFERENCES "EmployeeRank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_workplaceId_fkey" FOREIGN KEY ("workplaceId") REFERENCES "Workplace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeCareerHistory" ADD CONSTRAINT "EmployeeCareerHistory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeCareerHistory" ADD CONSTRAINT "EmployeeCareerHistory_employmentStatusId_fkey" FOREIGN KEY ("employmentStatusId") REFERENCES "EmploymentStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeCareerHistory" ADD CONSTRAINT "EmployeeCareerHistory_employeeGroupId_fkey" FOREIGN KEY ("employeeGroupId") REFERENCES "EmployeeGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeCareerHistory" ADD CONSTRAINT "EmployeeCareerHistory_employeePositionId_fkey" FOREIGN KEY ("employeePositionId") REFERENCES "EmployeePosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeCareerHistory" ADD CONSTRAINT "EmployeeCareerHistory_employeeRankId_fkey" FOREIGN KEY ("employeeRankId") REFERENCES "EmployeeRank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeCareerHistory" ADD CONSTRAINT "EmployeeCareerHistory_workplaceId_fkey" FOREIGN KEY ("workplaceId") REFERENCES "Workplace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeCareerHistory" ADD CONSTRAINT "EmployeeCareerHistory_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentType" ADD CONSTRAINT "DocumentType_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentType" ADD CONSTRAINT "DocumentType_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTypeProfessionGroup" ADD CONSTRAINT "DocumentTypeProfessionGroup_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "DocumentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTypeProfessionGroup" ADD CONSTRAINT "DocumentTypeProfessionGroup_professionGroupId_fkey" FOREIGN KEY ("professionGroupId") REFERENCES "ProfessionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTypeEmploymentStatus" ADD CONSTRAINT "DocumentTypeEmploymentStatus_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "DocumentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTypeEmploymentStatus" ADD CONSTRAINT "DocumentTypeEmploymentStatus_employmentStatusId_fkey" FOREIGN KEY ("employmentStatusId") REFERENCES "EmploymentStatus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTypeEmployeeGroup" ADD CONSTRAINT "DocumentTypeEmployeeGroup_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "DocumentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTypeEmployeeGroup" ADD CONSTRAINT "DocumentTypeEmployeeGroup_employeeGroupId_fkey" FOREIGN KEY ("employeeGroupId") REFERENCES "EmployeeGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTypeEmployeePosition" ADD CONSTRAINT "DocumentTypeEmployeePosition_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "DocumentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTypeEmployeePosition" ADD CONSTRAINT "DocumentTypeEmployeePosition_employeePositionId_fkey" FOREIGN KEY ("employeePositionId") REFERENCES "EmployeePosition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTypeEmployeeRank" ADD CONSTRAINT "DocumentTypeEmployeeRank_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "DocumentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTypeEmployeeRank" ADD CONSTRAINT "DocumentTypeEmployeeRank_employeeRankId_fkey" FOREIGN KEY ("employeeRankId") REFERENCES "EmployeeRank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTypeWorkplace" ADD CONSTRAINT "DocumentTypeWorkplace_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "DocumentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTypeWorkplace" ADD CONSTRAINT "DocumentTypeWorkplace_workplaceId_fkey" FOREIGN KEY ("workplaceId") REFERENCES "Workplace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "DocumentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_storedFileId_fkey" FOREIGN KEY ("storedFileId") REFERENCES "StoredFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_replacesDocumentId_fkey" FOREIGN KEY ("replacesDocumentId") REFERENCES "DocumentRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationHistory" ADD CONSTRAINT "VerificationHistory_documentRecordId_fkey" FOREIGN KEY ("documentRecordId") REFERENCES "DocumentRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationHistory" ADD CONSTRAINT "VerificationHistory_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVerification" ADD CONSTRAINT "DocumentVerification_subjectEmployeeId_fkey" FOREIGN KEY ("subjectEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVerification" ADD CONSTRAINT "DocumentVerification_issuedByUserId_fkey" FOREIGN KEY ("issuedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVerification" ADD CONSTRAINT "DocumentVerification_revokedByUserId_fkey" FOREIGN KEY ("revokedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAttachment" ADD CONSTRAINT "PostAttachment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAttachment" ADD CONSTRAINT "PostAttachment_storedFileId_fkey" FOREIGN KEY ("storedFileId") REFERENCES "StoredFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostVisibilityRole" ADD CONSTRAINT "PostVisibilityRole_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostVisibilityWorkplace" ADD CONSTRAINT "PostVisibilityWorkplace_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostVisibilityWorkplace" ADD CONSTRAINT "PostVisibilityWorkplace_workplaceId_fkey" FOREIGN KEY ("workplaceId") REFERENCES "Workplace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostVisibilityEmployeeGroup" ADD CONSTRAINT "PostVisibilityEmployeeGroup_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostVisibilityEmployeeGroup" ADD CONSTRAINT "PostVisibilityEmployeeGroup_employeeGroupId_fkey" FOREIGN KEY ("employeeGroupId") REFERENCES "EmployeeGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostVisibilityUser" ADD CONSTRAINT "PostVisibilityUser_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostVisibilityUser" ADD CONSTRAINT "PostVisibilityUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityLog" ADD CONSTRAINT "SecurityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemSetting" ADD CONSTRAINT "SystemSetting_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
