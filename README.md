# SIMDP BMAS

SIMDP adalah Sistem Informasi Manajemen Dokumen Pegawai untuk RSUD Bahteramas.

## Stack awal

- Next.js 15 App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui dengan CSS variables
- Tremor Charts pola Tremor Raw berbasis Recharts untuk visualisasi statistik
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
```

## Struktur penting

- `src/app/` — Next.js App Router.
- `src/components/ui/` — primitive shadcn/ui.
- `src/components/charts/` — komponen chart reusable pola Tremor Raw berbasis Recharts.
- `src/modules/statistics/components/` — wrapper domain dashboard statistik yang memakai chart reusable.
- `src/lib/utils.ts` — helper shared seperti `cn()`.
- `src/lib/chartUtils.ts` — helper warna/formatter untuk chart.
- `DESIGN.md` — design tokens dan aturan visual SIMDP.
- `context/` — dokumentasi keputusan, arsitektur, standar kode, dan progress project.
