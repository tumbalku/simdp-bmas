-- DropForeignKey
ALTER TABLE "DocumentRecord" DROP CONSTRAINT "DocumentRecord_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "DocumentRecord" DROP CONSTRAINT "DocumentRecord_documentTypeId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentRecord" DROP CONSTRAINT "DocumentRecord_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentRecord" DROP CONSTRAINT "DocumentRecord_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "DocumentType" DROP CONSTRAINT "DocumentType_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "DocumentType" DROP CONSTRAINT "DocumentType_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "DocumentTypeEmployeeGroup" DROP CONSTRAINT "DocumentTypeEmployeeGroup_documentTypeId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentTypeEmployeeGroup" DROP CONSTRAINT "DocumentTypeEmployeeGroup_employeeGroupId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentTypeEmployeePosition" DROP CONSTRAINT "DocumentTypeEmployeePosition_documentTypeId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentTypeEmployeePosition" DROP CONSTRAINT "DocumentTypeEmployeePosition_employeePositionId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentTypeEmployeeRank" DROP CONSTRAINT "DocumentTypeEmployeeRank_documentTypeId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentTypeEmployeeRank" DROP CONSTRAINT "DocumentTypeEmployeeRank_employeeRankId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentTypeEmploymentStatus" DROP CONSTRAINT "DocumentTypeEmploymentStatus_documentTypeId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentTypeEmploymentStatus" DROP CONSTRAINT "DocumentTypeEmploymentStatus_employmentStatusId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentTypeProfessionGroup" DROP CONSTRAINT "DocumentTypeProfessionGroup_documentTypeId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentTypeProfessionGroup" DROP CONSTRAINT "DocumentTypeProfessionGroup_professionGroupId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentTypeWorkplace" DROP CONSTRAINT "DocumentTypeWorkplace_documentTypeId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentTypeWorkplace" DROP CONSTRAINT "DocumentTypeWorkplace_workplaceId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_employeeGroupId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_employeePositionId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_employeeRankId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_employmentStatusId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_userId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_workplaceId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeCareerHistory" DROP CONSTRAINT "EmployeeCareerHistory_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeCareerHistory" DROP CONSTRAINT "EmployeeCareerHistory_employeeGroupId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeCareerHistory" DROP CONSTRAINT "EmployeeCareerHistory_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeCareerHistory" DROP CONSTRAINT "EmployeeCareerHistory_employeePositionId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeCareerHistory" DROP CONSTRAINT "EmployeeCareerHistory_employeeRankId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeCareerHistory" DROP CONSTRAINT "EmployeeCareerHistory_employmentStatusId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeCareerHistory" DROP CONSTRAINT "EmployeeCareerHistory_workplaceId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeGroup" DROP CONSTRAINT "EmployeeGroup_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeGroup" DROP CONSTRAINT "EmployeeGroup_employmentStatusId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeGroup" DROP CONSTRAINT "EmployeeGroup_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "EmployeePosition" DROP CONSTRAINT "EmployeePosition_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "EmployeePosition" DROP CONSTRAINT "EmployeePosition_professionGroupId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeePosition" DROP CONSTRAINT "EmployeePosition_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeRank" DROP CONSTRAINT "EmployeeRank_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeRank" DROP CONSTRAINT "EmployeeRank_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "EmploymentStatus" DROP CONSTRAINT "EmploymentStatus_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "EmploymentStatus" DROP CONSTRAINT "EmploymentStatus_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "PasswordResetToken" DROP CONSTRAINT "PasswordResetToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "ProfessionGroup" DROP CONSTRAINT "ProfessionGroup_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "ProfessionGroup" DROP CONSTRAINT "ProfessionGroup_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "SecurityLog" DROP CONSTRAINT "SecurityLog_actorId_fkey";

-- DropForeignKey
ALTER TABLE "SystemSetting" DROP CONSTRAINT "SystemSetting_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "VerificationHistory" DROP CONSTRAINT "VerificationHistory_documentRecordId_fkey";

-- DropForeignKey
ALTER TABLE "VerificationHistory" DROP CONSTRAINT "VerificationHistory_reviewedById_fkey";

-- DropForeignKey
ALTER TABLE "Workplace" DROP CONSTRAINT "Workplace_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Workplace" DROP CONSTRAINT "Workplace_updatedBy_fkey";

-- AlterTable
ALTER TABLE "DocumentRecord" ALTER COLUMN "reminderH30SentAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "reminderH7SentAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "reminderH1SentAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "uploadedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deletedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "DocumentType" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deletedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Aktif',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deletedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EmployeeCareerHistory" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EmployeeGroup" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EmployeePosition" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EmployeeRank" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EmploymentStatus" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PasswordResetToken" ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "usedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProfessionGroup" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "revokedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SecurityLog" ALTER COLUMN "timestamp" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SystemSetting" ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "lastLoginAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deletedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "VerificationHistory" ALTER COLUMN "reviewedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Workplace" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

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
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "DocumentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationHistory" ADD CONSTRAINT "VerificationHistory_documentRecordId_fkey" FOREIGN KEY ("documentRecordId") REFERENCES "DocumentRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationHistory" ADD CONSTRAINT "VerificationHistory_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityLog" ADD CONSTRAINT "SecurityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemSetting" ADD CONSTRAINT "SystemSetting_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
