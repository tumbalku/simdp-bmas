---
title: Document API
---

# Document API

## Upload

```txt
POST /api/v1/documents/upload
```

Content type:

```txt
multipart/form-data
```

Validasi:

- session user;
- ownership;
- `DocumentType`;
- metadata required;
- ukuran;
- MIME magic bytes;
- malware scan;
- SHA-256 hash.

## Download by id

```txt
GET /api/v1/documents/download/[id]
```

Menghasilkan URL atau response download sesuai provider dan permission.

## Stream local file

```txt
GET /api/v1/documents/download/stream
```

Dipakai untuk streaming file lokal dengan guard path traversal dan permission.

## Public document verification

```txt
GET /api/v1/document-verifications/[code]
```

Endpoint publik rate-limited untuk memverifikasi dokumen yang diterbitkan sistem, misalnya PDF profil pegawai dengan QR code.
