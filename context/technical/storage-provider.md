# Storage Provider — SIMDP

**Status:** Draft awal
**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §13 dan §16.1
**Terakhir diperbarui:** 2026-07-08

## Prinsip

SIMDP memakai satu kontrak storage agar upload/download dokumen tidak bergantung langsung pada provider.

Provider yang didukung:

- `local` untuk development;
- `supabase` untuk production option A;
- `s3` untuk production option B/future-proof.

Aturan wajib:

1. Kode di luar `src/lib/storage/` tidak boleh memanggil SDK Supabase/S3/filesystem langsung.
2. Modul `document` hanya boleh memanggil `getStorageProvider()` dan `IStorageProvider`.
3. `DocumentRecord.filePath` menyimpan path standar, bukan URL publik.
4. `DocumentRecord.storageProvider` menyimpan provider yang dipakai saat upload.
5. URL akses file harus sementara/terkontrol lewat `getUrl()`.

## Interface Wajib

```ts
export type StorageProviderName = "local" | "supabase" | "s3";

export interface StorageFile {
  buffer: Buffer;
  mimeType: string;
  size: number;
}

export interface StorageUploadResult {
  provider: StorageProviderName;
  filePath: string;
  storageKey: string;
  etag?: string;
}

export interface IStorageProvider {
  readonly providerName: StorageProviderName;
  upload(filePath: string, file: StorageFile): Promise<StorageUploadResult>;
  getUrl(filePath: string, expiresIn?: number): Promise<string>;
  delete(filePath: string): Promise<void>;
}
```

## Provider Selection

Factory berada di:

```txt
src/lib/storage/index.ts
```

Env utama:

```env
STORAGE_PROVIDER=local # local | supabase | s3
```

Default development boleh `local`.

## LocalStorageProvider

- `providerName = "local"`.
- File disimpan di folder `LocalStorage/` root project.
- Folder `LocalStorage/` wajib di-gitignore.
- `getUrl()` mengembalikan route internal yang tetap melakukan auth/ownership check.

## SupabaseStorageProvider

- `providerName = "supabase"`.
- Bucket privat: `employee-documents`.
- `getUrl()` memakai signed URL sementara, default 300 detik.
- Env wajib:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_STORAGE_BUCKET`

## S3StorageProvider

- `providerName = "s3"`.
- Bucket privat S3/S3-compatible.
- `getUrl()` memakai presigned URL sementara, default 300 detik.
- Env wajib:
  - `S3_REGION`
  - `S3_BUCKET`
  - `S3_ACCESS_KEY_ID`
  - `S3_SECRET_ACCESS_KEY`
- Env opsional:
  - `S3_ENDPOINT`

## Format FilePath Dokumen

Format:

```txt
{KODE-DOKUMEN}-{URUTAN}-{NIP-atau-NIK}.{ext}
```

Contoh:

```txt
STR-1-198501012010011001.pdf
KTP-1-198501012010011001.jpg
DIKLAT-2-198501012010011001.pdf
```

Rules:
- `KODE-DOKUMEN` dari `DocumentType.code`, uppercase, hanya `[A-Z0-9-]`.
- `URUTAN` dihitung dari jumlah dokumen owner + type sebelumnya.
- Gunakan NIP (`Employee.employeeId`) jika ada. Jika pegawai tidak memiliki NIP, gunakan NIK (`Employee.nik`). Minimal salah satu wajib tersedia.
- Extension lowercase.
- Nama asli upload tetap disimpan di `DocumentRecord.fileName`.

## Upload Canonical v1

Upload wajib lewat:

```txt
POST /api/v1/documents/upload
```

Direct-to-storage upload bukan alur utama v1. Jika nanti file besar/limit Vercel menjadi masalah, optimasi boleh ditambahkan di balik kontrak storage tanpa mengubah aturan bisnis modul `document`.
