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
| `DocumentTypeEmployeeRank` | Target by pangkat | Unique `(documentTypeId, employeeRankId)`. |
| `DocumentTypeWorkplace` | Target by unit | Unique `(documentTypeId, workplaceId)`. |
| `DocumentRecord` | File dokumen pegawai | Metadata file lengkap, status, expiry reminder fields, soft delete. |
| `VerificationHistory` | Riwayat verifikasi | Satu row untuk setiap approve/reject. |

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

## Aturan Implementasi

- Prisma schema harus mengikuti SQL ini.
- Jangan menghapus trigger/constraint tanpa keputusan baru.
- Query normal pada tabel soft delete wajib `deletedAt IS NULL`.
- `SecurityLog` tidak boleh di-update/delete oleh aplikasi.
