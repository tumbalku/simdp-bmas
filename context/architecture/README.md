# Architecture Context — SIMDP

Folder ini menjelaskan keputusan arsitektur dan boundary modul SIMDP.

## File Utama

- `system-overview.md` — gambaran sistem tingkat tinggi.
- `module-boundaries.md` — aturan boundary antar modul.
- `patterns.md` — pola implementasi yang wajib diikuti.
- `agent-orchestration.md` — workflow Hermes/mes + Antigravity + reviewer personas.

## ADR

Subfolder `adr/` berisi Architecture Decision Records:

- `ADR-001-app-router.md`
- `ADR-002-prisma-orm.md`
- `ADR-003-storage-provider.md`
- `ADR-004-custom-jwt.md`
- `ADR-005-statistics-readonly.md`
- `ADR-006-single-device-login.md`
- `ADR-007-flexible-identifier.md`
- `ADR-008-rest-api.md`

Jika ada keputusan arsitektur baru, buat ADR baru dengan nomor berikutnya dan tambahkan referensi ke `context/memory/decisions-log.md` bila keputusan tersebut memengaruhi implementasi.
