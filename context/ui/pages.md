# UI Pages — SIMDP

**Status:** Draft awal
**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §6, §9, §10, §17
**Terakhir diperbarui:** 2026-07-08

## Prinsip Halaman

- `page.tsx` hanya berisi auth/role guard dan render komponen utama dari modul.
- Logic tampilan tidak ditulis langsung di `page.tsx`.
- Komponen umum wajib memakai shadcn/ui.
- Chart dashboard memakai Tremor Charts di dalam wrapper shadcn/ui.
- Komponen client tidak boleh `fetch` langsung; gunakan `hooks.ts` dari modul.

## Public / Auth Pages

| Route | Akses | Komponen Utama | Catatan UX |
|---|---|---|---|
| `/login` | Public | Login form | Identifier fleksibel: NIP / NIK / email. Error harus jelas tanpa membocorkan data akun. |
| `/forgot-password` | Public | Forgot password form | Copy harus sederhana untuk pegawai non-IT. |
| `/reset-password` | Public via token | Reset password form | Validasi password jelas. Token invalid/expired tampil sebagai state khusus. |

## Dashboard Pages

| Route | Akses | Komponen Utama | Catatan UX |
|---|---|---|---|
| `/dashboard` | Admin, Staff, Employee | Role-specific overview | Admin/Staff melihat statistik; Employee melihat status dokumen pribadi. |
| `/documents` | Admin, Staff, Employee | Document list/table | Employee hanya dokumen sendiri. Admin/Staff bisa melihat dokumen sesuai izin. |
| `/documents/[id]` | Admin, Staff, Employee sesuai ownership/role | Document detail | Tampilkan preview/download, status, audit ringkas, dan riwayat verifikasi. |
| `/employees` | Admin | Employee data table | CRUD pegawai, search/filter, soft delete/restore. |
| `/employees/[id]` | Admin, Staff terbatas | Employee profile | Staff read-only sesuai scope. Admin bisa edit. |
| `/verification` | Admin, Staff | Verification queue | Fokus pada dokumen `PENDING`, aksi approve/reject wajib jelas. |
| `/notifications` | Admin, Staff, Employee | Notification list | Bedakan unread/read dan tipe reminder. |
| `/settings` | Admin | System settings forms | Ubah setting seperti reminder days dan max upload. Semua aksi sensitif diaudit. |
| `/security` | Admin | Security log table | Read-only audit trail, filter event type/user/date. |

## Dashboard Statistik

Dashboard Admin/Staff wajib menyediakan:

- jumlah pegawai total;
- breakdown per gender;
- breakdown per `EmploymentStatus`;
- breakdown per `EmployeeGroup`;
- breakdown per `Workplace`;
- breakdown per `ProfessionGroup`;
- piramida usia pegawai;
- jumlah dokumen per status;
- jumlah dokumen per `ArchiveCategory`;
- dokumen yang akan kadaluarsa dalam 30 hari;
- compliance rate;
- tren upload dokumen per bulan;
- rata-rata waktu verifikasi;
- antrian verifikasi saat ini.

Visualisasi statistik memakai Tremor Charts, tetapi layout dan state memakai shadcn/ui.

## Role-based UX

### Employee

Fokus UX:
- upload dokumen mudah dari mobile;
- status dokumen jelas;
- alasan reject mudah dibaca;
- reminder expired terlihat jelas.

### Staff

Fokus UX:
- antrian verifikasi cepat diproses;
- preview dokumen dan metadata pegawai mudah dilihat;
- approve/reject membutuhkan konfirmasi dan alasan jika reject.

### Admin

Fokus UX:
- kontrol penuh data pegawai, user, role, dokumen, setting, dan audit;
- tabel harus punya filter/search/pagination;
- aksi destructive wajib memakai confirmation dialog.

## State Wajib Setiap Halaman

Setiap halaman data-heavy wajib punya:

- loading state (`Skeleton`);
- empty state;
- error state (`Alert`);
- unauthorized/forbidden state;
- responsive layout minimal untuk viewport target.
