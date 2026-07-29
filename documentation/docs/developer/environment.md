---
title: Environment
---

# Environment

Semua environment variable server-side divalidasi di `src/lib/env.ts` menggunakan Zod. Server code harus mengimpor `env` dari file tersebut, bukan menyebar akses `process.env.*`.

## Template env

| File | Kapan dipakai |
|---|---|
| `.env.example` | Index lengkap semua variable dan penjelasan. |
| `.env.local.example` | Development lokal dengan storage local. |
| `.env.supabase.example` | App memakai Supabase database dan Supabase Storage. |
| `.env.backup-supabase.example` | Backup worker yang menarik database/storage Supabase ke local folder. |
| `.env.vps-local.example` | VPS dengan PostgreSQL dan storage local. |
| `.env.restore-local.example` | Restore drill ke database/folder sementara. |

## Variable wajib minimum

```env
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
REFRESH_TOKEN_SECRET=
CRON_SECRET=
NEXT_PUBLIC_APP_URL=
```

## Storage

```env
STORAGE_PROVIDER=local
```

Pilihan:

- `local`
- `supabase`
- `s3`

Jika `STORAGE_PROVIDER=supabase`, isi:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=employee-documents
```

Service role key hanya untuk server. Jangan gunakan prefix `NEXT_PUBLIC_`.

## Backup

Backup dikontrol oleh variable:

```env
BACKUP_ENABLED=false
BACKUP_DB_ENABLED=true
BACKUP_STORAGE_ENABLED=true
BACKUP_TARGET=local
BACKUP_LOCAL_DIR=
BACKUP_FOLDER_PATH=
```

`BACKUP_TARGET` bukan storage provider aplikasi. Target backup adalah lokasi artifact backup.

## Deployment context

```env
DEPLOYMENT_CONTEXT=hybrid
```

Pilihan:

| Nilai | Arti |
|---|---|
| `vercel-supabase` | Runtime Vercel, database/storage Supabase. Filesystem runtime tidak boleh jadi backup target. |
| `vps-local` | App berjalan di VPS sendiri dengan storage local. |
| `hybrid` | Kombinasi transisi atau development. |

## Larangan

- Jangan commit `.env`.
- Jangan commit secret asli di docs atau example.
- Jangan expose service role key ke client.
- Jangan simpan password/token di `SecurityLog.metadata`.
- Jangan gunakan `SIMDP_BACKUP_ALLOW_UNENCRYPTED=true` untuk production.
