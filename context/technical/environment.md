# Environment Variables — SIMDP

**Status:** Draft awal
**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §18.1
**Terakhir diperbarui:** 2026-07-08

Semua environment variable wajib divalidasi saat startup dengan Zod di `src/lib/env.ts`. Modul server-side harus mengimpor `env` dari file ini, bukan membaca `process.env` langsung, kecuali file konfigurasi tooling seperti `prisma.config.ts`.

## Database

| Variable | Required | Keterangan |
|---|:---:|---|
| `DATABASE_URL` | Yes | Supabase pooled connection string untuk runtime dan Prisma 7 config (`prisma.config.ts`). |
| `DIRECT_URL` | Yes | Supabase direct connection untuk SQL migration/manual migration. Belum dipakai langsung oleh Prisma config pada baseline ini. |

## Storage

| Variable | Required | Keterangan |
|---|:---:|---|
| `DEPLOYMENT_CONTEXT` | Yes | `vercel-supabase`, `vps-local`, atau `hybrid`. Default `hybrid`. Dipakai untuk fail-fast konfigurasi backup/deployment. |
| `STORAGE_PROVIDER` | Yes | `local`, `supabase`, atau `s3`. Development default: `local`. |
| `SUPABASE_URL` | Jika supabase | URL project Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Jika supabase | Service role key server-side only. Jangan expose ke client. |
| `SUPABASE_STORAGE_BUCKET` | Jika supabase | Default `employee-documents`. |
| `S3_ENDPOINT` | Optional | Untuk S3-compatible selain AWS. |
| `S3_REGION` | Jika s3 | Region bucket. |
| `S3_BUCKET` | Jika s3 | Nama bucket. |
| `S3_ACCESS_KEY_ID` | Jika s3 | Access key. Secret. |
| `S3_SECRET_ACCESS_KEY` | Jika s3 | Secret key. Secret. |

Catatan Backup & Disaster Recovery:
- Database dan storage harus dibackup sebagai satu paket recovery production. Lihat `context/operations/backup-disaster-recovery.md`.
- Jangan mengandalkan export/import admin sebagai pengganti backup database + storage.
- Jangan simpan backup, dump database, storage archive, atau backup encryption key di repository.
- `STORAGE_PROVIDER` hanya memilih storage dokumen aplikasi. Lokasi artefak backup/offsite dipilih oleh `BACKUP_TARGET`.
- Untuk helper lokal/VPS, `STORAGE_PROVIDER` juga menentukan sumber storage yang diarsipkan: `local` membaca `SIMDP_STORAGE_DIR`, sedangkan `supabase` menarik object dari bucket Supabase sebelum diarsipkan.

## Backup & Recovery

| Variable | Required | Keterangan |
|---|:---:|---|
| `BACKUP_ENABLED` | Yes | `true`/`false`. Default `false`. Saat `true`, env target backup divalidasi fail-fast. |
| `BACKUP_DB_ENABLED` | Yes | `true`/`false`. Default `true`. |
| `BACKUP_STORAGE_ENABLED` | Yes | `true`/`false`. Default `true`. |
| `BACKUP_ENCRYPTION_ENABLED` | Yes | `true`/`false`. Default `false`. Production local target wajib dienkripsi sebelum offsite. |
| `BACKUP_TARGET` | Yes | `gdrive` untuk target production utama; `local`/`folder` untuk VPS/local; `s3` opsi terakhir/future. Berbeda dari `STORAGE_PROVIDER`. |
| `BACKUP_LOCAL_DIR` | Jika `BACKUP_TARGET=local` | Folder artifact backup lokal. Harus di luar repo. |
| `BACKUP_FOLDER_PATH` | Jika `BACKUP_TARGET=folder` | Mounted folder/NAS/offline path. Harus di luar repo. |
| `BACKUP_RETENTION_DAILY_DAYS` | Optional | Default `14`. |
| `BACKUP_RETENTION_WEEKLY_DAYS` | Optional | Default `56`. |
| `BACKUP_RETENTION_MONTHLY_DAYS` | Optional | Default `365`. |
| `GDRIVE_FOLDER_ID` | Jika `BACKUP_TARGET=gdrive` | Folder tujuan Google Drive di Shared Drive. Jangan pakai folder My Drive pribadi untuk service account. |
| `GDRIVE_CLIENT_EMAIL` | Jika `BACKUP_TARGET=gdrive` | Service account email. Secret-adjacent, jangan expose client. |
| `GDRIVE_PRIVATE_KEY` | Jika `BACKUP_TARGET=gdrive` | Private key service account dari env. Secret. |

Context guard:

- `DEPLOYMENT_CONTEXT=vercel-supabase` menolak `STORAGE_PROVIDER=local` dan menolak `BACKUP_TARGET=local|folder`; gunakan `BACKUP_TARGET=gdrive` sebagai default production.
- `DEPLOYMENT_CONTEXT=vps-local` mengharapkan `STORAGE_PROVIDER=local`.
- `BACKUP_TARGET=s3` memakai env S3 yang sama untuk credential target backup, tetapi tidak berarti `STORAGE_PROVIDER=s3`; S3 adalah opsi terakhir sampai adapter/job resmi aktif.
- `BACKUP_TARGET=gdrive` harus menunjuk folder di Shared Drive yang dibagikan ke service account backup; My Drive pribadi akan gagal pada service account karena tidak punya storage quota.
- Detail desain dan recovery path ada di `context/operations/backup-recovery-architecture.md`.

## Auth & Security

| Variable | Required | Keterangan |
|---|:---:|---|
| `JWT_SECRET` | Yes | Secret signing access token JWT. |
| `REFRESH_TOKEN_SECRET` | Yes | Secret untuk hashing/derivasi refresh token. |
| `CRON_SECRET` | Yes | Secret untuk endpoint cron internal. |

## Malware Scanning

| Variable | Required | Keterangan |
|---|:---:|---|
| `MALWARE_SCANNER_PROVIDER` | Yes | Provider scanner. Default aman saat ini: `clamav`. |
| `CLAMAV_HOST` | Yes | Host service `clamd`. Default development: `127.0.0.1`. |
| `CLAMAV_PORT` | Yes | Port service `clamd`. Default: `3310`. |
| `CLAMAV_TIMEOUT_MS` | Yes | Timeout scan per file dalam milidetik. Default: `10000`. |

Upload file menerapkan kebijakan **fail closed**: jika ClamAV tidak tersedia, timeout, atau mengembalikan error, file tidak diterima sebagai dokumen aktif dan user diminta mencoba lagi nanti. Magic-byte check tetap berjalan sebelum malware scanning.

Catatan rate limiting:
- `enforceApiRateLimit()` membaca IP dari `x-forwarded-for` lalu fallback ke `x-real-ip`.
- Counter rate limit disimpan di tabel PostgreSQL `RateLimitBucket` agar berlaku global untuk deployment multi-instance yang memakai database yang sama.
- Strategi ini adalah default production awal. Jika traffic naik signifikan, gunakan Redis/Upstash atau limiter di edge/proxy untuk mengurangi write load PostgreSQL tanpa mengubah kontrak helper rate limit.
- Production harus berjalan di belakang trusted proxy/load balancer yang menimpa header IP tersebut, bukan meneruskan nilai spoofed langsung dari client.
- Jika deployment tidak menjamin sanitasi header IP, gunakan store/adapter rate limit di edge/proxy atau tambahkan allowlist trusted proxy sebelum mengandalkan limit per IP.

## Email & App URL

## Google OAuth/OIDC

| Variable | Required | Keterangan |
|---|:---:|---|
| `GOOGLE_CLIENT_ID` | Jika Google login | OAuth client ID dari Google Cloud Console. |
| `GOOGLE_CLIENT_SECRET` | Jika Google login | OAuth client secret, server-side only. |
| `GOOGLE_OAUTH_REDIRECT_URI` | Jika Google login | Callback URI, misalnya `http://localhost:3000/api/v1/auth/google/callback`. |

| Variable | Required | Keterangan |
|---|:---:|---|
| `EMAIL_PROVIDER` | Optional | `noop`, `resend`, atau `smtp`. Default `noop`. |
| `RESEND_API_KEY` | Jika Resend | API key email. |
| `EMAIL_FROM` | Jika Resend/SMTP | Email pengirim. Default contoh development: `onboarding@resend.dev`. |
| `SMTP_HOST` | Jika SMTP | Host SMTP, misalnya `smtp.gmail.com`. |
| `SMTP_PORT` | Jika SMTP | Port SMTP, misalnya `587`. |
| `SMTP_SECURE` | Jika SMTP | `true` untuk port 465, `false` untuk port 587/STARTTLS. |
| `SMTP_USER` | Jika SMTP | Username SMTP. Untuk Gmail biasanya alamat Gmail. |
| `SMTP_PASS` | Jika SMTP | Password SMTP/App Password. Secret. |
| `NEXT_PUBLIC_APP_URL` | Yes | URL aplikasi untuk link email. Public, boleh prefix `NEXT_PUBLIC_`. |

Email provider selection:
- `EMAIL_PROVIDER=noop` tidak mengirim email keluar dan hanya menulis warning development.
- `EMAIL_PROVIDER=resend` memakai Resend jika `RESEND_API_KEY` dan `EMAIL_FROM` terisi; jika tidak lengkap, fallback aman ke Noop.
- `EMAIL_PROVIDER=smtp` memakai SMTP jika `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, dan `EMAIL_FROM` terisi; jika tidak lengkap, fallback aman ke Noop.
- Untuk Gmail SMTP, gunakan Google App Password, bukan password akun biasa.

Forgot password:
- Link reset password dibentuk dari `NEXT_PUBLIC_APP_URL` + `/reset-password?token=<raw-token>`.
- Raw token hanya dikirim lewat provider email dan tidak disimpan di database atau audit log.
- Jika delivery email gagal, token reset yang baru dibuat langsung di-invalidasi dan response publik tetap generik.

## Realtime / Pusher

| Variable | Required | Keterangan |
|---|:---:|---|
| `PUSHER_APP_ID` | Jika Pusher | App ID Pusher server. |
| `PUSHER_KEY` | Jika Pusher | Key Pusher server. |
| `PUSHER_SECRET` | Jika Pusher | Secret Pusher server. |
| `PUSHER_CLUSTER` | Jika Pusher | Cluster Pusher server. |
| `NEXT_PUBLIC_PUSHER_KEY` | Jika Pusher | Key Pusher client. |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Jika Pusher | Cluster Pusher client. |

## Background Job / Inngest

| Variable | Required | Keterangan |
|---|:---:|---|
| `INNGEST_EVENT_KEY` | Jika Inngest | Event key untuk mengirim event ke Inngest Cloud. |
| `INNGEST_SIGNING_KEY` | Jika Inngest | Signing key untuk memverifikasi request dari Inngest. |

## Contoh Development

```env
DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/postgres"
STORAGE_PROVIDER="local"
JWT_SECRET="dev-change-me"
REFRESH_TOKEN_SECRET="dev-change-me-too"
CRON_SECRET="dev-cron-secret"
MALWARE_SCANNER_PROVIDER="clamav"
CLAMAV_HOST="127.0.0.1"
CLAMAV_PORT="3310"
CLAMAV_TIMEOUT_MS="10000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DEPLOYMENT_CONTEXT="hybrid"
BACKUP_ENABLED="false"
BACKUP_DB_ENABLED="true"
BACKUP_STORAGE_ENABLED="true"
BACKUP_ENCRYPTION_ENABLED="false"
BACKUP_TARGET="local"
BACKUP_RETENTION_DAILY_DAYS="14"
BACKUP_RETENTION_WEEKLY_DAYS="56"
BACKUP_RETENTION_MONTHLY_DAYS="365"
```

## Larangan

- Jangan commit `.env`, `.env.local`, `.env.production`.
- Jangan expose service role key ke client.
- Jangan prefix secret dengan `NEXT_PUBLIC_`.
- Jangan tulis secret asli di dokumentasi, issue, PR, log, atau `SecurityLog.metadata`.

## File Contoh

Gunakan `.env.example` untuk nama variable dan nilai development dummy. Jangan commit nilai secret asli.

## Pola Pemakaian

- Server-side code: `import { env } from "@/lib/env"`.
- Prisma runtime: `src/lib/prisma.ts` memakai `env.DATABASE_URL` dan Prisma PostgreSQL adapter.
- Client-side code hanya boleh membaca variable berawalan `NEXT_PUBLIC_`; jangan import `src/lib/env.ts` dari Client Component.
