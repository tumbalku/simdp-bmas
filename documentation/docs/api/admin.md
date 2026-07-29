---
title: Admin and System API
---

# Admin and System API

Halaman ini merangkum endpoint administratif dan sistem.

## Employee export

```txt
GET /api/v1/employees/export
```

Admin dapat export data pegawai sesuai filter. Export adalah fitur operasional, bukan disaster recovery.

## Employee profile PDF

```txt
GET /api/v1/employees/[id]/profile-pdf
```

Membuat PDF profil pegawai. PDF dapat diberi QR verification code untuk validasi publik.

## Statistics charts

```txt
GET /api/v1/statistics/charts
```

Endpoint read-only untuk data chart dashboard.

## Cron expiry

```txt
GET /api/v1/cron/check-expiry
```

Wajib memakai `Authorization: Bearer <CRON_SECRET>`.

Tugas:

- mencari dokumen mendekati expiry;
- mengirim reminder H-30, H-7, H-1;
- menandai dokumen expired jika melewati `expiryDate`;
- menulis audit untuk perubahan sistem.

## Inngest

```txt
POST /api/v1/inngest
```

Endpoint provider-managed untuk event bus async. Production runtime perlu `INNGEST_SIGNING_KEY`.
