---
title: Storage and Backup Targets
---

# Storage and Backup Targets

SIMDP memisahkan dua concern:

| Env | Arti |
|---|---|
| `STORAGE_PROVIDER` | Tempat file dokumen aplikasi disimpan dan dibaca saat runtime. |
| `BACKUP_TARGET` | Tempat artifact backup dikirim atau disimpan. |

Jangan mencampur keduanya. Storage dokumen adalah data aktif. Backup target adalah salinan recovery.

## Storage provider aplikasi

| Provider | Kegunaan |
|---|---|
| `local` | Development atau VPS dengan folder lokal. |
| `supabase` | Deployment Vercel/Supabase atau hybrid. |
| `s3` | Future-compatible provider untuk object storage. |

Semua akses file aplikasi harus lewat `IStorageProvider` di `src/lib/storage/`.

## Backup target

| Target | Status | Keterangan |
|---|---|---|
| `gdrive` | Implementasi awal tersedia | Target offsite utama untuk production jika memakai service account dan folder yang valid. |
| `local` | Tersedia | Cocok untuk backup laptop/VPS, harus disalin offsite untuk production. |
| `folder` | Tersedia | Cocok untuk mounted folder, NAS, atau path backup server. |
| `s3` | Validasi env tersedia, adapter future | Opsi terakhir sampai credential dan adapter resmi diputuskan. |

## Prioritas production

1. Google Drive service account sebagai offsite target utama.
2. VPS/local folder sebagai jalur kedua untuk server sendiri, lalu salin offsite.
3. S3/S3-compatible sebagai opsi terakhir/future.

## Kenapa Google Drive pribadi bermasalah

Service account Google Drive tidak otomatis punya storage quota di My Drive pribadi. Untuk production, target yang benar biasanya folder di Shared Drive atau folder yang akses dan kuotanya kompatibel dengan service account. Jika hanya memakai akun Google pribadi tanpa Workspace/Shared Drive, jalur local/VPS backup tetap bermanfaat sebagai opsi kedua.

## Hybrid Supabase + local backup

Skenario yang sudah diuji:

```txt
DATABASE_URL              Supabase PostgreSQL
STORAGE_PROVIDER          supabase
SUPABASE_STORAGE_BUCKET   employee-documents
BACKUP_TARGET             local
BACKUP_LOCAL_DIR          /c/Users/Arsi/Downloads/simdp-backup
BACKUP_DB_DUMP_PROVIDER   docker-image
BACKUP_DB_DOCKER_IMAGE    postgres:17-alpine
```

Worker backup menarik database dan bucket Supabase, lalu menyimpan artifact ke folder lokal.
