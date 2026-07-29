---
title: Source Docs
---

# Source Docs

Docusaurus adalah portal baca utama. Source detail masih berada di repo.

## Source utama

| Source | Isi |
|---|---|
| `README.md` | Ringkasan project dan command dasar. |
| `PRD-SIMDP-v2.0-20260708.md` | Product requirement utama. |
| `DESIGN.md` | Design tokens dan aturan visual. |
| `AGENTS.md` | Workflow agent, branch, review, dan quality gate. |
| `context/memory/changelog.md` | Catatan perubahan. |
| `context/memory/decisions-log.md` | Keputusan arsitektur/proyek. |
| `context/architecture/` | Boundary, pattern, diagram, ADR. |
| `context/domain/` | Entity, business rules, RBAC. |
| `context/security/` | Auth, RBAC security, audit. |
| `context/technical/` | API, database, env, storage. |
| `context/operations/` | Backup/recovery dan restore drill. |

## Cara menjaga sinkron

Jika kode berubah:

1. Update halaman Docusaurus yang dibaca manusia.
2. Update source context yang menjadi catatan detail.
3. Update changelog jika behavior berubah.
4. Update decisions log jika ada keputusan baru.
5. Jalankan `npm run docs:build`.
