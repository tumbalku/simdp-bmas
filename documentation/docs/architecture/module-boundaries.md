---
title: Module Boundaries
---

# Module Boundaries

Setiap folder di `src/modules/*` adalah bounded context. Modul lain boleh berbicara ke public boundary, tetapi tidak boleh menembus repository internal modul lain.

## Struktur modul standar

```txt
src/modules/<module>/
  index.ts
  service.ts
  repository.ts
  schema.ts
  types.ts
  actions.ts
  api.ts
  hooks.ts
  components/
```

Tidak semua modul harus punya semua file, tetapi jika concern-nya ada gunakan nama standar tersebut.

## Import yang benar

```ts
import { getEmployeeById } from "@/modules/employee/service";
```

## Import yang dilarang

```ts
import { employeeRepository } from "@/modules/employee/repository";
```

Repository modul lain tidak boleh diimpor langsung. Jika satu modul membutuhkan data modul lain, tambahkan public function di service modul tujuan.

## Tanggung jawab file

| File | Tanggung jawab |
|---|---|
| `service.ts` | Business logic, orchestration, public boundary modul. |
| `repository.ts` | Query Prisma/database internal modul. |
| `schema.ts` | Zod schema input. |
| `types.ts` | Type domain publik/internal. |
| `actions.ts` | Server Actions untuk form/mutasi dashboard. |
| `api.ts` | Client API wrapper. |
| `hooks.ts` | TanStack Query hooks. |
| `components/` | UI spesifik modul. |

## Aturan lint arsitektur

Architecture guard menolak pola berbahaya seperti:

- component melakukan `fetch()` langsung;
- `hooks.ts` memanggil `api.ts` modul lain;
- route handler atau action memanggil repository langsung;
- cross-module import ke repository internal;
- hardcoded status legacy di layer yang tidak tepat.

Jalankan:

```bash
npm run test -- tests/architecture/architecture-guards.test.ts
```

## Evolusi modul besar

Modul besar boleh berkembang ke subfolder:

```txt
src/modules/document/
  index.ts
  service.ts
  services/
  repositories/
  hooks/
  components/
  constants/
```

`index.ts` hanya boleh menjadi aggregator re-export. Jangan menaruh business logic di `index.ts`.
