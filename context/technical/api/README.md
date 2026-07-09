# API Documentation — SIMDP v1

**Status:** Docs-first roadmap
**Sumber utama:** `context/technical/api-contracts.md`, `context/security/*`, `context/domain/*`, `prisma/schema.prisma`
**Terakhir diperbarui:** 2026-07-09

Dokumentasi di folder ini adalah kontrak kerja sebelum implementasi API. Frontend, backend, dan reviewer harus memakai dokumen ini sebagai sumber kesepakatan bentuk request/response, role, error, side effect, dan verifikasi.

## 1. Prinsip Docs-first

API SIMDP dikerjakan dengan urutan berikut:

1. Tulis kontrak API lengkap.
2. Review kontrak terhadap RBAC, audit, Zod validation, module boundary, dan Prisma schema.
3. Pecah implementasi menjadi issue kecil.
4. Baru implementasi route handler, server action, service, repository, dan hook/frontend client.

Tidak boleh membuat endpoint baru hanya berdasarkan asumsi UI. Jika frontend butuh data baru, tambahkan dulu ke kontrak API terkait.

## 2. File Dokumentasi

| File | Scope | Status | Backlog |
|---|---|---|---|
| `conventions.md` | Standar umum request/response, error, pagination, filter, auth, audit, dan frontend API client | Ready for implementation | `SIMDP-API-DOCS-001` |
| `auth.md` | Login, refresh, logout, forgot/reset password, change password, session revoke | Ready for implementation | `SIMDP-API-DOCS-002` |
| `employee-master-data.md` | Profile, employee CRUD, career history, master data HR | Ready with notes | `SIMDP-API-DOCS-003` |
| `documents.md` | Document type, target rules, upload, preview/download, document record lifecycle | Ready with notes | `SIMDP-API-DOCS-004` |
| `verification-notification.md` | Approve/reject, verification history, notification list/read state | Ready for implementation | `SIMDP-API-DOCS-005` |
| `system.md` | Settings, security log, statistics, cron expiry reminder | Ready for implementation | `SIMDP-API-DOCS-006` |

## 3. API Surface untuk Frontend

Frontend tidak memanggil `fetch()` langsung dari React component. Pola wajib:

```txt
Component -> src/modules/<module>/hooks.ts -> src/modules/<module>/api.ts -> /api/v1/* atau Server Action -> service.ts
```

### 3.1 Route Handler REST

Route Handler dipakai untuk request yang memang perlu HTTP boundary eksplisit:

| Kelompok | Endpoint | Method | Pemakai Frontend | Minimum Role |
|---|---|:---:|---|---|
| Auth | `/api/v1/auth/login` | `POST` | Login page | Public |
| Auth | `/api/v1/auth/refresh` | `POST` | API client/session recovery | Cookie authenticated |
| Auth | `/api/v1/auth/logout` | `POST` | Navbar/profile menu | Authenticated |
| Auth | `/api/v1/auth/forgot-password` | `POST` | Forgot password page | Public |
| Auth | `/api/v1/auth/reset-password` | `POST` | Reset password page | Public |
| Document | `/api/v1/documents/upload` | `POST` | Document upload form | EMPLOYEE+ with ownership |
| Document | `/api/v1/documents/download/[id]` | `GET` | Preview/download button | Owner, STAFF, ADMIN |
| Cron | `/api/v1/cron/check-expiry` | `GET` | System only, not UI | `CRON_SECRET` |

### 3.2 Server Actions untuk Dashboard/Form

Server Actions dipakai untuk mutasi dashboard/form internal yang tidak perlu public REST contract terpisah.

| Modul | Action | Pemakai Frontend | Minimum Role |
|---|---|---|---|
| Auth | `changePasswordAction(data)` | Profile/security form | Authenticated self |
| Auth | `revokeSessionAction(tokenId)` | Session management UI | Authenticated self |
| Auth | `revokeAllSessionsAction()` | Session management UI | Authenticated self |
| Employee | `updateProfileAction(data)` | Employee profile form | EMPLOYEE self |
| Employee | `crudEmployeeAction()` | Employee admin pages | ADMIN |
| Employee | `addCareerHistoryAction(data)` | Employee admin detail | ADMIN |
| Employee | `crudMasterDataAction()` | Master data pages | ADMIN |
| Document | `softDeleteDocumentAction(id)` | Document list/detail | Employee owner, STAFF/ADMIN by rule |
| Document | `restoreDocumentAction(id)` | Document admin screens | ADMIN |
| Document | `crudDocumentTypeAction()` | Document type admin pages | ADMIN |
| Verification | `verifyDocumentAction(id, decision, note)` | Verification queue | STAFF |
| Notification | `markNotificationReadAction(id)` | Notification dropdown/page | Authenticated owner |
| Notification | `markAllNotificationsReadAction()` | Notification page | Authenticated owner |
| Statistics | `getStatisticsAction(filter)` | Dashboard statistics | STAFF |
| Security | `getSecurityLogAction(filter)` | Security log page | ADMIN |
| Settings | `updateSystemSettingAction(data)` | Settings page | ADMIN |
| Employee | `importEmployeesAction(csv)` | Admin import UI | ADMIN |

> Catatan: nama action final boleh berubah saat kontrak detail dibuat, tetapi perubahan harus dicatat di dokumen API terkait sebelum implementasi.

## 4. Urutan Implementasi yang Disarankan

Setelah semua dokumen kontrak selesai dan direview:

1. `SIMDP-API-001` — API foundation: response helpers, error helpers, auth guard, role guard, route handler conventions.
2. `SIMDP-API-002` — Auth API.
3. `SIMDP-API-003` — Employee & Master Data API.
4. `SIMDP-API-004` — Document API.
5. `SIMDP-API-005` — Verification & Notification API.
6. `SIMDP-API-006` — Settings, Security Log, Statistics, Cron API.

## 5. Contract Status Rules

Setiap endpoint/action punya status:

| Status | Makna |
|---|---|
| `Draft` | Masih boleh berubah, belum siap implementasi. |
| `Ready for review` | Kontrak lengkap dan menunggu review mes/Sil. |
| `Reviewed` | Sudah direview, ada catatan minor atau siap final. |
| `Ready for implementation` | Boleh dibuat issue implementasi dan mulai coding. |
| `Implemented` | Sudah ada kode dan verification lulus. |

## 6. Checklist Review Kontrak API

Sebuah kontrak API dianggap siap implementasi jika semua poin ini jelas:

- [ ] Path/method atau nama Server Action sudah jelas.
- [ ] Pemakai frontend dan use case UI tertulis.
- [ ] Role minimum dan ownership rule tertulis.
- [ ] Request params/query/body/form-data lengkap.
- [ ] Response sukses memakai envelope standar.
- [ ] Error response memakai shape standar.
- [ ] Validasi Zod yang perlu dibuat disebutkan.
- [ ] Service boundary jelas dan tidak bypass repository modul lain.
- [ ] Side effect database/storage/notification jelas.
- [ ] Audit event untuk aksi sensitif jelas.
- [ ] Soft delete dan ownership filter dipertimbangkan.
- [ ] Verification command untuk implementasi tertulis.

## 7. Rules Khusus Frontend

Frontend harus mengikuti aturan ini:

- Tidak ada `fetch()` langsung di component.
- API wrapper berada di `src/modules/<module>/api.ts`.
- Hook berada di `src/modules/<module>/hooks.ts`.
- Hook hanya memanggil `api.ts` modul yang sama.
- Client component tidak import `src/lib/env.ts`, `src/lib/prisma.ts`, atau server-only helper.
- Semua error dari API ditampilkan dari `error.message` yang aman untuk user.
- Form validation client hanya untuk UX; validasi server tetap wajib.
- Upload dokumen memakai `FormData` dan endpoint `/api/v1/documents/upload`.
- Auth cookie httpOnly tidak dibaca frontend; frontend hanya memanggil endpoint/session action.

## 8. Related Project Rules

Dokumentasi ini harus konsisten dengan:

- `context/architecture/module-boundaries.md`
- `context/architecture/patterns.md`
- `context/coding-standards/golden-rules.md`
- `context/security/auth-flow.md`
- `context/security/rbac.md`
- `context/domain/business-rules.md`
- `context/technical/database.md`
