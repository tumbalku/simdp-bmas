---
title: Restore Runbook
---

# Restore Runbook

Helper:

```txt
scripts/restore-local-vps.sh
```

Restore harus dilakukan hati-hati. Database restore dapat menimpa atau konflik dengan data target.

## 1. Pilih backup

Gunakan dry-run:

```bash
RESTORE_BACKUP_DIR="/c/Users/Arsi/Downloads/simdp-backup" \
RESTORE_TIMESTAMP="latest" \
RESTORE_DB_ENABLED=false \
RESTORE_STORAGE_ENABLED=true \
RESTORE_STORAGE_DIR="/c/Users/Arsi/Downloads/simdp-restore-test" \
bash scripts/restore-local-vps.sh dry-run
```

`RESTORE_TIMESTAMP=latest` memilih manifest dengan `timestamp_utc` terbaru.

## 2. Restore storage saja

```bash
RESTORE_BACKUP_DIR="/c/Users/Arsi/Downloads/simdp-backup" \
RESTORE_TIMESTAMP="latest" \
RESTORE_DB_ENABLED=false \
RESTORE_STORAGE_ENABLED=true \
RESTORE_STORAGE_DIR="/c/Users/Arsi/Downloads/simdp-restore-test" \
bash scripts/restore-local-vps.sh restore
```

Archive akan diekstrak ke folder target, biasanya berisi `storage/` atau `uploads/`.

## 3. Restore database ke DB sementara

Contoh via Docker container PostgreSQL:

```bash
RESTORE_BACKUP_DIR="/c/Users/Arsi/Downloads/simdp-backup" \
RESTORE_TIMESTAMP="latest" \
RESTORE_DB_ENABLED=true \
RESTORE_STORAGE_ENABLED=true \
RESTORE_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/simdp_restore" \
RESTORE_DB_TARGET_PROVIDER="docker" \
RESTORE_DB_DOCKER_CONTAINER="sicantik-local-psql" \
RESTORE_CONFIRM="I_UNDERSTAND_RESTORE_OVERWRITES_DATA" \
RESTORE_STORAGE_DIR="/c/Users/Arsi/Downloads/simdp-restore-test" \
bash scripts/restore-local-vps.sh restore
```

Restore database memakai:

```txt
psql -v ON_ERROR_STOP=1
```

Artinya restore berhenti jika ada SQL error.

## 4. Validasi hasil restore

Cek minimal:

- tabel `User` ada;
- tabel `Employee` ada;
- tabel `DocumentRecord` ada;
- jumlah pegawai masuk akal;
- jumlah document record masuk akal;
- file storage bisa dibuka;
- status dokumen dan verification history terbaca;
- SecurityLog tetap ada.

## 5. Cutover production

Cutover hanya dilakukan setelah validasi PASS:

1. Komunikasikan downtime.
2. Freeze upload/edit pada sistem lama.
3. Arahkan env aplikasi ke database/storage restore.
4. Jalankan smoke test.
5. Buka akses user.
6. Catat incident report dan data loss sesuai RPO.
