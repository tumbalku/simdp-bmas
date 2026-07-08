# ADR-002: Gunakan Prisma ORM di Atas Skema SQL

**Status:** Accepted
**Tanggal:** 2026-07-08

## Konteks

SIMDP sudah memiliki rancangan schema PostgreSQL manual di `dms_pegawai_schema.sql`, termasuk enum, index, partial unique index, dan trigger. Aplikasi tetap butuh query type-safe di TypeScript.

## Keputusan

Gunakan **Prisma ORM** untuk akses database, dengan Prisma schema yang disinkronkan terhadap SQL yang sudah dirancang.

## Konsekuensi

Positif:
- Query type-safe di TypeScript.
- Mengurangi risiko SQL injection.
- Integrasi baik dengan Next.js/TypeScript.
- Developer lebih mudah memahami model data.

Negatif:
- Trigger/partial index tertentu tetap harus dipahami dari SQL/migration.
- Prisma schema harus dijaga tetap sinkron dengan SQL.

## Alternatif yang Ditolak

- **Raw SQL penuh:** fleksibel tetapi rawan error untuk junior developer.
- **Drizzle ORM:** valid, tetapi PRD memilih Prisma sebagai canonical ORM.
- **Supabase client langsung untuk DB:** akan mencampur data access dan melemahkan boundary repository/service.
