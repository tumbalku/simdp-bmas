# ADR-008: REST API sebagai Protokol Komunikasi

**Status:** Accepted
**Tanggal:** 2026-07-08

## Konteks

SIMDP ditulis untuk junior programmer dan AI coding agent. Protokol komunikasi harus mudah dipahami, mudah diuji, dan cocok dengan Next.js Route Handler.

## Keputusan

Gunakan **REST API** untuk endpoint eksternal/internal tertentu di `/api/v1/*` dan **Server Actions** untuk mutasi internal dashboard/form.

Tidak menggunakan GraphQL atau gRPC di v1.

## Konsekuensi

Positif:
- Mudah dipahami dan di-debug.
- Cocok dengan browser, curl, dan tooling umum.
- Mudah menjadi boundary jika modul dipisah menjadi microservice nanti.

Negatif:
- REST bisa verbose untuk query kompleks.
- Perlu disiplin dokumentasi endpoint dan response shape.

## Alternatif yang Ditolak

- **GraphQL:** fleksibel, tetapi menambah kompleksitas schema/resolver/cache.
- **gRPC:** kuat untuk service-to-service, tetapi tidak cocok untuk target junior-friendly v1.
- **Event bus/message broker:** ditunda sampai kebutuhan microservice nyata.
