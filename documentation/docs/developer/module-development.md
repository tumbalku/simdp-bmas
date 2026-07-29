---
title: Module Development
---

# Module Development

Gunakan halaman ini saat menambah atau mengubah fitur dalam `src/modules/*`.

## Pola umum fitur

```txt
Component
  -> hooks.ts
  -> api.ts atau server action
  -> service.ts
  -> repository.ts
  -> Prisma
```

## Server Action

Urutan wajib:

```txt
requireAuth()
assertRole()
Zod validation
ownership/business rule check
service call
audit log jika sensitif
return safe result
```

## Route Handler

Dipakai untuk:

- auth publik;
- upload/download file;
- cron/internal job;
- endpoint public terbatas seperti QR verification.

Pattern:

```txt
parse request
auth atau secret check
Zod validation
service call
audit
response envelope
```

## Repository

Repository hanya query database.

Aturan:

- dipanggil oleh service modul yang sama;
- query normal tabel soft delete wajib filter `deletedAt IS NULL`;
- jangan taruh business rule domain yang perlu dipahami developer lain di repository.

## Upload file

Upload dokumen wajib lewat:

```txt
POST /api/v1/documents/upload
```

Server harus melakukan:

- auth/ownership check;
- validasi metadata;
- validasi aturan `DocumentType`;
- validasi ukuran file;
- magic-byte MIME check;
- malware scanning;
- SHA-256 hash;
- simpan file lewat `IStorageProvider.upload`;
- simpan metadata `DocumentRecord`;
- audit dan notifikasi.

## Checklist sebelum selesai

- Tidak ada `fetch()` langsung di Client Component.
- Tidak ada import repository lintas modul.
- `page.tsx` tetap tipis.
- Semua input eksternal divalidasi Zod.
- Aksi sensitif memiliki audit log.
- Tests relevan ditambahkan atau diupdate.
