# ADR-001: Gunakan Next.js App Router

**Status:** Accepted
**Tanggal:** 2026-07-08

## Konteks

SIMDP membutuhkan aplikasi web data-heavy dengan halaman login, dashboard, dokumen, verifikasi, pegawai, security log, dan settings. Tim memakai Next.js/TypeScript dan butuh struktur yang sederhana untuk junior programmer serta AI coding agent.

## Keputusan

Gunakan **Next.js 15+ App Router** sebagai routing dan application framework utama. Jangan memakai Pages Router untuk fitur baru.

## Konsekuensi

Positif:
- Server Components dapat mengurangi bundle JavaScript.
- Route Handler tersedia untuk REST API `/api/v1/*`.
- Server Actions cocok untuk mutasi internal dari dashboard/form.
- Layout nested cocok untuk dashboard authenticated.

Negatif:
- Developer harus disiplin membedakan Server Component dan Client Component.
- Beberapa pola lama Pages Router tidak dipakai.

## Alternatif yang Ditolak

- **Pages Router:** lebih lama dan familiar, tetapi kurang cocok dengan arah Next.js modern dan Server Components.
- **SPA React murni + backend terpisah:** terlalu banyak setup untuk v1 dan tidak sesuai monolith-first.
