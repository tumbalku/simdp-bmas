-- ============================================================
-- DMS PEGAWAI — PRODUCTION SCHEMA (PostgreSQL)
-- File ini bisa langsung dieksekusi untuk membuat database.
-- Urutan CREATE TABLE sudah memperhatikan dependency FK.
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF', 'EMPLOYEE');
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'REPLACED');
CREATE TYPE "ArchiveCategory" AS ENUM ('PERSONAL', 'EDUCATION', 'EMPLOYMENT', 'CERTIFICATION', 'LEGAL');

-- ============================================================
-- AUTH
-- ============================================================
CREATE TABLE "User" (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  "passwordHash" text NOT NULL,
  role "Role" NOT NULL DEFAULT 'EMPLOYEE',
  "isActive" boolean NOT NULL DEFAULT true,
  "lastLoginAt" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  "deletedAt" timestamp
);

CREATE TABLE "RefreshToken" (
  id text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  "userAgent" text,
  "ipAddress" text,
  "expiresAt" timestamp NOT NULL,
  "revokedAt" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX idx_refreshtoken_user ON "RefreshToken"("userId");

CREATE TABLE "PasswordResetToken" (
  id text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  "expiresAt" timestamp NOT NULL,
  "usedAt" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX idx_passwordreset_user ON "PasswordResetToken"("userId");

-- ============================================================
-- MASTER DATA KEPEGAWAIAN
-- ============================================================
CREATE TABLE "EmploymentStatus" (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  "createdBy" text REFERENCES "User"(id),
  "updatedBy" text REFERENCES "User"(id),
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "EmployeeGroup" (
  id text PRIMARY KEY,
  name text NOT NULL,
  "employmentStatusId" text NOT NULL REFERENCES "EmploymentStatus"(id),
  "createdBy" text REFERENCES "User"(id),
  "updatedBy" text REFERENCES "User"(id),
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  UNIQUE(name, "employmentStatusId")
);

CREATE TABLE "ProfessionGroup" (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  "createdBy" text REFERENCES "User"(id),
  "updatedBy" text REFERENCES "User"(id),
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "EmployeePosition" (
  id text PRIMARY KEY,
  name text NOT NULL,
  "professionGroupId" text NOT NULL REFERENCES "ProfessionGroup"(id),
  "createdBy" text REFERENCES "User"(id),
  "updatedBy" text REFERENCES "User"(id),
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  UNIQUE(name, "professionGroupId")
);

CREATE TABLE "EmployeeRank" (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  rank_name text,
  grade text,
  "createdBy" text REFERENCES "User"(id),
  "updatedBy" text REFERENCES "User"(id),
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "Workplace" (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  "createdBy" text REFERENCES "User"(id),
  "updatedBy" text REFERENCES "User"(id),
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- ============================================================
-- EMPLOYEE (1-1 dengan User)
-- ============================================================
CREATE TABLE "Employee" (
  id text PRIMARY KEY,
  "userId" text NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
  "employeeId" text UNIQUE,
  nik text UNIQUE,
  name text NOT NULL,
  "avatarUrl" text,
  gender text,
  "birthDate" date,
  "birthPlace" text,
  "academicDegree" text,
  "lastEducation" text,
  religion text,
  "maritalStatus" text,
  phone text,
  address text,
  "joinDate" date,
  "hasTmt" boolean NOT NULL DEFAULT false,
  "tmtStartDate" date,
  "tmtEndDate" date,

  "employmentStatusId" text REFERENCES "EmploymentStatus"(id),
  "employeeGroupId" text REFERENCES "EmployeeGroup"(id),
  "employeePositionId" text REFERENCES "EmployeePosition"(id),
  "employeeRankId" text REFERENCES "EmployeeRank"(id),
  "workplaceId" text REFERENCES "Workplace"(id),

  "createdBy" text REFERENCES "User"(id),
  "updatedBy" text REFERENCES "User"(id),
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  "deletedAt" timestamp,

  CONSTRAINT chk_employee_identifier_required
    CHECK ("employeeId" IS NOT NULL OR nik IS NOT NULL)
);
CREATE INDEX idx_employee_deleted ON "Employee"("deletedAt");

-- ============================================================
-- RIWAYAT MUTASI / JABATAN / PANGKAT
-- ============================================================
CREATE TABLE "EmployeeCareerHistory" (
  id text PRIMARY KEY,
  "employeeId" text NOT NULL REFERENCES "Employee"(id) ON DELETE CASCADE,
  "employmentStatusId" text REFERENCES "EmploymentStatus"(id),
  "employeeGroupId" text REFERENCES "EmployeeGroup"(id),
  "employeePositionId" text REFERENCES "EmployeePosition"(id),
  "employeeRankId" text REFERENCES "EmployeeRank"(id),
  "workplaceId" text REFERENCES "Workplace"(id),
  "effectiveDate" date NOT NULL,
  "endDate" date,
  note text,
  "createdBy" text REFERENCES "User"(id),
  "createdAt" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX idx_careerhistory_employee ON "EmployeeCareerHistory"("employeeId", "effectiveDate");

-- ============================================================
-- DOCUMENT TYPE
-- ============================================================
CREATE TABLE "DocumentType" (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  "archiveCategory" "ArchiveCategory" NOT NULL,
  "isMandatory" boolean NOT NULL DEFAULT false,
  "allowMultiple" boolean NOT NULL DEFAULT false,
  "requiresExpiryDate" boolean NOT NULL DEFAULT false,
  "requiresIssueDate" boolean NOT NULL DEFAULT false,
  "requiresDocumentNumber" boolean NOT NULL DEFAULT false,
  "allowedFormats" text NOT NULL,
  "maxSizeMb" double precision NOT NULL,
  icon text,
  "createdBy" text REFERENCES "User"(id),
  "updatedBy" text REFERENCES "User"(id),
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  "deletedAt" timestamp
);

CREATE TABLE "DocumentTypeProfessionGroup" (
  id text PRIMARY KEY,
  "documentTypeId" text NOT NULL REFERENCES "DocumentType"(id) ON DELETE CASCADE,
  "professionGroupId" text NOT NULL REFERENCES "ProfessionGroup"(id) ON DELETE CASCADE,
  UNIQUE("documentTypeId", "professionGroupId")
);

CREATE TABLE "DocumentTypeEmploymentStatus" (
  id text PRIMARY KEY,
  "documentTypeId" text NOT NULL REFERENCES "DocumentType"(id) ON DELETE CASCADE,
  "employmentStatusId" text NOT NULL REFERENCES "EmploymentStatus"(id) ON DELETE CASCADE,
  UNIQUE("documentTypeId", "employmentStatusId")
);

CREATE TABLE "DocumentTypeEmployeeGroup" (
  id text PRIMARY KEY,
  "documentTypeId" text NOT NULL REFERENCES "DocumentType"(id) ON DELETE CASCADE,
  "employeeGroupId" text NOT NULL REFERENCES "EmployeeGroup"(id) ON DELETE CASCADE,
  UNIQUE("documentTypeId", "employeeGroupId")
);

CREATE TABLE "DocumentTypeEmployeeRank" (
  id text PRIMARY KEY,
  "documentTypeId" text NOT NULL REFERENCES "DocumentType"(id) ON DELETE CASCADE,
  "employeeRankId" text NOT NULL REFERENCES "EmployeeRank"(id) ON DELETE CASCADE,
  UNIQUE("documentTypeId", "employeeRankId")
);

CREATE TABLE "DocumentTypeWorkplace" (
  id text PRIMARY KEY,
  "documentTypeId" text NOT NULL REFERENCES "DocumentType"(id) ON DELETE CASCADE,
  "workplaceId" text NOT NULL REFERENCES "Workplace"(id) ON DELETE CASCADE,
  UNIQUE("documentTypeId", "workplaceId")
);

-- ============================================================
-- DOCUMENT RECORD
-- ============================================================
CREATE TABLE "DocumentRecord" (
  id text PRIMARY KEY,
  "ownerId" text NOT NULL REFERENCES "Employee"(id) ON DELETE CASCADE,
  "documentTypeId" text NOT NULL REFERENCES "DocumentType"(id),
  title text,
  status "DocumentStatus" NOT NULL DEFAULT 'PENDING',
  "isCurrent" boolean NOT NULL DEFAULT true,
  "allowMultipleSnapshot" boolean NOT NULL DEFAULT false,

  "fileName" text NOT NULL,
  "filePath" text NOT NULL,
  "fileSize" bigint,
  "mimeType" text,
  "fileHash" text,
  "storageProvider" text NOT NULL DEFAULT 'local'
    CHECK ("storageProvider" IN ('local', 'supabase', 's3')),

  "documentNumber" text,
  "issueDate" date,
  "expiryDate" date,
  "reminderH30SentAt" timestamp,
  "reminderH7SentAt" timestamp,
  "reminderH1SentAt" timestamp,

  "createdBy" text REFERENCES "User"(id),
  "updatedBy" text REFERENCES "User"(id),
  "uploadedAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  "deletedAt" timestamp
);

CREATE INDEX idx_documentrecord_owner_type ON "DocumentRecord"("ownerId", "documentTypeId");
CREATE INDEX idx_documentrecord_expiry ON "DocumentRecord"("expiryDate") WHERE "expiryDate" IS NOT NULL;
CREATE INDEX idx_documentrecord_hash ON "DocumentRecord"("fileHash");

-- Partial unique index ini HANYA berlaku untuk baris dengan
-- allowMultipleSnapshot = false (mis. KTP, Ijazah). Untuk baris dengan
-- allowMultipleSnapshot = true (mis. Sertifikat DIKLAT), index ini tidak
-- berlaku sama sekali, sehingga banyak baris isCurrent=true diperbolehkan.
-- allowMultipleSnapshot diisi otomatis oleh trigger di bawah, jadi
-- aplikasi TIDAK perlu (dan tidak boleh) mengisi kolom ini secara manual.
CREATE UNIQUE INDEX uniq_current_document_per_type
ON "DocumentRecord" ("ownerId", "documentTypeId")
WHERE "isCurrent" = true AND "allowMultipleSnapshot" = false;

-- ============================================================
-- TRIGGER: isi snapshot allowMultiple + auto-replace dokumen lama
-- ============================================================
CREATE OR REPLACE FUNCTION handle_document_replacement()
RETURNS TRIGGER AS $$
DECLARE
  is_multiple boolean;
BEGIN
  SELECT "allowMultiple" INTO is_multiple
  FROM "DocumentType" WHERE id = NEW."documentTypeId";

  -- Simpan snapshot agar partial unique index di atas bisa bekerja
  NEW."allowMultipleSnapshot" := COALESCE(is_multiple, false);

  IF NOT COALESCE(is_multiple, false) AND NEW."isCurrent" = true THEN
    UPDATE "DocumentRecord"
    SET status = 'REPLACED',
        "isCurrent" = false,
        "updatedAt" = now()
    WHERE "ownerId" = NEW."ownerId"
      AND "documentTypeId" = NEW."documentTypeId"
      AND id <> NEW.id
      AND "isCurrent" = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_handle_document_replacement
BEFORE INSERT ON "DocumentRecord"
FOR EACH ROW EXECUTE FUNCTION handle_document_replacement();

-- ============================================================
-- VERIFICATION HISTORY
-- ============================================================
CREATE TABLE "VerificationHistory" (
  id text PRIMARY KEY,
  "documentRecordId" text NOT NULL REFERENCES "DocumentRecord"(id) ON DELETE CASCADE,
  status "DocumentStatus" NOT NULL,
  "reviewedById" text REFERENCES "User"(id),
  "reviewNote" text,
  "reviewedAt" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX idx_verificationhistory_document ON "VerificationHistory"("documentRecordId");

-- ============================================================
-- NOTIFICATION
-- ============================================================
CREATE TABLE "Notification" (
  id text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  "isRead" boolean NOT NULL DEFAULT false,
  "relatedEntityType" text,
  "relatedEntityId" text,
  "createdAt" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX idx_notification_user_unread ON "Notification"("userId", "isRead");

-- ============================================================
-- SECURITY LOG
-- ============================================================
CREATE TABLE "SecurityLog" (
  id text PRIMARY KEY,
  "timestamp" timestamp NOT NULL DEFAULT now(),
  "actorId" text REFERENCES "User"(id),
  "actorName" text NOT NULL,
  "actorRole" text NOT NULL,
  "eventType" text NOT NULL,
  resource text NOT NULL,
  "ipAddress" text,
  status text NOT NULL,
  metadata jsonb
);
CREATE INDEX idx_securitylog_actor ON "SecurityLog"("actorId");
CREATE INDEX idx_securitylog_timestamp ON "SecurityLog"("timestamp");

-- ============================================================
-- SYSTEM SETTING
-- ============================================================
CREATE TABLE "SystemSetting" (
  key text PRIMARY KEY,
  value text NOT NULL,
  label text,
  description text,
  "updatedBy" text REFERENCES "User"(id),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- ============================================================
-- GENERIC TRIGGER: auto-update kolom updatedAt saat UPDATE
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_updated_at
  BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_employee_updated_at
  BEFORE UPDATE ON "Employee" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_documenttype_updated_at
  BEFORE UPDATE ON "DocumentType" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_documentrecord_updated_at
  BEFORE UPDATE ON "DocumentRecord" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_employmentstatus_updated_at
  BEFORE UPDATE ON "EmploymentStatus" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_employeegroup_updated_at
  BEFORE UPDATE ON "EmployeeGroup" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_professiongroup_updated_at
  BEFORE UPDATE ON "ProfessionGroup" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_employeeposition_updated_at
  BEFORE UPDATE ON "EmployeePosition" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_employeerank_updated_at
  BEFORE UPDATE ON "EmployeeRank" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_workplace_updated_at
  BEFORE UPDATE ON "Workplace" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
