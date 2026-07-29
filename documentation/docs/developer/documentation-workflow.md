---
title: Documentation Workflow
---

# Documentation Workflow

Docusaurus berada di folder `documentation/`. Folder `context/` tetap digunakan sebagai memori detail proyek.

## Kapan update docs

Update dokumentasi saat:

- behavior user berubah;
- endpoint API berubah;
- env baru ditambahkan;
- deployment flow berubah;
- backup/recovery berubah;
- keputusan arsitektur baru dibuat;
- security model berubah;
- ada runbook atau checklist baru.

## Struktur konten

| Folder | Isi |
|---|---|
| `architecture/` | Cara sistem bekerja dan boundary teknis. |
| `developer/` | Setup, workflow, testing, aturan kontribusi. |
| `operator/` | Deployment, backup, restore, incident. |
| `security/` | Auth, RBAC, audit, upload hardening. |
| `api/` | Ringkasan kontrak endpoint. |
| `user-manual/` | Panduan Admin, Staff, Employee. |
| `reference/` | Glossary dan sumber docs. |

## Menjalankan docs

```bash
npm run docs:dev
```

Build:

```bash
npm run docs:build
```

## Style penulisan

- Bahasa utama: Indonesia.
- Gunakan contoh env dummy, bukan secret asli.
- Gunakan diagram Mermaid untuk alur utama.
- Halaman Docusaurus harus ringkas dan bisa dibaca operator.
- Detail historis panjang tetap diarahkan ke `context/`.

## Source of truth

Jika ada konflik antara halaman ringkas Docusaurus dan source detail:

1. cek kode terbaru;
2. cek `context/memory/decisions-log.md`;
3. update Docusaurus dan context agar selaras.
