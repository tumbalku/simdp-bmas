# Verification & Notification API Contracts — SIMDP

**Status:** Ready for review
**Backlog:** `SIMDP-API-DOCS-005`
**Terakhir diperbarui:** 2026-07-09

Dokumen ini berisi spesifikasi kontrak API untuk modul Verifikasi Dokumen (STAFF/ADMIN workflow) dan Notifikasi In-App Pegawai.

---

## Server Action: `getVerificationQueue(filter)`

**Status:** Ready for review
**Module:** `verification`
**Handler Type:** Server Action (or API Query via Action)
**Frontend Caller:** Staff Verification Queue Page
**Minimum Role:** STAFF+
**Ownership Rule:** N/A (Staff/Admin melihat antrean seluruh pegawai)

### Purpose
Mengambil daftar dokumen yang berstatus `PENDING` untuk ditinjau dan diverifikasi oleh Staff Kepegawaian.

### Request

#### Input Filter
```json
{
  "page": 1,
  "pageSize": 15,
  "search": "Andi",
  "documentTypeId": "doctype_str_123",
  "workplaceId": "work_1"
}
```

### Success Response
```json
{
  "ok": true,
  "data": [
    {
      "id": "doc_rec_881923",
      "owner": {
        "id": "emp_102893812",
        "name": "Andi Pratama",
        "workplace": "Bidang Rekam Medis"
      },
      "documentType": {
        "id": "doctype_str_123",
        "name": "Surat Tanda Registrasi"
      },
      "title": "STR Utama",
      "documentNumber": "STR-991823-2026",
      "uploadedAt": "2026-07-09T03:00:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 15,
      "totalItems": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

---

## Server Action: `verifyDocumentAction(id, decision, note)`

**Status:** Ready for review
**Module:** `verification`
**Handler Type:** Server Action
**Frontend Caller:** Tombol "Approve" / "Reject" di dialog verifikasi
**Minimum Role:** STAFF+
**Ownership Rule:** N/A (Staff/Admin memproses dokumen pegawai mana saja)

### Purpose
Memproses keputusan verifikasi dokumen (menyetujui atau menolak dokumen pegawai).

### Request

#### Input Data
- `id`: string (ID DocumentRecord)
- `decision`: `APPROVED` | `REJECTED`
- `note`: string (Catatan verifikasi, **wajib diisi jika decision = REJECTED**)

### Success Response
```json
{
  "ok": true,
  "data": {
    "id": "doc_rec_881923",
    "status": "APPROVED"
  }
}
```

### Error Responses

| HTTP Status | Code | Condition |
|---:|---|---|
| 400 | `VALIDATION_ERROR` | Decision tidak valid, atau `note` kosong padahal statusnya `REJECTED`. |
| 404 | `NOT_FOUND` | Dokumen tidak ditemukan atau sudah di-soft-delete. |

### Validation
- Zod schema: `verifyDocumentSchema`
  - `id`: `z.string().min(1)`
  - `decision`: `z.enum(["APPROVED", "REJECTED"])`
  - `note`: `z.string().optional()`
- Refinement rule: Jika `decision === "REJECTED"`, `note` wajib diisi minimal 5 karakter.

### Service Boundary
- Calls: `src/modules/verification/service.ts` -> `verifyDocument(id, decision, note, reviewerId)`
- Repository access: internal verification persistence only; document status and notification writes must go through approved service boundaries, not cross-module repository imports.

### Side Effects
- Database:
  - Mengupdate `status` di `DocumentRecord` menjadi `APPROVED` atau `REJECTED`.
  - Menambah record riwayat ke `VerificationHistory` (berisi status, reviewerId, note).
- Notification (BR-004):
  - Mengirim notifikasi in-app (`Notification` record baru) ke Employee pemilik dokumen.
  - Title: `"Dokumen Disetujui"` atau `"Dokumen Ditolak"`.
  - Message: `"Dokumen [Nama Jenis Dokumen] Anda telah [disetujui/ditolak]. Catatan: [Note]"`
- Audit:
  - Jika APPROVED: mencatat event `DOCUMENT_APPROVED`.
  - Jika REJECTED: mencatat event `DOCUMENT_REJECTED`.

---

## Server Action: `getVerificationHistory(documentId)`

**Status:** Ready for review
**Module:** `verification`
**Handler Type:** Server Action (or Query Action)
**Frontend Caller:** Riwayat verifikasi modal/tab di halaman detail dokumen
**Minimum Role:** EMPLOYEE+
**Ownership Rule:**
- Pegawai biasa hanya boleh melihat riwayat verifikasi dokumen miliknya sendiri (`ownerId = currentEmployee.id`).
- STAFF dan ADMIN dapat melihat riwayat verifikasi dokumen siapapun.

### Purpose
Mengambil riwayat peninjauan (approve/reject/note) dari suatu dokumen.

### Request
- `documentId`: string (ID DocumentRecord)

### Success Response
```json
{
  "ok": true,
  "data": [
    {
      "id": "vh_998231",
      "status": "REJECTED",
      "reviewNote": "Scan buram dan tidak terbaca jelas.",
      "reviewedAt": "2026-07-09T02:00:00.000Z",
      "reviewedBy": {
        "name": "Siti Rahma (Staff Kepegawaian)"
      }
    }
  ]
}
```

---

## Server Action: `getNotifications()`

**Status:** Ready for review
**Module:** `notification`
**Handler Type:** Server Action (or Query Action)
**Frontend Caller:** Bell notification dropdown, Notification Page
**Minimum Role:** Authenticated
**Ownership Rule:** User hanya dapat melihat notifikasi miliknya sendiri (`Notification.userId = currentUser.id`).

### Purpose
Mengambil daftar notifikasi in-app untuk user yang sedang aktif.

### Request
- Query params: `page`, `pageSize`, `isRead` (optional filter).

### Success Response
```json
{
  "ok": true,
  "data": [
    {
      "id": "notif_10023",
      "type": "DOCUMENT_STATUS",
      "title": "Dokumen Ditolak",
      "message": "Dokumen STR Anda telah ditolak. Catatan: Scan buram.",
      "isRead": false,
      "relatedEntityType": "DocumentRecord",
      "relatedEntityId": "doc_rec_881923",
      "createdAt": "2026-07-09T02:01:00.000Z"
    }
  ],
  "meta": {
    "unreadCount": 1
  }
}
```

---

## Server Action: `getUnreadNotificationCount()`

**Status:** Ready for review
**Module:** `notification`
**Handler Type:** Server Action
**Frontend Caller:** Bell icon badge
**Minimum Role:** Authenticated
**Ownership Rule:** User sendiri.

### Purpose
Mengambil jumlah notifikasi yang belum dibaca secara cepat.

### Request
Tidak ada parameter.

### Success Response
```json
{
  "ok": true,
  "data": {
    "unreadCount": 1
  }
}
```

---

## Server Action: `markNotificationReadAction(id)`

**Status:** Ready for review
**Module:** `notification`
**Handler Type:** Server Action
**Frontend Caller:** Klik item notifikasi
**Minimum Role:** Authenticated owner
**Ownership Rule:** Hanya boleh menandai notifikasi milik sendiri.

### Purpose
Menandai satu notifikasi tertentu sebagai telah dibaca (`isRead = true`).

### Request
- `id`: string (ID Notification)

### Success Response
```json
{
  "ok": true,
  "data": {
    "success": true
  }
}
```

### Side Effects
- Database: Mengupdate `isRead = true` pada record `Notification` bersangkutan.

---

## Server Action: `markAllNotificationsReadAction()`

**Status:** Ready for review
**Module:** `notification`
**Handler Type:** Server Action
**Frontend Caller:** Tombol "Tandai semua dibaca" di halaman notifikasi
**Minimum Role:** Authenticated owner
**Ownership Rule:** Hanya boleh untuk notifikasi milik sendiri.

### Purpose
Menandai seluruh notifikasi milik user aktif sebagai telah dibaca.

### Request
Tidak ada parameter.

### Success Response
```json
{
  "ok": true,
  "data": {
    "success": true
  }
}
```

### Side Effects
- Database: Mengupdate `isRead = true` untuk semua record `Notification` milik `userId` saat ini.

---

## Frontend Cache Invalidation Flow

| Mutasi | Invalidate Query Keys |
|---|---|
| verifyDocumentAction | `["verificationQueue"]`, `["documents"]`, `["notifications"]`, `["statistics"]` |
| markNotificationReadAction | `["notifications"]`, `["unreadNotificationCount"]` |
| markAllNotificationsReadAction | `["notifications"]`, `["unreadNotificationCount"]` |
