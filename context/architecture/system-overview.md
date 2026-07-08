# System Overview — SIMDP

**Status:** Draft awal
**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §6.1-6.2
**Terakhir diperbarui:** 2026-07-08

## 1. Gaya Arsitektur

SIMDP memakai gaya **monolit modular**:

- satu aplikasi Next.js untuk frontend dan backend;
- modul fitur dipisah jelas di `src/modules/*`;
- database utama PostgreSQL/Supabase;
- file storage lewat kontrak `IStorageProvider`;
- komunikasi eksternal/internal memakai REST Route Handler dan Server Actions.

Tujuan utamanya: sederhana untuk junior developer, tetapi tetap rapi jika nanti perlu dipisah menjadi microservice.

## 2. Diagram Tingkat Tinggi

```txt
+----------------------------------------------------------+
|                     Client (Browser)                      |
|         Next.js App Router (React Server Components)      |
+----------------------------+------------------------------+
                             | HTTPS
+----------------------------v------------------------------+
|                Next.js App (Vercel - Serverless)          |
|  +----------+ +----------+ +----------+ +------------+    |
|  |   auth   | | employee | | document | |verification|    |
|  +----------+ +----------+ +----------+ +------------+    |
|  +----------+ +----------+ +----------+ +------------+    |
|  |notifi-   | |statistics| | security | |  settings  |    |
|  |cation    | |          | |          | |            |    |
|  +----------+ +----------+ +----------+ +------------+    |
+----------+--------------------------------------------+---+
           | Prisma / SQL                | Storage Provider SDK
+----------v------------------+ +--------v----------------+
|  PostgreSQL (Supabase)       | |  File Storage Provider  |
|                              | |  local / Supabase / S3  |
+------------------------------+ +------------------------+
```

## 3. Komponen Sistem

| Komponen | Tanggung Jawab |
|---|---|
| Browser Client | Render UI, kirim form/action, consume hooks. Tidak fetch langsung dari komponen. |
| Next.js App Router | Routing, Server Components, Route Handlers, Server Actions. |
| Modules | Boundary domain: auth, employee, document, verification, notification, statistics, security, settings. |
| Prisma | Akses database PostgreSQL type-safe. |
| PostgreSQL/Supabase | Source of truth data relasional. |
| Storage Provider | Penyimpanan file dokumen via local/Supabase/S3. |
| Vercel Cron | Memanggil cron expiry/reminder harian. |
| Email Provider | Reset password dan reminder email. |

## 4. Flow Utama

### Auth

```txt
Client -> /api/v1/auth/login -> auth service -> User/RefreshToken -> httpOnly cookies
```

### Upload Dokumen

```txt
Client -> /api/v1/documents/upload -> document service -> IStorageProvider -> DocumentRecord -> SecurityLog
```

### Verifikasi

```txt
Staff/Admin UI -> verifyDocumentAction -> verification service -> DocumentRecord + VerificationHistory + Notification + SecurityLog
```

### Statistik

```txt
Dashboard -> statistics hook/action -> statistics service/repository -> read-only aggregate query
```

## 5. Prinsip Non-negotiable

- Modul lain hanya boleh memanggil `service.ts` suatu modul.
- `repository.ts` tidak boleh diimpor lintas modul.
- File storage hanya lewat `IStorageProvider`.
- `SecurityLog` append-only.
- `statistics` read-only.
- Data soft-deleted disembunyikan dari query normal.
