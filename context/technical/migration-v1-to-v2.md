# Runbook — Migrasi Database v1 → v2.3 (SIMDP)

**Issue:** #317 (REVIEW.md blocker B-1)
**Branch:** `fix/317-database-v1-to-v2-migration`
**Migration:** `prisma/migrations-v2/20260922000000_migrate_v1_to_v2/migration.sql`

> **PERINGATAN — TINDAKAN HIGH-RISK.**
> Menjalankan migrasi ini di database production adalah tindakan high-risk
> menurut `AGENTS.md` §10. **Wajib**: (1) persetujuan eksplisit user (Arsi),
> (2) jendela maintenance, (3) rehearsal di salinan database production
> terlebih dahulu. **Jangan pernah menjalankan tanpa ketiganya.**

## Daftar Isi

1. [Prasyarat](#1-prasyarat)
2. [Preflight check](#2-preflight-check)
3. [Backup](#3-backup)
4. [Dry-run](#4-dry-run)
5. [Apply](#5-apply)
6. [Verify](#6-verify)
7. [Rollback](#7-rollback)
8. [Setelah migrasi — pekerjaan follow-up](#8-setelah-migrasi--pekerjaan-follow-up)

---

## 1. Prasyarat

- PostgreSQL **12+** (memakai `ALTER TYPE ... ADD VALUE IF NOT EXISTS` dalam
  transaksi, sama dengan migration `20260920183000`).
- Node **22.6+** (seed memakai `node --experimental-strip-types`).
- Akses superuser atau role yang boleh `CREATE TYPE`, `ALTER TABLE`,
  `CREATE INDEX`, dan `CREATE TRIGGER`.
- `prisma.config.ts` mengarah ke `prisma/migrations-v2` (sudah default di branch ini).
- Database target masih bershape **v1** (memiliki kolom
  `"DocumentRecord"."fileName"`). Jika database sudah v2 (fresh install),
  migration ini adalah no-op aman — bagian 2-nya berhenti lebih awal.
- **Aplikasi dalam mode maintenance** selama jendela migrasi (stop server
  app, atau arahkan ke halaman maintenance). Migrasi mengubah kolom dan FK
  yang dipakai transaksi aplikasi.

## 2. Preflight check

Jalankan **semua** check di bawah di database target. Catat hasilnya ke
log operasi (timestamp + output). Jika **salah satu gagal**, hentikan dan
perbaiki sebelum backup.

### 2.1 Versi PostgreSQL

```sql
SELECT version();
-- Harus >= 12. Gagal jika < 12.
```

### 2.2 Database masih v1 (penanda)

```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = CURRENT_SCHEMA()
    AND table_name = 'DocumentRecord'
    AND column_name = 'fileName'
) AS is_v1;
-- is_v1 = true  -> database masih v1, migration akan bekerja penuh.
-- is_v1 = false -> database sudah v2; migration aman tapi no-op.
```

### 2.3 Baris `DocumentRecord` tanpa pasangan file

```sql
SELECT count(*) AS rows_with_null_file_metadata
FROM "DocumentRecord"
WHERE "fileName" IS NULL
   OR "filePath" IS NULL
   OR "fileSize" IS NULL
   OR "mimeType" IS NULL
   OR "fileHash" IS NULL OR "fileHash" = '';
```

- `0` → ideal, migration bersih.
- `> 0` → **dapat diterima**: migration memakai fallback (`fileSize` → 0,
  `mimeType` → `application/octet-stream`, `fileHash` →
  `'legacy-no-hash:' || id`). Catat jumlahnya; file dengan `fileHash`
  fallback sebaiknya di-re-hash ulang di langkah [8.2](#82-re-hashing-file-legacy).

### 2.4 `createdBy` NULL dan ketersediaan user ADMIN

```sql
SELECT count(*) AS documents_createdby_null
FROM "DocumentRecord"
WHERE "createdBy" IS NULL;

SELECT id, email, "createdAt"
FROM "User"
WHERE role = 'ADMIN'
ORDER BY "createdAt"
LIMIT 1;
```

- `documents_createdby_null = 0` → ideal.
- `> 0` **dan** ada user ADMIN → migration akan backfill memakai ADMIN
  pertama (tertua). **Tinjau apakah fallback ini dapat diterima secara
  audit** — semua dokumen tanpa creator akan dicatat sebagai dibuat oleh
  admin pertama. Jika tidak dapat diterima, hentikan dan tentukan fallback
  lain sebelum migrasi.
- `> 0` **dan tidak ada user ADMIN** → migration **akan gagal** di
  `SET NOT NULL` (memang disengaja: jangan tebak-tebakan data audit).

### 2.5 Status registrasi non-standar

```sql
SELECT status, count(*)
FROM "UserRegistrationRequest"
GROUP BY status
ORDER BY 2 DESC;
```

Pastikan tidak ada nilai `status` yang berisi data **penting** di luar
`EMAIL_PENDING`, `EMAIL_VERIFIED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`.
Nilai lain (termasuk `PENDING_ADMIN_REVIEW`, `EXPIRED`, typo) akan
dipetakan:

| Nilai lama | Nilai baru |
|---|---|
| `PENDING_ADMIN_REVIEW` | `UNDER_REVIEW` |
| `EXPIRED` | `EMAIL_PENDING` |
| nilai lain apa pun | `EMAIL_PENDING` |

### 2.6 Cek duplikat yang akan membatalkan unique index baru

```sql
SELECT email, count(*) AS dupes
FROM "UserRegistrationRequest"
WHERE "status" IN ('EMAIL_PENDING', 'EMAIL_VERIFIED', 'UNDER_REVIEW')
GROUP BY email
HAVING count(*) > 1;

SELECT nik, count(*) AS dupes
FROM "UserRegistrationRequest"
WHERE "nik" IS NOT NULL
  AND "status" IN ('EMAIL_PENDING', 'EMAIL_VERIFIED', 'UNDER_REVIEW')
GROUP BY nik
HAVING count(*) > 1;

SELECT "employeeId" AS claimed_nip, count(*) AS dupes
FROM "UserRegistrationRequest"
WHERE "employeeId" IS NOT NULL
  AND "status" IN ('EMAIL_PENDING', 'EMAIL_VERIFIED', 'UNDER_REVIEW')
GROUP BY "employeeId"
HAVING count(*) > 1;
```

Semua query harus mengembalikan **0 baris**. Jika ada duplikat, hapus
permohonan yang sudah tidak relevan (mis. `REJECTED` yang tersisa) atau
gabungkan manual sebelum migrasi — jika tidak, `CREATE UNIQUE INDEX` di
langkah 2.8 migration akan **gagal**.

### 2.7 Snapshot row count (baseline verifikasi)

Simpan output query ini sebagai `preflight-rowcounts.txt` — dipakai di
[langkah 6](#6-verify) untuk membandingkan sebelum/sesudah.

```sql
SELECT 'users' AS table_name, count(*) FROM "User"
UNION ALL SELECT 'employees', count(*) FROM "Employee"
UNION ALL SELECT 'document_types', count(*) FROM "DocumentType"
UNION ALL SELECT 'document_records', count(*) FROM "DocumentRecord"
UNION ALL SELECT 'registration_requests', count(*) FROM "UserRegistrationRequest"
UNION ALL SELECT 'security_logs', count(*) FROM "SecurityLog"
UNION ALL SELECT 'verification_histories', count(*) FROM "VerificationHistory"
UNION ALL SELECT 'notifications', count(*) FROM "Notification";
```

## 3. Backup

**Tidak ada migrasi tanpa backup yang sudah diuji restore-nya.**

### 3.1 Backup database

```bash
# Sesuaikan DATABASE_URL ke database target.
pg_dump --format=custom --no-owner --verbose \
  --file="backups/simdp-pre-v2-$(date +%Y%m%d-%H%M%S).dump" \
  "$DATABASE_URL"
```

- `--format=custom` (pg_restore) — mendukung restore paralel dan selektif.
- Simpan **di lokasi terpisah** (disk lain / object storage), bukan di
  server database yang sama.
- Untuk Vercel Postgres / Supabase: pakai backup harian platform sebagai
  lapisan kedua, tapi **tetap** lakukan `pg_dump` manual di atas.

### 3.2 Uji restore (wajib)

```bash
# Buat database kosong untuk uji restore.
createdb "simdp_restore_test"

pg_restore --dbname="simdp_restore_test" --no-owner --exit-on-error \
  "backups/simdp-pre-v2-<timestamp>.dump"

# Verifikasi: query row count harus sama dengan 2.7.
psql "simdp_restore_test" -c "SELECT count(*) FROM \"DocumentRecord\";"

# Bersihkan setelah verifikasi.
dropdb "simdp_restore_test"
```

**Jika restore gagal atau row count tidak sama → hentikan.** Backup yang
tidak bisa di-restore sama dengan tidak punya backup.

### 3.3 Backup file fisik (opsional, sangat disarankan)

```bash
# Jika storageProvider = LOCAL, salin folder uploads/ ke lokasi aman.
robocopy "<UPLOADS_DIR>" "<BACKUP_DIR>/uploads" /MIR
```

## 4. Dry-run

### 4.1 Buat rehearsal database

```bash
createdb "simdp_rehearsal"

# Restore dari backup yang sudah diverifikasi di 3.2.
pg_restore --dbname="simdp_rehearsal" --no-owner --exit-on-error \
  "backups/simdp-pre-v2-<timestamp>.dump"
```

### 4.2 Jalankan migration di rehearsal

**Bungkus dalam transaksi eksplisit** agar bisa di-rollback tanpa
memengaruhi data:

```bash
psql "simdp_rehearsal" -v ON_ERROR_STOP=1 -1 \
  --file="prisma/migrations-v2/20260922000000_migrate_v1_to_v2/migration.sql"
```

- `-1` = seluruh migration dalam satu transaksi (semua atau tidak sama sekali).
- `ON_ERROR_STOP=1` = berhenti pada error pertama, jangan lanjut setengah jalan.

**Catat**: waktu eksekusi, dan apakah ada error. Jika error → baca pesan,
koreksi (data atau migration), ulang dari restore fresh. Jangan pernah
melanjutkan ke production sebelum rehearsal **bersih**.

### 4.3 Verifikasi rehearsal (langsung ke [langkah 6](#6-verify))

Jalankan seluruh query verify di rehearsal database **sebelum** menyentuh
production. Jika verifikasi gagal → perbaiki, ulang 4.1.

## 5. Apply

> Hanya setelah [2](#2-preflight-check) lulus, [3](#3-backup) selesai
> (termasuk uji restore), dan [4](#4-dry-run) bersih.

### 5.1 Aktifkan mode maintenance

Stop aplikasi ( atau arahkan ke halaman maintenance via load balancer).
Pastikan **tidak ada koneksi app aktif** yang menulis ke
`DocumentRecord`/`UserRegistrationRequest`:

```sql
SELECT pid, usename, application_name, state, query
FROM pg_stat_activity
WHERE datname = current_database()
  AND state <> 'idle';
```

### 5.2 Apply migration

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 \
  --file="prisma/migrations-v2/20260922000000_migrate_v1_to_v2/migration.sql"
```

Lalu catat di tabel `_prisma_migrations` agar `prisma migrate deploy`
menganggap migration ini sudah terpasang (menghindari percobaan ulang):

```sql
INSERT INTO "_prisma_migrations" (id, checksum, migration_name, finished_at, applied_steps_count)
VALUES (
  gen_random_uuid(),
  '<checksum-dari-prisma-migrate-diff atau manual>',
  '20260922000000_migrate_v1_to_v2',
  now(),
  1
)
ON CONFLICT (migration_name) DO NOTHING;
```

> Catatan: `checksum` diisi nilai apa pun yang konsisten — yang penting
> barisnya ada. Gunakan output `prisma migrate diff` atau hash SHA-256
> file `migration.sql` (jalankan `sha256sum` di file-nya).

### 5.3 Apply trigger hardening

Migration transisi **sengaja tidak menduplikasi** trigger/constraint dari
`20260920031000_harden_v2_database_rules` (memiliki dua salinan logika DB
sama adalah sumber bug). Setelah struktur v2.3 ada, jalankan file
trigger-nya di database v1 yang sudah dimigrasi:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 \
  --file="prisma/migrations-v2/20260920031000_harden_v2_database_rules/migration.sql"
```

Lalu juga migration koreksi yang menyertakannya:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 \
  --file="prisma/migrations-v2/20260920033000_fix_post_visibility_orphan_guard/migration.sql"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 \
  --file="prisma/migrations-v2/20260920113000_support_explicit_document_replacement/migration.sql"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 \
  --file="prisma/migrations-v2/20260920114500_allow_controlled_verification_purge/migration.sql"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 \
  --file="prisma/migrations-v2/20260920183000_add_post_notification_entity_type/migration.sql"
```

Dan catat semuanya di `_prisma_migrations` seperti 5.2.

> **Penting:** migration harden di atas memakai `CREATE OR REPLACE
> FUNCTION` / `CREATE TRIGGER` (idempoten) dan `COMMENT ON`, jadi aman
> dijalankan ulang. Namun **selalu jalankan di rehearsal dulu** (langkah
> 4.2 seharusnya sudah menyertakannya).

### 5.4 Validasi parity schema

```bash
npx prisma migrate diff \
  --from-migrations prisma/migrations-v2 \
  --to-schema-datamodel prisma/schema.prisma
```

Output harus **kosong** (tidak ada perbedaan). Jika ada diff → struktur
database belum parity dengan `schema.prisma` — jangan nyalakan app dulu,
telusuri diff-nya.

### 5.5 Nyalakan aplikasi

```bash
# Generate client baru (pastikan tipe v2.3 dipakai).
npm run prisma:generate

# Nyalakan app, lalu pantau log eror 5-10 menit pertama.
npm run start
```

## 6. Verify

Jalankan setiap check di bawah. **Semua harus lulus** sebelum meninggalkan
jendela maintenance.

### 6.1 Row count parity (bandingkan dengan 2.7)

```sql
SELECT 'users' AS table_name, count(*) FROM "User"
UNION ALL SELECT 'employees', count(*) FROM "Employee"
UNION ALL SELECT 'document_types', count(*) FROM "DocumentType"
UNION ALL SELECT 'document_records', count(*) FROM "DocumentRecord"
UNION ALL SELECT 'registration_requests', count(*) FROM "UserRegistrationRequest"
UNION ALL SELECT 'security_logs', count(*) FROM "SecurityLog"
UNION ALL SELECT 'verification_histories', count(*) FROM "VerificationHistory"
UNION ALL SELECT 'notifications', count(*) FROM "Notification";
```

- `users`, `employees`, `document_types`, `document_records`,
  `registration_requests`, `security_logs` harus **sama persis** dengan 2.7.
- `verification_histories` mungkin bertambah untuk dokumen yang
  auto-approved oleh trigger — **hanya** untuk baris baru, bukan yang lama.

### 6.2 Backfill `StoredFile` lengkap

```sql
-- Harus 0: tidak ada DocumentRecord tanpa StoredFile.
SELECT count(*) AS documents_without_stored_file
FROM "DocumentRecord" d
LEFT JOIN "StoredFile" s ON s."id" = d."storedFileId"
WHERE s."id" IS NULL;

-- Harus 0: tidak ada DocumentRecord dengan storedFileId NULL.
SELECT count(*) AS documents_with_null_storedfile_id
FROM "DocumentRecord"
WHERE "storedFileId" IS NULL;

-- Jumlah StoredFile harus >= jumlah DocumentRecord (boleh lebih karena
-- PostAttachment juga memakai StoredFile di database yang sudah dipakai).
SELECT
  (SELECT count(*) FROM "StoredFile") AS stored_files,
  (SELECT count(*) FROM "DocumentRecord") AS document_records;
```

### 6.3 Integritas metadata file

```sql
-- Harus 0: tidak ada StoredFile dengan field NOT NULL yang kosong.
SELECT count(*) AS stored_files_with_null_metadata
FROM "StoredFile"
WHERE "fileName" IS NULL OR "filePath" IS NULL OR "fileSize" IS NULL
   OR "mimeType" IS NULL OR "fileHash" IS NULL OR "storageProvider" IS NULL;

-- Harus 0: kolom file lama sudah terhapus.
SELECT count(*) AS leftover_file_columns
FROM information_schema.columns
WHERE table_schema = CURRENT_SCHEMA()
  AND table_name = 'DocumentRecord'
  AND column_name IN ('fileName', 'filePath', 'fileSize', 'mimeType', 'fileHash', 'storageProvider');
```

### 6.4 Sample dokumen — hash & path identik

Ambil 10 sample acak, bandingkan `StoredFile` hasil migrasi dengan data
v1 (dari backup/`preflight-rowcounts.txt`):

```sql
SELECT d."id",
       s."fileName",
       s."filePath",
       s."fileSize",
       s."mimeType",
       s."fileHash",
       s."storageProvider"
FROM "DocumentRecord" d
JOIN "StoredFile" s ON s."id" = d."storedFileId"
ORDER BY random()
LIMIT 10;
```

`fileName`, `filePath`, `fileSize`, `fileHash` harus **identik** dengan
data v1 (kecuali yang masuk kategori 2.3 fallback: `fileSize` = 0,
`mimeType` = `application/octet-stream`, `fileHash` =
`legacy-no-hash:<id>`).

### 6.5 Registrasi: tidak ada nilai enum invalid

```sql
-- Harus 0.
SELECT count(*) AS invalid_registration_status
FROM "UserRegistrationRequest"
WHERE "status" NOT IN ('EMAIL_PENDING', 'EMAIL_VERIFIED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- Harus 0: kolom lama sudah ter-rename.
SELECT count(*) AS employeeid_column_still_exists
FROM information_schema.columns
WHERE table_schema = CURRENT_SCHEMA()
  AND table_name = 'UserRegistrationRequest'
  AND column_name = 'employeeId';

-- Distribusi status setelah mapping.
SELECT status, count(*)
FROM "UserRegistrationRequest"
GROUP BY status
ORDER BY 2 DESC;
```

### 6.6 Constraint & FK parity

```sql
-- createdBy dan storedFileId harus NOT NULL.
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_schema = CURRENT_SCHEMA()
  AND table_name = 'DocumentRecord'
  AND column_name IN ('createdBy', 'storedFileId');
-- Keduanya harus 'NO'.

-- FK onDelete harus RESTRICT.
SELECT con.conname, con.confdeltype
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'Employee' AND con.conname = 'Employee_userId_fkey'
UNION ALL
SELECT con.conname, con.confdeltype
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'DocumentRecord' AND con.conname = 'DocumentRecord_ownerId_fkey';
-- confdeltype harus 'r' (RESTRICT) untuk keduanya.
```

### 6.7 Smoke test fungsional (manual)

Lakukan **minimal** alur ini di app setelah dinyalakan:

1. **Login** sebagai employee → dashboard termuat, dokumen tampil.
2. **Download** dokumen existing → file terunduh, hash sama dengan 6.4.
3. **Upload dokumen non-periodik** → sukses, status `PENDING`.
4. **Upload dokumen periodik** (`requiresPeriod = true`) tanpa periode →
   **400** "Periode mulai dan periode berakhir wajib diisi" (bukan 500).
5. **Upload dokumen periodik dengan periode valid** → sukses.
6. **Admin upload `adminUploadAutoFinal = true`** → status `APPROVED`,
   `isFinal = true`, dan **tepat satu** `VerificationHistory` `APPROVED`
   (dibuat trigger, bukan service).
7. **Replace dokumen** → dokumen lama `REPLACED`, dokumen baru `PENDING`.
8. **Publish post `TARGETED`** + lihat feed sebagai pegawai target.
9. **Registrasi**: cek halaman antrian admin memuat data lama tanpa error.

## 7. Rollback

> Rollback = **pulihkan dari backup**. Migration transisi tidak disertakan
> "down migration" karena perubahan enum/NOT NULL/data-move bersifat
> destruktif satu arah (nilai enum lama sudah dipetakan; kolom file lama
> sudah di-drop). Membaliknya manual tidak aman.

### 7.1 Prosedur rollback

```bash
# 1. Matikan app (mode maintenance).
# 2. Drop database yang gagal/error.
dropdb --if-exists "<DATABASE_NAME>"

# 3. Pulihkan dari backup yang sudah diverifikasi di 3.2.
createdb "<DATABASE_NAME>"
pg_restore --dbname="<DATABASE_NAME>" --no-owner --exit-on-error \
  "backups/simdp-pre-v2-<timestamp>.dump"

# 4. Validasi: jalankan 2.7 (row count harus sama dengan preflight).
# 5. Kembalikan kode ke commit sebelum migrasi (git checkout tag/commit
#    pra-v2), generate ulang prisma client, nyalakan app.
npm run prisma:generate
npm run start
# 6. Pantau log 15 menit.
```

### 7.2 Rollback sebagian (jika migration berhenti setengah jalan)

Migration dijalankan dalam **satu transaksi** (`-1` di 4.2/5.2), jadi
setiap kegagalan membatalkan seluruh pernyataan — tidak ada kondisi
"setengah jalan". Jika Anda menjalankan **tanpa** `-1` dan terhenti:

```bash
# Cek apakah masih ada penanda v1.
psql "$DATABASE_URL" -c "
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = CURRENT_SCHEMA()
    AND table_name = 'DocumentRecord' AND column_name = 'fileName'
) AS still_v1;"
```

- `still_v1 = true` → lanjutkan dari awal migration (semua pernyataan
  idempoten, aman menjalankan ulang penuh).
- `still_v1 = false` → struktur sudah selesai tapi mungkin data belum
  pindah. **Jangan meneruskan**. Pulihkan dari backup (7.1) dan mulai
  ulang dari dry-run (4).

## 8. Setelah migrasi — pekerjaan follow-up

### 8.1 Hapus mode maintenance

Setelah [6](#6-verify) lulus, cabut pengaturan maintenance dan umumkan
ke user bahwa layanan sudah kembali.

### 8.2 Re-hashing file legacy

File yang masuk kategori [2.3](#23-baris-documentrecord-tanpa-pasangan-file)
fallback (`fileHash = 'legacy-no-hash:<id>'`) tidak terdeteksi duplikat
oleh `idx_storedfile_hash`. Jalankan job re-hash saat beban rendah:

```ts
// Contoh skema job (implementasi terpisah, bukan bagian migration):
// 1. SELECT id, filePath, storageProvider FROM "StoredFile"
//    WHERE "fileHash" LIKE 'legacy-no-hash:%';
// 2. Untuk tiap row: unduh file -> sha256 -> UPDATE "StoredFile"
//    SET "fileHash" = <hash> WHERE id = <id>;
// 3. Jika file tidak ditemukan (missing), catat ke SecurityLog.
```

### 8.3 Dedup path

Partial unique index `uniq_storedfile_provider_path`
`(storageProvider, filePath) WHERE "deletedAt" IS NULL` mungkin gagal
dibuat di database v1 jika ada path file terduplikasi. Cek setelah
migrasi:

```sql
SELECT "storageProvider", "filePath", count(*) AS dupes
FROM "StoredFile"
WHERE "deletedAt" IS NULL
GROUP BY "storageProvider", "filePath"
HAVING count(*) > 1;
```

Jika ada duplikat, jalankan migration
`20260920113000_support_explicit_document_replacement` (sudah di 5.3)
yang menyertakan index ini — atau resolve manual lalu buat ulang index-nya.

### 8.4 Backup post-migration

Setelah semua selesai dan app stabil ±24 jam, ambil backup baru:

```bash
pg_dump --format=custom --no-owner \
  --file="backups/simdp-post-v2-$(date +%Y%m%d-%H%M%S).dump" \
  "$DATABASE_URL"
```

---

## Lampiran — Ringkasan perubahan breaking

| Perubahan | Dampak | Ditangani di migration bagian |
|---|---|---|
| `DocumentRecord.{fileName,filePath,fileSize,mimeType,fileHash,storageProvider}` → `StoredFile`; `storedFileId` NOT NULL baru | Setiap baris existing butuh backfill | 1.3, 2.2, 2.3, 3.1, 3.4 |
| `DocumentRecord.createdBy` `String?` → `String` (NOT NULL) | Baris `createdBy IS NULL` dilanggar | 2.1, 3.2 |
| `UserRegistrationRequest.employeeId` → `claimedNip` (rename) | Data lama kehilangan kolom saat skema ditukar | 2.5 |
| Enum `RegistrationStatus`: hapus `PENDING_ADMIN_REVIEW`/`EXPIRED`, tambah `EMAIL_VERIFIED`/`UNDER_REVIEW` | Nilai lama invalid → `UPDATE` sebelum `ALTER TYPE` | 2.4, 2.6, 2.7, 2.8 |
| `ArchiveCategory` tambah `PERIODIC` | Additive, aman | 1.1 |
| `NotificationRelatedEntityType` tambah `POST` | Additive, aman | 1.1 |
| `Employee.user` `onDelete: Cascade` → `Restrict` | FK constraint berubah | 3.5 |
| `DocumentRecord.ownerId` `Cascade` → `Restrict` | FK constraint berubah | 3.6 |
| `DocumentRecord.createdBy` FK `SET NULL` → `Restrict` | FK constraint berubah | 3.7 |
| Tabel baru: `StoredFile`, `Post`, `PostAttachment`, `PostVisibility*` | Additive, aman | 1.3, 1.4 |
| Trigger hardening (`trg_01`–`trg_12`) | Rules DB baru; `updatedAt` jadi tanggung jawab trigger | 5.3 (runbook ini) |

## Lampiran — File yang relevan

- `prisma/migrations-v2/20260922000000_migrate_v1_to_v2/migration.sql` — migration transisi.
- `prisma/migrations-v2/20260920031000_harden_v2_database_rules/migration.sql` — trigger + constraint.
- `prisma/migrations-archive/README.md` — penjelasan folder v1 yang diarsipkan.
- `prisma.config.ts` — path migrasi aktif.
- `REVIEW.md` — asal temuan (B-1 blocker).
- `context/memory/decisions-log.md` [2026-09-21] — ADR strategi migrasi v1 → v2.
