# Changelog — SIMDP

Format mengikuti prinsip [Keep a Changelog](https://keepachangelog.com/) dan Conventional Commits.

## [Unreleased]

### Changed
- Issue #159: Mengisolasi akses Prisma modul `auth`, `notification`, `security`, `settings`, `statistics`, dan `verification` ke repository layer tanpa mengubah query, API, atau business behavior.
- Issues #145-#148: Memecah UI besar lintas employee/document/verification/security/statistics menjadi helper dan subcomponent yang lebih terfokus tanpa mengubah behavior atau service/repository.
- Issue #144: Memecah facade document service/repository ke folder internal `services/` dan `repositories/` yang lebih terfokus untuk document type, listing/detail, upload/replace, download, lifecycle arsip, dan expiry/reminder tanpa mengubah public import.
- Issue #143: Memecah facade employee service/repository ke folder internal `services/` dan `repositories/` yang lebih terfokus, sambil mempertahankan public import `src/modules/employee/service.ts` dan `repository.ts` sebagai re-export boundary.
- Issue #129: Menyusun dokumentasi perencanaan refaktor terkait batasan modul, peran aggregator `index.ts` (murni re-export), evolusi struktur modul besar ke subfolder terfokus, standardisasi nilai enum database dalam bahasa Inggris, serta tata cara migrasi enum database beserta legacy data mapping di `module-boundaries.md`, `file-structure.md`, dan `decisions-log.md`.
- Issue #115: Memoles halaman Kategori Pegawai agar kartu master data memiliki batas tinggi konsisten dan scroll internal saat konten melebihi area tampil.

### Added
- Issue #149: Menambahkan Vitest architecture guard untuk mencegah import repository lintas modul, `fetch()` langsung di Client Component, dan legacy hardcoded status pegawai di layer non-label.
- Issue #141, #142: Menetapkan taxonomy `SecurityLog.eventType` sebagai typed constants TypeScript, lalu memigrasikan `SecurityLog.status` dan `actorRole` ke Prisma enum canonical uppercase dengan legacy mapping untuk `Public`/`System`.
- Issue #135, #139, #140: Memigrasikan `Employee.religion`, `DocumentRecord.storageProvider`, serta `Notification.type`/`relatedEntityType` ke Prisma enum canonical dengan migration SQL legacy mapping dan kompatibilitas label UI Bahasa Indonesia.
- Issue #133, #134, #136: Memigrasikan `Employee.status`, `Employee.gender`, dan `Employee.maritalStatus` ke Prisma enum canonical English dengan migration SQL yang memetakan legacy value Indonesia, sambil menjaga label UI tetap Bahasa Indonesia dan CSV/import tetap menerima value legacy.
- Issue #132, #137, #138: Menambahkan fondasi constants canonical English untuk employee, keputusan `Employee.lastEducation` sebagai kandidat enum setelah audit distinct value, serta constants typed untuk audit/security dan notification tanpa mengubah schema database.
- Issue #130 & #131: Menambahkan file root module aggregator `index.ts` dan sub-komponen aggregator `index.ts` untuk 8 modul inti (`auth`, `document`, `employee`, `notification`, `security`, `settings`, `statistics`, `verification`) untuk memperjelas dan mengamankan batasan modul tanpa logika internal.

- Issue #60: Memperbarui halaman `/documents` sebagai self-service dokumen pegawai, termasuk card per jenis dokumen yang berlaku untuk user, tombol `Tambah`/`Ganti` sesuai `allowMultiple`, aksi `Hapus` yang mengarsipkan dokumen, dan guard service agar arsip tetap berbasis ownership.
- Issue #124: Menambahkan kontrol arsip dan hapus permanen dokumen pada `/master-data/documents`, termasuk tab Aktif/Arsip, hapus file storage saat hapus permanen, pembersihan notifikasi terkait, dan audit event `DOCUMENT_PERMANENTLY_DELETED`.
- Issue #62: Menambahkan aksi hapus permanen khusus untuk pegawai arsip, termasuk guard agar pegawai aktif tidak bisa langsung dihapus, pembersihan referensi user sebelum delete cascade, audit event, dan dialog konfirmasi destruktif di tab Arsip.
- Issue #62: Menambahkan PR kecil kelima Admin & Master Data untuk kontrol akun pegawai admin, termasuk status akun di detail pegawai, pengelolaan email/role/status aktif akun, guard nonaktifkan akun sendiri, dan audit perubahan akun sensitif.
- Issue #62: Menambahkan PR kecil keempat Admin & Master Data untuk dialog tambah riwayat karier dari detail pegawai, termasuk cascade pilihan master data dan guard agar riwayat lama tidak menimpa penugasan aktif.
- Issue #62: Menambahkan PR kecil ketiga Admin & Master Data untuk UI import CSV pegawai dan endpoint export CSV direktori pegawai sesuai filter aktif.
- Issue #62: Menambahkan PR kecil kedua Admin & Master Data untuk UI arsip/pulihkan pegawai, termasuk filter tampilan Aktif/Arsip, action Hapus/Pulihkan, dan query direktori pegawai arsip.
- Issue #62: Menambahkan PR kecil pertama Admin & Master Data untuk edit flow pegawai admin, meliputi route edit, prefill form, submit update, dan tombol Edit dari list/detail pegawai.
- Issue #112: Memisahkan pengaturan pribadi user dari pengaturan sistem admin. `/settings` menjadi halaman semua user untuk keamanan akun dan ganti password mandiri, sementara konfigurasi admin dipindahkan ke `/system-settings`.
- SIMDP-ROADMAP-002 (#61): Implementasi sistem verifikasi & notifikasi dengan arsitektur provider-agnostic. Menambahkan realtime provider (Pusher), email provider (Resend + React Email templates), dan background job provider (Inngest). Ditambahkan fallback Noop provider yang aman ketika environment variables tidak terkonfigurasi lengkap. Integrasi alur verifikasi dokumen dan pengiriman peringatan kedaluwarsa dokumen agar melalui boundary layanan notifikasi resmi.
- SIMDP-ROADMAP-001 (#60): Menambahkan implementasi awal Core Employee & Document untuk review visual, meliputi service/action listing dokumen berbasis ownership, opsi DocumentType untuk upload, halaman `/documents` dengan ringkasan dan form upload Employee, halaman detail dokumen dengan tombol unduh berbasis URL temporer, direktori `/master-data/employees`, detail pegawai, serta test service baru untuk query dokumen dan pegawai.
- SIMDP-UI-006 (#50): Implementasi dashboard feature UI pages untuk role Admin/Staff dan Employee, termasuk kartu metrik reusable, DonutChart status dokumen dengan label ringkas (Pending, Approved, Rejected, Expired), tren upload/verifikasi, ringkasan kategori arsip, dashboard pegawai pribadi, dan seed demo yang lebih kaya agar tampilan dashboard dapat direview dengan data realistis.
- SIMDP-UI-005 (#49): Implementasi Auth UI (form login/forgot/reset ter-wired ke API) dan refaktor dashboard shell agar menu sidebar serta navigasi mobile menyesuaikan role user (ADMIN, STAFF, EMPLOYEE) secara dinamis dari server session.

### Fixed
- SIMDP-TEST-007 (#38): Addressing API route and test suite review gaps. This includes fixing Windows-only path separator assertions in `storage.test.ts`, standardizing login password minimum length to 8 characters, introducing standard `AppError` typed class to handle file upload/download service-level errors cleanly in route handlers, removing `eslint-disable @typescript-eslint/no-explicit-any` comments across route handlers, adding timing-safe comparisons to the cron secret authorization header, and adding complete integration/unit tests for auth logout/forgot-password/reset-password, document upload/download, and cross-employee admin/staff access.
- SIMDP-API-SEC-001 (#29): memperbaiki temuan critical review API dengan menutup path traversal pada local document stream, mewajibkan cron secret via `Authorization: Bearer`, menambahkan bypass middleware untuk refresh/logout, memindahkan lookup logout ke service boundary, menyimpan reset token dalam bentuk hash, menambahkan guard restore dokumen hanya untuk Admin, dan memindahkan audit log replacement upload keluar dari transaksi Prisma. Pola Zod `z.email("Format email tidak valid")` tetap dipertahankan karena sesuai Zod v4.

### Added
- SIMDP-UI-004 (#48): Menambahkan route group publik `(public)` dengan layout auth terpisah dari dashboard shell, serta template halaman `/login`, `/forgot-password`, dan `/reset-password` berisi copy profesional berbahasa Indonesia, placeholder form statis, dan komponen auth reusable berbasis shadcn/ui untuk fase implementasi Auth UI berikutnya.
- SIMDP-UI-002: Membuat komponen Navbar responsive di `src/components/shared/Navbar.tsx` lengkap dengan logo brand RSUD Bahteramas, navigasi Home/Dashboard, input pencarian (InputGroup), tombol toggle dark mode (next-themes), dan menu dropdown avatar user (profil, pengaturan, keluar) yang terintegrasi dengan server-side actions.
- SIMDP-UI-001 (#42): Menambahkan Taste Skill `design-taste-frontend` secara project-local untuk Antigravity CLI melalui `npx skills add`, termasuk `.agents/skills/design-taste-frontend/SKILL.md` dan `skills-lock.json`, agar pekerjaan UI berikutnya memakai panduan anti-slop frontend design.
- SIMDP-UI-000 (#40): Menambahkan library komponen shadcn/ui primitives yang dibutuhkan (accordion, alert, alert-dialog, avatar, badge, breadcrumb, calendar, checkbox, collapsible, command, dialog, dropdown-menu, form, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, scroll-area, select, separator, sheet, sidebar, skeleton, sonner, switch, table, tabs, textarea, tooltip) dan membuat halaman preview lokal terisolasi di `/preview` (diabaikan dalam `.gitignore`).
- Setup Vitest testing infrastructure (#31 / SIMDP-TEST-001) with path alias support, node environment, and mocked Prisma/cookie store.
- Unit tests for lib helpers (#32 / SIMDP-TEST-002) covering success/error envelopes, BigInt serialization, auth helpers, and local storage provider.
- Unit tests for auth module (#33 / SIMDP-TEST-003) covering login identifiers, password comparison, token rotation, password resets, and session revoking.
- Unit tests for document module (#34 / SIMDP-TEST-004) covering upload size, PDF/PNG/JPEG magic bytes, download ownership guards, and cron expiry reminder logic using fake timers.
- Unit tests for employee, verification, notification, settings, security, and statistics modules (#35 / SIMDP-TEST-005) covering service boundaries, queue pagination, note lengths, settings seeding, and aggregation math.
- API route and integration test baseline (#36 / SIMDP-TEST-006) covering login validation formats, token rotation cookies, cron Authorization Bearer security, and download path traversal rejection.
- Implementasi API Foundation (#15): standard success/error response envelope, Zod validation error formatter, BigInt serialization helper, JWT authentication cookies setting/clearing, session retrieval guard, dan role-based access permission helper.
- Implementasi Auth API (#16): login route handler dengan flex-identifier (email/NIP/NIK), refresh token rotation, logout route handler, forgot password link request, reset password token validation, change password server action, and session revocation server actions with audit log side effects.
- Implementasi Employee & Career History API (#17): getCurrentProfile dan updateProfileAction server actions dengan row-level ownership checks, dan addCareerHistoryAction untuk mutasi pegawai dengan sinkronisasi ke data profil saat ini.
- Implementasi Admin Employee & CSV Import (#18): crudEmployeeAction (Create, Update, Soft Delete, Restore) untuk admin kepegawaian dan importEmployeesAction untuk bulk import pegawai dari CSV file via stream.
- Implementasi Master Data HR API (#19): crudMasterDataAction untuk EmploymentStatus, EmployeeGroup, ProfessionGroup, EmployeePosition, EmployeeRank, dan Workplace dengan unique constraint handling dan conflict mapping.
- Implementasi Document Type Administration API (#20): crudDocumentTypeAction untuk mengelola master jenis dokumen beserta target rules profesi, status kepegawaian, golongan, pangkat, dan unit kerja.
- Implementasi Document Records & Upload API (#21): Route handler `/api/v1/documents/upload` menggunakan multipart form data, Zod validation, file magic bytes content format validation (PDF/PNG/JPEG), SHA-256 hash calculation, storage provider, and DB transaction triggers.
- Implementasi Document Download & Lifecycle API (#22): Route handler `/api/v1/documents/download/[id]` untuk download URL temporer, `/api/v1/documents/download/stream` untuk streaming file lokal dengan checks, dan soft delete/restore actions.
- Implementasi Document Verification Workflow API (#23): getVerificationQueue untuk Staff kepegawaian, verifyDocumentAction (Approve/Reject dengan catatan minimal 5 karakter), dan getVerificationHistory modal/tab.
- Implementasi In-App Notifications API (#24): getNotifications listing, getUnreadNotificationCount badge count, markNotificationReadAction, dan markAllNotificationsReadAction.
- Implementasi System Settings & Security Audit Log API (#25): getSystemSettings (dengan default seeding) dan updateSystemSettingAction untuk sistem konfigurasi, serta getSecurityLog pagination & filtering untuk Admin audit trail.
- Implementasi Dashboard Statistics & Expiry Cron API (#26): getStatistics dashboard ComplianceRate aggregation, dan GET `/api/v1/cron/check-expiry` route handler yang aman dan idempotent untuk status transition dan H-30/H-7/H-1 reminders.
- Implementasi Local Storage Provider di `src/lib/storage/index.ts` untuk support upload, delete, dan download streaming.
- Global middleware `src/middleware.ts` untuk route guarding UI (dashboard/admin) dan context headers injection.

- Menambahkan `SIMDP-API-DOCS-007`: Review kontrak API lengkap SIMDP v1 terhadap RBAC, audit log, validasi Zod, module boundaries, dan Prisma schema, serta menyusun rencana pemecahan menjadi 12 issue implementasi detail di `context/technical/api/review-implementation-split.md` dan GitHub issue #15-#26.
- Menambahkan `SIMDP-API-DOCS-002` hingga `SIMDP-API-DOCS-006`: kontrak API lengkap untuk modul Auth, Employee & Master Data, Document Type & Record, Verification & Notification, serta System Settings, Security Log, Statistics, dan Cron expiry reminders.
- Menambahkan `SIMDP-API-DOCS-001`: standar dokumentasi API v1 di `context/technical/api/README.md` dan `context/technical/api/conventions.md`, termasuk response envelope, error shape, pagination/filter, auth cookie, RBAC/ownership notation, audit, upload, dan frontend API wrapper conventions.
- Menambahkan `SIMDP-DB-003`: baseline migration Prisma awal di `prisma/migrations/20260709000000_init/migration.sql` dari `dms_pegawai_schema.sql` beserta `prisma/migrations/migration_lock.toml` untuk menyimpan semua schema PostgreSQL mentah (tabel, enum, index, check constraint, partial unique index, function, dan trigger).
- Menambahkan `SIMDP-OPS-001`: root `AGENTS.md` untuk Antigravity/agent coding dan dokumentasi `context/architecture/agent-orchestration.md` untuk workflow mes + Antigravity + reviewer personas.
- Menambahkan `SIMDP-DB-002`: validasi environment variable dengan Zod di `src/lib/env.ts`, Prisma Client singleton di `src/lib/prisma.ts`, dependency `zod`, `pg`, dan `@prisma/adapter-pg`, serta contoh `.env.example` yang siap development.
- Menambahkan Prisma ORM untuk `SIMDP-DB-001`, termasuk `prisma/schema.prisma`, `prisma.config.ts`, script Prisma, dan model yang disinkronkan dari `dms_pegawai_schema.sql`.
- Setup Tremor Charts dengan pola Tremor Raw untuk `SIMDP-SETUP-002`, termasuk dependency `recharts`, `tailwind-variants`, `@remixicon/react`, `@tailwindcss/forms`, shadcn `Card`, komponen chart reusable di `src/components/charts/`, utility `src/lib/chartUtils.ts`, wrapper domain di modul `statistics`, dan preview dashboard statistik dengan data contoh.
- Scaffold aplikasi Next.js 15 + TypeScript + Tailwind CSS v4 + shadcn/ui untuk `SIMDP-SETUP-001`.
- Menambahkan konfigurasi dasar `components.json`, `src/components/ui/button.tsx`, `src/lib/utils.ts`, dan theme token SIMDP di `src/app/globals.css`.
- Inisialisasi folder `context/ui`, `context/memory`, dan `context/progress` sebagai ingatan jangka panjang proyek untuk AI agent.
- Menambahkan panduan UI shadcn/ui-first dan charting Tremor ke `context/ui/design-system.md`.
- Menambahkan daftar halaman dan role-based UX ke `context/ui/pages.md`.
- Menambahkan log keputusan awal proyek ke `context/memory/decisions-log.md`.
- Menambahkan roadmap, sprint log, dan task board awal di `context/progress/`.
- Menambahkan konteks bisnis awal di `context/business/` (`overview.md`, `scope.md`, `glossary.md`).
- Menambahkan konteks domain awal di `context/domain/` (`entities.md`, `business-rules.md`, `rbac.md`).
- Menambahkan konteks security awal di `context/security/` (`auth-flow.md`, `rbac.md`, `audit.md`).
- Menambahkan konteks teknis awal di `context/technical/` (`tech-stack.md`, `database.md`, `api-contracts.md`, `storage-provider.md`, `environment.md`).
- Menambahkan standar kode awal di `context/coding-standards/` (`golden-rules.md`, `naming.md`, `file-structure.md`, `checklist.md`).
- Menambahkan konteks arsitektur awal di `context/architecture/` (`README.md`, `system-overview.md`, `module-boundaries.md`, `patterns.md`) dan 8 ADR awal di `context/architecture/adr/`.

### Changed
- PRD diperbarui agar charting memakai Tremor Charts dan design system wajib mengikuti shadcn/ui.
- Meluruskan model identitas pegawai: NIP (`employeeId`) tidak wajib untuk semua pegawai; minimal salah satu dari NIP atau NIK wajib ada, dengan NIK sebagai identifier utama jika NIP tidak tersedia.

### Fixed
- Belum ada.

### Known Issues
- Belum ada.
