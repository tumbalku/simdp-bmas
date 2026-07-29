---
title: Setup Local
---

# Setup Local

Panduan ini untuk developer yang ingin menjalankan SIMDP di mesin lokal.

## Requirement

- Node.js versi modern yang kompatibel dengan Next.js 15.
- npm.
- PostgreSQL lokal, Docker PostgreSQL, atau Supabase project.
- Git.

Opsional:

- ClamAV jika ingin menguji malware scanning fail-closed.
- Docker jika memakai database container atau backup `docker-image`.

## Install dependency

```bash
npm install
```

## Siapkan env

Gunakan salah satu template:

```txt
.env.local.example
.env.supabase.example
.env.vps-local.example
.env.backup-supabase.example
.env.restore-local.example
```

Untuk development paling sederhana:

```bash
copy .env.local.example .env
```

Isi minimal:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/simdp
DIRECT_URL=postgresql://user:password@localhost:5432/simdp
STORAGE_PROVIDER=local
JWT_SECRET=dev-change-me
REFRESH_TOKEN_SECRET=dev-change-me-too
CRON_SECRET=dev-cron-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Jangan commit `.env`.

## Prisma

```bash
npm run prisma:validate
npm run prisma:generate
```

Jika database belum memiliki schema, gunakan migration baseline sesuai workflow proyek. Jangan mengubah migration production tanpa backup.

## Jalankan app

```bash
npm run dev
```

Buka:

```txt
http://localhost:3000
```

## Quality gate minimum

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Untuk perubahan database:

```bash
npm run prisma:validate
npm run prisma:generate
```
