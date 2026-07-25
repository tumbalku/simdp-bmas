# Architecture Context — SIMDP

Folder ini menjelaskan keputusan arsitektur dan boundary modul SIMDP.

## File Utama

- `system-overview.md` — gambaran sistem tingkat tinggi.
- `module-boundaries.md` — aturan boundary antar modul.
- `patterns.md` — pola implementasi yang wajib diikuti.
- `agent-orchestration.md` — workflow Hermes/mes + Antigravity + reviewer personas.

## Diagram UML (PlantUML)

Subfolder `diagrams/` berisi berkas diagram PlantUML resmi proyek SIMDP, dipisah berdasarkan jenis UML agar lebih mudah dibaca dan dirawat:

- `diagrams/overview/` — diagram gambaran umum sistem, boundary modul, dan deployment.
- `diagrams/use-case/` — diagram kasus penggunaan berdasarkan aktor atau peran.
- `diagrams/activity/` — diagram alur proses bisnis per workflow.
- `diagrams/sequence/` — diagram urutan interaksi antar komponen per skenario.
- `diagrams/state/` — diagram lifecycle/status objek domain.
- `diagrams/class/` — diagram class/domain untuk entitas dan relasi utama.
- `diagrams/component/` — diagram boundary komponen dan alur modul.
- `diagrams/erd/` — entity relationship diagram untuk data model.
- `diagrams/notes/` — catatan istilah, konvensi, dan glossary diagram.

Seluruh panduan visual lengkap, penjelasan alur sistem untuk pembaca non-teknis, beserta daftar diagram SVG ter-embed dapat diakses pada **[Panduan Visual & Master Diagram SIMDP (`diagrams/README.md`)](diagrams/README.md)**.

Ringkasan subfolder diagram saat ini:

| Subfolder | Isi |
|---|---|
| `diagrams/overview/` | system-overview, module-boundary, deployment-overview |
| `diagrams/use-case/` | overview, auth, pegawai, staff, admin, system |
| `diagrams/activity/` | login-session, upload-document, verification-document, master-data, **master-data-admin**, reminder-expiry |
| `diagrams/sequence/` | login-refresh-logout, upload-document, verification-document, forgot-reset-password, public-verification, notification-dispatch, **master-data-admin** |
| `diagrams/state/` | document-record, refresh-token, password-reset-token, notification, **document-verification** |
| `diagrams/class/` | auth-domain, employee-domain, document-domain, notification-security-domain, domain-overview |
| `diagrams/component/` | frontend-backend-flow, module-boundary, storage-infrastructure |
| `diagrams/erd/` | auth, employee-master-data, document-verification, system-support |
| `diagrams/notes/` | diagram-conventions.md, glossary.md |

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
