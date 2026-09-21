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
  SELECT "userId" INTO owner_user_id FROM "Employee" WHERE id = NEW."ownerId";

  IF uploader_role = 'EMPLOYEE' AND NEW."createdBy" <> owner_user_id THEN
    RAISE EXCEPTION 'Employee hanya dapat mengunggah dokumen untuk diri sendiri (createdBy=%, owner userId=%)',
      NEW."createdBy", owner_user_id;
  END IF;

  IF doc_type_record."uploaderRole" = 'EMPLOYEE' AND uploader_role <> 'EMPLOYEE' THEN
    RAISE EXCEPTION 'Tipe dokumen ini hanya boleh diunggah oleh pegawai';
  ELSIF doc_type_record."uploaderRole" = 'ADMIN' AND uploader_role NOT IN ('ADMIN', 'STAFF') THEN
    RAISE EXCEPTION 'Tipe dokumen ini hanya boleh diunggah oleh admin/staff';
  END IF;

  NEW."allowMultipleSnapshot" := COALESCE(doc_type_record."allowMultiple", false);

  IF doc_type_record."adminUploadAutoFinal" IS TRUE AND uploader_role IN ('ADMIN', 'STAFF') THEN
    NEW."isFinal" := true;
    NEW.status := 'APPROVED';
  ELSE
    NEW."isFinal" := false;
  END IF;

  IF NEW."replacesDocumentId" IS NOT NULL THEN
    SELECT id, "isFinal" INTO existing_current_id, existing_current_is_final
    FROM "DocumentRecord"
    WHERE id = NEW."replacesDocumentId"
      AND "ownerId" = NEW."ownerId"
      AND "documentTypeId" = NEW."documentTypeId"
      AND "isCurrent" = true
      AND "deletedAt" IS NULL;

    IF existing_current_id IS NULL THEN
      RAISE EXCEPTION 'Dokumen pengganti harus merujuk dokumen aktif dengan pemilik dan jenis yang sama';
    END IF;
  ELSIF NOT COALESCE(doc_type_record."allowMultiple", false) THEN
    SELECT id, "isFinal" INTO existing_current_id, existing_current_is_final
    FROM "DocumentRecord"
    WHERE "ownerId" = NEW."ownerId"
      AND "documentTypeId" = NEW."documentTypeId"
      AND "isCurrent" = true
      AND "deletedAt" IS NULL
    LIMIT 1;

    NEW."replacesDocumentId" := existing_current_id;
  END IF;

  IF existing_current_id IS NOT NULL
     AND existing_current_is_final IS TRUE
     AND uploader_role NOT IN ('ADMIN', 'STAFF') THEN
    RAISE EXCEPTION 'Dokumen final (id=%) tidak dapat digantikan oleh non-admin/non-staff', existing_current_id;
  END IF;

  IF NEW."isCurrent" = true AND existing_current_id IS NOT NULL THEN
    UPDATE "DocumentRecord"
    SET status = 'REPLACED',
        "isCurrent" = false,
        "updatedBy" = NEW."createdBy",
        "updatedAt" = now()
    WHERE id = existing_current_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION handle_document_replacement() IS 'Enforces uploader permissions and final-document protection, preserves explicit replacement chains for all document types, and auto-replaces the current record for single-document types.';
