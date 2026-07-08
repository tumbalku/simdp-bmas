# Domain Entities — SIMDP

**Status:** Draft awal
**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §3.1 dan `dms_pegawai_schema.sql`
**Terakhir diperbarui:** 2026-07-08

## 1. Auth Entities

### User

Akun login aplikasi.

Field penting:
- `email`: unik, wajib.
- `passwordHash`: hash password, Argon2id di aplikasi.
- `role`: `ADMIN`, `STAFF`, atau `EMPLOYEE`.
- `isActive`: status aktif akun.
- `deletedAt`: soft delete.

Relasi penting:
- 1 `User` bisa punya 1 `Employee`.
- 1 `User` bisa punya banyak `RefreshToken`, `PasswordResetToken`, `Notification`, dan `SecurityLog` sebagai actor.

### RefreshToken

Menyimpan hash refresh token untuk sesi login.

Aturan:
- Jangan simpan plaintext refresh token.
- Login baru wajib revoke semua token lama user tersebut.
- Refresh token lama direvoke saat rotation.

### PasswordResetToken

Token satu-pakai untuk reset password.

Aturan:
- Expired 1 jam.
- Setelah dipakai, isi `usedAt`.
- Reset password revoke semua refresh token user.

## 2. Employee & Master Data

### Employee

Profil pegawai lengkap, 1-1 dengan `User`.

Field identitas penting:
- `employeeId`: NIP, unik, boleh kosong karena tidak semua pegawai memiliki NIP.
- `nik`: NIK, unik, boleh kosong hanya jika NIP ada.
- Minimal salah satu dari `employeeId` atau `nik` wajib ada. Jika pegawai tidak memiliki NIP, gunakan NIK sebagai identifier utama.
- `name`: nama pegawai.
- `gender`, `birthDate`, `birthPlace`, `phone`, `address`.

Relasi current assignment:
- `employmentStatusId`
- `employeeGroupId`
- `employeePositionId`
- `employeeRankId`
- `workplaceId`

Audit/soft delete:
- `createdBy`, `updatedBy`, `createdAt`, `updatedAt`, `deletedAt`.

### EmploymentStatus

Status kepegawaian, misalnya PNS, kontrak, honorer.

### EmployeeGroup

Kelompok pegawai turunan dari `EmploymentStatus`.

Relasi:
- wajib punya `employmentStatusId`.
- unik berdasarkan `(name, employmentStatusId)`.

### ProfessionGroup

Rumpun profesi, misalnya medis/non-medis/keperawatan.

### EmployeePosition

Jabatan pegawai, turunan dari `ProfessionGroup`.

Relasi:
- wajib punya `professionGroupId`.
- unik berdasarkan `(name, professionGroupId)`.

### EmployeeRank

Pangkat/golongan pegawai.

### Workplace

Unit kerja/lokasi kerja pegawai.

### EmployeeCareerHistory

Riwayat mutasi jabatan/pangkat/status/unit kerja pegawai.

Aturan:
- Setiap perubahan jabatan/status kepegawaian harus menambah baris baru.
- `effectiveDate` wajib.
- `endDate` optional.
- Current assignment di `Employee` ikut diperbarui saat mutasi.

## 3. Document Entities

### DocumentType

Master jenis dokumen.

Field penting:
- `code`: kode unik dokumen.
- `name`: nama dokumen.
- `archiveCategory`: `PERSONAL`, `EDUCATION`, `EMPLOYMENT`, `CERTIFICATION`, `LEGAL`.
- `isMandatory`: apakah wajib untuk compliance.
- `allowMultiple`: apakah boleh banyak snapshot current.
- `requiresExpiryDate`, `requiresIssueDate`, `requiresDocumentNumber`.
- `allowedFormats`, `maxSizeMb`.
- `deletedAt`: soft delete.

### DocumentType Target Relations

Tabel relasi target dokumen:
- `DocumentTypeProfessionGroup`
- `DocumentTypeEmploymentStatus`
- `DocumentTypeEmployeeGroup`
- `DocumentTypeEmployeeRank`
- `DocumentTypeWorkplace`

Aturan matching:
- Dalam kategori target yang sama: OR.
- Antar kategori target: AND.
- Jika satu kategori target tidak punya baris, kategori tersebut dianggap berlaku untuk semua pegawai.

### DocumentRecord

File dokumen yang diunggah pegawai.

Field penting:
- `ownerId`: relasi ke `Employee` pemilik dokumen.
- `documentTypeId`: jenis dokumen.
- `status`: `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`, `REPLACED`.
- `isCurrent`: apakah snapshot current.
- `allowMultipleSnapshot`: snapshot dari `DocumentType.allowMultiple`, diisi trigger DB.
- metadata file: `fileName`, `filePath`, `fileSize`, `mimeType`, `fileHash`, `storageProvider`.
- metadata dokumen: `documentNumber`, `issueDate`, `expiryDate`.
- reminder: `reminderH30SentAt`, `reminderH7SentAt`, `reminderH1SentAt`.
- `deletedAt`: soft delete.

Database constraint penting:
- `uniq_current_document_per_type` memastikan hanya satu current document per owner + type jika `allowMultipleSnapshot = false`.
- Trigger `handle_document_replacement()` otomatis menandai dokumen lama sebagai `REPLACED` dan `isCurrent = false`.

### VerificationHistory

Riwayat verifikasi untuk `DocumentRecord`.

Aturan:
- Setiap approve/reject wajib menambah baris.
- Reject wajib punya `reviewNote`.

## 4. Notification, Audit, Settings

### Notification

Notifikasi in-app per user.

Field penting:
- `userId`
- `type`
- `title`
- `message`
- `isRead`
- `relatedEntityType`
- `relatedEntityId`

### SecurityLog

Audit trail append-only.

Field penting:
- `timestamp`
- `actorId`, `actorName`, `actorRole`
- `eventType`
- `resource`
- `ipAddress`
- `status`
- `metadata`

### SystemSetting

Konfigurasi key-value tanpa redeploy.

Key awal:
- `reminder_days_h1`
- `reminder_days_h7`
- `reminder_days_h30`
- `default_max_upload_mb`
- `soft_delete_retention_days`
