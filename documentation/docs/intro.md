---
sidebar_position: 1
title: Mulai Dari Sini
slug: /
---

# SIMDP / SiCantIK

SIMDP adalah Sistem Informasi Manajemen Dokumen Pegawai untuk RSUD Bahteramas. Di dalam aplikasi, branding yang digunakan adalah **SiCantIK**: Sistem Pencatatan Informasi Kepegawaian.

Dokumentasi ini menjelaskan bagaimana project bekerja dari sudut pandang developer, operator, auditor keamanan, dan pengguna internal.

## Apa yang dilakukan aplikasi

SIMDP menyimpan dan mengelola:

- akun user dan role akses;
- profil pegawai dan riwayat karier;
- master data kepegawaian;
- jenis dokumen yang wajib atau opsional;
- file dokumen pegawai;
- proses verifikasi dokumen oleh Staff/Admin;
- notifikasi status dan pengingat kedaluwarsa;
- audit log untuk aksi sensitif;
- backup dan recovery database serta storage dokumen.

## Stack utama

| Area | Teknologi |
|---|---|
| Web app | Next.js 15 App Router |
| Bahasa | TypeScript |
| UI | Tailwind CSS v4, shadcn/ui, Base UI |
| Chart | Recharts dengan pola Tremor Raw |
| Database | PostgreSQL, Prisma 7, Supabase-compatible |
| Auth | Custom JWT dan refresh token httpOnly cookie |
| Storage | Local, Supabase Storage, S3-ready |
| Test | Vitest, ESLint, TypeScript typecheck |
| Docs | Docusaurus |

## Jalur baca cepat

Jika Anda developer baru, mulai dari:

1. [Setup lokal](./developer/setup-local.md)
2. [Environment](./developer/environment.md)
3. [Module development](./developer/module-development.md)
4. [Testing](./developer/testing.md)

Jika Anda operator/deployment owner, mulai dari:

1. [Deployment overview](./operator/deployment-overview.md)
2. [Backup & recovery](./operator/backup-recovery.md)
3. [Restore runbook](./operator/restore-runbook.md)
4. [Incident checklist](./operator/incident-checklist.md)

Jika Anda ingin memahami desain sistem, mulai dari:

1. [Architecture overview](./architecture/overview.md)
2. [Module boundaries](./architecture/module-boundaries.md)
3. [Data flow](./architecture/data-flow.md)
4. [Database](./architecture/database.md)

## Source of truth

Dokumentasi Docusaurus ini adalah portal baca utama. Detail historis dan catatan keputusan tetap berada di folder `context/`.

Aturan praktis:

- perubahan behavior aplikasi harus memperbarui docs yang relevan;
- keputusan arsitektur baru harus masuk ke `context/memory/decisions-log.md`;
- runbook operasional detail tetap disimpan di `context/operations/`;
- secret asli tidak boleh ditulis di dokumentasi, issue, PR, log, atau audit metadata.
