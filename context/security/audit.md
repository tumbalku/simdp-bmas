# Security Audit — SIMDP

**Status:** Draft awal
**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §9.6
**Terakhir diperbarui:** 2026-07-08

## 1. Prinsip Audit

`SecurityLog` adalah audit trail utama SIMDP.

Aturan:

- Append-only: tidak boleh update/delete dari aplikasi.
- Semua aksi sensitif wajib memanggil `logActivity()`.
- `logActivity()` diekspor dari `@/modules/security/service` agar tetap mengikuti boundary modul.
- Security log UI hanya untuk Admin.
- Security log boleh diekspor ke CSV oleh Admin.

## 2. Field SecurityLog

Berdasarkan skema SQL:

| Field | Keterangan |
|---|---|
| `id` | Primary key. |
| `timestamp` | Waktu event, default `now()`. |
| `actorId` | `User.id` aktor, nullable untuk event sistem/public tertentu. |
| `actorName` | Nama aktor saat event terjadi. |
| `actorRole` | Role aktor saat event terjadi. |
| `eventType` | Jenis event. |
| `resource` | Resource yang terdampak, misalnya `DocumentRecord:abc`. |
| `ipAddress` | IP request jika tersedia. |
| `status` | `SUCCESS` atau `FAILED`. |
| `metadata` | JSON detail tambahan. Jangan isi secret. |

## 3. Format logActivity

Target bentuk function:

```ts
type SecurityLogStatus = "SUCCESS" | "FAILED";

type LogActivityInput = {
  actorId?: string | null;
  actorName: string;
  actorRole: string;
  eventType: string;
  resource: string;
  ipAddress?: string | null;
  status: SecurityLogStatus;
  metadata?: Record<string, unknown>;
};

async function logActivity(input: LogActivityInput): Promise<void>;
```

Catatan:
- Jangan simpan password, token, secret key, atau isi file dokumen di `metadata`.
- Simpan ID resource dan ringkasan aman saja.

## 4. Event Types Wajib dari PRD

| eventType | Pemicu |
|---|---|
| `DOCUMENT_UPLOADED` | Upload dokumen. |
| `DOCUMENT_APPROVED` | Dokumen di-approve. |
| `DOCUMENT_REJECTED` | Dokumen di-reject. |
| `DOCUMENT_DELETED` | Dokumen di-soft-delete. |
| `DOCUMENT_RESTORED` | Dokumen direstore. |
| `EMPLOYEE_CREATED` | Pegawai dibuat. |
| `EMPLOYEE_UPDATED` | Data pegawai diubah. |
| `EMPLOYEE_DELETED` | Pegawai di-soft-delete. |
| `MASTER_DATA_CREATED` | Master data dibuat. |
| `MASTER_DATA_UPDATED` | Master data diubah. |
| `MASTER_DATA_DELETED` | Master data dihapus/soft-delete jika ada. |
| `SYSTEM_SETTING_UPDATED` | Pengaturan sistem diubah. |
| `USER_ROLE_CHANGED` | Role user diubah. |

## 5. Event Types Auth Tambahan

Event auth yang perlu dicatat:

| eventType | Pemicu |
|---|---|
| `AUTH_LOGIN_SUCCESS` | Login berhasil. |
| `AUTH_LOGIN_FAILED` | Login gagal. |
| `AUTH_FORCE_LOGOUT_OTHERS` | Login baru merevoke sesi lama. |
| `AUTH_REFRESH_SUCCESS` | Refresh token berhasil. |
| `AUTH_REFRESH_FAILED` | Refresh token gagal/expired/revoked. |
| `AUTH_LOGOUT` | Logout. |
| `AUTH_PASSWORD_RESET_REQUESTED` | Request reset password diterima. |
| `AUTH_PASSWORD_RESET_SUCCESS` | Reset password berhasil. |
| `AUTH_PASSWORD_CHANGED` | User mengganti password sendiri. |

## 6. Aksi yang Wajib Audit

Wajib audit:

- login success/failure;
- force logout sesi lain;
- refresh failure;
- logout;
- reset password;
- upload dokumen;
- approve/reject dokumen;
- soft delete/restore dokumen;
- CRUD pegawai;
- CRUD master data;
- CRUD DocumentType;
- ubah role;
- ubah setting sistem;
- import/export data sensitif;
- cron expiry jika mengubah status dokumen atau mengirim reminder.

## 7. Metadata Aman

Contoh metadata aman:

```json
{
  "documentRecordId": "doc_123",
  "documentTypeId": "doctype_123",
  "previousStatus": "PENDING",
  "newStatus": "APPROVED"
}
```

Jangan simpan:

- password;
- refresh/access token;
- password reset token;
- secret/env value;
- isi file dokumen;
- data pegawai lengkap jika cukup pakai ID.

## 8. UI Security Log

Admin only.

Fitur UI:
- tabel read-only;
- filter by eventType;
- filter by actor;
- filter by tanggal;
- filter by status;
- export CSV.

Tidak boleh ada tombol edit/hapus.
