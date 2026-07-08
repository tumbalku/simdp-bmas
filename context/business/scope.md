# Business Scope — SIMDP v1

**Status:** Draft awal
**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §2.5, §9
**Terakhir diperbarui:** 2026-07-08

## 1. Scope v1 — Masuk

Fitur yang masuk scope v1:

### Autentikasi & Sesi

- Login dengan identifier fleksibel: NIP / NIK / email.
- Custom JWT access token + refresh token.
- Single-device login: login baru merevoke sesi lama.
- Forgot password dan reset password via email.
- Logout dan manajemen sesi aktif.

### Manajemen Pegawai

- CRUD Employee oleh Admin.
- Buat `User` + `Employee` dalam satu transaksi.
- Edit profil pegawai non-kritis oleh user sendiri.
- Riwayat karier/mutasi pegawai.
- CRUD master data kepegawaian:
  - `EmploymentStatus`
  - `EmployeeGroup`
  - `ProfessionGroup`
  - `EmployeePosition`
  - `EmployeeRank`
  - `Workplace`
- Import/export pegawai via CSV.
- Soft delete dan restore pegawai dalam batas retention.

### Manajemen Dokumen

- CRUD `DocumentType` oleh Admin.
- Target dokumen berdasarkan ProfessionGroup / EmploymentStatus / EmployeeGroup / EmployeeRank / Workplace.
- Upload dokumen via server-mediated `IStorageProvider`.
- Lihat/download/preview dokumen dengan akses terkontrol.
- Riwayat versi dokumen.
- Soft delete dokumen sesuai role.

### Verifikasi Dokumen

- Antrian verifikasi untuk Staff/Admin.
- Approve/reject dokumen.
- `reviewNote` wajib untuk reject.
- Riwayat verifikasi wajib tercatat di `VerificationHistory`.

### Notifikasi

- In-app notification center.
- Notifikasi dokumen approved/rejected/pending.
- Notifikasi dokumen expiring/expired.
- Cron harian untuk cek expiry.

### Dashboard & Statistik

- Dashboard statistik untuk Admin/Staff.
- Statistik pegawai, dokumen, compliance rate, tren upload, waktu verifikasi, dan antrian pending.
- Chart memakai Tremor Charts dengan layout shadcn/ui.

### Security & Audit

- RBAC Employee/Staff/Admin.
- Row-level ownership untuk Employee.
- `SecurityLog` append-only untuk aksi sensitif.
- UI security log Admin only.
- Export security log ke CSV.

## 2. Out of Scope v1 — Tidak Masuk

Hal berikut tidak dikerjakan di v1 kecuali ada keputusan baru di `context/memory/decisions-log.md`:

- Integrasi payroll/absensi.
- Tanda tangan digital bersertifikat resmi Kominfo/BSrE.
- Aplikasi mobile native.
- Multi-tenant untuk banyak rumah sakit.
- Hard delete otomatis untuk soft-deleted data.
- Direct-to-storage upload sebagai alur utama.
- GraphQL/gRPC.
- Event bus/message queue.
- Microservice fisik sejak awal.

## 3. Aturan Jika Ada Permintaan Fitur Baru

Sebelum mengerjakan fitur baru:

1. Cek apakah fitur masuk daftar scope v1.
2. Jika ambigu, catat opsi dan diskusikan dengan project owner.
3. Jika di luar scope, catat di `context/memory/known-issues.md` dengan label `[OUT OF SCOPE]`.
4. Jika disetujui masuk scope, tambahkan keputusan baru di `context/memory/decisions-log.md`.
5. Update file ini agar scope tetap menjadi source of truth.
