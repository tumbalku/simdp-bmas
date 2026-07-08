# API Contracts — SIMDP

**Status:** Draft awal
**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §11
**Terakhir diperbarui:** 2026-07-08

## Prinsip Umum

- REST endpoint berada di `/api/v1/*`.
- Auth publik/file/cron memakai Route Handler.
- Mutasi internal dashboard/form memakai Server Actions.
- Komponen client tidak boleh `fetch` langsung; harus lewat `hooks.ts` → `api.ts`.
- Semua request body/query/form-data wajib divalidasi Zod sebelum service call.

## Route Handlers

| Endpoint | Method | Fungsi | Role |
|---|:---:|---|---|
| `/api/v1/auth/login` | `POST` | Login identifier fleksibel | Public |
| `/api/v1/auth/refresh` | `POST` | Rotasi refresh token | Authenticated cookie |
| `/api/v1/auth/logout` | `POST` | Revoke token dan hapus cookie | Authenticated |
| `/api/v1/auth/forgot-password` | `POST` | Kirim email reset password | Public |
| `/api/v1/auth/reset-password` | `POST` | Reset password dengan token | Public |
| `/api/v1/documents/upload` | `POST` | Upload dokumen via server-mediated `IStorageProvider` | Employee+ |
| `/api/v1/documents/download/[id]` | `GET` | Generate temporary preview/download URL | Owner / Staff / Admin |
| `/api/v1/cron/check-expiry` | `GET` | Cek expiry dan kirim reminder | System via `CRON_SECRET` |

## Auth Endpoint Shapes

### `POST /api/v1/auth/login`

Request:

```json
{
  "identifier": "NIP atau NIK atau email",
  "password": "password"
}
```

Response aman minimal:

```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "EMPLOYEE",
    "employeeId": "employee_id_optional"
  }
}
```

Side effect:
- set httpOnly access cookie;
- set httpOnly refresh cookie;
- revoke refresh token lama;
- audit auth event.

### `POST /api/v1/auth/refresh`

Request: refresh token dari cookie.

Response:

```json
{
  "ok": true
}
```

Side effect:
- revoke refresh token lama;
- buat refresh token baru;
- set cookie baru.

### `POST /api/v1/auth/logout`

Request: token dari cookie.

Response:

```json
{
  "ok": true
}
```

Side effect: revoke refresh token aktif dan hapus cookie.

## Document Upload

### `POST /api/v1/documents/upload`

Content-Type: `multipart/form-data`.

Fields:

| Field | Required | Keterangan |
|---|:---:|---|
| `documentTypeId` | Yes | ID DocumentType. |
| `file` | Yes | File dokumen. |
| `title` | No | Judul opsional. |
| `documentNumber` | Conditional | Wajib jika DocumentType membutuhkan nomor dokumen. |
| `issueDate` | Conditional | Wajib jika DocumentType membutuhkan tanggal terbit. |
| `expiryDate` | Conditional | Wajib jika DocumentType membutuhkan tanggal expired. |

Server wajib:
1. auth check minimal Employee;
2. ownership check;
3. Zod validation;
4. cek aturan DocumentType;
5. verifikasi ukuran dan MIME dari isi file;
6. hitung SHA-256;
7. generate `filePath` standar;
8. upload via `IStorageProvider`;
9. simpan `DocumentRecord`;
10. kirim notifikasi pending;
11. audit `DOCUMENT_UPLOADED`.

## Document Download/Preview

### `GET /api/v1/documents/download/[id]`

Response:

```json
{
  "url": "temporary-signed-or-internal-url"
}
```

Rules:
- Employee hanya dokumen sendiri.
- Staff/Admin boleh dokumen semua pegawai.
- URL berlaku sementara, default 300 detik.
- Tidak boleh return URL publik permanen.

## Cron

### `GET /api/v1/cron/check-expiry`

Security:
- wajib validasi `CRON_SECRET`.

Flow:
1. tandai dokumen lewat expiry sebagai `EXPIRED`;
2. kirim reminder H-30 jika belum `reminderH30SentAt`;
3. kirim reminder H-7 jika belum `reminderH7SentAt`;
4. kirim reminder H-1 jika belum `reminderH1SentAt`;
5. threshold dari `SystemSetting`.

## Server Actions

| Action | Modul | Role Minimum |
|---|---|---|
| `softDeleteDocumentAction(id)` | document | Employee owner |
| `restoreDocumentAction(id)` | document | Admin |
| `verifyDocumentAction(id, decision, note)` | verification | Staff |
| `crudDocumentTypeAction()` | document | Admin |
| `crudEmployeeAction()` | employee | Admin |
| `addCareerHistoryAction(data)` | employee | Admin |
| `crudMasterDataAction()` | employee | Admin |
| `updateProfileAction(data)` | employee | Employee self |
| `changePasswordAction(data)` | auth | Employee self |
| `revokeSessionAction(tokenId)` | auth | Employee self |
| `revokeAllSessionsAction()` | auth | Employee self |
| `markNotificationReadAction(id)` | notification | Employee self |
| `markAllNotificationsReadAction()` | notification | Employee self |
| `getStatisticsAction(filter)` | statistics | Staff |
| `getSecurityLogAction(filter)` | security | Admin |
| `updateSystemSettingAction(data)` | settings | Admin |
| `importEmployeesAction(csv)` | employee | Admin |
