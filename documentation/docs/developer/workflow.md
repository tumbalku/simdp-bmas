---
title: Development Workflow
---

# Development Workflow

Workflow normal SIMDP memakai `development` sebagai branch integrasi aktif.

## Branch

```txt
main         final/stable
development integrasi harian
feature/*   pekerjaan satu scope
docs/*      dokumentasi
fix/*       bug fix
```

Feature branch normal dibuat dari `development` dan PR menargetkan `development`.

## Urutan kerja

1. Sync `development`.
2. Buat branch kecil sesuai scope.
3. Baca context yang relevan.
4. Implement hanya scope tersebut.
5. Update docs/context jika behavior berubah.
6. Jalankan quality gate.
7. Commit dengan Conventional Commit.
8. Push branch.
9. Buat PR ke `development`.
10. Merge setelah review/checks lulus.

## Commit message

```txt
<type>(<scope>): <short description>
```

Contoh:

```txt
feat(document): add upload metadata validation
fix(auth): reject expired refresh token
docs(backup): add restore runbook
```

## Quality gate

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Untuk Prisma:

```bash
npm run prisma:validate
npm run prisma:generate
```

Untuk docs:

```bash
npm run docs:build
```

## Dokumentasi wajib

Jika pekerjaan mengubah behavior, update minimal satu dari:

- `documentation/docs/...`
- `context/memory/changelog.md`
- `context/memory/decisions-log.md`
- `context/technical/...`
- `context/operations/...`

Dokumentasi Docusaurus adalah portal baca. `context/` tetap menjadi memori historis dan source detail proyek.
