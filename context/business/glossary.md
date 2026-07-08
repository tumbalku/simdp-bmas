# Glossary — SIMDP

**Status:** Draft awal
**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §3.2 dan §24
**Terakhir diperbarui:** 2026-07-08

## Istilah Bisnis & Domain

| Istilah | Definisi |
|---|---|
| SIMDP | Sistem Informasi Manajemen Dokumen Pegawai. |
| DMS | Document Management System; sistem untuk menyimpan, mengelola, dan melacak dokumen. |
| Employee / Pegawai | User dengan role `EMPLOYEE`; hanya boleh mengelola data/dokumen miliknya sendiri. |
| Staff | Petugas Kepegawaian dengan role `STAFF`; bisa melihat dokumen semua pegawai dan melakukan verifikasi. |
| Admin | Superuser dengan role `ADMIN`; bisa mengelola pegawai, user, master data, document type, settings, dan security log. |
| TMT | Terhitung Mulai Tanggal; tanggal efektif perubahan status/jabatan/pangkat/unit kerja. |
| Snapshot Dokumen | Setiap unggahan baru dianggap versi/snapshot baru. Untuk `allowMultiple = false`, hanya satu snapshot boleh `isCurrent = true`. |
| DocumentType | Master jenis dokumen dan aturan validasinya: kode, nama, kategori, wajib/tidak, boleh multiple/tidak, field wajib, format, ukuran max. |
| DocumentRecord | File dokumen yang diunggah pegawai beserta metadata file dan status verifikasi. |
| Archive Category | Kategori arsip dokumen: `PERSONAL`, `EDUCATION`, `EMPLOYMENT`, `CERTIFICATION`, `LEGAL`. |
| DocumentStatus | Status dokumen: `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`, `REPLACED`. |
| Compliance Rate | Persentase pegawai yang sudah mengunggah semua `DocumentType` wajib yang relevan dengan grup mereka. |
| Soft Delete | Data tidak dihapus permanen; kolom `deletedAt` diisi. Query normal wajib menyembunyikan data soft-deleted. |
| Audit Trail | Jejak aktivitas sensitif, disimpan di `SecurityLog`, append-only. |
| SecurityLog | Tabel audit untuk mencatat siapa melakukan apa, kapan, dari IP mana, dan statusnya. |
| RBAC | Role-Based Access Control; pembatasan akses berdasarkan role Employee/Staff/Admin. |
| Row-level Ownership | Pembatasan akses data per baris, misalnya Employee hanya boleh melihat dokumen `ownerId` miliknya sendiri. |
| IStorageProvider | Interface storage tunggal untuk local, Supabase, atau S3. |
| Server-mediated upload | Upload file melewati server agar validasi MIME, ukuran, hash, dan penyimpanan metadata konsisten. |
| Refresh Token Rotation | Setiap refresh mengganti token lama dengan token baru dan merevoke token lama. |
| Single-device Login | Satu user hanya boleh punya satu sesi aktif; login baru merevoke refresh token lama. |

## Enum Database

### Role

- `ADMIN`
- `STAFF`
- `EMPLOYEE`

### DocumentStatus

- `PENDING`
- `APPROVED`
- `REJECTED`
- `EXPIRED`
- `REPLACED`

### ArchiveCategory

- `PERSONAL`
- `EDUCATION`
- `EMPLOYMENT`
- `CERTIFICATION`
- `LEGAL`

## Catatan Pemeliharaan

Jika menemukan istilah baru yang ambigu saat implementasi, tambahkan ke file ini dan referensikan sumber/keputusannya di `context/memory/decisions-log.md` jika istilah tersebut memengaruhi scope atau arsitektur.
