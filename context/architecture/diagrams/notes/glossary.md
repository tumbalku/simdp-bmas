# Glossary — SIMDP Diagram Terms

Daftar istilah yang digunakan dalam diagram UML SIMDP beserta definisinya.

## Entitas & Model Data

| Istilah | Definisi |
|---|---|
| **DocumentRecord** | Satu berkas dokumen yang diunggah pegawai. Memiliki status lifecycle: PENDING, APPROVED, REJECTED, EXPIRED, REPLACED. |
| **DocumentType** | Master jenis dokumen (contoh: SK Pengangkatan, STR, Ijazah). Mengatur aturan validasi: format, ukuran, apakah wajib, multi-snapshot, dsb. |
| **VerificationHistory** | Riwayat setiap aksi approve/reject pada sebuah DocumentRecord. Append-only. |
| **DocumentVerification** | Token/kode publik untuk verifikasi keabsahan profil/dokumen pegawai tanpa login. |
| **Employee** | Profil lengkap pegawai RSUD Bahteramas. Wajib punya minimal NIP (employeeId) atau NIK. |
| **EmploymentStatus** | Status kepegawaian: PNS, Kontrak, Honorer, dll. |
| **EmployeeGroup** | Sub-kelompok pegawai dalam satu EmploymentStatus. |
| **ProfessionGroup** | Rumpun profesi: Medis, Keperawatan, Non-medis, dll. |
| **EmployeePosition** | Jabatan pegawai dalam satu ProfessionGroup. |
| **EmployeeRank** | Pangkat/golongan pegawai. |
| **Workplace** | Unit kerja / lokasi kerja pegawai (misal: ICU, IGD, Poli Umum). |
| **EmployeeCareerHistory** | Riwayat perubahan jabatan, pangkat, status, atau unit kerja pegawai. |
| **RefreshToken** | Token jangka panjang (7 hari) untuk memperpanjang sesi tanpa login ulang. Disimpan sebagai SHA-256 hash. |
| **PasswordResetToken** | Token satu-kali-pakai (1 jam) untuk reset password via email. Disimpan sebagai SHA-256 hash. |
| **SecurityLog** | Audit trail append-only yang merekam semua event penting (login, upload, verifikasi, dsb). |
| **Notification** | Notifikasi in-app per user. Tidak mengandung data sensitif. |
| **SystemSetting** | Konfigurasi runtime yang bisa diubah admin tanpa redeploy (misal: hari reminder). |
| **RateLimitBucket** | Kontainer rate limiting untuk membatasi percobaan login gagal (maks 5x/15 menit/IP). |

## Status & Enum

| Istilah | Nilai | Definisi |
|---|---|---|
| **DocumentStatus** | PENDING | Baru diunggah, menunggu verifikasi staf. |
| | APPROVED | Dokumen disetujui oleh staf/admin. |
| | REJECTED | Dokumen ditolak; reviewNote wajib diisi. |
| | EXPIRED | expiryDate telah lewat; dokumen tidak berlaku lagi. |
| | REPLACED | Dokumen lama otomatis digantikan oleh upload baru (trigger DB). |
| **Role** | ADMIN | Akses penuh: master data, settings, audit log. |
| | STAFF | Verifikator dokumen, kelola pegawai, statistik. |
| | EMPLOYEE | Hanya akses data & dokumen milik sendiri. |
| **StorageProvider** | LOCAL | File disimpan di filesystem server (development). |
| | SUPABASE | File disimpan di Supabase Storage bucket. |
| | S3 | File disimpan di AWS S3 bucket. |

## Mekanisme & Pola Teknis

| Istilah | Definisi |
|---|---|
| **IStorageProvider** | Interface abstraksi storage. DocumentService hanya memanggil ini; implementasi konkret ditentukan oleh env var `STORAGE_PROVIDER`. |
| **Single-Device Enforcement** | Aturan: hanya 1 sesi aktif per user. Saat login baru berhasil, semua RefreshToken lama di-revoke. |
| **Token Rotation** | Setiap kali `/auth/refresh` berhasil, token lama di-revoke dan token baru dibuat. Mencegah token replay. |
| **handle_document_replacement()** | Database trigger yang otomatis men-set `status=REPLACED, isCurrent=false` pada dokumen current lama saat dokumen baru dengan tipe yang sama diunggah (hanya jika `allowMultiple=false`). |
| **allowMultiple** | Flag di DocumentType. Jika `false`, hanya 1 dokumen `isCurrent=true` per owner per tipe (enforced via partial unique index). Jika `true`, bisa banyak current snapshot. |
| **Target Matching** | Logika pencocokan DocumentType ke Employee. Dalam kategori yang sama: OR. Antar kategori: AND. Kategori tanpa baris = berlaku untuk semua. |
| **Argon2id** | Algoritma hashing password yang digunakan SIMDP (bukan bcrypt). |
| **httpOnly Cookie** | Cookie yang tidak bisa diakses JavaScript client. Digunakan untuk menyimpan access_token dan refresh_token agar aman dari XSS. |
| **SHA-256 Hash** | Hash satu arah yang digunakan untuk menyimpan refresh token dan password reset token di database (bukan plaintext). |
