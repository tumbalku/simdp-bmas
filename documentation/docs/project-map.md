---
sidebar_position: 2
title: Project Map
---

# Project Map

Halaman ini adalah peta folder penting agar developer cepat tahu harus membuka file mana.

## Struktur utama

```txt
SIMDP/
  src/
    app/                 Next.js App Router
    components/          UI shared dan shadcn wrappers
    lib/                 runtime infrastructure dan provider
    modules/             bounded context aplikasi
    utils/               helper umum non-infrastruktur
  prisma/                Prisma schema dan migration baseline
  scripts/               helper operasional dan automation
  context/               source context historis proyek
  documentation/         Docusaurus docs site
  tests/                 architecture/integration tests
```

## Folder aplikasi

| Path | Fungsi |
|---|---|
| `src/app/` | Route UI dan API. `page.tsx` harus tipis. |
| `src/app/(public)/` | Halaman login, forgot password, reset password. |
| `src/app/(dashboard)/` | Halaman yang membutuhkan session login. |
| `src/app/api/v1/` | REST route handlers untuk auth, upload/download, cron, dan API publik terbatas. |
| `src/modules/` | Modul domain: auth, employee, document, verification, notification, settings, security, statistics. |
| `src/lib/env.ts` | Validasi env dengan Zod. |
| `src/lib/prisma.ts` | Prisma Client singleton. |
| `src/lib/storage/` | Satu-satunya boundary storage provider aplikasi. |
| `src/lib/backup/` | Kontrak dan target backup artifact. |
| `src/lib/events/` | Event bus internal untuk side effect async. |

## Folder dokumentasi dan operasi

| Path | Fungsi |
|---|---|
| `context/architecture/` | Boundary modul, pattern, ADR, diagram. |
| `context/domain/` | Entity domain, business rules, RBAC. |
| `context/security/` | Auth flow, RBAC security, audit log. |
| `context/technical/` | Database, env, API contract, storage provider. |
| `context/operations/` | Backup, disaster recovery, restore drill. |
| `context/memory/` | Changelog, decisions log, known issues. |
| `documentation/` | Website dokumentasi berbasis Docusaurus. |

## Modul domain

| Modul | Tanggung jawab |
|---|---|
| `auth` | Login, refresh token, reset password, session management. |
| `employee` | Profil pegawai, master data HR, career history. |
| `document` | DocumentType, DocumentRecord, upload, download, lifecycle dokumen. |
| `verification` | Approve/reject dokumen dan VerificationHistory. |
| `notification` | Notifikasi in-app dan read state. |
| `statistics` | Dashboard dan agregasi read-only. |
| `security` | SecurityLog dan helper audit. |
| `settings` | SystemSetting dan konfigurasi runtime. |

## Command utama

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run prisma:validate
npm run docs:dev
npm run docs:build
```
