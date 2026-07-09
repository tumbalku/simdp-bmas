# API v1 Conventions — SIMDP

**Status:** Ready for review
**Backlog:** `SIMDP-API-DOCS-001`
**Terakhir diperbarui:** 2026-07-09

File ini menetapkan standar semua request/response API SIMDP v1 agar backend, frontend, dan reviewer memakai bahasa kontrak yang sama.

## 1. Base URL dan Namespace

Semua REST endpoint berada di namespace:

```txt
/api/v1/*
```

Frontend wrapper boleh menerima path relatif seperti:

```ts
"/api/v1/documents/upload"
```

Jangan hardcode domain production di module `api.ts`. Gunakan relative URL agar Next.js dev/prod memakai origin yang sama.

## 2. Handler Type

SIMDP memakai dua bentuk API surface:

| Type | Dipakai untuk | Contoh |
|---|---|---|
| Route Handler | Auth publik, file upload/download, cron/system endpoint, endpoint yang perlu boundary HTTP eksplisit | `POST /api/v1/auth/login` |
| Server Action | Mutasi dashboard/form internal dan read action yang perlu server-only logic | `verifyDocumentAction(id, decision, note)` |

Route Handler tetap harus memanggil `service.ts` modul terkait. Server Action juga harus memanggil `service.ts`, bukan repository langsung.

## 3. HTTP Methods

| Method | Makna | Body |
|---|---|---|
| `GET` | Baca data tanpa side effect bisnis | Tidak ada body; pakai params/query |
| `POST` | Create, command, login/logout, upload, aksi non-idempotent | JSON atau `multipart/form-data` |
| `PATCH` | Update sebagian resource | JSON |
| `DELETE` | Soft delete resource | Biasanya tidak ada body; alasan delete boleh JSON jika diperlukan |

> Untuk v1, hard delete tidak dipakai kecuali ada keputusan baru.

## 4. Content-Type

| Use case | Content-Type |
|---|---|
| JSON request | `application/json` |
| Upload dokumen | `multipart/form-data` via `FormData`; jangan set header manual di browser |
| CSV import | `multipart/form-data` via `FormData` |
| Download/preview | `GET`, response JSON berisi temporary URL atau stream internal sesuai kontrak detail |

## 5. Standard Success Envelope

Semua response JSON sukses dari Route Handler memakai envelope:

```json
{
  "ok": true,
  "data": {},
  "meta": {
    "requestId": "req_optional",
    "timestamp": "2026-07-09T03:00:00.000Z"
  }
}
```

Aturan:

- `ok` selalu `true` untuk sukses.
- `data` berisi payload utama.
- `meta` optional, tetapi dianjurkan untuk list/pagination dan debug aman.
- Jangan return secret, token plaintext, password hash, service role key, atau path internal yang tidak perlu frontend tahu.

### 5.1 Single Resource Example

```json
{
  "ok": true,
  "data": {
    "id": "doc_123",
    "status": "PENDING"
  }
}
```

### 5.2 Command Success Example

Untuk command tanpa payload detail:

```json
{
  "ok": true,
  "data": {
    "success": true
  }
}
```

### 5.3 Empty Result Example

Untuk hasil kosong yang valid:

```json
{
  "ok": true,
  "data": null
}
```

## 6. Standard Error Envelope

Semua error Route Handler memakai shape:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input tidak valid.",
    "details": [
      {
        "path": "email",
        "message": "Email wajib diisi."
      }
    ]
  },
  "meta": {
    "requestId": "req_optional",
    "timestamp": "2026-07-09T03:00:00.000Z"
  }
}
```

Aturan:

- `ok` selalu `false` untuk error.
- `error.code` machine-readable dan `SCREAMING_SNAKE_CASE`.
- `error.message` aman ditampilkan di UI.
- `error.details` optional; dipakai untuk validation field errors.
- Jangan bocorkan stack trace, SQL query, token, secret, atau detail internal storage.

## 7. Standard Error Codes

| HTTP | Code | Kapan dipakai | Frontend behavior |
|---:|---|---|---|
| 400 | `BAD_REQUEST` | Request malformed atau field tidak sesuai format umum | Tampilkan pesan form/global |
| 400 | `VALIDATION_ERROR` | Zod validation gagal | Map ke field errors jika ada |
| 401 | `UNAUTHENTICATED` | Belum login atau access token invalid | Redirect/login prompt |
| 401 | `SESSION_EXPIRED` | Refresh token invalid/expired | Clear session state, redirect login |
| 403 | `FORBIDDEN` | Role tidak cukup | Tampilkan akses ditolak |
| 403 | `OWNERSHIP_REQUIRED` | Employee mencoba akses data orang lain | Tampilkan akses ditolak |
| 404 | `NOT_FOUND` | Resource tidak ada atau disembunyikan oleh ownership/soft-delete | Tampilkan not found |
| 409 | `CONFLICT` | Unique conflict atau state conflict | Tampilkan pesan konflik |
| 413 | `PAYLOAD_TOO_LARGE` | File/body melebihi batas | Tampilkan batas ukuran |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Format/MIME file tidak diizinkan | Tampilkan format valid |
| 422 | `BUSINESS_RULE_VIOLATION` | Melanggar aturan domain | Tampilkan pesan domain |
| 429 | `RATE_LIMITED` | Terlalu banyak request/login gagal | Tampilkan cooldown |
| 500 | `INTERNAL_ERROR` | Error tak terduga | Tampilkan pesan umum, log server |
| 503 | `SERVICE_UNAVAILABLE` | Storage/email/database sementara gagal | Tampilkan coba lagi nanti |

## 8. Validation Details Shape

Untuk error Zod, `details` memakai array field error:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input tidak valid.",
    "details": [
      {
        "path": "documentNumber",
        "message": "Nomor dokumen wajib diisi untuk jenis dokumen ini."
      },
      {
        "path": "expiryDate",
        "message": "Tanggal kedaluwarsa harus format YYYY-MM-DD."
      }
    ]
  }
}
```

Aturan `path`:

- Field top-level: `email`
- Nested object: `employee.name`
- Array item: `targets.professionGroupIds[0]`
- FormData file: `file`

## 9. Pagination Convention

Endpoint list memakai query standar:

| Query | Type | Default | Notes |
|---|---|---:|---|
| `page` | integer | `1` | Minimal `1` |
| `pageSize` | integer | `10` | Minimal `1`, maksimal `100` |
| `sortBy` | string | endpoint-specific | Harus allowlist |
| `sortOrder` | `asc` \| `desc` | `desc` | Harus eksplisit |

Response list:

```json
{
  "ok": true,
  "data": [
    {
      "id": "emp_123",
      "name": "Nama Pegawai"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalItems": 42,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

Frontend harus membaca pagination dari `meta.pagination`, bukan menghitung sendiri dari panjang `data`.

## 10. Filter Convention

Filter list memakai query string sederhana. Hindari JSON string di query kecuali kontrak detail menyatakan perlu.

Contoh:

```txt
/api/v1/employees?page=1&pageSize=20&search=andi&role=EMPLOYEE&workplaceId=wrk_1
```

Aturan umum:

- `search` untuk pencarian teks bebas.
- Field enum memakai value enum database, misalnya `status=PENDING`.
- Date range memakai suffix `From` dan `To`, misalnya `uploadedAtFrom`, `uploadedAtTo`.
- Boolean memakai `true` atau `false` string.
- ID filter memakai nama field, misalnya `documentTypeId`, `workplaceId`.
- Semua `sortBy` harus allowlist di server untuk mencegah query injection.

## 11. Date and Time Convention

| Jenis data | Format | Contoh |
|---|---|---|
| Date-only | `YYYY-MM-DD` | `2026-07-09` |
| Timestamp response | ISO 8601 UTC | `2026-07-09T03:00:00.000Z` |
| Timestamp input | ISO 8601 UTC jika butuh jam | `2026-07-09T03:00:00.000Z` |

Field Prisma `@db.Date` seperti `birthDate`, `issueDate`, `expiryDate`, `effectiveDate` harus dikirim frontend sebagai `YYYY-MM-DD`.

## 12. ID Convention

- ID resource saat ini bertipe `string` mengikuti Prisma schema.
- Frontend tidak boleh menebak format ID.
- Validasi server minimal memastikan ID non-empty string.
- Jika nanti memakai prefixed ID (`emp_`, `doc_`), kontrak detail harus diperbarui.

## 13. Auth and Cookie Convention

SIMDP memakai custom JWT + refresh token via httpOnly cookie.

Frontend behavior:

- Frontend tidak membaca token dari JavaScript.
- Frontend request ke same-origin API otomatis membawa cookie.
- API wrapper harus memakai `credentials: "same-origin"` jika memakai `fetch` di wrapper.
- Saat menerima `UNAUTHENTICATED` atau `SESSION_EXPIRED`, frontend mengarahkan user ke login atau memicu session refresh sesuai kontrak Auth.
- Jangan simpan token di localStorage/sessionStorage.

Cookie security backend:

- `httpOnly: true`
- `secure: true` di production
- `sameSite: "lax"` minimal
- access token short-lived, refresh token rotated

## 14. RBAC and Ownership Notation

Setiap kontrak wajib menulis:

```md
**Minimum Role:** EMPLOYEE
**Ownership Rule:** `DocumentRecord.ownerId` harus sama dengan `currentEmployee.id`, kecuali STAFF/ADMIN.
```

Role hierarchy:

```txt
ADMIN > STAFF > EMPLOYEE
```

Notation:

| Notasi | Makna |
|---|---|
| Public | Tidak perlu login, tetapi tetap boleh rate limit |
| Authenticated | Semua user login aktif |
| EMPLOYEE+ | EMPLOYEE, STAFF, ADMIN |
| STAFF+ | STAFF, ADMIN |
| ADMIN | Admin saja |
| System | Bukan user; validasi secret seperti `CRON_SECRET` |
| Owner | Resource milik current user/current employee |

Default jika ragu: deny, bukan allow.

## 15. Audit Convention

Aksi sensitif wajib mencatat `SecurityLog` melalui service boundary security.

Kontrak endpoint/action wajib menulis audit event:

```md
**Audit:** `DOCUMENT_UPLOADED` on success, `DOCUMENT_UPLOAD_FAILED` on failure penting.
```

Audit metadata tidak boleh menyimpan:

- password/token/secret;
- isi file;
- service role key;
- stack trace mentah;
- data pribadi yang tidak perlu.

Minimal audit metadata aman:

```json
{
  "resourceId": "doc_123",
  "resourceType": "DocumentRecord",
  "status": "PENDING"
}
```

## 16. Request Contract Template

Setiap detail endpoint/action harus mengikuti template ini:

```md
## <METHOD> <PATH or ACTION NAME>

**Status:** Draft | Ready for review | Reviewed | Ready for implementation | Implemented
**Module:** `<module>`
**Handler Type:** Route Handler | Server Action
**Frontend Caller:** `src/modules/<module>/api.ts` or form/action caller
**Minimum Role:** Public | Authenticated | EMPLOYEE+ | STAFF+ | ADMIN | System
**Ownership Rule:** ...

### Purpose

...

### Request

#### Params

| Name | Type | Required | Notes |
|---|---|:---:|---|

#### Query

| Name | Type | Required | Notes |
|---|---|:---:|---|

#### Body / Form Data

```json
{}
```

### Success Response

```json
{
  "ok": true,
  "data": {}
}
```

### Error Responses

| HTTP Status | Code | Condition |
|---:|---|---|

### Validation

- Zod schema: `<schemaName>`
- Important rules:

### Service Boundary

- Calls: `src/modules/<module>/service.ts`
- Repository access: same module only.

### Side Effects

- Database:
- Storage:
- Notification:
- Audit:

### Frontend Notes

- Loading state:
- Empty state:
- Error display:
- Cache invalidation:

### Verification Plan

- Commands:
```

## 17. Frontend API Wrapper Convention

Module API wrappers should normalize error handling. The exact helper will be implemented later in `SIMDP-API-001`, but contracts should assume this behavior:

```ts
type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta?: ApiMeta;
};

type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ path: string; message: string }>;
  };
  meta?: ApiMeta;
};

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
```

Frontend module `api.ts` should return typed data or throw a typed safe error. Components should not parse raw response envelopes themselves.

## 18. Cache and Invalidation Notes

When TanStack Query is introduced/used, contracts should include cache invalidation notes.

Examples:

| Mutation | Invalidate |
|---|---|
| Upload document | `documents`, `documentSummary`, `notifications`, `statistics` |
| Verify document | `verificationQueue`, `documents`, `notifications`, `statistics` |
| Update profile | `currentProfile`, `employeeDetail` |
| Update system setting | `systemSettings` |
| Mark notification read | `notifications`, `notificationUnreadCount` |

If a contract does not mention cache behavior, implementer must add it before coding frontend hooks.

## 19. Upload Request Convention

Document upload and import endpoints use `FormData`.

Document upload required fields baseline:

| Field | Type | Required | Notes |
|---|---|:---:|---|
| `documentTypeId` | string | Yes | Existing `DocumentType.id` |
| `file` | File | Yes | Server validates content, MIME, size |
| `title` | string | No | Optional display title |
| `documentNumber` | string | Conditional | Required if `DocumentType.requiresDocumentNumber` |
| `issueDate` | `YYYY-MM-DD` | Conditional | Required if `DocumentType.requiresIssueDate` |
| `expiryDate` | `YYYY-MM-DD` | Conditional | Required if `DocumentType.requiresExpiryDate` |

Frontend must not send:

- `ownerId` for self-service employee upload unless a Staff/Admin upload-on-behalf contract explicitly allows it;
- `allowMultipleSnapshot`;
- `status` for new upload;
- storage path generated manually.

## 20. Security Defaults

- Public endpoints still need validation and rate limiting where relevant.
- Auth failures should use generic messages to avoid account enumeration.
- `NOT_FOUND` may be returned instead of `FORBIDDEN` if revealing resource existence is unsafe.
- `SecurityLog` is append-only and never exposed to non-Admin.
- Soft-deleted resources should behave as not found in normal user flows.
- File preview/download URLs must be temporary or internally controlled; no permanent public URL by default.

## 21. Implementation Verification Baseline

When implementation starts, each API issue should run at least:

```bash
npm run lint
npm run typecheck
npm run build
```

For Prisma/database-impacting API work, also run:

```bash
npm run prisma:validate
npm run prisma:generate
```

If route tests or integration tests are added later, contract docs should be updated to include exact test commands.
