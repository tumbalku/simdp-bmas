# Domain RBAC — SIMDP

**Status:** Draft awal
**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §10.4
**Terakhir diperbarui:** 2026-07-08

## 1. Role

| Role | Level | Label UI | Deskripsi |
|---|---:|---|---|
| `EMPLOYEE` | 1 | Pegawai | User biasa, hanya data/dokumen sendiri. |
| `STAFF` | 2 | Staff | Petugas kepegawaian, verifikasi dokumen dan baca data semua pegawai. |
| `ADMIN` | 3 | Admin | Superuser, mengelola seluruh sistem. |

## 2. Permission Matrix

| Kemampuan | Employee | Staff | Admin |
|---|:---:|:---:|:---:|
| Upload dokumen milik sendiri | Yes | Yes | Yes |
| Lihat dokumen milik sendiri | Yes | Yes | Yes |
| Edit profil sendiri non-kritis | Yes | Yes | Yes |
| Ganti password sendiri | Yes | Yes | Yes |
| Kelola sesi aktif sendiri | Yes | Yes | Yes |
| Soft-delete dokumen PENDING/REJECTED milik sendiri | Yes | Yes | Yes |
| Lihat dokumen semua pegawai | No | Yes | Yes |
| Verifikasi approve/reject dokumen | No | Yes | Yes |
| Lihat dashboard statistik | No | Yes terbatas | Yes penuh |
| CRUD Employee | No | No | Yes |
| CRUD User & role | No | No | Yes |
| CRUD master data kepegawaian | No | No | Yes |
| CRUD DocumentType | No | No | Yes |
| Soft-delete / restore dokumen siapapun | No | No | Yes |
| Restore Employee/DocumentType soft-deleted | No | No | Yes |
| Lihat Security Log | No | No | Yes |
| Ubah System Setting | No | No | Yes |
| Export Security Log ke CSV | No | No | Yes |

## 3. Rule Praktis

- Employee selalu butuh ownership check.
- Staff boleh verifikasi dan melihat dokumen semua pegawai, tetapi tidak boleh CRUD master data atau ubah role.
- Admin boleh melakukan semua aksi administratif.
- UI hiding bukan security; server tetap wajib enforce role dan ownership.

## 4. Ambiguitas

Jika ada aksi yang belum ada di matrix:

1. Default ke role paling aman: Admin only.
2. Diskusikan dengan project owner.
3. Catat keputusan di `context/memory/decisions-log.md`.
4. Update matrix ini.
