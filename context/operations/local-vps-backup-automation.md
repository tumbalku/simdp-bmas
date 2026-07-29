# Local/VPS Backup Automation - SIMDP

**Issue:** #237  
**Target:** deployment lokal/VPS dengan PostgreSQL dan storage dokumen aktif.  
**Script:** `scripts/backup-local-vps.sh`

Dokumen ini adalah panduan operasional untuk menjalankan backup otomatis SIMDP di server lokal/VPS. Script ini bukan fitur web app dan tidak boleh dijalankan dari browser/admin UI.

Sumber storage yang dibackup dipilih lewat `STORAGE_PROVIDER`:

- `local` membaca folder lokal, default `uploads/` atau `SIMDP_STORAGE_DIR`.
- `supabase` menyalin object dari Supabase Storage ke snapshot lokal sementara sebelum diarsipkan.
- `s3` belum didukung oleh helper lokal/VPS ini sebagai sumber storage.

## 1. Apa yang dibackup

Script `scripts/backup-local-vps.sh` membuat dua artefak:

1. **Database PostgreSQL** via `pg_dump`.
2. **Storage dokumen aktif** via `tar.gz`, dari sumber yang dipilih oleh `STORAGE_PROVIDER`.

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

Jika `STORAGE_PROVIDER=supabase`, helper juga butuh akses jaringan keluar untuk Supabase REST API.

Di production, backup harus dienkripsi dan disalin ke lokasi offsite.

## 3. Environment variable

| Variable | Wajib | Keterangan |
|---|:---:|---|
| `DATABASE_URL` | Ya | Connection string PostgreSQL. Jangan dicetak ke log. |
| `BACKUP_DATABASE_URL` | Opsional | URL khusus `pg_dump`, override `DATABASE_URL` hanya untuk backup. Berguna jika `DATABASE_URL` aplikasi punya query parameter Prisma atau memakai port host Docker. |
| `BACKUP_TARGET` | Ya | Gunakan `local` atau `folder` untuk helper ini. |
| `BACKUP_LOCAL_DIR` / `BACKUP_FOLDER_PATH` | Ya | Folder tujuan backup. Harus di luar repository. |
| `BACKUP_DB_DUMP_PROVIDER` | Tidak | `auto`, `local`, `docker`, atau `docker-image`. Default `auto`. |
| `BACKUP_DB_DOCKER_CONTAINER` | Jika provider `docker` | Nama container PostgreSQL, misalnya `sicantik-local-psql`. |
| `BACKUP_DB_DOCKER_IMAGE` | Jika provider `docker-image` | Image PostgreSQL client untuk `pg_dump`, misalnya `postgres:17-alpine`. |
| `STORAGE_PROVIDER` | Ya | `local` atau `supabase` untuk helper ini. Menentukan sumber storage yang diarsipkan. |
| `SIMDP_STORAGE_DIR` | Jika `STORAGE_PROVIDER=local` | Folder storage lokal aktif. Default: `<repo>/uploads`. |
| `SUPABASE_URL` | Jika `STORAGE_PROVIDER=supabase` | URL project Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Jika `STORAGE_PROVIDER=supabase` | Service role key server-side only. |
| `SUPABASE_STORAGE_BUCKET` | Jika `STORAGE_PROVIDER=supabase` | Nama bucket storage yang diarsipkan. Default: `employee-documents`. |
| `SIMDP_BACKUP_ENCRYPTION_PASSPHRASE_FILE` | Production | File berisi passphrase enkripsi. Jangan commit. |
| `SIMDP_BACKUP_DIR` | Tidak | Alias lama untuk `BACKUP_LOCAL_DIR`, hanya untuk transisi. |
| `SIMDP_BACKUP_ALLOW_UNENCRYPTED` | Local only | Set `true` hanya untuk tes lokal tanpa enkripsi. |
| `BACKUP_RETENTION_DAILY_DAYS` | Tidak | Default `14`. |
| `BACKUP_RETENTION_WEEKLY_DAYS` | Tidak | Default `56`. |
| `BACKUP_RETENTION_MONTHLY_DAYS` | Tidak | Default `365`. |

## 4. Contoh dry-run

Dry-run hanya menampilkan konfigurasi dan command yang tersedia. Tidak membuat backup.

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/simdp" \
BACKUP_TARGET="folder" \
BACKUP_FOLDER_PATH="/var/backups/simdp" \
STORAGE_PROVIDER="local" \
SIMDP_STORAGE_DIR="/srv/simdp/uploads" \
SIMDP_BACKUP_ENCRYPTION_PASSPHRASE_FILE="/etc/simdp/backup-passphrase" \
bash scripts/backup-local-vps.sh dry-run
```

## 5. Contoh backup production

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/simdp" \
BACKUP_TARGET="folder" \
BACKUP_FOLDER_PATH="/var/backups/simdp" \
STORAGE_PROVIDER="local" \
SIMDP_STORAGE_DIR="/srv/simdp/uploads" \
SIMDP_BACKUP_ENCRYPTION_PASSPHRASE_FILE="/etc/simdp/backup-passphrase" \
bash scripts/backup-local-vps.sh create
```

Contoh kalau storage aktifnya Supabase:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/simdp" \
BACKUP_TARGET="folder" \
BACKUP_FOLDER_PATH="/var/backups/simdp" \
STORAGE_PROVIDER="supabase" \
SUPABASE_URL="https://xxxx.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="..." \
SUPABASE_STORAGE_BUCKET="employee-documents" \
SIMDP_BACKUP_ENCRYPTION_PASSPHRASE_FILE="/etc/simdp/backup-passphrase" \
bash scripts/backup-local-vps.sh create
```

Contoh kalau database PostgreSQL berjalan di Docker:

```bash
BACKUP_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/simdp" \
BACKUP_DB_DUMP_PROVIDER="docker" \
BACKUP_DB_DOCKER_CONTAINER="sicantik-local-psql" \
BACKUP_TARGET="local" \
BACKUP_LOCAL_DIR="/mnt/c/Users/Arsi/Downloads/simdp-backup" \
STORAGE_PROVIDER="local" \
SIMDP_STORAGE_DIR="/mnt/d/Real Work/Website/Final Project/SIMDP/uploads" \
SIMDP_BACKUP_ALLOW_UNENCRYPTED=true \
bash scripts/backup-local-vps.sh create
```

Catatan Docker: `BACKUP_DATABASE_URL` di atas dilihat dari dalam container PostgreSQL, jadi port-nya memakai `5432`, bukan port host seperti `55432`.

Contoh kalau database sumber ada di Supabase PostgreSQL 17:

```bash
BACKUP_DATABASE_URL="postgresql://postgres.xxxxx:password@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres" \
BACKUP_DB_DUMP_PROVIDER="docker-image" \
BACKUP_DB_DOCKER_IMAGE="postgres:17-alpine" \
BACKUP_TARGET="local" \
BACKUP_LOCAL_DIR="/mnt/c/Users/Arsi/Downloads/simdp-backup" \
STORAGE_PROVIDER="supabase" \
SUPABASE_URL="https://xxxxx.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="sb_secret_..." \
SUPABASE_STORAGE_BUCKET="employee-documents" \
SIMDP_BACKUP_ALLOW_UNENCRYPTED=true \
bash scripts/backup-local-vps.sh create
```

Gunakan image PostgreSQL dengan major version yang sama atau lebih baru dari database server. Jika server Supabase memakai PostgreSQL 17, pakai `postgres:17-alpine`.

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
BACKUP_TARGET="local" \
BACKUP_LOCAL_DIR="$HOME/simdp-backups" \
STORAGE_PROVIDER="local" \
SIMDP_BACKUP_ALLOW_UNENCRYPTED=true \
bash scripts/backup-local-vps.sh create
```

Jangan gunakan `SIMDP_BACKUP_ALLOW_UNENCRYPTED=true` untuk production.

## 7. Prune backup lama

Script bisa menghapus artefak backup yang lebih lama dari retention:

```bash
BACKUP_TARGET="folder" \
BACKUP_FOLDER_PATH="/var/backups/simdp" \
bash scripts/backup-local-vps.sh prune
```

Default retention:

- daily: 14 hari;
- weekly: 56 hari;
- monthly: 365 hari.

## 8. Jadwal cron contoh

Contoh menjalankan backup setiap hari jam 02:00 dan prune jam 03:00:

```cron
0 2 * * * DATABASE_URL='postgresql://user:password@localhost:5432/simdp' BACKUP_TARGET='folder' BACKUP_FOLDER_PATH='/var/backups/simdp' STORAGE_PROVIDER='local' SIMDP_STORAGE_DIR='/srv/simdp/uploads' SIMDP_BACKUP_ENCRYPTION_PASSPHRASE_FILE='/etc/simdp/backup-passphrase' /bin/bash /srv/simdp/scripts/backup-local-vps.sh create >> /var/log/simdp-backup.log 2>&1
0 3 * * * BACKUP_TARGET='folder' BACKUP_FOLDER_PATH='/var/backups/simdp' /bin/bash /srv/simdp/scripts/backup-local-vps.sh prune >> /var/log/simdp-backup.log 2>&1
```

Jika storage aktifnya Supabase, gantikan `STORAGE_PROVIDER='local'` menjadi `STORAGE_PROVIDER='supabase'` dan tambahkan `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, serta `SUPABASE_STORAGE_BUCKET` di wrapper cron.

Untuk production nyata, lebih aman letakkan env di file root-only seperti `/etc/simdp/backup.env`, lalu source file itu dari wrapper cron yang permission-nya dibatasi.

## 9. Offsite copy

Backup di `/var/backups/simdp` masih berada di server yang sama. Production wajib menyalin backup terenkripsi ke lokasi terpisah. Urutan target yang diprioritaskan:

- Google Drive folder khusus backup via service account;
- server backup internal/NAS RSUD;
- bucket S3-compatible khusus backup sebagai opsi terakhir;
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

Helper awal restore tersedia di:

```txt
scripts/restore-local-vps.sh
```

Perilaku helper restore:

- `RESTORE_TIMESTAMP=latest` memilih manifest dengan `timestamp_utc` paling baru dari folder `daily`, `weekly`, dan `monthly`.
- Restore database memakai `psql -v ON_ERROR_STOP=1`, sehingga command berhenti jika ada SQL error.
- Provider database lokal/Docker memakai environment command untuk connection URL, bukan menaruh URL sebagai argumen langsung di command line.
- Skrip shell dijaga dengan `.gitattributes` agar checkout berikutnya memakai LF dan tidak memunculkan error seperti `pipefail\r`.

Contoh cek backup terbaru tanpa menjalankan restore:

```bash
RESTORE_BACKUP_DIR="/mnt/c/Users/Arsi/Downloads/simdp-backup" \
RESTORE_TIMESTAMP="latest" \
RESTORE_DB_ENABLED=false \
RESTORE_STORAGE_ENABLED=true \
RESTORE_STORAGE_DIR="/mnt/c/Users/Arsi/Downloads/simdp-restore-test" \
bash scripts/restore-local-vps.sh dry-run
```

Contoh restore storage saja ke folder terpisah:

```bash
RESTORE_BACKUP_DIR="/mnt/c/Users/Arsi/Downloads/simdp-backup" \
RESTORE_TIMESTAMP="latest" \
RESTORE_DB_ENABLED=false \
RESTORE_STORAGE_ENABLED=true \
RESTORE_STORAGE_DIR="/mnt/c/Users/Arsi/Downloads/simdp-restore-test" \
bash scripts/restore-local-vps.sh restore
```

Contoh full restore via Docker ke database restore:

```bash
RESTORE_BACKUP_DIR="/mnt/c/Users/Arsi/Downloads/simdp-backup" \
RESTORE_TIMESTAMP="latest" \
RESTORE_DB_ENABLED=true \
RESTORE_STORAGE_ENABLED=true \
RESTORE_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/simdp_restore" \
RESTORE_DB_TARGET_PROVIDER="docker" \
RESTORE_DB_DOCKER_CONTAINER="sicantik-local-psql" \
RESTORE_CONFIRM="I_UNDERSTAND_RESTORE_OVERWRITES_DATA" \
RESTORE_STORAGE_DIR="/mnt/c/Users/Arsi/Downloads/simdp-restore-test" \
bash scripts/restore-local-vps.sh restore
```

Catatan penting: full restore sebaiknya diarahkan ke database sementara seperti `simdp_restore`, bukan langsung ke database aktif. Setelah validasi aplikasi PASS, operator baru memutuskan cutover.

## 11. Larangan

- Jangan commit backup file.
- Jangan commit passphrase file.
- Jangan simpan backup di folder publik Next.js.
- Jangan taruh `BACKUP_LOCAL_DIR`, `BACKUP_FOLDER_PATH`, atau alias `SIMDP_BACKUP_DIR` di dalam repository.
- Jangan jadikan admin export/import sebagai satu-satunya backup.
