# ADR-005: Statistics Module Read-only

**Status:** Accepted
**Tanggal:** 2026-07-08

## Konteks

SIMDP membutuhkan dashboard statistik pegawai dan dokumen. Pada v1, data volume belum dibuktikan membutuhkan data warehouse, cache kompleks, atau tabel agregat.

## Keputusan

Modul `statistics` bersifat **read-only**. Modul ini boleh melakukan query Prisma lintas tabel melalui repository sendiri untuk agregasi, tetapi tidak boleh menulis data atau membuat side effect.

Tidak ada tabel agregat terpisah di v1.

## Konsekuensi

Positif:
- Implementasi sederhana.
- Tidak ada risiko data agregat stale.
- Cocok untuk v1 dan junior developer.

Negatif:
- Performa perlu dipantau jika data tumbuh besar.
- Query agregasi mungkin perlu optimasi index atau cache di masa depan.

## Alternatif yang Ditolak

- **Tabel agregat/materialized summary v1:** menambah kompleksitas sinkronisasi.
- **Data warehouse/cache sejak awal:** over-engineering untuk v1.
