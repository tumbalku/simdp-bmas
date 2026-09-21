# Rencana Eksekusi Hasil Review — `codex/align-v2-code`

**Dibuat:** 2026-09-21
**Asal:** `REVIEW.md` (review menyeluruh atas branch `codex/align-v2-code` oleh mes)
**Kondisi production:** database RSUD sudah berjalan dengan schema v1 dan **sudah ada data pegawai**. v2 belum ada di production.

## Verdict review (dikonfirmasi)

**REQUEST CHANGES — HOLD untuk produksi.** Kode, arsitektur modular, validasi Zod, audit logging, dan quality gate otomatis sangat baik (lint, typecheck, prisma validate/generate, 499 test, `next build` lulus). Tapi:

1. **Tidak ada migration path v1 → v2** → production RSUD akan gagal atau kehilangan data.
2. Empat temuan High belum diselesaikan.

## Issue yang dibuat (GitHub — repo `tumbalku/simdp-bmas`)

| # | Judul | Label | Prioritas |
|---|---|---|---|
| **317** | fix(database): migration path v1 → v2.3 untuk database production yang sudah ada data | bug, blocker, security | **Blocker** |
| **318** | fix(post): lampiran pengumuman tidak melalui malware scanner dan validasi MIME berbasis konten | bug, security | High |
| **319** | fix(document): service upload abaikan requiresPeriod dan tidak ada validasi paralel di aplikasi | bug | High |
| **320** | fix(post): rate limiting tidak diterapkan pada endpoint manage dan attachments | bug, security | High |
| **321** | fix(post): pencarian feed melakukan query pada JSON Tiptap mentah (false positive) | bug | High |
| **322** | task(context): perbarui changelog, decisions-log, task-board, module-boundaries | task, documentation | Medium |
| **323** | task(post): fan-out notifikasi, read-state, dan cek visibilitas attachment | task, enhancement | Medium |
| **324** | task(repo): adakan branch development sebagai target integrasi | task | Medium |
| **325** | task(review): catat hal yang sudah baik, temuan Low, dan gap test trigger DB | task, documentation | Backlog |

Label baru dibuat: `blocker` (B60205), `security` (6B2D8C).

## Relasi blocking

```
317 (blocker)  ──blocks──► 322 (dokumentasi context)
317            ──blocks──► 323 (optimisasi post)
317            ──blocks──► 324 (branch development)
318            ──blocks──► 322
319            ──blocks──► 322
321            ──blocks──► 322
```

Alasannya: #322 menulis ADR untuk keputusan yang baru pasti setelah #317/#318/#319/#321 selesai (mis. strategi migrasi, sumber kebenaran status auto-final, pengecualian malware scanner). #324 menunggu #317 karena keputusan tentang branch `v2` lokal bergantung pada apakah baseline v2 adalah greenfield atau lanjutan.

## Urutan pengerjaan (fase)

### Fase 0 — persiapan workflow (sebelum menulis kode)

1. Kerjakan **#324** lebih dulu untuk bagian non-kontroversial: buat branch `development` di remote dari `main` terbaru, lalu PR-PR berikutnya menargetkan `development` (bukan `main`) sesuai `AGENTS.md` §2.
   - `git checkout main && git pull && git checkout -b development && git push -u origin development`
   - Keputusan tentang branch `v2` lokal dan perubahan default branch → butuh persetujuan user; catat di `decisions-log.md`.
2. Buka PR dari `codex/align-v2-code` **ke `development`** dengan status **Draft** + checklist issue-issue di atas, agar review tidak tertinggal.

### Fase 1 — blocker migrasi (sebelum semua)

**#317** — paling berisiko, dikerjakan dulu karena:
- menentukan schema final yang dipakai issue lain;
- high-risk menurut `AGENTS.md` §10 → butuh persetujuan eksplisit + jendela maintenance.

Langkah:
1. Ambil **backup database production asli** → restore ke local sebagai `simdp_rehearsal`.
2. Tulis `prisma/migrations-v2/<ts>_migrate_v1_to_v2/migration.sql`:
   - `CREATE TABLE "StoredFile"` → backfill dari `DocumentRecord` (`gen_random_uuid()`) → add column `storedFileId` → update → `SET NOT NULL` → drop kolom file lama;
   - `RENAME COLUMN "employeeId" TO "claimedNip"`;
   - mapping enum registrasi (`PENDING_ADMIN_REVIEW` → `UNDER_REVIEW`, `EXPIRED` → `EMAIL_PENDING` atau status terminal baru) **sebelum** `ALTER TYPE`;
   - `createdBy` backfill (fallback: user admin pertama) sebelum `SET NOT NULL`;
   - FK/`onDelete` `Employee.userId`.
3. Arsipkan `prisma/migrations` → `prisma/migrations-archive/` + README.
4. Samakan ground-truth SQL: update `dms_pegawai_schema.sql` ke v2.3, atau nyatakan deprecated + ganti dengan `database.sql v2.3` (hilangkan sumber kebenaran ganda).
5. Jalankan di `simdp_rehearsal`; verifikasi row count + sample dokumen (hash sama) + data registrasi lama + data pegawai utuh.
6. Uji rollback (restore backup, jalankan ulang).
7. Uji rantai migration dari database **fresh** (baseline baru) untuk memastikan tidak rusak.
8. Tulis runbook di `context/technical/migration-v1-to-v2.md` (preflight, backup, dry-run, apply, verify, rollback).
9. Setelah migrasi tersedia, barulah #323 bisa dikerjakan.

### Fase 2 — temuan High (paralel, satu issue = satu branch)

Urutan rekomendasi (risiko tertinggi dulu):

1. **#318** — `scanFileBuffer` + magic-byte sniffing pada lampiran post; `mimeType` dari hasil sniffing, bukan `file.type`; tolak dengan `AppError` 400.
2. **#319** — field `periodStartDate`/`periodEndDate` di service upload + validasi `requiresPeriod` → `AppError` 400; baca `uploaderRole`/`adminUploadAutoFinal`; **putuskan satu sumber kebenaran status auto-final** (trigger *atau* service) → ADR; tangkap `PrismaClientKnownRequestError` di route.
3. **#320** — `enforceApiRateLimit()` di 7 endpoint posts (`manage` GET/POST, `manage/[id]` GET/PATCH/DELETE, `target-options`, `attachments/[id]`); kategori download attachment dipisah.
4. **#321** — pilih opsi A (batasi pencarian ke `title`, paling sederhana untuk v1) atau opsi B (kolom `contentText` generated). Catat keputusan di `decisions-log.md`.

### Fase 3 — dokumentasi & optimisasi

1. **#322** — changelog (6 perubahan utama), 4+ ADR (StoredFile, trigger rules, strategi migrasi, enum registrasi), task-board, module-boundaries (modul `post`). Dikerjakan **setelah** Fase 2 agar ADR akurat.
2. **#323** — fan-out notifikasi PUBLIC (batch/queue atau andalkan feed), pisahkan read-state dari notifikasi, peringan query visibilitas attachment.

### Fase 4 — backlog (opsional, tidak blocks merge)

**#325** — temuan Low (L-1 s/d L-10) + gap test trigger (mock Prisma tidak menguji trigger DB; pertimbangkan integration test DB nyata).

## Verifikasi akhir sebelum PR

Setiap PR wajib lulus (sesuai `AGENTS.md` §6):

```bash
npm run lint
npm run typecheck
npm run build
npm run prisma:validate
npm run prisma:generate
npm test
```

Untuk PR yang menyentuh database (#317), tambahan:

```bash
npx prisma migrate diff --from-migrations prisma/migrations-v2 --to-schema-datamodel prisma/schema.prisma
```

## Uji manual pada database nyata (wajib sebelum merge)

Diuji pada **dua** jenis database:

**A. Fresh install** (baseline baru):
- seed → login → upload dokumen → verifikasi → publish post → download attachment.

**B. Hasil migrasi v1 → v2** (dari backup production):
- data pegawai utuh (bandingkan row count + sample);
- dokumen existing dapat dilihat dan didownload (hash identik);
- permohonan registrasi ber-status lama tidak hilang/invalid;
- upload dokumen periodik (lihat #319);
- upload admin auto-final → status APPROVED tanpa duplikat history;
- replace dokumen existing;
- publish post TARGETED dan PUBLIC → feed + notifikasi + read-state.

## Keputusan yang butuh persetujuan user (Arsi)

1. **Menjalankan migrasi v2.3 di production** — high-risk (`AGENTS.md` §10). Butuh persetujuan eksplisit + jendela maintenance. **Jangan dijalankan tanpa persetujuan.**
2. **Mengubah default branch repo ke `development`** — menyentuh pengaturan repository.
3. **Nasib branch `v2` lokal** — apakah greenfield terpisah atau harus di-merge ke `development` (menentukan apakah #317 perlu baseline fresh-install tambahan).
4. **Pilihan M-3 (#323)** — notifikasi per-user untuk post PUBLIC atau andalkan feed (berdampak pada UX + arsitektur read-state).
5. **Pilihan #321** — pencarian `title` saja (A) atau kolom `contentText` (B).

## Referensi

- `REVIEW.md` — review lengkap (verdict, temuan B-1, H-1..H-4, M-1..M-11, L-1..L-10).
- `AGENTS.md` §2 (workflow), §6 (verifikasi), §10 (safety defaults).
- `CONTRIBUTING.md` — branch naming, Conventional Commits, PR rules.
