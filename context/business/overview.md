# Business Overview — SIMDP

**Status:** Draft awal
**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §2
**Terakhir diperbarui:** 2026-07-08

## 1. Latar Belakang

RSUD Bahteramas Kendari membutuhkan sistem terpusat untuk mengelola dokumen kepegawaian seperti KTP, ijazah, SK, sertifikat, STR, SIP, dan dokumen legal lain.

Masalah utama kondisi manual/tersebar:

- Dokumen pegawai bisa hilang, tercecer, atau sulit ditemukan.
- Dokumen kadaluarsa sering tidak terpantau tepat waktu.
- Riwayat verifikasi dokumen sulit dilacak: siapa approve/reject, kapan, dan alasannya apa.
- Manajemen tidak punya dashboard real-time untuk melihat statistik pegawai dan kepatuhan dokumen.
- Aksi sensitif belum punya audit trail yang konsisten.

## 2. Tujuan Produk

SIMDP adalah **Document Management System (DMS)** berbasis web untuk:

1. Memusatkan penyimpanan dokumen pegawai secara digital dan aman.
2. Menyediakan alur verifikasi berjenjang: Employee → Staff → Admin.
3. Memberi notifikasi otomatis untuk dokumen yang kadaluarsa atau butuh tindakan.
4. Memberi dashboard statistik kepegawaian dan dokumen untuk Admin/Staff.
5. Mencatat seluruh jejak audit: siapa melakukan apa, kapan, dari IP mana.
6. Menjadi fondasi monolit modular yang siap dipecah menjadi microservice jika dibutuhkan di masa depan.

## 3. Target Pengguna

| Peran | Kode DB | Label UI | Deskripsi |
|---|---|---|---|
| Admin | `ADMIN` | Admin | Administrator sistem / superuser. |
| Staff | `STAFF` | Staff | Petugas Kepegawaian yang memverifikasi dokumen. |
| Pegawai | `EMPLOYEE` | Pegawai | Seluruh pegawai RSUD Bahteramas. |

## 4. Success Metrics

Target keberhasilan v1:

- 100% dokumen wajib pegawai tersimpan digital dalam 3 bulan pertama.
- Waktu verifikasi dokumen rata-rata kurang dari 2x24 jam.
- 0 insiden kebocoran dokumen dengan audit trail lengkap.
- Admin dapat menghasilkan laporan statistik real-time tanpa query manual ke database.

## 5. Prinsip Produk

- **Aman dulu:** dokumen pegawai adalah data sensitif.
- **Mudah dipakai pegawai:** upload dan cek status dokumen harus sederhana.
- **Audit lengkap:** aksi penting harus bisa ditelusuri.
- **Tidak over-engineering:** mulai dari monolit modular yang rapi, bukan arsitektur kompleks.
- **Source of truth jelas:** PRD dan folder `context/` menjadi referensi utama AI agent dan developer.

## 6. Out of Scope v1

Lihat detail di `context/business/scope.md`.
