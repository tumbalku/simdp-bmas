---
title: API Overview
---

# API Overview

SIMDP memakai REST API v1 dan Server Actions.

## Response envelope

Response API mengikuti pola envelope:

```json
{
  "success": true,
  "data": {},
  "message": "OK"
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input tidak valid"
  }
}
```

## Prinsip endpoint

- Semua input divalidasi Zod.
- Endpoint publik tetap rate-limited.
- Endpoint protected wajib auth.
- Endpoint Staff/Admin wajib role check.
- Aksi sensitif wajib audit.
- File upload/download harus melalui route resmi.

## Kelompok API

| Area | Route |
|---|---|
| Auth | `/api/v1/auth/*` |
| Documents | `/api/v1/documents/*` |
| Employee export/PDF | `/api/v1/employees/*` |
| Cron | `/api/v1/cron/check-expiry` |
| Public verification | `/api/v1/document-verifications/[code]` |
| Realtime auth | `/api/v1/auth/pusher` |
| Inngest | `/api/v1/inngest` |

Detail historis kontrak ada di `context/technical/api/`.
