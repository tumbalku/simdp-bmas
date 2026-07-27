# Local/VPS Backup Automation — SIMDP

**Issue:** #237  
**Target:** deployment lokal/VPS dengan PostgreSQL dan folder storage lokal.  
**Script:** `scripts/backup-local-vps.sh`

Dokumen ini adalah panduan operasional untuk menjalankan backup otomatis SIMDP di server lokal/VPS. Script ini bukan fitur web app dan tidak boleh dijalankan dari browser/admin UI.

## 1. Apa yang dibackup

Script `scripts/backup-local-vps.sh` membuat dua artefak:

1. **Database PostgreSQL** via `pg_dump`.
2. **Folder storage dokumen** via `tar.gz`, default dari folder `uploads/`.

Script juga membuat manifest berisi timestamp, lokasi artefak, ukuran file, SHA-256 checksum, dan status enkripsi.

## 2. Requirement server

Command yang dibutuhkan:

- `bash`
- `pg_dump`
- `gzip`
- `tar`
- `find`
- `openssl` jika backup dienkripsi
- `sha256sum` atau `shasum` untuk checksum

Di production, backup harus dienkripsi dan disalin ke lokasi offsite.

## 3. Environment variable

| Variable | Wajib | Keterangan |
|---|:---:|---|
| `DATABASE_URL` | Ya | Connection string PostgreSQL. Jangan dicetak ke log. |
| `SIMDP_BACKUP_DIR` | Ya | Folder tujuan backup. Harus di luar repository. |
| `SIMDP_BACKUP_ENCRYPTION_PASSPHRASE_FILE` | Production | File berisi passphrase enkripsi. Jangan commit. |
| `SIMDP_STORAGE_DIR` | Tidak | Folder storage. Default: `<repo>/uploads`. |
| `SIMDP_BACKUP_ALLOW_UNENCRYPTED` | Local only | Set `true` hanya untuk tes lokal tanpa enkripsi. |
| `SIMDP_BACKUP_RETENTION_DAILY_DAYS` | Tidak | Default `14`. |
| `SIMDP_BACKUP_RETENTION_WEEKLY_DAYS` | Tidak | Default `56`. |
| `SIMDP_BACKUP_RETENTION_MONTHLY_DAYS` | Tidak | Default `365`. |

## 4. Contoh dry-run

Dry-run hanya menampilkan konfigurasi dan command yang tersedia. Tidak membuat backup.

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/simdp" \
SIMDP_BACKUP_DIR="/var/backups/simdp" \
SIMDP_STORAGE_DIR="/srv/simdp/uploads" \
SIMDP_BACKUP_ENCRYPTION_PASSPHRASE_FILE="/etc/simdp/backup-passphrase" \
bash scripts/backup-local-vps.sh dry-run
```

## 5. Contoh backup production

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/simdp" \
SIMDP_BACKUP_DIR="/var/backups/simdp" \
SIMDP_STORAGE_DIR="/srv/simdp/uploads" \
SIMDP_BACKUP_ENCRYPTION_PASSPHRASE_FILE="/etc/simdp/backup-passphrase" \
bash scripts/backup-local-vps.sh create
```

Output contoh:

```txt
/var/backups/simdp/daily/simdp-db_20260727_020000.sql.gz.enc
/var/backups/simdp/daily/simdp-storage_20260727_020000.tar.gz.enc
/var/backups/simdp/daily/manifest_20260727_020000.txt
```

## 6. Contoh tes lokal tanpa enkripsi

Gunakan hanya untuk mengetes script di laptop/dev server.

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/simdp" \
SIMDP_BACKUP_DIR="$HOME/simdp-backups" \
SIMDP_BACKUP_ALLOW_UNENCRYPTED=true \
bash scripts/backup-local-vps.sh create
```

Jangan gunakan `SIMDP_BACKUP_ALLOW_UNENCRYPTED=true` untuk production.

## 7. Prune backup lama

Script bisa menghapus artefak backup yang lebih lama dari retention:

```bash
SIMDP_BACKUP_DIR="/var/backups/simdp" \
bash scripts/backup-local-vps.sh prune
```

Default retention:

- daily: 14 hari;
- weekly: 56 hari;
- monthly: 365 hari.

## 8. Jadwal cron contoh

Contoh menjalankan backup setiap hari jam 02:00 dan prune jam 03:00:

```cron
0 2 * * * DATABASE_URL='postgresql://user:password@localhost:5432/simdp' SIMDP_BACKUP_DIR='/var/backups/simdp' SIMDP_STORAGE_DIR='/srv/simdp/uploads' SIMDP_BACKUP_ENCRYPTION_PASSPHRASE_FILE='/etc/simdp/backup-passphrase' /bin/bash /srv/simdp/scripts/backup-local-vps.sh create >> /var/log/simdp-backup.log 2>&1
0 3 * * * SIMDP_BACKUP_DIR='/var/backups/simdp' /bin/bash /srv/simdp/scripts/backup-local-vps.sh prune >> /var/log/simdp-backup.log 2>&1
```

Untuk production nyata, lebih aman letakkan env di file root-only seperti `/etc/simdp/backup.env`, lalu source file itu dari wrapper cron yang permission-nya dibatasi.

## 9. Offsite copy

Backup di `/var/backups/simdp` masih berada di server yang sama. Production wajib menyalin backup ke lokasi terpisah, misalnya:

- object storage terpisah;
- server backup internal;
- bucket S3-compatible khusus backup;
- backup service yang dikelola operator.

Offsite copy harus menjaga enkripsi dan tidak boleh menyimpan passphrase bersama artefak backup.

## 10. Cara restore singkat

Restore harus mengikuti runbook utama di:

```txt
context/operations/backup-disaster-recovery.md
```

Ringkasnya:

1. Pilih manifest database dan storage dengan timestamp yang cocok.
2. Decrypt artefak jika `.enc`.
3. Restore database ke DB sementara lebih dulu.
4. Extract storage ke folder/bucket restore.
5. Arahkan app restore ke DB/storage tersebut.
6. Jalankan restore drill checklist.
7. Catat hasil drill memakai `context/operations/restore-drill-template.md`.

## 11. Larangan

- Jangan commit backup file.
- Jangan commit passphrase file.
- Jangan simpan backup di folder publik Next.js.
- Jangan taruh `SIMDP_BACKUP_DIR` di dalam repository.
- Jangan jadikan admin export/import sebagai satu-satunya backup.
