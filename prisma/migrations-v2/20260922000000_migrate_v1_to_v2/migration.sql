-- ============================================================
-- SIMDP - MIGRASI TRANSISI SCHEMA v1 -> v2.3
-- Issue #317 (REVIEW.md blocker B-1)
-- Dibuat: 2026-09-22
-- ============================================================
--
-- TUJUAN
--   Membawa database SIMDP yang sudah berjalan dengan schema v1
--   (20 migration di prisma/migrations, folder lama sekarang menjadi
--   prisma/migrations-archive) ke bentuk schema v2.3 yang dipakai
--   branch codex/align-v2-code (prisma/schema.prisma).
--
--   Migration init_v2 (20260920024915) adalah baseline fresh-install:
--   isinya CREATE TABLE penuh, jadi TIDAK BISA dijalankan di database
--   v1 yang sudah ada tabelnya. Migration inilah jembatannya.
--
-- IDEMPOTENSI
--   Setiap pernyataan dibungkus penjaga (IF NOT EXISTS / IF EXISTS /
--   DROP ... IF EXISTS) sehingga migration ini AMAN dijalankan ulang
--   dan AMAN di database yang SUDAH v2 (fresh install hasil init_v2
--   + harden_v2 + ...). Prasyarat itu penting karena database baru
--   tidak melewati migration ini (lihat catatan penerapan di runbook
--   context/technical/migration-v1-to-v2.md bagian "Apply").
--
--   Penanda "database ini masih v1" adalah adanya kolom
--   "DocumentRecord"."fileName" (dihapus di bagian 3.4 migration ini).
--   Bagian 2 (data migration) hanya berjalan jika penanda itu ada.
--
-- URUTAN BESAR
--   1. Objek aditif (enum, tabel, kolom, index, FK baru) - aman di DB apa pun.
--   2. Data migration v1 -> v2 (hanya jika penanda v1 ada):
--      backfill StoredFile + storedFileId, backfill createdBy,
--      mapping status registrasi, rename employeeId -> claimedNip.
--   3. Perubahan NOT NULL + parity FK + hapus kolom file lama.
--
-- CATATAN PENTING TENTANG TRIGGER / CONSTRAINT HARDENING
--   Migration ini membawa struktur (tabel/kolom/enum/index/FK) ke
--   bentuk v2.3. Trigger dan constraint tambahan dari migration
--   20260920031000_harden_v2_database_rules (chk_*, trg_02..trg_12,
--   uniq_storedfile_provider_path, versi uniq_current_document_per_type
--   yang menyertakan deletedAt) TIDAK diduplikasi di sini agar tidak
--   menjaga dua salinan logika DB yang sama. Cara menerapkannya di
--   database v1 yang sudah dimigrasi dijelaskan di runbook
--   context/technical/migration-v1-to-v2.md (bagian "Apply" langkah 4).
--
-- PostgreSQL 12+ dipersyaratkan (ALTER TYPE ... ADD VALUE IF NOT EXISTS
-- di dalam transaksi), sama dengan migration 20260920183000 yang sudah ada.
-- ============================================================


-- ============================================================
-- BAGIAN 1 - OBJEK ADITIF (idempoten, aman di v1 maupun v2)
-- ============================================================

-- --------------------------------------------------------
-- 1.1 Nilai enum baru
-- --------------------------------------------------------
-- ArchiveCategory: v2 menambah PERIODIC (Cuti, Surat Tugas, Tugas Belajar).
ALTER TYPE "ArchiveCategory" ADD VALUE IF NOT EXISTS 'PERIODIC';

-- NotificationType: v2 menambah ANNOUNCEMENT (sistem pengumuman / Post).
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ANNOUNCEMENT';

-- NotificationRelatedEntityType: v2 menambah POST supaya notifikasi
-- pengumuman bisa merujuk balik ke Post-nya. Sudah ditambahkan oleh
-- migration 20260920183000 di database fresh; di database v1 belum ada.
ALTER TYPE "NotificationRelatedEntityType" ADD VALUE IF NOT EXISTS 'POST';

-- --------------------------------------------------------
-- 1.2 Tipe enum baru
-- --------------------------------------------------------
-- PostgreSQL tidak mendukung "CREATE TYPE IF NOT EXISTS", jadi
-- dibungkus DO block. RegistrationStatus menggantikan kolom TEXT
-- "UserRegistrationRequest"."status" di schema v1 (lihat bagian 2.7).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'DocumentUploader'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE "DocumentUploader" AS ENUM ('EMPLOYEE', 'ADMIN', 'BOTH');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'PostVisibilityType'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE "PostVisibilityType" AS ENUM ('PUBLIC', 'TARGETED');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'PostStatus'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'RegistrationStatus'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE "RegistrationStatus" AS ENUM (
      'EMAIL_PENDING',
      'EMAIL_VERIFIED',
      'UNDER_REVIEW',
      'APPROVED',
      'REJECTED'
    );
  END IF;
END $$;

-- --------------------------------------------------------
-- 1.3 Tabel "StoredFile" (abstraksi penyimpanan file)
-- --------------------------------------------------------
-- Definisi disalin persis dari migration 20260920024915_init_v2
-- (kolom, tipe, constraint PK). FK uploadedBy ditambahkan di 1.6.
CREATE TABLE IF NOT EXISTS "StoredFile" (
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

CREATE INDEX IF NOT EXISTS "idx_storedfile_hash" ON "StoredFile"("fileHash");
CREATE INDEX IF NOT EXISTS "idx_storedfile_deleted" ON "StoredFile"("deletedAt");
CREATE INDEX IF NOT EXISTS "idx_storedfile_uploaded" ON "StoredFile"("uploadedBy");

-- --------------------------------------------------------
-- 1.4 Tabel sistem pengumuman (Post)
-- --------------------------------------------------------
-- Definisi disalin dari migration 20260920024915_init_v2. FK dideklarasikan
-- inline dengan nama constraint yang sama persis dengan init_v2, jadi di
-- database yang SUDAH v2 pernyataan ini tidak mengubah apa-apa, sedangkan
-- di database v1 semuanya dibuat dalam satu pernyataan.

CREATE TABLE IF NOT EXISTS "Post" (
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

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Post_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "PostAttachment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "storedFileId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostAttachment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PostAttachment_postId_fkey"
      FOREIGN KEY ("postId") REFERENCES "Post"("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostAttachment_storedFileId_fkey"
      FOREIGN KEY ("storedFileId") REFERENCES "StoredFile"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "PostVisibilityRole" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "PostVisibilityRole_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PostVisibilityRole_postId_fkey"
      FOREIGN KEY ("postId") REFERENCES "Post"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "PostVisibilityWorkplace" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "workplaceId" TEXT NOT NULL,

    CONSTRAINT "PostVisibilityWorkplace_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PostVisibilityWorkplace_postId_fkey"
      FOREIGN KEY ("postId") REFERENCES "Post"("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostVisibilityWorkplace_workplaceId_fkey"
      FOREIGN KEY ("workplaceId") REFERENCES "Workplace"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "PostVisibilityEmployeeGroup" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "employeeGroupId" TEXT NOT NULL,

    CONSTRAINT "PostVisibilityEmployeeGroup_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PostVisibilityEmployeeGroup_postId_fkey"
      FOREIGN KEY ("postId") REFERENCES "Post"("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostVisibilityEmployeeGroup_employeeGroupId_fkey"
      FOREIGN KEY ("employeeGroupId") REFERENCES "EmployeeGroup"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "PostVisibilityUser" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PostVisibilityUser_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PostVisibilityUser_postId_fkey"
      FOREIGN KEY ("postId") REFERENCES "Post"("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostVisibilityUser_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

-- Index tabel Post (sama persis dengan init_v2).
CREATE INDEX IF NOT EXISTS "idx_post_status" ON "Post"("status", "publishedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_post_author" ON "Post"("authorId");
CREATE INDEX IF NOT EXISTS "idx_post_pinned" ON "Post"("isPinned", "publishedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_post_deleted" ON "Post"("deletedAt");

CREATE INDEX IF NOT EXISTS "idx_postattachment_post" ON "PostAttachment"("postId", "displayOrder");
CREATE INDEX IF NOT EXISTS "idx_postattachment_file" ON "PostAttachment"("storedFileId");

CREATE INDEX IF NOT EXISTS "idx_postvisibilityrole_post" ON "PostVisibilityRole"("postId");
CREATE UNIQUE INDEX IF NOT EXISTS "PostVisibilityRole_postId_role_key"
  ON "PostVisibilityRole"("postId", "role");

CREATE INDEX IF NOT EXISTS "idx_postvisibilityworkplace_post" ON "PostVisibilityWorkplace"("postId");
CREATE UNIQUE INDEX IF NOT EXISTS "PostVisibilityWorkplace_postId_workplaceId_key"
  ON "PostVisibilityWorkplace"("postId", "workplaceId");

CREATE INDEX IF NOT EXISTS "idx_postvisibilitygroup_post" ON "PostVisibilityEmployeeGroup"("postId");
CREATE UNIQUE INDEX IF NOT EXISTS "PostVisibilityEmployeeGroup_postId_employeeGroupId_key"
  ON "PostVisibilityEmployeeGroup"("postId", "employeeGroupId");

CREATE INDEX IF NOT EXISTS "idx_postvisibilityuser_post" ON "PostVisibilityUser"("postId");
CREATE UNIQUE INDEX IF NOT EXISTS "PostVisibilityUser_postId_userId_key"
  ON "PostVisibilityUser"("postId", "userId");

-- --------------------------------------------------------
-- 1.5 Kolom baru di tabel yang sudah ada
-- --------------------------------------------------------
ALTER TABLE "DocumentType"
  ADD COLUMN IF NOT EXISTS "requiresPeriod" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "uploaderRole" "DocumentUploader" NOT NULL DEFAULT 'BOTH',
  ADD COLUMN IF NOT EXISTS "adminUploadAutoFinal" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "DocumentRecord"
  ADD COLUMN IF NOT EXISTS "replacesDocumentId" TEXT,
  ADD COLUMN IF NOT EXISTS "isFinal" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "periodStartDate" DATE,
  ADD COLUMN IF NOT EXISTS "periodEndDate" DATE,
  ADD COLUMN IF NOT EXISTS "storedFileId" TEXT;

-- Index baru di DocumentRecord (v1 belum punya).
CREATE INDEX IF NOT EXISTS "idx_documentrecord_status" ON "DocumentRecord"("status");
CREATE INDEX IF NOT EXISTS "idx_documentrecord_file" ON "DocumentRecord"("storedFileId");
CREATE INDEX IF NOT EXISTS "idx_documentrecord_replaces" ON "DocumentRecord"("replacesDocumentId");

-- --------------------------------------------------------
-- 1.6 FK untuk struktur baru (drop-then-add = idempoten)
-- --------------------------------------------------------
ALTER TABLE "StoredFile"
  DROP CONSTRAINT IF EXISTS "StoredFile_uploadedBy_fkey";
ALTER TABLE "StoredFile"
  ADD CONSTRAINT "StoredFile_uploadedBy_fkey"
  FOREIGN KEY ("uploadedBy") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DocumentRecord"
  DROP CONSTRAINT IF EXISTS "DocumentRecord_storedFileId_fkey";
ALTER TABLE "DocumentRecord"
  ADD CONSTRAINT "DocumentRecord_storedFileId_fkey"
  FOREIGN KEY ("storedFileId") REFERENCES "StoredFile"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DocumentRecord"
  DROP CONSTRAINT IF EXISTS "DocumentRecord_replacesDocumentId_fkey";
ALTER TABLE "DocumentRecord"
  ADD CONSTRAINT "DocumentRecord_replacesDocumentId_fkey"
  FOREIGN KEY ("replacesDocumentId") REFERENCES "DocumentRecord"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;


-- ============================================================
-- BAGIAN 2 - DATA MIGRATION v1 -> v2
-- ============================================================
-- Hanya berjalan jika database masih bershape v1, ditandai dengan
-- adanya kolom "DocumentRecord"."fileName". plpgsql melakukan parse/
-- plan pernyataan saat pernyataan itu pertama kali dicapai, jadi
-- cabang yang tidak diambil tidak akan error meskipun kolom v1-nya
-- sudah tidak ada di database v2.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = CURRENT_SCHEMA()
      AND table_name = 'DocumentRecord'
      AND column_name = 'fileName'
  ) THEN
    -- Sudah v2 (fresh install, atau migration ini sudah pernah jalan).
    -- Tidak ada data v1 yang perlu dimigrasi.
    RETURN;
  END IF;

  -- ------------------------------------------------------
  -- 2.1 Backfill "DocumentRecord"."createdBy" yang NULL
  -- ------------------------------------------------------
  -- v1: createdBy TEXT NULLABLE. v2: createdBy TEXT NOT NULL
  -- (audit actor wajib). Fallback = user ADMIN pertama berdasarkan
  -- createdAt (user paling tua = biasanya akun bootstrap/admin awal).
  -- Jika ada baris createdBy IS NULL tetapi tidak ada user ADMIN sama
  -- sekali, subquery menghasilkan NULL sehingga SET NOT NULL di
  -- bagian 3 akan gagal dengan pesan jelas - itu perilaku yang
  -- diinginkan: hentikan migration, jangan tebak-tebakan data audit.
  UPDATE "DocumentRecord"
  SET "createdBy" = (
    SELECT "User"."id"
    FROM "User"
    WHERE "User"."role" = 'ADMIN'
    ORDER BY "User"."createdAt"
    LIMIT 1
  )
  WHERE "createdBy" IS NULL;

  -- ------------------------------------------------------
  -- 2.2 Backfill tabel "StoredFile" dari "DocumentRecord"
  -- ------------------------------------------------------
  -- Metadata file dipindahkan dari DocumentRecord ke StoredFile.
  --
  -- KUNCI: id StoredFile diisi dengan id DocumentRecord-nya sendiri
  -- (bukan gen_random_uuid()). Alasan:
  --   1. Hubungan 1:1 persis berdasarkan primary key - tidak mungkin
  --      salah pasang atau dobel, tidak peduli apakah filePath/fileHash
  --      unik atau tidak di data v1.
  --   2. Idempoten: menjalankan ulang menghasilkan id yang sama, jadi
  --      klausa NOT EXISTS membuatnya aman diulang.
  --   3. Verifikasi trivial: JOIN pada id = jumlah baris persis.
  --
  -- NULL handling untuk kolom NOT NULL di v2 (v1 memperbolehkan NULL
  -- pada fileSize/mimeType/fileHash):
  --   - fileSize NULL  -> 0          (ukuran diisi ulang oleh job
  --                                  re-hashing, lihat runbook)
  --   - mimeType NULL  -> 'application/octet-stream'
  --   - fileHash NULL/'' -> 'legacy-no-hash:' || id (unik per baris,
  --                          jelas bukan hash nyata, tidak mengganggu
  --                          index idx_storedfile_hash / dedup)
  INSERT INTO "StoredFile" (
    "id",
    "fileName",
    "filePath",
    "fileSize",
    "mimeType",
    "fileHash",
    "storageProvider",
    "uploadedBy",
    "uploadedAt",
    "deletedAt"
  )
  SELECT
    d."id",
    d."fileName",
    d."filePath",
    COALESCE(d."fileSize", 0),
    COALESCE(d."mimeType", 'application/octet-stream'),
    COALESCE(NULLIF(d."fileHash", ''), 'legacy-no-hash:' || d."id"),
    d."storageProvider",
    d."createdBy",
    d."uploadedAt",
    d."deletedAt"
  FROM "DocumentRecord" d
  WHERE NOT EXISTS (
    SELECT 1 FROM "StoredFile" s WHERE s."id" = d."id"
  );

  -- ------------------------------------------------------
  -- 2.3 Isi "DocumentRecord"."storedFileId"
  -- ------------------------------------------------------
  -- Dipasang ke baris StoredFile yang baru dibuat (id = id DocumentRecord).
  UPDATE "DocumentRecord" d
  SET "storedFileId" = d."id"
  WHERE d."storedFileId" IS NULL
    AND EXISTS (SELECT 1 FROM "StoredFile" s WHERE s."id" = d."id");

  -- ------------------------------------------------------
  -- 2.4 Mapping status registrasi (SEBELUM kolom diubah tipenya)
  -- ------------------------------------------------------
  -- Enum RegistrationStatus v2.3 (dari schema.prisma):
  --   EMAIL_PENDING, EMAIL_VERIFIED, UNDER_REVIEW, APPROVED, REJECTED.
  -- Schema v1: kolom TEXT, nilai bebas. Nilai lama yang tidak ada di
  -- enum v2 (dari kode v1) dipetakan dulu, jika tidak konversi tipe
  -- di bagian 2.7 akan gagal.
  --
  --   PENDING_ADMIN_REVIEW -> UNDER_REVIEW   (sedang direview admin:
  --                                            semantik paling pas)
  --   EXPIRED              -> EMAIL_PENDING  (permohonan tidak pernah
  --                                            selesai diverifikasi ->
  --                                            kembali menunggu verifikasi;
  --                                            REVIEW.md bagian B-1)
  UPDATE "UserRegistrationRequest"
  SET "status" = 'UNDER_REVIEW'
  WHERE "status" = 'PENDING_ADMIN_REVIEW';

  UPDATE "UserRegistrationRequest"
  SET "status" = 'EMAIL_PENDING'
  WHERE "status" = 'EXPIRED';

  -- Jaring pengaman: nilai aneh lainnya (typo, status v1 yang tidak
  -- terdokumentasi) jangan sampai membatalkan konversi tipe.
  UPDATE "UserRegistrationRequest"
  SET "status" = 'EMAIL_PENDING'
  WHERE "status" NOT IN (
    'EMAIL_PENDING',
    'EMAIL_VERIFIED',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED'
  );

  -- ------------------------------------------------------
  -- 2.5 Rename "employeeId" -> "claimedNip"
  -- ------------------------------------------------------
  -- PostgreSQL memperbarui definisi index yang melekat secara otomatis
  -- (tetap dengan nama lama: idx_userregistration_employee_id dan
  -- uniq_userregistration_active_employee_id). Namanya dirapikan di
  -- bagian 2.8.
  ALTER TABLE "UserRegistrationRequest"
    RENAME COLUMN "employeeId" TO "claimedNip";
END $$;


-- ============================================================
-- BAGIAN 2 (lanjutan) - KONVERSI TIPE REGISTRASI
-- ============================================================
-- Dilakukan di luar DO block supaya tetap aman di database v2:
-- enum -> enum yang sama adalah no-op yang valid.

-- 2.6 Hapus index unik parsial v1 dulu. Predicate-nya menyebut
-- 'PENDING_ADMIN_REVIEW' yang tidak ada di enum v2; ALTER COLUMN TYPE
-- membangun ulang index dan akan gagal menerapkan predicate itu.
-- Index ini dibuat ulang di 2.8 dengan kosa kata status v2.
-- (Index global dari draft awal v1 juga di-drop jika ada.)
DROP INDEX IF EXISTS "uniq_userregistration_active_email";
DROP INDEX IF EXISTS "uniq_userregistration_active_nik";
DROP INDEX IF EXISTS "uniq_userregistration_active_employee_id";
DROP INDEX IF EXISTS "UserRegistrationRequest_email_key";
DROP INDEX IF EXISTS "UserRegistrationRequest_nik_key";
DROP INDEX IF EXISTS "UserRegistrationRequest_employeeId_key";
DROP INDEX IF EXISTS "idx_userregistration_employee_id";

-- 2.7 Konversi tipe kolom status: TEXT (v1) / RegistrationStatus (v2)
-- -> RegistrationStatus. USING ("status"::text) bekerja di kedua jalur
-- karena enum selalu bisa dikembalikan ke text lalu dikonversi lagi.
ALTER TABLE "UserRegistrationRequest"
  ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "UserRegistrationRequest"
  ALTER COLUMN "status" TYPE "RegistrationStatus"
  USING ("status"::text)::"RegistrationStatus";

ALTER TABLE "UserRegistrationRequest"
  ALTER COLUMN "status" SET DEFAULT 'EMAIL_PENDING';

-- 2.8 Bangun ulang index status-aktif dengan kosa kata v2.
-- "Aktif" = EMAIL_PENDING | EMAIL_VERIFIED | UNDER_REVIEW (bisa
-- menunggu verifikasi email, sudah verifikasi, atau sedang direview).
-- Mencegah duplikat permohonan yang masih berjalan, sama seperti
-- versi v1, hanya dengan nama + nilai enum yang benar.
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_userregistration_active_email"
  ON "UserRegistrationRequest"("email")
  WHERE "status" IN ('EMAIL_PENDING', 'EMAIL_VERIFIED', 'UNDER_REVIEW');

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_userregistration_active_nik"
  ON "UserRegistrationRequest"("nik")
  WHERE "nik" IS NOT NULL
    AND "status" IN ('EMAIL_PENDING', 'EMAIL_VERIFIED', 'UNDER_REVIEW');

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_userregistration_active_claimed_nip"
  ON "UserRegistrationRequest"("claimedNip")
  WHERE "claimedNip" IS NOT NULL
    AND "status" IN ('EMAIL_PENDING', 'EMAIL_VERIFIED', 'UNDER_REVIEW');

CREATE INDEX IF NOT EXISTS "idx_userregistration_claimed_nip"
  ON "UserRegistrationRequest"("claimedNip");


-- ============================================================
-- BAGIAN 3 - NOT NULL + PARITY FK + HAPUS KOLOM LAMA
-- ============================================================

-- 3.1 storedFileId NOT NULL. Di v1 setiap baris sudah dapat StoredFile
-- di 2.3 (id = id DocumentRecord). Jika ada baris yang masih NULL
-- (mis. file record tanpa pasangan), pernyataan ini gagal dengan jelas
-- - itulah yang kita mau: tidak ada data yang diam-diam rusak.
-- Di database v2 kolom ini sudah NOT NULL (no-op).
ALTER TABLE "DocumentRecord"
  ALTER COLUMN "storedFileId" SET NOT NULL;

-- 3.2 createdBy NOT NULL (setelah backfill NULL di 2.1).
ALTER TABLE "DocumentRecord"
  ALTER COLUMN "createdBy" SET NOT NULL;

-- 3.3 Hapus check constraint storageProvider v1 (sudah digantikan enum
-- StorageProvider) sebelum kolomnya dihapus, sebagai insurance.
ALTER TABLE "DocumentRecord"
  DROP CONSTRAINT IF EXISTS "DocumentRecord_storageProvider_check";

-- 3.4 Hapus kolom metadata file yang sudah pindah ke StoredFile.
-- Index lama idx_documentrecord_hash ikut terhapus otomatis karena
-- bergantung pada kolom "fileHash"; v2 menyediakan idx_storedfile_hash.
ALTER TABLE "DocumentRecord"
  DROP COLUMN IF EXISTS "fileName",
  DROP COLUMN IF EXISTS "filePath",
  DROP COLUMN IF EXISTS "fileSize",
  DROP COLUMN IF EXISTS "mimeType",
  DROP COLUMN IF EXISTS "fileHash",
  DROP COLUMN IF EXISTS "storageProvider";

-- 3.5 Employee.userId: ON DELETE CASCADE (v1) -> ON DELETE RESTRICT (v2).
-- Pegawai hanya boleh di-soft-delete; hapus user secara hard delete
-- harus ditolak agar data kepegawaian tidak ikut terhapus.
ALTER TABLE "Employee"
  DROP CONSTRAINT IF EXISTS "Employee_userId_fkey";
ALTER TABLE "Employee"
  ADD CONSTRAINT "Employee_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3.6 DocumentRecord.ownerId: CASCADE (v1) -> RESTRICT (v2). Dokumen
-- pegawai adalah arsip; hapus pegawai hard-delete harus ditolak.
ALTER TABLE "DocumentRecord"
  DROP CONSTRAINT IF EXISTS "DocumentRecord_ownerId_fkey";
ALTER TABLE "DocumentRecord"
  ADD CONSTRAINT "DocumentRecord_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "Employee"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3.7 DocumentRecord.createdBy: SET NULL (v1) -> RESTRICT (v2). Audit
-- actor dokumen tidak boleh hilang; konsisten dengan createdBy NOT NULL.
ALTER TABLE "DocumentRecord"
  DROP CONSTRAINT IF EXISTS "DocumentRecord_createdBy_fkey";
ALTER TABLE "DocumentRecord"
  ADD CONSTRAINT "DocumentRecord_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3.8 Index v1 yang sudah tidak terpakai di v2 (diganti / tidak ada
-- lagi kolomnya). IF EXISTS menjaga idempotensi di database v2.
DROP INDEX IF EXISTS "idx_documentrecord_expiry";
DROP INDEX IF EXISTS "uniq_current_document_per_type";

-- 3.9 Versi v1 dari partial unique index dokumen current masih
-- menggunakan definisi lama (tanpa deletedAt). Versi v2 yang benar
-- ada di migration 20260920031000_harden_v2_database_rules; cara
-- menerapkannya di database v1 yang sudah dimigrasi ada di runbook
-- (bagian "Apply" langkah 4).
