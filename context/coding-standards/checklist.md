# Implementation Checklist — SIMDP

**Status:** Draft awal
**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §19.1, §22 dan `CONTRIBUTING.md`
**Terakhir diperbarui:** 2026-07-08

Gunakan checklist ini sebelum menganggap fitur selesai atau sebelum membuka PR.

## A. Checklist Arsitektur

- [ ] Komponen tidak ada `fetch()` langsung; semua data lewat `hooks.ts`.
- [ ] `hooks.ts` hanya memanggil `api.ts` di modul yang sama.
- [ ] Server Action/Route Handler hanya memanggil `service.ts` di modul yang sama.
- [ ] Jika butuh data modul lain, panggil `service.ts` modul itu, bukan `repository.ts`.
- [ ] `page.tsx` tipis: guard + render komponen utama.
- [ ] Modul `statistics` tetap read-only.

## B. Checklist Validasi & Security

- [ ] Semua input request divalidasi Zod.
- [ ] Server Action mengikuti urutan: auth check → role check → Zod validation → service → audit log jika sensitif.
- [ ] Permission diverifikasi untuk role Employee, Staff, Admin.
- [ ] Row-level ownership diterapkan untuk Employee.
- [ ] Aksi sensitif memanggil `logActivity()`.
- [ ] Tidak ada token/secret disimpan di localStorage.
- [ ] Tidak ada secret masuk commit, docs, log, atau metadata audit.

## C. Checklist Data & Soft Delete

- [ ] Query normal pada tabel soft-delete memakai `deletedAt IS NULL`.
- [ ] Soft delete tidak menghilangkan data permanen.
- [ ] Restore hanya sesuai role dan retention.
- [ ] Update status dokumen approve/reject selalu membuat `VerificationHistory`.
- [ ] `SecurityLog` tidak di-update/delete.

## D. Checklist Upload & Storage

- [ ] Upload file melewati `POST /api/v1/documents/upload`.
- [ ] Client validation hanya untuk UX; server tetap validasi ulang.
- [ ] Semua akses storage lewat `IStorageProvider`.
- [ ] Tidak ada kode modul `document` yang memanggil SDK Supabase/S3/filesystem langsung.
- [ ] Metadata file tersimpan lengkap: `fileName`, `filePath`, `fileSize`, `mimeType`, `fileHash`, `storageProvider`.
- [ ] URL preview/download bersifat sementara/terkontrol.

## E. Checklist UI

- [ ] Komponen umum memakai shadcn/ui atau wrapper internal.
- [ ] Chart memakai Tremor Charts hanya untuk visualisasi statistik.
- [ ] Loading state tersedia (`Skeleton`).
- [ ] Empty state tersedia.
- [ ] Error state tersedia (`Alert` atau pattern setara).
- [ ] Kontras warna minimal WCAG AA.
- [ ] Halaman Employee nyaman di mobile; Admin/Staff nyaman di desktop.

## F. Checklist Testing & Quality Gate

- [ ] Unit test business logic di `service.ts` lulus.
- [ ] `npm run lint` lulus.
- [ ] `npm run typecheck` / `tsc --noEmit` lulus.
- [ ] `npm test` lulus.
- [ ] Jika script belum tersedia, jelaskan sebagai blocker dan tambahkan saat setup Next.js.
- [ ] Tidak ada penggunaan `any` tanpa alasan kuat.

## G. Checklist Dokumentasi & Progress

- [ ] Entry ditambahkan ke `context/memory/changelog.md`.
- [ ] Keputusan baru ditambahkan ke `context/memory/decisions-log.md`.
- [ ] Known issue/debt baru ditambahkan ke `context/memory/known-issues.md`.
- [ ] Task terkait di `context/progress/task-board.md` diupdate.
- [ ] Dokumen context terkait diupdate jika behaviour berubah.

## H. Checklist PR

Sebelum PR:

- [ ] Issue terkait sudah ada.
- [ ] Branch dibuat dari `main` terbaru.
- [ ] Scope PR kecil dan sesuai issue.
- [ ] Tidak ada file rahasia ikut ter-commit.
- [ ] PR description punya summary, test plan, dan linked issue.
- [ ] CI/checks lulus sebelum merge.
