# Sprint Log — SIMDP

File ini diupdate di akhir sprint atau setelah milestone kecil selesai.

## Sprint 0 — Project Foundation

**Tanggal mulai:** 2026-07-08
**Status:** In Progress

### Tujuan

- Menyiapkan fondasi workflow proyek.
- Menyiapkan PRD sebagai source of truth.
- Menyiapkan folder `context/` agar AI agent punya memori proyek yang konsisten.

### Yang Dikerjakan

- Repository workflow awal sudah tersedia: contributing guide, issue template, PR template.
- PRD v2.0 tersedia sebagai source of truth.
- PRD diperbarui: charting memakai Tremor Charts dan design system mengikuti shadcn/ui.
- Folder context tahap pertama dibuat: `ui`, `memory`, dan `progress`.
- Folder context tahap kedua dibuat: `business`, `domain`, dan `security`.
- Folder context tahap ketiga dibuat: `technical` dan `coding-standards`.
- Folder context tahap keempat dibuat: `architecture` dan 8 ADR awal.

### Kendala / Catatan

- Project Next.js belum terlihat di repo saat sprint log ini dibuat.
- Semua folder context yang didefinisikan PRD §23 sudah dibuat. Tahap berikutnya adalah scaffold aplikasi Next.js.

### Keputusan Terkait

- Lihat `context/memory/decisions-log.md`.
