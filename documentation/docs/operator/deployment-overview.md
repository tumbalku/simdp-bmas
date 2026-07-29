---
title: Deployment Overview
---

# Deployment Overview

SIMDP bisa dijalankan dalam beberapa pola deployment. Pilihan deployment menentukan kombinasi env, storage provider, dan strategi backup.

## Skenario 1: Vercel + Supabase

| Area | Pilihan |
|---|---|
| Runtime app | Vercel |
| Database | Supabase PostgreSQL |
| Storage dokumen | Supabase Storage |
| Backup database | Supabase backup atau worker eksternal |
| Backup storage | Worker eksternal ke Google Drive/folder/S3 |

Env penting:

```env
DEPLOYMENT_CONTEXT=vercel-supabase
STORAGE_PROVIDER=supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=employee-documents
```

Catatan: filesystem runtime Vercel tidak boleh dipakai sebagai backup target.

## Skenario 2: VPS local

| Area | Pilihan |
|---|---|
| Runtime app | VPS |
| Database | PostgreSQL lokal atau Docker |
| Storage dokumen | Folder lokal |
| Backup | `scripts/backup-local-vps.sh` |
| Offsite | Google Drive/NAS/future S3 |

Env penting:

```env
DEPLOYMENT_CONTEXT=vps-local
STORAGE_PROVIDER=local
BACKUP_TARGET=folder
BACKUP_FOLDER_PATH=/var/backups/simdp
```

## Skenario 3: Hybrid

Hybrid dipakai saat app berjalan di satu tempat tetapi database/storage berada di provider lain. Contoh:

- app local/VPS menarik database Supabase;
- backup worker local menarik Supabase Storage ke folder lokal;
- app Vercel memakai Supabase, tetapi backup dijalankan dari laptop/operator/VPS.

Env:

```env
DEPLOYMENT_CONTEXT=hybrid
```

## Checklist deployment

- Database production tersedia dan migration sesuai.
- Storage provider production terisi.
- Secret disimpan di secret manager/platform env, bukan repo.
- `NEXT_PUBLIC_APP_URL` sesuai domain production.
- `CRON_SECRET` kuat dan hanya diketahui operator.
- Malware scanning diputuskan: ClamAV aktif atau noop dengan risiko disetujui.
- Backup database dan storage aktif.
- Restore drill minimal pernah dilakukan.
- Admin account awal dibuat dengan password kuat.

## Quality gate sebelum release

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run docs:build
```
