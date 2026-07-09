# Changelog — SIMDP

Format mengikuti prinsip [Keep a Changelog](https://keepachangelog.com/) dan Conventional Commits.

## [Unreleased]

### Added
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
- Script `npm test` belum tersedia karena testing framework belum dipasang pada backlog setup awal.
