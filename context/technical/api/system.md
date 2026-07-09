# System, Settings, & Cron API Contracts — SIMDP

**Status:** Ready for review
**Backlog:** `SIMDP-API-DOCS-006`
**Terakhir diperbarui:** 2026-07-09

Dokumen ini berisi spesifikasi kontrak API untuk modul System Settings, Security Audit Log, Dashboard Statistics, dan Cron Jobs.

---

## Server Action: `getSystemSettings()`

**Status:** Ready for review
**Module:** `settings`
**Handler Type:** Server Action
**Frontend Caller:** Admin Settings Form
**Minimum Role:** ADMIN
**Ownership Rule:** N/A (Admin only)

### Purpose
Mengambil seluruh konfigurasi sistem (`SystemSetting`) yang tersimpan di database.

### Request
Tidak ada parameter.

### Success Response
```json
{
  "ok": true,
  "data": [
    { "key": "reminder_days_h1", "value": "1", "label": "Reminder H-1 (Hari)", "description": "Selisih hari untuk reminder tahap akhir" },
    { "key": "reminder_days_h7", "value": "7", "label": "Reminder H-7 (Hari)", "description": "Selisih hari untuk reminder tahap menengah" },
    { "key": "reminder_days_h30", "value": "30", "label": "Reminder H-30 (Hari)", "description": "Selisih hari untuk reminder tahap awal" },
    { "key": "default_max_upload_mb", "value": "10", "label": "Batas Maksimal Upload (MB)", "description": "Batas ukuran file global jika tidak ditentukan per jenis dokumen" },
    { "key": "soft_delete_retention_days", "value": "30", "label": "Masa Retensi Sampah (Hari)", "description": "Batas waktu pemulihan dokumen/pegawai yang telah dihapus" }
  ]
}
```

---

## Server Action: `updateSystemSettingAction(data)`

**Status:** Ready for review
**Module:** `settings`
**Handler Type:** Server Action
**Frontend Caller:** Admin Settings Form Submit Button
**Minimum Role:** ADMIN
**Ownership Rule:** N/A

### Purpose
Mengupdate nilai dari konfigurasi sistem tertentu.

### Request

#### Input Data
```json
{
  "settings": [
    { "key": "reminder_days_h30", "value": "30" },
    { "key": "default_max_upload_mb", "value": "15" }
  ]
}
```

### Success Response
```json
{
  "ok": true,
  "data": {
    "success": true
  }
}
```

### Error Responses
- `FORBIDDEN`: Bukan Admin.
- `VALIDATION_ERROR`: Value tidak valid (misal: negatif).

### Validation
- Zod schema: `updateSettingsSchema`
  - `settings`: `z.array(z.object({ key: z.string().min(1), value: z.string().min(1) }))`

### Service Boundary
- Calls: `src/modules/settings/service.ts` -> `updateSettings(settingsList, userId)`
- Repository access: internal settings persistence only.

### Side Effects
- Database: Mengupdate field `value` dan `updatedBy` di tabel `SystemSetting`.
- Audit: Mencatat event `SYSTEM_SETTING_UPDATED`.

---

## Server Action: `getSecurityLog(filter)`

**Status:** Ready for review
**Module:** `security`
**Handler Type:** Server Action
**Frontend Caller:** Admin Security Audit Log View (Table)
**Minimum Role:** ADMIN
**Ownership Rule:** N/A

### Purpose
Mengambil data log audit sistem (`SecurityLog`) dengan filter, pencarian, dan paginasi. Bersifat append-only dan read-only bagi Admin (tidak ada edit/delete action).

### Request

#### Input Filter
```json
{
  "page": 1,
  "pageSize": 25,
  "search": "Andi",
  "eventType": "DOCUMENT_UPLOADED",
  "status": "SUCCESS",
  "dateFrom": "2026-07-01",
  "dateTo": "2026-07-09"
}
```

### Success Response
```json
{
  "ok": true,
  "data": [
    {
      "id": "log_8819238129",
      "timestamp": "2026-07-09T03:00:00.000Z",
      "actorName": "Andi Pratama",
      "actorRole": "EMPLOYEE",
      "eventType": "DOCUMENT_UPLOADED",
      "resource": "DocumentRecord:doc_rec_881923",
      "ipAddress": "192.168.1.100",
      "status": "SUCCESS",
      "metadata": {
        "documentRecordId": "doc_rec_881923",
        "documentTypeId": "doctype_str_123"
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "totalItems": 125,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

### Service Boundary
- Calls: `src/modules/security/service.ts` -> `getSecurityLogs(filter)`
- Repository access: internal security persistence only.

---

## Server Action: `getStatistics(filter)`

**Status:** Ready for review
**Module:** `statistics`
**Handler Type:** Server Action (Read-only Constraint - BR-012)
**Frontend Caller:** Dashboard Statistics View
**Minimum Role:** STAFF+
**Ownership Rule:** N/A (Staff dan Admin melihat data dashboard)

### Purpose
Membaca agregasi data kepatuhan dokumen pegawai, total dokumen pending, disetujui, ditolak, dan status kedaluwarsa. Modul ini terikat aturan **BR-012 (Read-only)**, tidak boleh mengubah data apa pun di database.

### Request

#### Input Filter
```json
{
  "workplaceId": "work_1"
}
```

### Success Response
```json
{
  "ok": true,
  "data": {
    "totalEmployees": 150,
    "compliantEmployeesCount": 120,
    "complianceRate": 80.0,
    "documentsByStatus": {
      "PENDING": 15,
      "APPROVED": 450,
      "REJECTED": 8,
      "EXPIRED": 12
    },
    "documentsByCategory": {
      "PERSONAL": 150,
      "EDUCATION": 120,
      "EMPLOYMENT": 110,
      "CERTIFICATION": 80,
      "LEGAL": 25
    }
  }
}
```

### Service Boundary
- Calls: `src/modules/statistics/service.ts` -> `getDashboardStats(filter)`
- Repository access: statistics module read-only aggregation only; cross-domain reads must respect module/service boundaries and never write data.

---

## GET /api/v1/cron/check-expiry

**Status:** Ready for review
**Module:** `system`
**Handler Type:** Route Handler (System Endpoint)
**Frontend Caller:** N/A (Tidak digunakan oleh UI. Dipanggil secara berkala via Cron Job scheduler external)
**Minimum Role:** System (Validasi token via query `?secret=CRON_SECRET` atau header `Authorization: Bearer CRON_SECRET`)

### Purpose
Cron job berkala untuk mendeteksi dokumen yang akan atau telah kedaluwarsa, memperbarui status dokumen secara otomatis menjadi `EXPIRED`, dan mengirimkan notifikasi reminder H-30, H-7, dan H-1 secara aman dan idempotent (BR-006 & BR-011).

### Request

#### Headers
- `Authorization`: `Bearer <CRON_SECRET>`

#### Query Params
Tidak ada.

### Success Response
```json
{
  "ok": true,
  "data": {
    "expiredCount": 2,
    "remindersSent": {
      "H30": 5,
      "H7": 1,
      "H1": 0
    }
  }
}
```

### Error Responses

| HTTP Status | Code | Condition |
|---:|---|---|
| 401 | `UNAUTHENTICATED` | Secret token cron salah atau tidak disertakan |

### Logic & Idempotency Rules (BR-006, BR-011)
1. **Security**: Bandingkan token dengan `env.CRON_SECRET`; jangan membaca `process.env` langsung di handler.
2. **Expired Transition**:
   - Cari seluruh dokumen berstatus `APPROVED` yang `expiryDate <= now()`.
   - Update dokumen tersebut menjadi `status = EXPIRED` (isCurrent dipertahankan tetap true jika ia merupakan snapshot terbaru agar tetap masuk dalam compliance checking, namun statusnya expired).
   - Catat `SecurityLog` dengan event `CRON_DOCUMENT_EXPIRED`.
3. **Idempotent Reminders**:
   - Ambil konfigurasi batas hari dari `SystemSetting` (`reminder_days_h30`, `reminder_days_h7`, `reminder_days_h1`).
   - Hitung tanggal target H-30, H-7, dan H-1 dari hari ini.
   - Kirim notifikasi in-app ke pemilik dokumen:
     - Tahap H-30: jika `expiryDate` cocok dan `reminderH30SentAt IS NULL`. Setelah kirim, update `reminderH30SentAt = now()`.
     - Tahap H-7: jika `expiryDate` cocok dan `reminderH7SentAt IS NULL`. Setelah kirim, update `reminderH7SentAt = now()`.
     - Tahap H-1: jika `expiryDate` cocok dan `reminderH1SentAt IS NULL`. Setelah kirim, update `reminderH1SentAt = now()`.
   - Ini memastikan reminder hanya dikirim tepat satu kali per tahapan.

### Service Boundary
- Calls: `src/modules/document/service.ts` -> `processExpiredDocumentsAndReminders()`
- Repository access: cron/system service orchestration only; document status updates and notification writes must use approved service boundaries and remain idempotent.

### Side Effects
- Database:
  - Mengubah status `DocumentRecord` ke `EXPIRED`.
  - Mengisi `reminderHXXSentAt = now()` pada record terkait.
  - Insert record `Notification` in-app baru.
- Audit: Mencatat log audit `CRON_CHECK_EXPIRY_RUN` dengan detail ringkas hasil eksekusi.
