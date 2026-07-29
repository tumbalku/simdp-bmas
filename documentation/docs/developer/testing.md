---
title: Testing
---

# Testing

SIMDP memakai Vitest, ESLint, TypeScript typecheck, dan Next build sebagai quality gate.

## Command utama

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Test spesifik

Jalankan satu file test:

```bash
npm run test -- src/lib/backup/__tests__/backup.test.ts
```

Architecture guard:

```bash
npm run test -- tests/architecture/architecture-guards.test.ts
```

## Area yang wajib diuji

| Area | Fokus test |
|---|---|
| Auth | login identifier, password, refresh token rotation, reset password. |
| Document | upload validation, ownership, download, expiry reminder. |
| Employee | CRUD, import/export, ownership profile. |
| Verification | approve/reject, review note, history. |
| Notification | read state, event handling. |
| Security | rate limit, audit events, RBAC. |
| Backup | env validation, target selection, storage snapshot. |

## Build docs

Untuk memastikan Docusaurus valid:

```bash
npm run docs:build
```

## Catatan praktis

Jika `npm run typecheck` gagal karena `.next/types` sedang dibuat oleh build paralel, jalankan ulang typecheck setelah build selesai.
