---
title: Upload Security
---

# Upload Security

Upload dokumen adalah salah satu permukaan risiko terbesar karena menerima file dari user.

## Jalur wajib

```txt
POST /api/v1/documents/upload
```

Client tidak boleh langsung menulis ke storage provider.

## Validasi server

Server wajib melakukan:

- auth check;
- role dan ownership check;
- Zod validation untuk metadata;
- validasi aturan `DocumentType`;
- batas ukuran file;
- MIME magic-byte check;
- malware scanning;
- SHA-256 hash;
- file path generation standar;
- upload via `IStorageProvider`;
- audit event.

## Malware scanning

Provider default adalah ClamAV `clamd`.

Kebijakan:

- fail closed;
- jika scanner unavailable, timeout, error, atau mendeteksi malware, file ditolak;
- event kegagalan/deteksi dicatat ke audit log;
- isi file dan secret tidak dicatat di metadata.

## Format nama file

```txt
{NIK-atau-NIP}_{KATEGORI-ARSIP}_{KODE-DOKUMEN}_{YYYYMMDD}_{VERSI}.{ext}
```

Contoh:

```txt
7471010101780001_PERSONAL_KTP_20260725_1.pdf
7471085802840001_EMPLOYMENT_SK01_20260725_1.pdf
```

Aturan:

- prioritas identifier adalah NIK lalu NIP;
- extension lowercase;
- tidak ada spasi;
- hanya karakter aman `[A-Za-z0-9._-]`.
