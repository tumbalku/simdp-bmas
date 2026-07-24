# Diagram Index — SIMDP

Folder ini berisi semua diagram PlantUML SIMDP, diorganisasi berdasarkan jenis UML.
Baca [`notes/diagram-conventions.md`](notes/diagram-conventions.md) sebelum membuat diagram baru.
Lihat [`notes/glossary.md`](notes/glossary.md) untuk istilah domain.

## Struktur Folder

| Folder | Isi |
|---|---|
| `overview/` | Gambaran umum sistem, boundary modul, dan deployment. |
| `use-case/` | Use case per aktor / kelompok fitur. |
| `activity/` | Activity diagram per workflow bisnis. |
| `sequence/` | Sequence diagram per skenario interaksi. |
| `state/` | State diagram lifecycle objek domain. |
| `class/` | Class diagram per domain entitas. |
| `component/` | Component diagram boundary & infrastruktur. |
| `erd/` | Entity Relationship Diagram per domain. |
| `notes/` | Konvensi diagram & glossary istilah. |

---

## Daftar Diagram

### overview/
- [`system-overview.puml`](overview/system-overview.puml) — Arsitektur monolit modular Next.js dari browser hingga database.
- [`module-boundary.puml`](overview/module-boundary.puml) — Aturan import yang boleh dan dilarang antar modul.
- [`deployment-overview.puml`](overview/deployment-overview.puml) — Topologi deployment: Vercel, Supabase, S3, Email Provider.

### use-case/
- [`use-case-overview.puml`](use-case/use-case-overview.puml) — Ringkasan semua aktor dan kelompok fitur.
- [`use-case-auth.puml`](use-case/use-case-auth.puml) — Use case autentikasi & keamanan sesi (semua aktor).
- [`use-case-pegawai.puml`](use-case/use-case-pegawai.puml) — Use case khusus Pegawai (Employee).
- [`use-case-staff.puml`](use-case/use-case-staff.puml) — Use case tambahan Staf Kepegawaian / Verifikator.
- [`use-case-admin.puml`](use-case/use-case-admin.puml) — Use case eksklusif Administrator.
- [`use-case-system.puml`](use-case/use-case-system.puml) — Use case otomasi Cron Job (reminder & expiry).

### activity/
- [`activity-login-session.puml`](activity/activity-login-session.puml) — Alur login fleksibel, session refresh otomatis, dan logout.
- [`activity-upload-document.puml`](activity/activity-upload-document.puml) — Alur upload dokumen, validasi, simpan ke storage, auto-replacement.
- [`activity-verification-document.puml`](activity/activity-verification-document.puml) — Alur verifikasi dokumen (approve/reject) oleh staf/admin.
- [`activity-master-data.puml`](activity/activity-master-data.puml) — Ringkasan CRUD master data (versi singkat tanpa swimlane).
- [`activity-master-data-admin.puml`](activity/activity-master-data-admin.puml) — CRUD master data lengkap dengan swimlane per aktor: Admin, Server, Service, Database. Mencakup tambah, ubah, hapus (soft delete), pulihkan, validasi Zod, role check, dan audit log.
- [`activity-reminder-expiry.puml`](activity/activity-reminder-expiry.puml) — Alur cron harian: reminder H-30/H-7/H-1 dan auto set EXPIRED.

### sequence/
- [`sequence-login-refresh-logout.puml`](sequence/sequence-login-refresh-logout.puml) — Interaksi detail login, token rotation, dan logout.
- [`sequence-upload-document.puml`](sequence/sequence-upload-document.puml) — Interaksi upload dokumen & DB trigger replacement.
- [`sequence-verification-document.puml`](sequence/sequence-verification-document.puml) — Interaksi verifikasi approve/reject & notifikasi.
- [`sequence-forgot-reset-password.puml`](sequence/sequence-forgot-reset-password.puml) — Alur forgot password & reset via email token.
- [`sequence-public-verification.puml`](sequence/sequence-public-verification.puml) — Alur verifikasi dokumen publik (tanpa login).
- [`sequence-notification-dispatch.puml`](sequence/sequence-notification-dispatch.puml) — Alur pengiriman notifikasi in-app & email dari event domain, termasuk skenario fallback jika email gagal.
- [`sequence-master-data-admin.puml`](sequence/sequence-master-data-admin.puml) — Interaksi CRUD master data oleh Admin: create, update, soft delete (sukses & gagal karena relasi aktif), dan restore.

### state/
- [`state-document-record.puml`](state/state-document-record.puml) — Lifecycle status DocumentRecord: PENDING → APPROVED / REJECTED / EXPIRED / REPLACED.
- [`state-refresh-token.puml`](state/state-refresh-token.puml) — Lifecycle RefreshToken: ACTIVE → REVOKED / ROTATED / EXPIRED.
- [`state-password-reset-token.puml`](state/state-password-reset-token.puml) — Lifecycle PasswordResetToken: VALID → USED / EXPIRED.
- [`state-notification.puml`](state/state-notification.puml) — Lifecycle Notifikasi In-App: DIBUAT → TERKIRIM → DIBACA.
- [`state-document-verification.puml`](state/state-document-verification.puml) — Lifecycle kode verifikasi publik (DocumentVerification): AKTIF → DICABUT / KADALUARSA.

### class/
- [`class-auth-domain.puml`](class/class-auth-domain.puml) — Class User, RefreshToken, PasswordResetToken, UserTwoFactor.
- [`class-employee-domain.puml`](class/class-employee-domain.puml) — Class Employee & semua master data (Status, Group, Position, Rank, Workplace).
- [`class-document-domain.puml`](class/class-document-domain.puml) — Class DocumentType, DocumentRecord, VerificationHistory, DocumentVerification.
- [`class-notification-security-domain.puml`](class/class-notification-security-domain.puml) — Class Notification, SecurityLog, SystemSetting, RateLimitBucket.
- [`class-domain-overview.puml`](class/class-domain-overview.puml) — Relasi antar domain secara keseluruhan (high-level).

### component/
- [`component-frontend-backend-flow.puml`](component/component-frontend-backend-flow.puml) — Alur data dari browser (RSC / hooks / api.ts) ke service layer.
- [`component-module-boundary.puml`](component/component-module-boundary.puml) — Batas modul dan alur import yang diizinkan antar service.
- [`component-storage-infrastructure.puml`](component/component-storage-infrastructure.puml) — Arsitektur IStorageProvider & implementasi konkret (Local / Supabase / S3).

### erd/
- [`erd-auth.puml`](erd/erd-auth.puml) — ERD: User, RefreshToken, PasswordResetToken, UserTwoFactor, RateLimitBucket.
- [`erd-employee-master-data.puml`](erd/erd-employee-master-data.puml) — ERD: Employee & semua tabel master data.
- [`erd-document-verification.puml`](erd/erd-document-verification.puml) — ERD: DocumentType, DocumentRecord, VerificationHistory, tabel target matching.
- [`erd-system-support.puml`](erd/erd-system-support.puml) — ERD: Notification, SecurityLog, SystemSetting, RateLimitBucket.

---

## Aturan Penamaan File

- Lowercase, tanda hubung sebagai pemisah kata.
- Format: `[jenis]-[topik-spesifik].puml`
- Satu file = satu tujuan utama.
- Setiap file baru wajib didaftarkan di README ini.
