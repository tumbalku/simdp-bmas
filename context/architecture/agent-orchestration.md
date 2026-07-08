# Agent Orchestration — SIMDP

**Status:** Draft awal
**Sumber:** SIMDP company-style workflow, Antigravity `agent-skills`, dan keputusan user/mes
**Terakhir diperbarui:** 2026-07-09

Dokumen ini menjelaskan cara SIMDP memakai Hermes/mes, Antigravity, dan reviewer personas sebagai satu workflow engineering yang terkontrol.

## Tujuan

Orkestrasi ini dibuat supaya agent membantu pekerjaan coding tanpa mengambil alih keputusan project.

Target utama:

- menjaga workflow perusahaan: issue → branch → PR → review/tests → merge;
- memastikan agent membaca context yang relevan sebelum coding;
- mencegah agent mengerjakan hal di luar instruksi;
- membuat review teknis lebih konsisten;
- menjaga user tetap menjadi final approver GitHub.

## Role Tim

| Role | Pemilik | Tanggung jawab |
|---|---|---|
| Product Owner / Maintainer | User / Arsi | Menentukan prioritas, menyetujui keputusan besar, approve/merge PR di GitHub. |
| Orchestrator / Senior Reviewer | Hermes / mes | Membuat/menjaga issue, branch, instruksi, review teknis, verifikasi, dan verdict. |
| Developer Agent | Antigravity (`agy`) | Mengimplementasikan task sesuai instruksi, tidak melebar di luar scope. |
| Code Reviewer | `code-reviewer` persona | Review correctness, readability, architecture, security, performance. |
| Test Reviewer | `test-engineer` persona | Review test strategy, coverage, edge cases, regression risk. |
| Security Reviewer | `security-auditor` persona | Review auth, RBAC, secrets, env, database access, upload, dan audit log. |
| Performance Reviewer | `web-performance-auditor` persona | Review UI performance, dashboard, charts, Core Web Vitals. |

## Approval Policy

User memegang final approval untuk:

- merge PR;
- approve PR di GitHub;
- perubahan branch protection;
- perubahan repository settings;
- keputusan fitur besar;
- tindakan high-risk seperti migrasi database production atau force push.

mes dapat menangani approval operasional yang aman saat mengorkestrasi agent:

- membaca file;
- edit file sesuai scope task;
- menjalankan lint/typecheck/build;
- menjalankan Prisma validate/generate;
- membaca git diff/status;
- membuat branch/issue/PR sesuai workflow yang sudah disetujui.

Jika tindakan berisiko, mes harus berhenti dan meminta keputusan user.

## Workflow Standar

```txt
User memberi task
  ↓
mes sync main + buat/cek issue
  ↓
mes buat feature branch
  ↓
mes siapkan instruksi dan context wajib
  ↓
Antigravity implement task
  ↓
mes review diff + run verification
  ↓
reviewer persona dipanggil bila perlu
  ↓
mes beri verdict: APPROVE / REQUEST CHANGES / HOLD
  ↓
user approve/merge di GitHub
  ↓
mes sync main + cleanup branch
```

## Context yang Wajib Dibaca Agent

Root `AGENTS.md` adalah instruksi operasional utama untuk Antigravity dan agent lain.

Sebelum coding, agent wajib membaca context sesuai kategori task:

### Semua task coding

- `README.md`
- `context/progress/task-board.md`
- `context/memory/changelog.md`
- `context/memory/decisions-log.md`
- `context/architecture/module-boundaries.md`
- `context/architecture/patterns.md`
- `context/coding-standards/golden-rules.md`
- `context/coding-standards/file-structure.md`
- `context/coding-standards/naming.md`
- `context/coding-standards/checklist.md`

### UI

- `DESIGN.md`
- `context/ui/design-system.md`
- `context/ui/pages.md`

### Database

- `context/technical/database.md`
- `context/technical/environment.md`
- `prisma/schema.prisma`
- `prisma.config.ts`
- `dms_pegawai_schema.sql` jika schema parity diperlukan

### Auth/Security

- `context/security/auth-flow.md`
- `context/security/rbac.md`
- `context/security/audit.md`
- `context/domain/rbac.md`

### Domain/Module

- `context/domain/entities.md`
- `context/domain/business-rules.md`
- file module terkait di `src/modules/<module>/`

## Scope Control

Agent hanya boleh mengerjakan hal yang tertulis di issue/instruksi.

Jika menemukan masalah lain:

1. catat sebagai note;
2. usulkan follow-up issue;
3. jangan memperbaiki di branch task berjalan kecuali diminta.

Contoh yang tidak boleh dilakukan tanpa instruksi:

- refactor unrelated code;
- rename unrelated files/symbols;
- mengganti library atau design system;
- mengubah arsitektur tanpa ADR/context update;
- mengubah `.env` asli;
- push/merge langsung ke `main`;
- menjalankan destructive command.

## Penggunaan Antigravity `agent-skills`

Plugin `agent-skills` sudah dipasang di Antigravity.

Gunakan bertahap:

| Kebutuhan | Command |
|---|---|
| Membuat spesifikasi fitur | `/spec` |
| Memecah task | `/planning` |
| Implement satu slice | `/build` |
| TDD/testing workflow | `/test` |
| Review kualitas kode | `/review` |
| Simplifikasi kode | `/code-simplify` |
| Pre-merge / pre-ship fan-out | `/ship` |
| Audit performa web | `/webperf` |

Untuk SIMDP tahap awal, prefer:

```txt
/planning → /build → /review
```

Hindari `/build auto` kecuali ada spec jelas dan user/mes menyetujui autonomous multi-task execution.

## Reviewer Routing

| Situasi | Reviewer wajib/disarankan |
|---|---|
| Code change non-trivial | `code-reviewer` |
| Logic-heavy / bug fix / flow penting | `test-engineer` |
| Auth/RBAC/secret/env/database/upload/audit | `security-auditor` |
| UI dashboard/chart/performance | `web-performance-auditor` |
| Perubahan besar sebelum merge | `/ship` fan-out |

Fan-out harus flat. Persona tidak memanggil persona lain. mes/main agent yang mensintesis hasil review.

## Verdict Review

mes memberi salah satu verdict:

### APPROVE

Perubahan sesuai scope, verification pass, risiko dapat diterima.

### REQUEST CHANGES

Ada masalah yang harus diperbaiki sebelum commit/PR/merge.

### HOLD

Ada keputusan product/security/arsitektur yang harus diputuskan user dulu.

## Quality Gates

Minimum untuk code change:

```bash
npm run lint
npm run typecheck
npm run build
```

Untuk database/Prisma:

```bash
npm run prisma:validate
npm run prisma:generate
```

Untuk UI:

- jalankan dev server bila perlu;
- smoke check browser;
- cek console error;
- pastikan sesuai `DESIGN.md` dan shadcn/ui.

## Batasan Tahap Awal

Untuk sekarang SIMDP hanya memakai satu core team:

```txt
User + mes + Antigravity + reviewer personas sesuai kebutuhan
```

Belum memakai banyak workstream paralel, nested teams, atau autonomous multi-branch execution. Itu baru dipertimbangkan setelah module utama lebih stabil.
