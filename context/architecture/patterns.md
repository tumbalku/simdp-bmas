# Architecture Patterns — SIMDP

**Status:** Draft awal
**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §5, §6, §11-13, §22
**Terakhir diperbarui:** 2026-07-08

## 1. Client Data Pattern

Komponen React tidak boleh `fetch()` langsung.

```txt
Component -> hooks.ts -> api.ts -> REST endpoint / Server Action read-only -> service.ts -> repository.ts
```

Rules:
- `hooks.ts` hanya memanggil `api.ts` modul yang sama.
- Gunakan TanStack Query untuk cache/loading/error/refetch.
- Mutation wajib invalidate query terkait.

## 2. Server Action Pattern

Urutan wajib:

```txt
1. requireAuth()
2. assertRole(minRole)
3. validate input dengan Zod
4. ownership/business rule check
5. panggil service.ts modul sendiri
6. logActivity() jika aksi sensitif
7. return result aman untuk client
```

Server Action cocok untuk mutasi internal dari dashboard/form.

## 3. Route Handler Pattern

REST Route Handler dipakai untuk:

- auth publik: login, refresh, logout, forgot/reset password;
- upload/download/preview file;
- cron/internal system job.

Pattern:

```txt
request -> parse -> auth/secret check -> Zod validation -> service -> audit -> response
```

## 4. Repository Pattern

Repository hanya berisi query database.

Rules:
- hanya dipanggil oleh `service.ts` modul yang sama;
- query normal tabel soft delete wajib `deletedAt IS NULL`;
- jangan letakkan business rule di repository jika rule itu perlu dipahami domain; taruh di service.

## 5. Soft Delete Pattern

Untuk tabel dengan `deletedAt`:

```txt
Normal query: WHERE deletedAt IS NULL
Soft delete: UPDATE deletedAt = now()
Restore: UPDATE deletedAt = NULL, Admin only, within retention
```

Tidak ada hard delete otomatis v1.

## 6. Upload Pattern

Canonical v1:

```txt
Client multipart/form-data -> POST /api/v1/documents/upload -> document service -> IStorageProvider.upload() -> DocumentRecord -> Notification -> SecurityLog
```

Server wajib validasi:
- role/ownership;
- Zod metadata;
- aturan DocumentType;
- ukuran;
- MIME dari isi file;
- SHA-256 hash.

## 7. Audit Pattern

Aksi sensitif wajib:

```txt
await logActivity({ actor, eventType, resource, status, metadata })
```

`logActivity()` berasal dari `@/modules/security/service`.

Jangan simpan secret/token/isi file di metadata.

## 8. Statistics Pattern

`statistics` adalah modul read-only.

Boleh:
- query agregasi lintas tabel;
- membuat DTO/dashboard summary;
- membaca data untuk chart.

Tidak boleh:
- menulis database;
- mengubah status dokumen;
- membuat side effect;
- membuat tabel agregat v1 tanpa keputusan baru.

## 9. Environment Pattern

Semua env divalidasi di startup:

```txt
src/lib/env.ts -> Zod schema -> export typed env
```

Jangan akses `process.env.*` langsung tersebar di banyak file kecuali di adapter/config layer.

## 10. Page Pattern

`page.tsx` harus tipis:

```txt
page.tsx -> requireRole/guard -> render <FeaturePage />
```

Business logic, data fetching, dan UI kompleks pindah ke modul/components.
