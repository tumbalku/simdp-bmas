---
title: Local/VPS Backup
---

# Local/VPS Backup

Helper:

```txt
scripts/backup-local-vps.sh
```

Script ini membuat:

- dump database PostgreSQL;
- archive storage dokumen;
- manifest berisi checksum, ukuran, timestamp, dan status enkripsi.

## Requirement

- `bash`
- `gzip`
- `tar`
- `find`
- `pg_dump` atau Docker
- `openssl` jika backup terenkripsi
- `sha256sum` atau `shasum`

Jika `STORAGE_PROVIDER=supabase`, script butuh akses jaringan ke Supabase REST API.

## Backup local tanpa enkripsi

Hanya untuk drill/dev:

```bash
BACKUP_DATABASE_URL="postgresql://user:password@host:5432/postgres" \
BACKUP_DB_DUMP_PROVIDER="docker-image" \
BACKUP_DB_DOCKER_IMAGE="postgres:17-alpine" \
BACKUP_TARGET="local" \
BACKUP_LOCAL_DIR="/c/Users/Arsi/Downloads/simdp-backup" \
STORAGE_PROVIDER="supabase" \
SUPABASE_URL="https://xxxxx.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="replace_with_secret_key" \
SUPABASE_STORAGE_BUCKET="employee-documents" \
SIMDP_BACKUP_ALLOW_UNENCRYPTED=true \
bash scripts/backup-local-vps.sh create
```

## Backup production

Production harus terenkripsi:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/simdp" \
BACKUP_TARGET="folder" \
BACKUP_FOLDER_PATH="/var/backups/simdp" \
STORAGE_PROVIDER="local" \
SIMDP_STORAGE_DIR="/srv/simdp/uploads" \
SIMDP_BACKUP_ENCRYPTION_PASSPHRASE_FILE="/etc/simdp/backup-passphrase" \
bash scripts/backup-local-vps.sh create
```

## Prune retention

```bash
BACKUP_TARGET="folder" \
BACKUP_FOLDER_PATH="/var/backups/simdp" \
bash scripts/backup-local-vps.sh prune
```

## Output

```txt
daily/
  manifest_YYYYMMDD_HHmmSS.txt
  simdp-db_YYYYMMDD_HHmmSS.sql.gz
  simdp-storage_YYYYMMDD_HHmmSS.tar.gz
```

Jika enkripsi aktif, artifact menjadi `.enc`.

## Catatan keamanan

- Jangan simpan backup di dalam repository.
- Jangan commit backup artifact.
- Jangan commit passphrase.
- Jangan simpan passphrase bersama artifact backup.
- Salin artifact production ke offsite setelah backup lokal berhasil.
