# Backup & Disaster Recovery Plan — SIMDP

**Status:** Production readiness plan awal  
**Issue:** #237  
**Terakhir diperbarui:** 2026-07-27

Dokumen ini menjelaskan cara SIMDP mencegah kehilangan data dan cara memulihkan sistem jika terjadi kerusakan. SIMDP menyimpan data pegawai dan dokumen legal/asli, sehingga backup tidak boleh bergantung pada export manual dari halaman admin saja.

## 1. Tujuan sederhana

Backup & Disaster Recovery (BDR) menjawab pertanyaan ini:

1. **Apa yang harus disalin?** Database dan file dokumen.
2. **Kapan disalin?** Otomatis dan terjadwal.
3. **Disimpan di mana?** Di tempat aman yang terpisah dari sistem utama.
4. **Berapa lama disimpan?** Sesuai aturan retention.
5. **Bagaimana cara mengembalikan?** Ada langkah restore yang jelas dan pernah diuji.

Analogi: database adalah **katalog arsip**, storage adalah **map berisi dokumen fisik**. Keduanya harus selamat. Jika hanya katalog yang selamat, file tidak bisa dibuka. Jika hanya file yang selamat, sistem tidak tahu file itu milik siapa, statusnya apa, dan riwayat verifikasinya bagaimana.

## 2. Istilah penting

| Istilah | Arti singkat | Target awal SIMDP |
|---|---|---|
| Backup | Salinan data untuk keadaan darurat. | Otomatis untuk database dan storage. |
| Restore | Proses mengembalikan sistem dari backup. | Harus diuji sebelum production final. |
| RPO | Maksimal data yang boleh hilang. | 24 jam untuk production awal. |
| RTO | Maksimal waktu sistem boleh down sampai pulih. | 4 jam untuk production awal. |
| Retention | Berapa lama backup disimpan. | Harian 14 hari, mingguan 8 minggu, bulanan 12 bulan. |
| Offsite backup | Backup di lokasi berbeda dari server utama. | Wajib untuk production. |
| Restore drill | Latihan restore untuk membuktikan backup bisa dipakai. | Minimal 1 kali sebelum merge/release ke `main`. |

Target ini bisa diperketat setelah deployment nyata dan kebutuhan RSUD ditetapkan.

## 3. Aset yang wajib dibackup

### 3.1 Database PostgreSQL

Database menyimpan:

- akun user, role, dan status akun;
- data profil pegawai dan riwayat karier;
- master data HR;
- metadata dokumen (`DocumentRecord`, `DocumentType`, status, hash, provider, path);
- riwayat verifikasi;
- notifikasi;
- audit log/security log;
- system settings.

Backup database harus menjaga konsistensi seluruh tabel, bukan hanya export CSV pegawai.

### 3.2 Storage dokumen

Storage menyimpan file asli:

- file dokumen pegawai seperti PDF, SK, ijazah, STR, sertifikat, dan dokumen legal lain;
- foto profil upload manual;
- file lain yang disimpan melalui `IStorageProvider`.

Backup storage harus mempertahankan struktur path karena database menyimpan `filePath` yang menunjuk ke lokasi file.

### 3.3 Konfigurasi aplikasi

Konfigurasi production seperti env var dan secret tidak boleh disimpan di repository. Namun, operator harus punya daftar nama variable yang dibutuhkan dari `.env.example` dan `context/technical/environment.md`.

Yang boleh didokumentasikan:

- nama variable;
- fungsi variable;
- sumber cara mendapatkannya.

Yang tidak boleh didokumentasikan:

- nilai secret asli;
- service role key;
- database password;
- backup encryption key.

## 4. Prinsip wajib production

1. **Backup otomatis, bukan manual.** Admin export/import hanya pelengkap operasional.
2. **Database dan storage harus dibackup bersama.** Satu tanpa yang lain tidak cukup.
3. **Backup tidak boleh hanya berada di server yang sama.** Jika server rusak, backup ikut hilang.
4. **Backup harus terlindungi.** Backup bisa berisi data pribadi dan dokumen legal.
5. **Restore harus pernah diuji.** Backup yang tidak pernah diuji belum bisa dipercaya.
6. **Restore production harus dikontrol.** Jangan membuat tombol restore publik di web app tanpa desain keamanan khusus.

## 5. Admin export/import bukan pengganti backup

Fitur admin export/import tetap berguna untuk kebutuhan operasional, misalnya:

- export data pegawai ke CSV;
- import data pegawai/master data;
- koreksi data massal;
- laporan manual.

Namun export/import admin **bukan** disaster recovery utama karena biasanya tidak mencakup:

- seluruh tabel database;
- audit log lengkap;
- relasi kompleks antar tabel;
- file asli di storage;
- snapshot konsisten antara metadata dan file.

Untuk bencana besar, gunakan backup database + storage dari jalur ops/server.

## 6. Strategi backup berdasarkan deployment

### 6.1 Jika production memakai Supabase

Database:

- aktifkan fitur backup database Supabase sesuai paket production;
- pastikan ada jadwal backup otomatis;
- catat cara restore database dari dashboard/CLI Supabase;
- lakukan restore ke project/database sementara untuk drill.

Storage:

- bucket dokumen harus disalin berkala ke lokasi backup/offsite;
- opsi realistis: scheduled job yang sync bucket Supabase Storage ke object storage lain atau archive storage;
- simpan manifest backup yang berisi waktu backup, jumlah object, dan total ukuran.

Catatan: fitur backup database Supabase tidak otomatis berarti file storage ikut terbackup. Storage tetap perlu strategi sendiri.

### 6.2 Jika production memakai VPS/PostgreSQL sendiri

Database:

- jalankan `pg_dump` otomatis minimal harian;
- simpan dump dengan nama tanggal/waktu;
- kompres dan enkripsi dump sebelum dikirim offsite;
- verifikasi dump bisa dibaca.
- gunakan `scripts/backup-local-vps.sh` sebagai helper awal untuk membuat backup database + storage dan manifest checksum.

Contoh pola nama file:

```txt
simdp-db_YYYYMMDD_HHmm.sql.gz.enc
```

Storage:

- sync folder `uploads/` atau lokasi storage aktif ke lokasi backup;
- gunakan incremental sync jika ukuran besar;
- jangan hapus backup lama sebelum retention policy berjalan benar.
- lihat panduan operasional di `context/operations/local-vps-backup-automation.md`.

Contoh pola nama archive:

```txt
simdp-storage_YYYYMMDD_HHmm.tar.gz.enc
```

### 6.3 Jika production memakai S3/S3-compatible

Database tetap mengikuti strategi PostgreSQL/Supabase. Untuk storage:

- aktifkan bucket versioning jika tersedia;
- aktifkan lifecycle retention;
- sync/copy ke bucket backup di lokasi berbeda jika memungkinkan;
- batasi akses backup bucket hanya untuk operator/automation.

## 7. Retention policy awal

Target awal SIMDP:

| Jenis backup | Frekuensi | Lama simpan |
|---|---:|---:|
| Harian | 1 kali per hari | 14 hari |
| Mingguan | 1 kali per minggu | 8 minggu |
| Bulanan | 1 kali per bulan | 12 bulan |

Aturan tambahan:

- backup sebelum migration besar harus disimpan minimal sampai migration dinyatakan stabil;
- backup yang berisi data pribadi harus dienkripsi;
- akses backup harus dibatasi dan diaudit di luar aplikasi jika platform mendukung.

## 8. Restore runbook

Gunakan runbook ini saat terjadi kerusakan besar. Jangan jalankan langsung ke production tanpa keputusan operator/maintainer.

### 8.1 Persiapan

1. Tentukan waktu kejadian dan perkiraan data terakhir yang valid.
2. Pilih backup database dan storage dengan timestamp yang cocok.
3. Siapkan environment restore sementara jika memungkinkan.
4. Pastikan secret production tidak dipindahkan sembarangan ke environment yang tidak aman.

### 8.2 Restore database

1. Buat database baru atau kosongkan database restore sementara.
2. Restore dump PostgreSQL sesuai platform.
3. Jalankan validasi dasar:
   - tabel utama ada;
   - jumlah pegawai masuk akal;
   - jumlah document record masuk akal;
   - audit log masih ada.
4. Jalankan Prisma validation/generate jika diperlukan oleh deployment.

### 8.3 Restore storage

1. Restore folder/bucket storage ke lokasi restore.
2. Pastikan struktur path tetap sama dengan `DocumentRecord.filePath`.
3. Cek beberapa file dari kategori berbeda:
   - dokumen PDF;
   - gambar/foto profil;
   - file dari provider aktif.
4. Jangan expose bucket/folder restore ke publik tanpa auth.

### 8.4 Validasi aplikasi

1. Arahkan aplikasi restore ke database dan storage restore.
2. Login sebagai admin test/operator.
3. Buka halaman pegawai.
4. Buka beberapa dokumen dari pegawai berbeda.
5. Cek status dokumen dan riwayat verifikasi.
6. Cek security log.
7. Cek export penting seperti CSV/PDF jika relevan.

### 8.5 Cutover ke production

Cutover artinya mengarahkan traffic user ke hasil restore.

1. Komunikasikan downtime ke user internal.
2. Freeze sementara upload/edit jika sistem lama masih berjalan.
3. Arahkan env aplikasi ke database/storage hasil restore.
4. Jalankan smoke test singkat.
5. Buka akses user lagi.
6. Catat incident report dan data yang mungkin hilang sesuai RPO.

## 9. Restore drill checklist

Sebelum production final atau merge/release ke `main`, lakukan minimal satu restore drill:

- [ ] Ambil backup database terbaru.
- [ ] Ambil backup storage yang timestamp-nya cocok.
- [ ] Restore database ke environment sementara.
- [ ] Restore storage ke environment sementara.
- [ ] Jalankan app terhadap environment restore.
- [ ] Login admin berhasil.
- [ ] Minimal 5 pegawai acak bisa dibuka.
- [ ] Minimal 5 dokumen acak bisa di-download/preview.
- [ ] Foto profil upload manual tetap muncul jika ada.
- [ ] Audit log masih terbaca.
- [ ] Catat durasi restore aktual.
- [ ] Catat data yang tidak ikut restore jika ada.
- [ ] Update dokumen ini jika langkah restore berbeda dari kenyataan.

## 10. Monitoring backup

Minimal production harus punya cara menjawab:

- backup terakhir berhasil kapan;
- ukuran backup database;
- jumlah/ukuran file storage yang tersalin;
- lokasi backup;
- error backup terakhir;
- siapa yang menerima alert jika backup gagal.

Jika memakai scheduler/cron eksternal, alert backup gagal harus masuk ke kanal operator, bukan hanya log server.

## 11. Security untuk backup

- Backup database dan storage wajib dianggap data sensitif.
- Backup tidak boleh disimpan di folder publik aplikasi.
- Backup tidak boleh masuk git.
- Backup harus dienkripsi jika keluar dari platform utama.
- Backup encryption key tidak boleh disimpan bersama file backup.
- Hanya operator yang berwenang boleh mengakses backup.
- Jangan memasukkan isi file dokumen atau secret ke `SecurityLog.metadata`.

## 12. Production readiness checklist BDR

Sebelum SIMDP dianggap siap production/main:

- [ ] Deployment target final ditentukan: Supabase, VPS, atau S3-compatible.
- [ ] Backup database otomatis aktif.
- [ ] Backup storage otomatis aktif.
- [ ] Backup disimpan offsite atau di lokasi terpisah.
- [ ] Retention harian/mingguan/bulanan diterapkan.
- [ ] Backup gagal mengirim alert ke operator.
- [ ] Restore database pernah diuji.
- [ ] Restore storage pernah diuji.
- [ ] Dokumen dari hasil restore bisa dibuka.
- [ ] Durasi restore aktual dicatat dan masih sesuai RTO.
- [ ] Kehilangan data maksimum masih sesuai RPO.
- [ ] Operator tahu siapa yang bertanggung jawab saat incident.

## 13. Follow-up implementation issues

Dokumen ini adalah plan awal. Implementasi teknis otomatis perlu issue terpisah setelah target deployment final jelas:

1. **Wire local/VPS backup helper to server cron/systemd timer and offsite copy.**
2. **Implement provider-specific Supabase Storage backup/sync if production uses Supabase.**
3. **Add backup monitoring and failure alert.**
4. **Run and record first restore drill.**
5. **Evaluate admin export/import as operational convenience, not disaster recovery.**
