# Database Reference — SIMDP

**Status:** Draft awal
**Sumber utama:** `dms_pegawai_schema.sql`, `PRD-SIMDP-v2.0-20260708.md` §8 dan §24
**Terakhir diperbarui:** 2026-07-08

## Database

- Engine: PostgreSQL.
- Hosting target: Supabase.
- ORM target: Prisma.
- SQL source of truth awal: `dms_pegawai_schema.sql`.

## Enums

| Enum | Values |
|---|---|
| `Role` | `ADMIN`, `STAFF`, `EMPLOYEE` |
| `DocumentStatus` | `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`, `REPLACED` |
| `ArchiveCategory` | `PERSONAL`, `EDUCATION`, `EMPLOYMENT`, `CERTIFICATION`, `LEGAL` |
| `EmployeeStatus` | `ACTIVE`, `RETIRED`, `STUDY_ASSIGNMENT` |
| `EmployeeGender` | `MALE`, `FEMALE` |
| `EmployeeMaritalStatus` | `SINGLE`, `MARRIED`, `DIVORCED`, `WIDOWED` |
| `EmployeeReligion` | `ISLAM`, `PROTESTANT`, `CATHOLIC`, `HINDU`, `BUDDHIST`, `CONFUCIAN` |
| `StorageProvider` | `LOCAL`, `SUPABASE`, `S3` |
| `NotificationType` | `DOCUMENT_STATUS`, `DOCUMENT_VERIFICATION`, `EXPIRY_REMINDER`, `VERIFICATION_REQUIRED`, `INFO` |
| `NotificationRelatedEntityType` | `DOCUMENT_RECORD` |
| `SecurityLogStatus` | `SUCCESS`, `FAILED` |
| `SecurityActorRole` | `ADMIN`, `STAFF`, `EMPLOYEE`, `PUBLIC`, `SYSTEM` |
| `DocumentVerificationType` | `EMPLOYEE_PROFILE`, `EMPLOYEE_DIRECTORY`, `EMPLOYEE_DOCUMENTS` |

## Tabel Auth

| Tabel | Fungsi | Catatan |
|---|---|---|
| `User` | Akun login | `email` unik, `role`, `isActive`, `deletedAt`. |
| `RefreshToken` | Sesi refresh token | Simpan hash token, revoke via `revokedAt`. |
| `PasswordResetToken` | Reset password satu-pakai | `usedAt`, `expiresAt`. |

## Tabel Pegawai & Master Data

| Tabel | Fungsi | Catatan |
|---|---|---|
| `Employee` | Profil pegawai | 1-1 dengan `User`; `employeeId`/NIP unik nullable; `nik`/NIK unik nullable; minimal salah satu dari NIP atau NIK wajib ada; soft delete. |
| `EmploymentStatus` | Status kepegawaian | Master data. |
| `EmployeeGroup` | Kelompok pegawai | Unik `(name, employmentStatusId)`. |
| `ProfessionGroup` | Rumpun profesi | Master data. |
| `EmployeePosition` | Jabatan | Unik `(name, professionGroupId)`. |
| `EmployeeRank` | Pangkat/golongan | Master data. |
| `Workplace` | Unit kerja | Master data. |
| `EmployeeCareerHistory` | Riwayat karier/mutasi | Index `(employeeId, effectiveDate)`. |

## Tabel Dokumen

| Tabel | Fungsi | Catatan |
|---|---|---|
| `DocumentType` | Master jenis dokumen | Kategori, mandatory, allowMultiple, field requirements, format, size. |
| `DocumentTypeProfessionGroup` | Target by profesi | Unique `(documentTypeId, professionGroupId)`. |
| `DocumentTypeEmploymentStatus` | Target by status | Unique `(documentTypeId, employmentStatusId)`. |
| `DocumentTypeEmployeeGroup` | Target by group | Unique `(documentTypeId, employeeGroupId)`. |
| `DocumentTypeEmployeePosition` | Target by jabatan | Unique `(documentTypeId, employeePositionId)`. |
| `DocumentTypeEmployeeRank` | Target by pangkat | Unique `(documentTypeId, employeeRankId)`. |
| `DocumentTypeWorkplace` | Target by unit | Unique `(documentTypeId, workplaceId)`. |
| `DocumentRecord` | File dokumen pegawai | Metadata file lengkap, status, expiry reminder fields, soft delete. |
| `VerificationHistory` | Riwayat verifikasi | Satu row untuk setiap approve/reject. |
| `DocumentVerification` | Kode verifikasi publik untuk dokumen yang diterbitkan sistem | Kode unik random, subject pegawai opsional untuk dokumen agregat, jenis dokumen, hash file opsional, revoked/expiry metadata. |

## Tabel Pendukung

| Tabel | Fungsi | Catatan |
|---|---|---|
| `Notification` | Notifikasi in-app | Index `(userId, isRead)`. |
| `SecurityLog` | Audit trail | Append-only, index actor/timestamp. |
| `SystemSetting` | Konfigurasi key-value | Update tanpa redeploy. |

## Index Penting

- `idx_refreshtoken_user` pada `RefreshToken(userId)`.
- `idx_passwordreset_user` pada `PasswordResetToken(userId)`.
- `idx_employee_deleted` pada `Employee(deletedAt)`.
- `idx_careerhistory_employee` pada `EmployeeCareerHistory(employeeId, effectiveDate)`.
- `idx_documentrecord_owner_type` pada `DocumentRecord(ownerId, documentTypeId)`.
- `idx_documentrecord_expiry` pada `DocumentRecord(expiryDate)` jika not null.
- `idx_documentrecord_hash` pada `DocumentRecord(fileHash)`.
- `idx_verificationhistory_document` pada `VerificationHistory(documentRecordId)`.
- `idx_documentverification_subject` pada `DocumentVerification(subjectEmployeeId)`.
- `idx_documentverification_issued_at` pada `DocumentVerification(issuedAt)`.
- `idx_notification_user_unread` pada `Notification(userId, isRead)`.
- `idx_securitylog_actor` dan `idx_securitylog_timestamp`.

## Trigger Penting

### `handle_document_replacement()`

Trigger `BEFORE INSERT` pada `DocumentRecord`.

Tanggung jawab:
- isi `allowMultipleSnapshot` dari `DocumentType.allowMultiple`;
- jika `allowMultiple = false`, dokumen current lama untuk owner/type yang sama otomatis menjadi `REPLACED` dan `isCurrent = false`.

### `set_updated_at()`

Trigger generic untuk update `updatedAt` pada tabel yang punya kolom tersebut.

## Constraint Penting

`uniq_current_document_per_type`:

```sql
CREATE UNIQUE INDEX uniq_current_document_per_type
ON "DocumentRecord" ("ownerId", "documentTypeId")
WHERE "isCurrent" = true AND "allowMultipleSnapshot" = false;
```

Makna: satu pegawai hanya punya satu dokumen current untuk DocumentType non-multiple.


## Prisma Schema & Migration Baseline

`prisma/schema.prisma` dibuat dari `dms_pegawai_schema.sql` sebagai baseline ORM. Prisma 7 memakai `prisma.config.ts` untuk membaca `DATABASE_URL`; schema file hanya menyimpan provider PostgreSQL dan model/enum.

Migration baseline awal berada di `prisma/migrations/20260709000000_init/migration.sql` yang menyimpan seluruh schema SQL mentah (tabel, enum, index, check constraint, partial unique index, function, dan trigger) untuk menjaga konsistensi database. Folder migration juga menyimpan `prisma/migrations/migration_lock.toml` dengan provider `postgresql` agar Prisma Migrate mengunci provider database yang benar.

Validasi lokal:

```bash
npm run prisma:format
npm run prisma:validate
npm run prisma:generate
```

Batasan representasi Prisma:
- CHECK constraint `chk_employee_identifier_required` tetap harus dijaga di SQL migration karena Prisma schema belum merepresentasikan CHECK constraint.
- CHECK constraint `DocumentRecord.storageProvider IN ('local', 'supabase', 's3')` tetap harus dijaga di SQL migration.
- Partial unique index `uniq_current_document_per_type` tetap harus dijaga di SQL migration karena Prisma tidak merepresentasikan partial unique index secara native.
- Trigger `handle_document_replacement()` dan `set_updated_at()` tetap berada di SQL migration; Prisma model hanya merepresentasikan tabel/relasi/field.


## Prisma Client Runtime

`src/lib/prisma.ts` menyediakan Prisma Client singleton untuk server-side code. Singleton ini mencegah terlalu banyak koneksi saat Next.js development hot reload membuat module di-load ulang.

Pola pemakaian:

```ts
import { prisma } from "@/lib/prisma";
```

Catatan Prisma 7:
- Runtime client memakai `@prisma/adapter-pg` dan `pg`.
- `DATABASE_URL` dibaca dari `src/lib/env.ts`.
- File ini server-only; jangan import dari Client Component.

## Aturan Implementasi

- Prisma schema harus mengikuti SQL ini.
- Jangan menghapus trigger/constraint tanpa keputusan baru.
- Query normal pada tabel soft delete wajib `deletedAt IS NULL`.
- `SecurityLog` tidak boleh di-update/delete oleh aplikasi.
