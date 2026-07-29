---
title: Database
---

# Database

SIMDP memakai PostgreSQL dengan Prisma 7. Baseline schema berasal dari `dms_pegawai_schema.sql`, lalu direpresentasikan di `prisma/schema.prisma`.

## Kelompok tabel

| Kelompok | Tabel utama |
|---|---|
| Auth | `User`, `RefreshToken`, `PasswordResetToken` |
| Pegawai | `Employee`, `EmployeeCareerHistory` |
| Master data | `EmploymentStatus`, `EmployeeGroup`, `ProfessionGroup`, `EmployeePosition`, `EmployeeRank`, `Workplace` |
| Dokumen | `DocumentType`, `DocumentRecord`, target relation tables |
| Verifikasi | `VerificationHistory`, `DocumentVerification` |
| Sistem | `Notification`, `SecurityLog`, `SystemSetting`, `RateLimitBucket` |

## Enum utama

| Enum | Nilai |
|---|---|
| `Role` | `ADMIN`, `STAFF`, `EMPLOYEE` |
| `DocumentStatus` | `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`, `REPLACED` |
| `ArchiveCategory` | `PERSONAL`, `EDUCATION`, `EMPLOYMENT`, `CERTIFICATION`, `LEGAL` |
| `StorageProvider` | `LOCAL`, `SUPABASE`, `S3` |
| `SecurityLogStatus` | `SUCCESS`, `FAILED` |

Nilai enum database memakai bahasa Inggris. Label Bahasa Indonesia ditangani di UI atau mapping domain.

## Constraint penting

`Employee` harus memiliki minimal satu identifier:

```txt
employeeId atau nik wajib ada
```

`DocumentRecord` memiliki partial unique index untuk membatasi satu current document per jenis dokumen non-multiple:

```sql
CREATE UNIQUE INDEX uniq_current_document_per_type
ON "DocumentRecord" ("ownerId", "documentTypeId")
WHERE "isCurrent" = true AND "allowMultipleSnapshot" = false;
```

## Trigger penting

`handle_document_replacement()` berjalan sebelum insert `DocumentRecord`.

Tugasnya:

- mengisi `allowMultipleSnapshot` dari `DocumentType.allowMultiple`;
- jika document type tidak multiple, dokumen current lama otomatis menjadi `REPLACED` dan `isCurrent = false`.

`set_updated_at()` mengisi `updatedAt` pada tabel yang mendukung timestamp update.

## Prisma runtime

Prisma Client hanya dibuat melalui singleton:

```ts
import { prisma } from "@/lib/prisma";
```

Jangan membuat Prisma Client instance baru di modul lain. Jangan import Prisma Client dari Client Component.

## Validasi schema

```bash
npm run prisma:format
npm run prisma:validate
npm run prisma:generate
```

## Catatan migration

Prisma belum merepresentasikan semua kemampuan PostgreSQL seperti CHECK constraint, partial unique index, dan trigger. Karena itu migration SQL tetap harus menjaga constraint/trigger yang tidak bisa diekspresikan penuh oleh Prisma schema.
