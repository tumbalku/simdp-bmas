---
title: Audit Log
---

# Audit Log

`SecurityLog` adalah audit trail utama SIMDP.

## Prinsip

- Append-only.
- Tidak boleh update/delete dari aplikasi.
- Hanya Admin yang boleh melihat.
- Metadata tidak boleh berisi secret, token, password, atau isi file.

## Field penting

| Field | Keterangan |
|---|---|
| `timestamp` | Waktu event. |
| `actorId` | User aktor, nullable untuk public/system event. |
| `actorName` | Nama aktor saat event terjadi. |
| `actorRole` | Role aktor. |
| `eventType` | Jenis event. |
| `resource` | Resource terdampak. |
| `ipAddress` | IP request jika tersedia. |
| `status` | `SUCCESS` atau `FAILED`. |
| `metadata` | Detail aman. |

## Aksi yang wajib audit

- login success/failure;
- logout dan refresh failure;
- reset password;
- upload/download dokumen;
- approve/reject dokumen;
- soft delete/restore/hapus permanen;
- CRUD pegawai;
- CRUD master data;
- perubahan role/user;
- perubahan system setting;
- import/export sensitif;
- cron expiry yang mengubah status atau mengirim reminder.

## Metadata aman

Contoh:

```json
{
  "documentRecordId": "doc_123",
  "previousStatus": "PENDING",
  "newStatus": "APPROVED"
}
```

Jangan simpan:

- password;
- access token;
- refresh token;
- password reset token;
- service role key;
- private key;
- isi file dokumen;
- dump data pegawai lengkap.
