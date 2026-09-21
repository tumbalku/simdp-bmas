-- Constraints and partial unique indexes that Prisma cannot represent.
ALTER TABLE "Employee"
  ADD CONSTRAINT chk_employee_identifier_required
  CHECK ("employeeId" IS NOT NULL OR nik IS NOT NULL);

ALTER TABLE "EmployeeCareerHistory"
  ADD CONSTRAINT chk_careerhistory_dates
  CHECK ("endDate" IS NULL OR "endDate" >= "effectiveDate");

ALTER TABLE "DocumentType"
  ADD CONSTRAINT chk_documenttype_allowed_formats_not_empty
  CHECK (btrim("allowedFormats") <> ''),
  ADD CONSTRAINT chk_documenttype_max_size_positive
  CHECK ("maxSizeMb" > 0);

ALTER TABLE "DocumentRecord"
  ADD CONSTRAINT chk_periodic_dates_required
  CHECK (
    ("periodStartDate" IS NULL AND "periodEndDate" IS NULL) OR
    ("periodStartDate" IS NOT NULL AND "periodEndDate" IS NOT NULL AND "periodEndDate" >= "periodStartDate")
  ),
  ADD CONSTRAINT chk_expiry_after_issue
  CHECK ("issueDate" IS NULL OR "expiryDate" IS NULL OR "expiryDate" >= "issueDate"),
  ADD CONSTRAINT chk_not_self_replacing
  CHECK ("replacesDocumentId" IS DISTINCT FROM id);

CREATE UNIQUE INDEX uniq_storedfile_provider_path
ON "StoredFile"("storageProvider", "filePath")
WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX uniq_current_document_per_type
ON "DocumentRecord" ("ownerId", "documentTypeId")
WHERE "isCurrent" = true AND "allowMultipleSnapshot" = false AND "deletedAt" IS NULL;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_01_user_updated_at
  BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_01_usertwofactor_updated_at
  BEFORE UPDATE ON "UserTwoFactor" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_01_employee_updated_at
  BEFORE UPDATE ON "Employee" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_01_employmentstatus_updated_at
  BEFORE UPDATE ON "EmploymentStatus" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_01_employeegroup_updated_at
  BEFORE UPDATE ON "EmployeeGroup" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_01_professiongroup_updated_at
  BEFORE UPDATE ON "ProfessionGroup" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_01_employeeposition_updated_at
  BEFORE UPDATE ON "EmployeePosition" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_01_employeerank_updated_at
  BEFORE UPDATE ON "EmployeeRank" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_01_workplace_updated_at
  BEFORE UPDATE ON "Workplace" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_01_documenttype_updated_at
  BEFORE UPDATE ON "DocumentType" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_01_documentrecord_updated_at
  BEFORE UPDATE ON "DocumentRecord" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_01_post_updated_at
  BEFORE UPDATE ON "Post" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_01_ratelimitbucket_updated_at
  BEFORE UPDATE ON "RateLimitBucket" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_01_userregistration_updated_at
  BEFORE UPDATE ON "UserRegistrationRequest" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON FUNCTION set_updated_at() IS 'DB is the source of truth for updatedAt. Do not also mark the corresponding Prisma field @updatedAt — pick one mechanism, not both.';

-- ============================================================
-- TRIGGERS: 02 — Validate DocumentType field requirements
-- (REVIEW FIX #9: requiresExpiryDate/IssueDate/DocumentNumber are now
-- enforced, not just requiresPeriod)
-- ============================================================

CREATE OR REPLACE FUNCTION validate_document_fields()
RETURNS TRIGGER AS $$
DECLARE
  dt RECORD;
BEGIN
  SELECT "requiresPeriod", "requiresExpiryDate", "requiresIssueDate", "requiresDocumentNumber"
  INTO dt
  FROM "DocumentType"
  WHERE id = NEW."documentTypeId";

  IF dt."requiresPeriod" IS TRUE THEN
    IF NEW."periodStartDate" IS NULL OR NEW."periodEndDate" IS NULL THEN
      RAISE EXCEPTION 'periodStartDate dan periodEndDate wajib diisi untuk tipe dokumen ini';
    END IF;
  ELSE
    IF NEW."periodStartDate" IS NOT NULL OR NEW."periodEndDate" IS NOT NULL THEN
      RAISE EXCEPTION 'periodStartDate/periodEndDate tidak boleh diisi untuk tipe dokumen ini';
    END IF;
  END IF;

  IF dt."requiresExpiryDate" IS TRUE AND NEW."expiryDate" IS NULL THEN
    RAISE EXCEPTION 'expiryDate wajib diisi untuk tipe dokumen ini';
  END IF;

  IF dt."requiresIssueDate" IS TRUE AND NEW."issueDate" IS NULL THEN
    RAISE EXCEPTION 'issueDate wajib diisi untuk tipe dokumen ini';
  END IF;

  IF dt."requiresDocumentNumber" IS TRUE AND (NEW."documentNumber" IS NULL OR btrim(NEW."documentNumber") = '') THEN
    RAISE EXCEPTION 'documentNumber wajib diisi untuk tipe dokumen ini';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_02_validate_document_fields
BEFORE INSERT OR UPDATE ON "DocumentRecord"
FOR EACH ROW EXECUTE FUNCTION validate_document_fields();

COMMENT ON FUNCTION validate_document_fields() IS 'Enforces DocumentType.requires* flags against the actual DocumentRecord values';

-- ============================================================
-- TRIGGERS: 03 — Document replacement / final-document protection
-- (REVIEW FIX #1, #2, #6, #7, #10)
-- ============================================================

CREATE OR REPLACE FUNCTION handle_document_replacement()
RETURNS TRIGGER AS $$
DECLARE
  doc_type_record RECORD;
  uploader_role "Role";
  owner_user_id text;
  existing_current_id text;
  existing_current_is_final boolean;
BEGIN
  SELECT "allowMultiple", "uploaderRole", "adminUploadAutoFinal"
  INTO doc_type_record
  FROM "DocumentType"
  WHERE id = NEW."documentTypeId";

  SELECT role INTO uploader_role FROM "User" WHERE id = NEW."createdBy";
  
  -- Get the userId of the document owner (employee)
  SELECT "userId" INTO owner_user_id FROM "Employee" WHERE id = NEW."ownerId";

  -- HARDENING FIX #1: Employee dapat hanya upload dokumen untuk dirinya sendiri
  IF uploader_role = 'EMPLOYEE' AND NEW."createdBy" <> owner_user_id THEN
    RAISE EXCEPTION 'Employee hanya dapat mengunggah dokumen untuk diri sendiri (createdBy=%, owner userId=%)', 
      NEW."createdBy", owner_user_id;
  END IF;

  -- REVIEW FIX #10: enforce who is allowed to upload this DocumentType.
  -- STAFF is treated as equivalent to ADMIN for upload purposes.
  IF doc_type_record."uploaderRole" = 'EMPLOYEE' AND uploader_role <> 'EMPLOYEE' THEN
    RAISE EXCEPTION 'Tipe dokumen ini hanya boleh diunggah oleh pegawai';
  ELSIF doc_type_record."uploaderRole" = 'ADMIN' AND uploader_role NOT IN ('ADMIN', 'STAFF') THEN
    RAISE EXCEPTION 'Tipe dokumen ini hanya boleh diunggah oleh admin/staff';
  END IF;

  NEW."allowMultipleSnapshot" := COALESCE(doc_type_record."allowMultiple", false);

  -- HARDENING FIX #4: Konsistensikan admin/staff auto-final
  -- REVIEW FIX #1: isFinal is ALWAYS explicitly decided here — never
  -- pass through a client-supplied value. REVIEW FIX #6: admin-final
  -- uploads are auto-approved.
  IF doc_type_record."adminUploadAutoFinal" IS TRUE AND uploader_role IN ('ADMIN', 'STAFF') THEN
    NEW."isFinal" := true;
    NEW.status := 'APPROVED';
  ELSE
    NEW."isFinal" := false;
  END IF;

  -- Find the current document (if any) this insert would sit alongside/replace
  SELECT id, "isFinal" INTO existing_current_id, existing_current_is_final
  FROM "DocumentRecord"
  WHERE "ownerId" = NEW."ownerId"
    AND "documentTypeId" = NEW."documentTypeId"
    AND "isCurrent" = true
    AND "deletedAt" IS NULL
  LIMIT 1;

  -- REVIEW FIX #2: a final/official document can never be superseded by
  -- a non-admin/non-staff upload.
  IF existing_current_id IS NOT NULL
     AND existing_current_is_final IS TRUE
     AND uploader_role NOT IN ('ADMIN', 'STAFF') THEN
    RAISE EXCEPTION 'Dokumen final (id=%) tidak dapat digantikan oleh non-admin/non-staff', existing_current_id;
  END IF;

  -- HARDENING FIX #2: replacesDocumentId hanya diisi untuk non-multiple types
  -- atau saat ada explicit replacement.
  IF NOT COALESCE(doc_type_record."allowMultiple", false) AND existing_current_id IS NOT NULL THEN
    NEW."replacesDocumentId" := existing_current_id;
  ELSE
    NEW."replacesDocumentId" := NULL;
  END IF;

  -- Replace the old current document only for non-multiple types
  IF NOT COALESCE(doc_type_record."allowMultiple", false)
     AND NEW."isCurrent" = true
     AND existing_current_id IS NOT NULL THEN
    UPDATE "DocumentRecord"
    SET status = 'REPLACED', "isCurrent" = false, "updatedAt" = now()
    WHERE id = existing_current_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_03_document_replacement
BEFORE INSERT ON "DocumentRecord"
FOR EACH ROW EXECUTE FUNCTION handle_document_replacement();

COMMENT ON FUNCTION handle_document_replacement() IS 'Enforces uploaderRole, employee self-upload ownership, decides isFinal/auto-approval (admin/staff), blocks non-admin/staff replacement of final documents, records replacesDocumentId only for non-multiple types, and replaces the prior current document for non-multiple types.';

-- ============================================================
-- TRIGGERS: 04 — Auto verification-history entry for auto-approved
-- final documents (REVIEW FIX #6)
-- ============================================================

CREATE OR REPLACE FUNCTION auto_verification_history_for_final()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."isFinal" IS TRUE AND NEW.status = 'APPROVED' THEN
    INSERT INTO "VerificationHistory" (id, "documentRecordId", status, "reviewedById", "reviewNote", "reviewedAt")
    VALUES (
      NEW.id || '-auto-verif',
      NEW.id,
      'APPROVED',
      NEW."createdBy",
      'Auto-approved: dokumen final diunggah oleh admin/staff',
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Runs AFTER INSERT because it must reference NEW.id, which only exists
-- as a row in DocumentRecord once the INSERT actually completes.
CREATE TRIGGER trg_04_auto_verification_history
AFTER INSERT ON "DocumentRecord"
FOR EACH ROW EXECUTE FUNCTION auto_verification_history_for_final();

COMMENT ON FUNCTION auto_verification_history_for_final() IS 'Keeps VerificationHistory complete even for documents that were auto-approved rather than manually reviewed.';

-- ============================================================
-- TRIGGERS: 05 — Protect final documents from sensitive updates
-- (HARDENING FIX #3)
-- ============================================================

CREATE OR REPLACE FUNCTION protect_final_document_updates()
RETURNS TRIGGER AS $$
DECLARE
  updater_role "Role";
BEGIN
  -- Only enforce protection if the document WAS final before this update
  IF OLD."isFinal" IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  -- Get the role of the user performing the update
  IF NEW."updatedBy" IS NULL THEN
    RAISE EXCEPTION 'updatedBy wajib diisi untuk update dokumen final';
  END IF;

  SELECT role INTO updater_role FROM "User" WHERE id = NEW."updatedBy";

  -- Allow ADMIN and STAFF to update final documents
  IF updater_role IN ('ADMIN', 'STAFF') THEN
    RETURN NEW;
  END IF;

  -- Block sensitive field changes for non-admin/non-staff
  IF OLD."storedFileId" IS DISTINCT FROM NEW."storedFileId" THEN
    RAISE EXCEPTION 'Dokumen final tidak dapat mengubah file (storedFileId) oleh non-admin/staff';
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    RAISE EXCEPTION 'Dokumen final tidak dapat mengubah status oleh non-admin/staff';
  END IF;

  IF OLD."isCurrent" IS DISTINCT FROM NEW."isCurrent" THEN
    RAISE EXCEPTION 'Dokumen final tidak dapat mengubah isCurrent oleh non-admin/staff';
  END IF;

  IF OLD."deletedAt" IS DISTINCT FROM NEW."deletedAt" THEN
    RAISE EXCEPTION 'Dokumen final tidak dapat dihapus (soft delete) oleh non-admin/staff';
  END IF;

  IF OLD."documentTypeId" IS DISTINCT FROM NEW."documentTypeId" THEN
    RAISE EXCEPTION 'Dokumen final tidak dapat mengubah documentTypeId oleh non-admin/staff';
  END IF;

  IF OLD."ownerId" IS DISTINCT FROM NEW."ownerId" THEN
    RAISE EXCEPTION 'Dokumen final tidak dapat mengubah ownerId oleh non-admin/staff';
  END IF;

  IF OLD."documentNumber" IS DISTINCT FROM NEW."documentNumber" THEN
    RAISE EXCEPTION 'Dokumen final tidak dapat mengubah documentNumber oleh non-admin/staff';
  END IF;

  IF OLD."issueDate" IS DISTINCT FROM NEW."issueDate" THEN
    RAISE EXCEPTION 'Dokumen final tidak dapat mengubah issueDate oleh non-admin/staff';
  END IF;

  IF OLD."expiryDate" IS DISTINCT FROM NEW."expiryDate" THEN
    RAISE EXCEPTION 'Dokumen final tidak dapat mengubah expiryDate oleh non-admin/staff';
  END IF;

  IF OLD."periodStartDate" IS DISTINCT FROM NEW."periodStartDate" THEN
    RAISE EXCEPTION 'Dokumen final tidak dapat mengubah periodStartDate oleh non-admin/staff';
  END IF;

  IF OLD."periodEndDate" IS DISTINCT FROM NEW."periodEndDate" THEN
    RAISE EXCEPTION 'Dokumen final tidak dapat mengubah periodEndDate oleh non-admin/staff';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_05_protect_final_document
BEFORE UPDATE ON "DocumentRecord"
FOR EACH ROW EXECUTE FUNCTION protect_final_document_updates();

COMMENT ON FUNCTION protect_final_document_updates() IS 'Prevents non-admin/non-staff users from modifying sensitive fields of final (official) documents. Final documents can only be viewed by employees, not manipulated.';

-- ============================================================
-- TRIGGERS: 06 & 07 — Append-only enforcement
-- (REVIEW FIX #3)
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION '% is append-only: % is not allowed', TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_06_securitylog_immutable
BEFORE UPDATE OR DELETE ON "SecurityLog"
FOR EACH ROW EXECUTE FUNCTION prevent_mutation();

CREATE TRIGGER trg_07_verificationhistory_immutable
BEFORE UPDATE OR DELETE ON "VerificationHistory"
FOR EACH ROW EXECUTE FUNCTION prevent_mutation();

COMMENT ON FUNCTION prevent_mutation() IS 'Generic guard used to make audit tables truly append-only at the DB level, regardless of which DB role/connection issues the query.';

-- ============================================================
-- TRIGGERS: 08 — Post visibility consistency
-- (REVIEW FIX #11)
-- ============================================================

CREATE OR REPLACE FUNCTION validate_post_visibility_targets()
RETURNS TRIGGER AS $$
DECLARE
  target_count integer;
BEGIN
  IF NEW.status = 'PUBLISHED' AND NEW."visibilityType" = 'TARGETED' THEN
    SELECT
      (SELECT count(*) FROM "PostVisibilityRole" WHERE "postId" = NEW.id) +
      (SELECT count(*) FROM "PostVisibilityWorkplace" WHERE "postId" = NEW.id) +
      (SELECT count(*) FROM "PostVisibilityEmployeeGroup" WHERE "postId" = NEW.id) +
      (SELECT count(*) FROM "PostVisibilityUser" WHERE "postId" = NEW.id)
    INTO target_count;

    IF target_count = 0 THEN
      RAISE EXCEPTION 'Post TARGETED harus memiliki minimal satu target visibility sebelum dipublish';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Deferred to end-of-transaction so the app can insert the Post row and
-- its PostVisibility* target rows within the same transaction, in any
-- order, before this check runs.
CREATE CONSTRAINT TRIGGER trg_08_post_visibility_check
AFTER INSERT OR UPDATE ON "Post"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION validate_post_visibility_targets();

COMMENT ON FUNCTION validate_post_visibility_targets() IS 'A TARGETED post cannot be PUBLISHED without at least one visibility target row. Requires the app to create the Post and its targeting rows inside a single transaction.';

-- ============================================================
-- TRIGGERS: 09-12 — Prevent orphaning published targeted posts
-- (HARDENING FIX #5)
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_orphaning_targeted_post()
RETURNS TRIGGER AS $$
DECLARE
  post_record RECORD;
  remaining_targets integer;
BEGIN
  -- Get the post this target belongs to
  SELECT status, "visibilityType" INTO post_record
  FROM "Post"
  WHERE id = COALESCE(OLD."postId", NEW."postId");

  -- Only enforce if the post is PUBLISHED and TARGETED
  IF post_record.status = 'PUBLISHED' AND post_record."visibilityType" = 'TARGETED' THEN
    -- Count remaining targets after this operation
    SELECT
      (SELECT count(*) FROM "PostVisibilityRole" WHERE "postId" = COALESCE(OLD."postId", NEW."postId")) +
      (SELECT count(*) FROM "PostVisibilityWorkplace" WHERE "postId" = COALESCE(OLD."postId", NEW."postId")) +
      (SELECT count(*) FROM "PostVisibilityEmployeeGroup" WHERE "postId" = COALESCE(OLD."postId", NEW."postId")) +
      (SELECT count(*) FROM "PostVisibilityUser" WHERE "postId" = COALESCE(OLD."postId", NEW."postId"))
    INTO remaining_targets;

    -- If this is a DELETE, subtract 1 because the row still exists during trigger execution
    IF TG_OP = 'DELETE' THEN
      remaining_targets := remaining_targets - 1;
    END IF;

    IF remaining_targets = 0 THEN
      RAISE EXCEPTION 'Tidak dapat menghapus target terakhir dari post PUBLISHED TARGETED (postId=%)', 
        COALESCE(OLD."postId", NEW."postId");
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_09_prevent_orphan_role
AFTER DELETE OR UPDATE ON "PostVisibilityRole"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION prevent_orphaning_targeted_post();

CREATE CONSTRAINT TRIGGER trg_10_prevent_orphan_workplace
AFTER DELETE OR UPDATE ON "PostVisibilityWorkplace"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION prevent_orphaning_targeted_post();

CREATE CONSTRAINT TRIGGER trg_11_prevent_orphan_group
AFTER DELETE OR UPDATE ON "PostVisibilityEmployeeGroup"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION prevent_orphaning_targeted_post();

CREATE CONSTRAINT TRIGGER trg_12_prevent_orphan_user
AFTER DELETE OR UPDATE ON "PostVisibilityUser"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION prevent_orphaning_targeted_post();

COMMENT ON FUNCTION prevent_orphaning_targeted_post() IS 'Prevents deletion or updates that would leave a PUBLISHED TARGETED post with zero visibility targets. Deferred to end-of-transaction for flexibility.';

-- ============================================================
-- INITIAL SYSTEM SETTINGS
-- ============================================================

INSERT INTO "SystemSetting" (key, value, label, description) VALUES
  ('reminder_days_h30', '30', 'Reminder H-30', 'Days before expiry to send first reminder'),
  ('reminder_days_h7', '7', 'Reminder H-7', 'Days before expiry to send second reminder'),
  ('reminder_days_h1', '1', 'Reminder H-1', 'Days before expiry to send final reminder'),
  ('soft_delete_retention_days', '30', 'Soft Delete Retention', 'Days before soft-deleted data can no longer be restored'),
  ('default_max_upload_mb', '10', 'Max Upload Size', 'Default maximum file upload size in MB');

-- ============================================================
-- END OF SCHEMA
-- ============================================================

COMMENT ON SCHEMA public IS 'SIMDP v2.2 - Hardened schema: employee self-upload enforcement, final-document update protection, Post TARGETED orphan prevention, StoredFile path uniqueness, and DocumentType validation constraints. See file header for full changelog vs v2.1 and v2.0.';
