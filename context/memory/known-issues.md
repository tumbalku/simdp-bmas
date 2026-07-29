# Known Issues — SIMDP

File ini mencatat technical debt, known bug, dan hal yang sengaja belum dikerjakan. Gunakan label:

- `[DEBT]` untuk technical debt yang disengaja.
- `[KNOWN BUG]` untuk bug yang diketahui.
- `[OUT OF SCOPE]` untuk permintaan di luar scope v1.
- `[TODO]` untuk pekerjaan yang sudah diketahui tetapi belum dimulai.

## Active

- [DEBT] Rate limiting API v1 kini memakai tabel `RateLimitBucket` agar counter global antar instance. Jika traffic naik signifikan, evaluasi Redis/Upstash atau edge/provider limiter untuk mengurangi write load PostgreSQL.
- [DEBT] Rate limiting API v1 pada #196 bergantung pada header IP dari trusted proxy (`x-forwarded-for`/`x-real-ip`). Deployment harus memastikan header tersebut tidak bisa dipalsukan langsung oleh client.
- [DEBT] Rate limiting login gagal memakai `RateLimitBucket` sebagai store terpusat dan SecurityLog hanya dicatat pada awal window/rate-limited claim. Jika volume login tinggi, evaluasi Redis/Upstash agar PostgreSQL tidak menjadi hot path limiter.
- [TODO] Script `npm test` belum tersedia; testing framework akan dipasang saat pekerjaan test setup dimulai.
- [DEBT] `npm audit --audit-level=moderate` masih melaporkan advisory PostCSS dari dependency internal Next.js 15.5.20. `npm audit fix --force` tidak dipakai karena menyarankan downgrade/breaking change; evaluasi ulang saat Next.js 15 mendapat patch atau saat project memutuskan upgrade major.
- [DEBT] `npm audit --audit-level=moderate` juga melaporkan advisory `@hono/node-server` dari dependency internal Prisma 7 dev tooling. `npm audit fix --force` menyarankan downgrade/breaking change ke Prisma 6.x, jadi belum dipakai.

## Resolved

- [2026-07-08] Tremor Charts sudah dipasang dan preview dashboard statistik sudah tersedia melalui wrapper modul `statistics`.
- [2026-07-08] Project Next.js sudah discaffold; `npm run lint`, `npm run typecheck`, dan `npm run build` tersedia sebagai quality gate awal.
- [2026-07-08] Folder context tahap awal `ui`, `memory`, dan `progress` sudah dibuat.
- [2026-07-08] Folder context `business`, `domain`, dan `security` sudah dibuat.
- [2026-07-08] Folder context `technical` dan `coding-standards` sudah dibuat.
- [2026-07-08] Folder context `architecture` dan ADR awal sudah dibuat.
