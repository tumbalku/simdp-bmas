# Backup & Recovery Architecture - SIMDP

**Status:** Implementasi awal provider-agnostic
**Issue:** #237
**Terakhir diperbarui:** 2026-07-27

Dokumen ini menjelaskan desain backup/recovery SIMDP yang dipilih dari environment variable. Backup destination sengaja dipisah dari storage dokumen aplikasi.

## 1. Desain arsitektur

```txt
Document upload/download
  -> IStorageProvider
  -> STORAGE_PROVIDER=local|supabase|s3

Backup/recovery job
  -> pg_dump atau platform database backup
  -> export/sync storage dokumen
  -> manifest + checksum + metadata
  -> IBackupTarget
  -> BACKUP_TARGET=local|folder|gdrive|s3
```

Prinsip utama:

- `IStorageProvider` hanya untuk file dokumen aplikasi.
- `IBackupTarget` hanya untuk lokasi artefak backup.
- `STORAGE_PROVIDER` tidak boleh dipakai sebagai keputusan offsite backup.
- `BACKUP_TARGET` tidak boleh dipakai untuk upload/download dokumen user.
- Semua env tervalidasi di `src/lib/env.ts`.
- Helper kontrak backup berada di `src/lib/backup/index.ts`.

Prioritas target production:

1. `gdrive` sebagai target offsite utama.
2. `folder`/`local` untuk VPS/local, wajib disalin ke lokasi terpisah.
3. `s3` sebagai opsi terakhir/future sampai adapter upload atau job CLI resmi dipilih.

## 2. Kontrak implementasi

Kontrak backup target:

```ts
interface IBackupTarget {
  readonly targetName: "local" | "folder" | "gdrive" | "s3";
  putArtifact(artifact: BackupArtifact): Promise<BackupUploadResult>;
}
```

Implementasi saat ini:

| Target | Status | Catatan |
|---|---|---|
| `local` | Aktif | Menulis artefak ke `BACKUP_LOCAL_DIR`. Cocok untuk dev/drill atau staging lokal. |
| `folder` | Aktif | Menulis artefak ke `BACKUP_FOLDER_PATH`. Cocok untuk mounted backup volume/NAS. |
| `gdrive` | Aktif, target utama | Upload ke Google Drive via service account dan Google Drive REST API. |
| `s3` | Env tervalidasi, adapter upload belum aktif | Opsi terakhir/future. Siap fail-fast sampai SDK/SigV4 resmi ditambahkan. Untuk production S3, gunakan job offsite provider/CLI yang dikelola operator atau buat issue adapter S3. |

## 3. Env umum

| Env | Nilai | Keterangan |
|---|---|---|
| `DEPLOYMENT_CONTEXT` | `vercel-supabase`, `vps-local`, `hybrid` | Menentukan guard deployment. |
| `STORAGE_PROVIDER` | `local`, `supabase`, `s3` | Provider dokumen aplikasi. Bukan backup destination. |
| `BACKUP_ENABLED` | `true`/`false` | Mengaktifkan validasi backup target. Default `false`. |
| `BACKUP_DB_ENABLED` | `true`/`false` | Backup database dibuat oleh job/platform. Default `true`. |
| `BACKUP_STORAGE_ENABLED` | `true`/`false` | Backup storage dokumen dibuat oleh job/platform. Default `true`. |
| `BACKUP_ENCRYPTION_ENABLED` | `true`/`false` | Menandai artefak backup harus terenkripsi sebelum keluar dari host. |
| `BACKUP_TARGET` | `local`, `folder`, `gdrive`, `s3` | Destination artefak backup/offsite. |
| `BACKUP_RETENTION_DAILY_DAYS` | integer | Default 14. |
| `BACKUP_RETENTION_WEEKLY_DAYS` | integer | Default 56. |
| `BACKUP_RETENTION_MONTHLY_DAYS` | integer | Default 365. |

## 4. Env per context

| Context | Database source | Storage source | Backup destination | Recovery path | Env wajib |
|---|---|---|---|---|---|
| `vercel-supabase` | Supabase PostgreSQL/platform backup atau `pg_dump` dari job eksternal | Supabase Storage/S3 | `gdrive` utama, `s3` fallback terakhir | Restore DB ke Supabase/temp DB, restore bucket dari artefak offsite, arahkan app ke env restore | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `BACKUP_TARGET=gdrive`, credential Google Drive |
| `vps-local` | PostgreSQL lokal via `pg_dump` | Folder lokal, default `uploads/` | `folder`/`local`, lalu copy offsite ke `gdrive` jika memungkinkan | Decrypt, `psql` restore, extract archive storage ke path aktif, smoke test | `DATABASE_URL`, `STORAGE_PROVIDER=local`, `BACKUP_LOCAL_DIR`/`BACKUP_FOLDER_PATH`, passphrase encryption production |
| `hybrid` | Sesuai DB aktif | Sesuai `STORAGE_PROVIDER` | Pilih berurutan: `gdrive`, lalu `folder`/`local`, lalu `s3` | Ikuti manifest backup untuk DB/storage yang cocok | Env provider aktif + env target backup |

## 5. Google Drive target

Gunakan service account khusus backup dengan akses hanya ke folder backup di **Shared Drive**, bukan My Drive pribadi. Service account tidak punya storage quota sendiri, jadi target backup Google Drive harus berada di shared drive atau memakai OAuth delegation.

Env wajib:

```env
BACKUP_ENABLED=true
BACKUP_TARGET=gdrive
GDRIVE_FOLDER_ID=...
GDRIVE_CLIENT_EMAIL=...
GDRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

`GDRIVE_PRIVATE_KEY` dibaca dari env dan newline escaped `\n` dinormalisasi di runtime. Jangan tulis key asli ke repo, issue, log, atau manifest.

Checklist Drive:

1. Buat Shared Drive khusus backup, misalnya `SIMDP Backup Production`.
2. Tambahkan service account sebagai member dengan akses minimal `Content manager` atau setara yang diizinkan organisasi.
3. Buat folder backup di dalam Shared Drive tersebut.
4. Ambil `GDRIVE_FOLDER_ID` dari folder itu.

## 6. Flow backup

1. Scheduler eksternal memulai job backup.
2. Job membaca env dan fail-fast jika context tidak cocok.
3. Jika `BACKUP_DB_ENABLED=true`, job membuat dump database atau mengambil artifact platform backup.
4. Jika `BACKUP_STORAGE_ENABLED=true`, job membuat archive/sync storage dokumen.
5. Job membuat manifest berisi timestamp, daftar artifact, byte size, SHA-256, context, provider, dan target.
6. Jika enkripsi aktif, artifact dienkripsi sebelum dikirim offsite.
7. Job mengirim artifact dan manifest ke `IBackupTarget`.
8. Job menjalankan retention/prune sesuai target.
9. Alert dikirim jika ada tahap gagal.

## 7. Flow recovery

1. Pilih manifest backup dengan timestamp paling cocok terhadap incident.
2. Download artifact dari backup target.
3. Validasi SHA-256 semua artifact terhadap manifest.
4. Decrypt jika artifact berakhiran `.enc`.
5. Restore database ke environment sementara lebih dulu.
6. Restore storage dokumen ke folder/bucket restore.
7. Arahkan app restore ke DB/storage restore.
8. Jalankan smoke test: login admin, buka data pegawai, stream/download dokumen, cek security log.
9. Jika PASS, operator memutuskan cutover.

Runbook detail ada di `context/operations/backup-disaster-recovery.md`.

## 8. Risiko dan batasan

- Adapter upload `BACKUP_TARGET=s3` belum aktif di kode aplikasi; S3 diposisikan sebagai opsi terakhir/future dan env sudah divalidasi agar production tidak salah credential saat adapter ditambahkan.
- Backup database Supabase paling aman tetap memakai fitur/platform Supabase atau job eksternal yang punya akses `pg_dump`, bukan runtime Vercel.
- Vercel tidak punya filesystem persisten, sehingga local/folder target ditolak untuk `DEPLOYMENT_CONTEXT=vercel-supabase`.
- Backup terenkripsi membutuhkan manajemen key di luar repo. Kehilangan key sama dengan kehilangan kemampuan restore.
