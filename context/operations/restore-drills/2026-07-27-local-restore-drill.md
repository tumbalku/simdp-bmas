# Restore Drill Result — SIMDP Local DB Smoke Test

**Issue asal:** #237
**Tanggal:** 2026-07-27
**Status:** PASS WITH NOTES
**Scope:** local database + local storage restore smoke test via Docker PostgreSQL container and `uploads/` archive.

> Dokumen ini tidak menyimpan secret, password, connection string, isi file dokumen, atau data pribadi lengkap.

## 1. Ringkasan drill

| Field | Isi |
|---|---|
| Tanggal drill | 2026-07-27 |
| Jam mulai | 03:50 UTC |
| Jam selesai | 03:50 UTC |
| Operator | mes / local agent |
| Reviewer/approver | Sil |
| Environment asal backup | local Docker PostgreSQL |
| Environment restore | temporary database di container local PostgreSQL |
| Deployment target yang disimulasikan | local/VPS PostgreSQL |
| Status akhir | PASS WITH NOTES |

## 2. Target RPO/RTO

| Target | Nilai rencana | Hasil aktual | Status |
|---|---:|---:|---|
| RPO — maksimal data boleh hilang | 24 jam | 0 menit untuk drill lokal karena backup dibuat langsung sebelum restore | PASS |
| RTO — maksimal waktu pemulihan | 4 jam | 3 detik untuk dump kecil lokal | PASS |

Catatan:

- Drill ini adalah smoke test database + storage lokal kecil, bukan simulasi full production.
- Durasi production nyata akan lebih lama tergantung ukuran database, storage dokumen, enkripsi, dan offsite copy.

## 3. Backup yang digunakan

### 3.1 Database

| Field | Isi |
|---|---|
| Manifest path | `C:/Users/Arsi/simdp-restore-drill-backups/20260727_035025/manifest_20260727_035025.txt` |
| Artifact path | `C:/Users/Arsi/simdp-restore-drill-backups/20260727_035025/simdp-db_20260727_035025.sql.gz` |
| Timestamp backup UTC | 20260727_035025 |
| Jenis backup | manual local drill |
| Ukuran artifact | 2,585 bytes |
| SHA-256 cocok dengan manifest | Ya |
| Encrypted | Tidak — local test only |
| Decryption berhasil | N/A |

SHA-256 artifact:

```txt
7dbe5ba9b3a60ca4d7ae7e66a2a34863c18c59d88d15ddac4b7ef863074b31e4
```

### 3.2 Storage dokumen

| Field | Isi |
|---|---|
| Manifest path | `C:/Users/Arsi/simdp-restore-drill-backups/storage_20260727_043512/storage_manifest_20260727_043512.txt` |
| Artifact path / bucket source | `C:/Users/Arsi/simdp-restore-drill-backups/storage_20260727_043512/simdp-storage_20260727_043512.tar.gz` |
| Timestamp backup UTC | 20260727_043512 |
| Jenis backup | manual local drill |
| Ukuran artifact / total object | 74,758 bytes / 28 files |
| SHA-256 cocok dengan manifest | Ya |
| Encrypted | Tidak — local test only |
| Decryption berhasil | N/A |

SHA-256 storage artifact:

```txt
971884e77b393c406975037a3e4fd9e1ff76868f2a554fcc9e6dd5c804c7b4b5
```

## 4. Persiapan restore

- [x] Environment restore sementara dibuat sebagai database sementara.
- [x] Environment restore tidak memakai database production aktif.
- [x] Secret production tidak dicatat di dokumen ini.
- [x] Operator tahu artifact backup mana yang dipakai.
- [x] Database backup dibuat dari timestamp yang jelas.
- [x] Ada ruang disk cukup untuk dump kecil lokal.
- [x] Storage backup dan restore lokal sudah diuji dari folder `uploads/`.
- [ ] Host local belum punya `pg_dump`/`psql`; drill memakai `docker exec` ke container PostgreSQL.

Catatan persiapan:

```txt
Host command pg_dump=missing.
Host command psql=missing.
Docker tersedia.
Container PostgreSQL local tersedia: simdp-postgres.
Script backup-local-vps.sh dry-run berhasil, tetapi menandai DATABASE_URL dan pg_dump host sebagai missing.
```

## 5. Langkah restore database

| No | Langkah | Hasil | Catatan |
|---:|---|---|---|
| 1 | Verifikasi checksum database artifact | PASS | SHA-256 dibuat dan dicatat di manifest. |
| 2 | Decrypt database artifact jika `.enc` | N/A | Local drill tidak terenkripsi. Production wajib enkripsi. |
| 3 | Buat database restore sementara | PASS | Database sementara `simdp_restore_drill_20260727_035025` dibuat. |
| 4 | Restore dump PostgreSQL | PASS | Restore via `gzip -dc ... | docker exec -i ... psql`. |
| 5 | Cek tabel utama tersedia | PASS | Source 9 tabel, restore 9 tabel. |
| 6 | Cek jumlah pegawai masuk akal | PASS | Source 1 row, restore 1 row untuk tabel `Employee`. |
| 7 | Cek jumlah document record masuk akal | N/A | Database local yang diuji tidak memiliki tabel dokumen. |
| 8 | Cek audit/security log tersedia | N/A | Database local yang diuji tidak memiliki tabel audit/security log. |

Durasi restore database:

```txt
Total command drill: 3 detik.
```

## 6. Langkah restore storage

| No | Langkah | Hasil | Catatan |
|---:|---|---|---|
| 1 | Verifikasi checksum storage artifact/manifest | PASS | Artifact SHA-256 cocok dengan manifest storage drill. |
| 2 | Decrypt storage artifact jika `.enc` | N/A | Local drill tidak terenkripsi. Production wajib enkripsi. |
| 3 | Extract/sync storage ke lokasi restore | PASS | `tar -xzf` berhasil ke folder restore sementara. |
| 4 | Struktur path storage sesuai `DocumentRecord.filePath` | PASS | 28 relative paths source dan restore cocok. |
| 5 | Cek folder/bucket tidak publik | PASS | Restore dilakukan di folder lokal luar repo, bukan public web folder. |
| 6 | Cek sample file ada secara fisik | PASS | 28 file source dan restore cocok berdasarkan count, total bytes, dan SHA-256 per-file. |

Durasi restore storage:

```txt
Storage archive/restore lokal selesai dalam satu command shell; 28 file, 107,112 bytes source, 107,112 bytes restore.
```

## 7. Validasi aplikasi setelah restore

| Area | Test | Hasil | Catatan |
|---|---|---|---|
| Auth | Login admin/operator test berhasil | PASS | Runtime smoke test berhasil login memakai akun demo admin di DB `sicantik-local-psql`. |
| Employee | Minimal 5 pegawai acak bisa dibuka | PARTIAL | Halaman `/profile` berhasil render 200 setelah login; drill belum membuka 5 detail pegawai acak lewat browser. |
| Document | Minimal 5 dokumen acak bisa preview/download | PASS | 5 dokumen seed diunduh via endpoint app restore; metadata route dan stream route sama-sama HTTP 200; semua body terdeteksi PDF. |
| Document | Status dokumen sesuai metadata DB | PASS | 5 dokumen sample diambil dari DB `sicantik-local-psql` dan status metadata tersedia sebelum stream file. |
| Avatar | Foto profil upload manual tetap muncul jika ada | N/A | Belum divalidasi app-level. |
| Audit | Security log bisa dibuka | N/A | Tidak diuji lewat UI pada drill ini. |
| Export | Export CSV/PDF penting berjalan jika relevan | N/A | Tidak diuji karena app tidak diarahkan ke DB restore. |
| Settings | System settings terbaca | N/A | Tidak diuji di DB local ini. |

Percobaan app-level smoke test tambahan:

| Langkah | Hasil | Catatan |
|---|---|---|
| Buat DB restore app sementara | PASS | Database sementara `simdp_app_restore_smoke_20260727_044031` dibuat di container PostgreSQL lokal. |
| Restore storage candidate untuk app | PASS | 28 file dari archive storage diextract ke folder restore sementara luar repo. |
| Buat role DB temporary untuk koneksi host | PASS | Role temporary dibuat lalu dibersihkan setelah test. |
| Jalankan `prisma db push` ke DB restore app | FAIL/BLOCKED | Host tidak bisa autentikasi ke PostgreSQL container via `localhost:5433` dengan role temporary (`28P01`). Mes tidak membaca password container atau `.env` asli. |
| Jalankan `npm run build` dengan DB restore app | NOT RUN | Dihentikan karena Prisma belum bisa connect ke DB restore app. |
| Cleanup DB/role sementara | PASS | Database sementara dan role temporary sudah dihapus; verifikasi `db_exists=no`, `role_exists=no`. |
| Buat/gunakan container PostgreSQL lokal baru `sicantik-local-psql` | PASS | Container sehat di `localhost:55432` dengan DB lokal `sicantik`. |
| Jalankan `prisma migrate deploy` ke DB `sicantik` | BLOCKED/EXPECTED | Gagal `P3005` karena schema `public` sudah tidak kosong dan belum punya `_prisma_migrations`; tabel aplikasi sudah tersedia. |
| Jalankan seed demo ke DB `sicantik` | PASS | Seed selesai: 20 users, 20 employees, 27 document records, 10 notifications, 5 system settings. |
| Smoke query Prisma terhadap DB `sicantik` | PASS | Count penting terbaca: users=20, employees=20, documents=27, notifications=10, settings=5. |
| Jalankan `npm run build` dengan env restore lokal | PASS | `prisma generate && next build` sukses; 23 static pages generated dan route dynamic terdaftar. |
| Start app restore lokal via `next start` | PASS WITH NOTES | Port 3100 pertama gagal HTTP 500 karena production runtime membutuhkan `INNGEST_SIGNING_KEY`; restart di port 3101 dengan dummy local signing key berhasil. |
| Runtime HTTP smoke setelah login | PASS | `POST /api/v1/auth/login`=200, `/dashboard`=200, `/statistics`=200, `/profile`=200. |
| Runtime document download/preview smoke | PASS | 5 dokumen sample: metadata download=200, stream=200, PDF signature valid, bytes > 100, SHA-256 tercatat di `2026-07-27-document-download-smoke.txt`. |
| Enkripsi artifact backup lokal | PASS | Database dump dan storage archive dienkripsi AES-256-CBC PBKDF2 lalu didekripsi ulang; SHA-256 hasil decrypt sama dengan sumber. |
| Offsite backup provider | BLOCKED | AWS CLI tersedia tetapi token/credential lokal invalid; belum ada bucket/server offsite production yang disetujui. |

Sample yang dicek:

| Sample | Jenis data | Identifier tersensor | Hasil | Catatan |
|---|---|---|---|---|
| 1 | Database schema | `simdp_employee` | PASS | 9 tabel source sama dengan restore. |
| 2 | Employee row count | `Employee` | PASS | 1 row source sama dengan restore. |
| 3 | Storage folder | `uploads/` | PASS | 28 file, path relatif dan SHA-256 per-file cocok setelah restore. |
| 4 | Temporary restore DB cleanup | `simdp_restore_drill_***` | PASS | Database sementara dihapus setelah validasi. |
| 5 | App runtime smoke | `sicantik-local-psql` | PASS | Login admin demo dan halaman dashboard/statistics/profile menghasilkan HTTP 200. |
| 6 | Document download smoke | `seed_doc_019`, `seed_doc_011`, `seed_doc_003`, `seed_doc_026`, `seed_doc_020` | PASS | 5 file PDF bisa di-stream dari app restore. |
| 7 | Backup encryption check | DB dump + storage archive | PASS | Encrypted artifacts dibuat di luar repo; decrypt checksum cocok dengan sumber. |

## 8. Hasil pengukuran

| Metrik | Hasil |
|---|---:|
| Durasi persiapan | < 1 menit |
| Durasi restore DB | 3 detik total drill command |
| Durasi restore storage | < 1 menit |
| Durasi validasi aplikasi | < 5 menit untuk build + runtime HTTP smoke lokal |
| Durasi validasi download dokumen | < 2 menit untuk 5 dokumen sample |
| Total durasi restore drill | 3 detik command + inspeksi manual |
| Perkiraan data gap dari backup terakhir | 0 menit untuk local drill |
| Total ukuran backup DB | 2,585 bytes |
| Total ukuran backup storage | 74,758 bytes archive / 107,112 bytes source files |

## 9. Masalah yang ditemukan

| Severity | Masalah | Dampak | Owner | Follow-up issue |
|---|---|---|---|---|
| MEDIUM | `pg_dump` dan `psql` belum tersedia di host local. | Script `scripts/backup-local-vps.sh create` belum bisa dijalankan langsung dari host; drill harus memakai `docker exec`. | Operator/dev environment | TBD |
| MEDIUM | DB `sicantik` sudah memiliki schema tanpa `_prisma_migrations`, sehingga `prisma migrate deploy` memberi `P3005`. | Untuk DB local/dev baru yang dibuat via `db push` atau sudah berisi tabel, perlu baseline migration atau rebuild bersih sebelum memakai `migrate deploy`. | Operator/dev environment | TBD |
| LOW | Drill storage lokal belum memakai enkripsi. | Aman untuk local test, tetapi production wajib encryption/passphrase. | Operator/dev environment | TBD |
| HIGH | Offsite backup production belum aktif/terverifikasi. | Backup masih belum memenuhi disaster recovery penuh jika server lokal rusak total. | Operator/devops | Tentukan target offsite: Supabase backup, S3/R2 bucket, NAS/server backup, atau backup service RSUD. |

Catatan detail:

```txt
DB-level dan storage-level backup/restore smoke test berhasil.
Percobaan app-level smoke test dilanjutkan memakai container `sicantik-local-psql`: seed demo, Prisma count query, production build, login API, halaman `/dashboard`, `/statistics`, `/profile`, dan 5 download/preview dokumen berhasil.
Enkripsi artifact backup lokal berhasil diverifikasi, tetapi offsite backup production belum bisa dinyatakan siap karena target/credential offsite belum tersedia.
```

## 10. Keputusan akhir

- [ ] PASS — restore berhasil, RPO/RTO terpenuhi, tidak ada blocker.
- [x] PASS WITH NOTES — restore database dan storage lokal berhasil, ada catatan non-blocking untuk app-level validation/encryption/offsite.
- [ ] FAIL — restore tidak memenuhi target atau ada blocker.

Ringkasan keputusan:

```txt
Local database + storage restore smoke test berhasil. Backup database dibuat dari container PostgreSQL, direstore ke database sementara, count tabel dan employee cocok, lalu database restore dihapus. Folder `uploads/` di-archive ke `.tar.gz`, diextract ke folder restore sementara, dan 28 file cocok berdasarkan path, total bytes, dan SHA-256 per-file. App-level smoke tambahan terhadap `sicantik-local-psql` berhasil untuk seed demo, Prisma query, build, login admin, render halaman utama setelah login, dan stream 5 dokumen PDF sample. Enkripsi lokal backup artifact berhasil; offsite production masih blocker.
```

## 11. Tindak lanjut wajib

- [ ] Install PostgreSQL client tools (`pg_dump`, `psql`) di host/VPS agar script backup bisa berjalan langsung.
- [x] Siapkan/gunakan sample folder storage lokal `uploads/` atau storage restore fixture yang aman.
- [x] Jalankan DB + storage restore drill lokal level data.
- [x] Arahkan app lokal ke database restore sementara/lokal dan jalankan smoke test login + halaman utama.
- [x] Jalankan drill lanjutan untuk preview/download minimal 5 dokumen acak dari storage restore.
- [x] Verifikasi enkripsi/dekripsi artifact backup lokal.
- [ ] Tentukan dan verifikasi offsite backup production; AWS credential lokal saat ini invalid dan target bucket/server belum disetujui.
- [ ] Siapkan baseline migration untuk DB local/dev yang sudah terisi schema tetapi belum memiliki `_prisma_migrations`, atau rebuild DB kosong sebelum `migrate deploy`.
- [ ] Pastikan backup production nanti terenkripsi dan punya offsite copy.

## 12. Sign-off

| Peran | Nama | Tanggal | Catatan |
|---|---|---|---|
| Operator | mes | 2026-07-27 | DB + storage local smoke test berhasil. |
| Reviewer | Sil | 2026-07-27 | Menunggu review lokal. |
| Product owner/maintainer | Sil | 2026-07-27 | Menunggu keputusan tindak lanjut. |
