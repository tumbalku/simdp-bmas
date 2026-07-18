# SIMDP BMAS

SIMDP adalah Sistem Informasi Manajemen Dokumen Pegawai untuk RSUD Bahteramas.

## Stack awal

- Next.js 15 App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui dengan CSS variables
- Tremor Charts pola Tremor Raw berbasis Recharts untuk visualisasi statistik
- Prisma ORM untuk PostgreSQL/Supabase
- ESLint + TypeScript typecheck

## Menjalankan project

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Quality gate

```bash
npm run lint
npm run typecheck
npm run build
npm run prisma:validate
```

## Struktur penting

- `src/app/` — Next.js App Router.
- `src/components/ui/` — primitive shadcn/ui.
- `src/components/charts/` — komponen chart reusable pola Tremor Raw berbasis Recharts.
- `src/components/cards/`, `navigation/`, `providers/`, `tables/` — komponen global reusable yang dikategorikan berdasarkan fungsi.
- `src/modules/statistics/components/` — wrapper domain dashboard statistik yang memakai chart reusable.
- `src/utils/` — helper shared seperti `cn()` dan formatter data umum.
- `src/lib/env.ts` — validasi environment variable dengan Zod.
- `src/lib/prisma.ts` — Prisma Client singleton untuk akses database server-side.
- `src/utils/chart.ts` — helper warna/formatter untuk chart.
- `prisma/schema.prisma` — Prisma schema yang disinkronkan dari `dms_pegawai_schema.sql`.
- `prisma.config.ts` — konfigurasi Prisma 7 untuk lokasi schema/migrations dan `DATABASE_URL`.
- `DESIGN.md` — design tokens dan aturan visual SIMDP.
- `context/` — dokumentasi keputusan, arsitektur, standar kode, dan progress project.
- `AGENTS.md` — aturan kerja untuk Antigravity dan agent coding lain di SIMDP.
