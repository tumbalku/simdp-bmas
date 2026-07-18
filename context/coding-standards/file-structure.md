# File Structure Standards — SIMDP

**Status:** Draft awal
**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §6
**Terakhir diperbarui:** 2026-07-08

## Struktur Modul

Setiap modul di `src/modules/*` mengikuti pola:

```txt
src/modules/<module>/
├── service.ts
├── repository.ts
├── schema.ts
├── types.ts
├── actions.ts
├── api.ts
├── hooks.ts
└── components/
```

Tidak semua modul harus punya semua file sejak awal, tapi jika concern-nya muncul, gunakan nama standar di atas.

## Tanggung Jawab File

| File | Tanggung Jawab | Boleh Diimpor Oleh |
|---|---|---|
| `service.ts` | Business logic dan orchestration modul | Modul lain, actions, route handlers modul sendiri |
| `repository.ts` | Query Prisma/database | `service.ts` modul yang sama saja |
| `schema.ts` | Zod schema validasi input | actions, route handlers, service jika perlu |
| `types.ts` | Type/interface domain modul | Modul sendiri dan modul lain jika tipe public |
| `actions.ts` | Server Actions Next.js | Komponen/form modul terkait |
| `api.ts` | Client API wrapper ke REST endpoint | `hooks.ts` modul yang sama |
| `hooks.ts` | TanStack Query hooks | Komponen React |
| `components/` | UI modul | Page/komponen lain sesuai kebutuhan |

## Boundary Modul

Benar:

```ts
import { getEmployeeById } from "@/modules/employee/service";
```

Salah:

```ts
import { employeeRepository } from "@/modules/employee/repository";
```

Rule: modul lain hanya boleh lewat `service.ts`.

## Struktur App Router

Target struktur:

```txt
src/app/
├── (public)/
│   ├── login/page.tsx
│   ├── forgot-password/page.tsx
│   └── reset-password/page.tsx
├── (dashboard)/
│   ├── layout.tsx
│   ├── dashboard/page.tsx
│   ├── documents/page.tsx
│   ├── documents/[id]/page.tsx
│   ├── master-data/employees/page.tsx
│   ├── master-data/employees/[id]/page.tsx
│   ├── verification/page.tsx
│   ├── notifications/page.tsx
│   ├── settings/page.tsx
│   └── security/page.tsx
└── api/v1/
```

`page.tsx` harus tipis:
- auth/role guard;
- render satu komponen utama dari modul;
- tidak berisi business logic atau data fetching manual.

## Shared Components

```txt
src/components/
├── ui/          # shadcn/ui primitives
├── cards/       # InfoCard, MetricCard, field display helpers
├── charts/      # reusable chart primitives/wrappers
├── navigation/  # Navbar, Sidebar, PageHeader, navigation panels
├── providers/   # app-level React providers
└── tables/      # DataTable, pagination, filters, table view controls
```

Komponen umum wajib memakai shadcn/ui atau wrapper internal berbasis shadcn/ui.

## Lib

```txt
src/lib/
├── api-response.ts
├── auth.ts
├── env.ts
├── errors.ts
├── events/
├── notifications/
├── prisma.ts
└── storage/
```

`src/lib/` disimpan untuk infrastruktur, adapter/provider, singleton, dan boundary runtime server/client. Helper umum non-infrastruktur berada di:

```txt
src/utils/
├── index.ts    # cn(), bigIntToNumber(), helper umum kecil
└── chart.ts    # helper chart color/formatter
```

`src/lib/storage/` adalah satu-satunya tempat yang boleh tahu detail SDK/file system provider.

## Kapan Memecah File

Boleh memecah file jika:
- file sudah terlalu panjang dan punya beberapa concern jelas;
- ada reusable helper internal modul;
- kompleksitas membuat test sulit.

Tetap pertahankan public entry point:
- modul lain tetap import dari `service.ts` atau `index.ts` aggregator;
- jangan expose `repository.ts` sebagai shortcut.

## Evolusi Struktur Modul Besar

Jika suatu modul berkembang sangat besar, struktur file flat di root modul dapat dipecah menjadi folder-folder terfokus:
```txt
src/modules/<module>/
├── index.ts              # entry point utama (hanya re-export)
├── services/             # logika bisnis terpecah
├── repositories/         # Prisma/DB query terpecah
├── hooks/                # TanStack query hooks terpecah
├── components/           # komponen UI terpecah
│   └── index.ts          # aggregator komponen (hanya re-export)
└── constants/            # konstanta internal/eksternal modul
```

Aturan penting untuk evolusi ini:
1. File `index.ts` di root modul dan subfolder `components/` hanya boleh berisi pernyataan `export` (re-export aggregator). Tidak boleh ada logika bisnis atau definisi variabel/fungsi langsung di dalamnya.
2. Modul eksternal harus mengimpor fungsionalitas melalui aggregator modul ini, bukan mengimpor file internal/dalam secara langsung.
