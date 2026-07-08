# Known Issues — SIMDP

File ini mencatat technical debt, known bug, dan hal yang sengaja belum dikerjakan. Gunakan label:

- `[DEBT]` untuk technical debt yang disengaja.
- `[KNOWN BUG]` untuk bug yang diketahui.
- `[OUT OF SCOPE]` untuk permintaan di luar scope v1.
- `[TODO]` untuk pekerjaan yang sudah diketahui tetapi belum dimulai.

## Active

- [TODO] Script `npm test` belum tersedia; testing framework akan dipasang saat pekerjaan test setup dimulai.
- [DEBT] `npm audit --audit-level=moderate` masih melaporkan advisory PostCSS dari dependency internal Next.js 15.5.20. `npm audit fix --force` tidak dipakai karena menyarankan downgrade/breaking change; evaluasi ulang saat Next.js 15 mendapat patch atau saat project memutuskan upgrade major.

## Resolved

- [2026-07-08] Project Next.js sudah discaffold; `npm run lint`, `npm run typecheck`, dan `npm run build` tersedia sebagai quality gate awal.
- [2026-07-08] Folder context tahap awal `ui`, `memory`, dan `progress` sudah dibuat.
- [2026-07-08] Folder context `business`, `domain`, dan `security` sudah dibuat.
- [2026-07-08] Folder context `technical` dan `coding-standards` sudah dibuat.
- [2026-07-08] Folder context `architecture` dan ADR awal sudah dibuat.
