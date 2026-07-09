# Document Type & Record API Contracts — SIMDP

**Status:** Ready for review
**Backlog:** `SIMDP-API-DOCS-004`
**Terakhir diperbarui:** 2026-07-09

Dokumen ini berisi spesifikasi kontrak API untuk modul Document Type (Master Jenis Dokumen) dan Document Record (File Unggahan Pegawai).

---

## Server Action: `crudDocumentTypeAction(operation, id?, data?)`

**Status:** Ready for review
**Module:** `document`
**Handler Type:** Server Action
**Frontend Caller:** Admin Document Type Management Page
**Minimum Role:** ADMIN
**Ownership Rule:** N/A

### Purpose
Menyediakan operasi CRUD lengkap untuk jenis dokumen (`DocumentType`) beserta konfigurasi relasi target penugasannya.

### Request

#### Input Data (Create Example)
```json
{
  "operation": "CREATE",
  "data": {
    "code": "STR",
    "name": "Surat Tanda Registrasi",
    "description": "Surat izin praktik tenaga medis/kesehatan",
    "archiveCategory": "CERTIFICATION",
    "isMandatory": true,
    "allowMultiple": false,
    "requiresExpiryDate": true,
    "requiresIssueDate": true,
    "requiresDocumentNumber": true,
    "allowedFormats": "pdf,jpg,jpeg",
    "maxSizeMb": 5.0,
    "professionGroupIds": ["prof_medis", "prof_keperawatan"],
    "employmentStatusIds": []
  }
}
```

### Success Response
```json
{
  "ok": true,
  "data": {
    "id": "doctype_str_123",
    "code": "STR",
    "name": "Surat Tanda Registrasi"
  }
}
```

### Validation
- Zod schema: `crudDocumentTypeSchema`
  - `operation`: `z.enum(["CREATE", "UPDATE", "DELETE", "RESTORE"])`
  - `data.code`: `z.string().min(2).max(10)`
  - `data.allowedFormats`: `z.string().min(1) // e.g. "pdf,jpg"`
  - `data.maxSizeMb`: `z.number().positive()`
- Target Assignment Matching Logic (BR-005):
  - Kategori target: `professionGroupIds`, `employmentStatusIds`, `employeeGroupIds`, `employeeRankIds`, `workplaceIds`.
  - Jika suatu array kosong (e.g. `employmentStatusIds: []`), artinya berlaku untuk seluruh pegawai di kategori tersebut.
  - Untuk pencocokan kelayakan pegawai:
    `[Profession Match] AND [Status Match] AND [Group Match] AND [Rank Match] AND [Workplace Match]`
    Di mana masing-masing bagian bernilai `OR` di dalamnya (misal: `Medis OR Keperawatan`).

### Side Effects
- Database:
  - Membuat/mengubah record di `DocumentType`.
  - Menyelaraskan tabel relasi target (e.g. `DocumentTypeProfessionGroup`).
  - `DELETE`: `deletedAt = now()`.
  - `RESTORE`: `deletedAt = null`.
- Audit: Mencatat event `MASTER_DATA_CREATED`, `MASTER_DATA_UPDATED`, atau `MASTER_DATA_DELETED`.

---

## POST /api/v1/documents/upload

**Status:** Ready for review
**Module:** `document`
**Handler Type:** Route Handler (Multipart FormData)
**Frontend Caller:** `src/modules/document/api.ts` -> `uploadDocument(formData)`
**Minimum Role:** EMPLOYEE+ (Setiap pegawai aktif)
**Ownership Rule:** Pegawai hanya boleh mengupload dokumen untuk dirinya sendiri (ownerId otomatis di-set ke currentEmployeeId di server).

### Purpose
Mengunggah file dokumen pegawai ke server, melakukan validasi tipe dan ukuran file secara riil, menghitung SHA-256, menyimpannya via `IStorageProvider`, dan membuat record `DocumentRecord`.

### Request

#### Form Data Fields
- `documentTypeId`: string (ID DocumentType)
- `file`: File (Binary upload)
- `title`: string (Optional, Judul kustom)
- `documentNumber`: string (Conditional)
- `issueDate`: `YYYY-MM-DD` (Conditional)
- `expiryDate`: `YYYY-MM-DD` (Conditional)

### Success Response
```json
{
  "ok": true,
  "data": {
    "id": "doc_rec_881923",
    "status": "PENDING",
    "fileName": "STR-1-198501012010011001.pdf",
    "filePath": "uploads/STR/STR-1-198501012010011001.pdf"
  }
}
```

### Error Responses

| HTTP Status | Code | Condition |
|---:|---|---|
| 400 | `VALIDATION_ERROR` | Field kondisional (nomor, tanggal terbit, kedaluwarsa) tidak diisi padahal diwajibkan oleh jenis dokumen, atau format tanggal salah. |
| 413 | `PAYLOAD_TOO_LARGE` | Ukuran file melebihi batas yang ditentukan di `DocumentType.maxSizeMb`. |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Format file tidak sesuai dengan `DocumentType.allowedFormats` (diverifikasi berdasarkan magic bytes, bukan sekadar ekstensi). |

### Validation & Server Process
1. **Zod Validation**: Memvalidasi input string metadata.
2. **DocumentType Check**: Membaca aturan dari `DocumentType` terkait:
   - Jika `requiresDocumentNumber = true`, field `documentNumber` wajib diisi.
   - Jika `requiresIssueDate = true`, field `issueDate` wajib diisi.
   - Jika `requiresExpiryDate = true`, field `expiryDate` wajib diisi.
3. **MIME/Content Verification**: Membaca beberapa byte awal file (magic bytes) untuk memvalidasi format riil (e.g. PDF header `%PDF-`, JPEG `\xff\xd8\xff`).
4. **Deduplication / SHA-256**: Menghitung SHA-256 hash dari buffer file untuk disimpan di `fileHash` guna audit kelak.
5. **Storage Provider**: File dilewatkan ke modul `src/lib/storage/` (implementasi `IStorageProvider.upload()`).
6. **Trigger DB (BR-001 & BR-002)**: Database trigger `handle_document_replacement()` berjalan saat record disimpan:
   - Jika jenis dokumen tidak mengizinkan banyak snapshot (`allowMultiple = false`), trigger otomatis mengubah dokumen aktif lama milik owner tersebut menjadi `status = REPLACED` dan `isCurrent = false`.

### Side Effects
- Database: Insert record baru di `DocumentRecord`.
- Storage: File disimpan di folder target (format nama: `{KODE-DOKUMEN}-{URUTAN}-{IDENTIFIER}.{ext}`).
- Notification: Mengirim notifikasi ke admin/staff bahwa ada dokumen baru yang memerlukan verifikasi.
- Audit: Mencatat event `DOCUMENT_UPLOADED`.

---

## GET /api/v1/documents/download/[id]

**Status:** Ready for review
**Module:** `document`
**Handler Type:** Route Handler
**Frontend Caller:** Button preview/download link
**Minimum Role:** EMPLOYEE+
**Ownership Rule:**
- Pegawai biasa hanya boleh mendownload/melihat dokumen miliknya sendiri (`ownerId = currentEmployee.id`).
- STAFF dan ADMIN dapat mendownload dokumen milik pegawai siapapun.

### Purpose
Menghasilkan temporary signed URL yang aman dan berumur pendek untuk preview atau download file dokumen asli dari storage provider.

### Request

#### Params
- `id`: string (ID DocumentRecord)

### Success Response
```json
{
  "ok": true,
  "data": {
    "url": "https://storage.bahteramas.go.id/signed-url/STR-123.pdf?token=abc123xyz&expires=1783918239"
  }
}
```

### Error Responses

| HTTP Status | Code | Condition |
|---:|---|---|
| 401 | `UNAUTHENTICATED` | User belum login. |
| 403 | `OWNERSHIP_REQUIRED` | Pegawai mencoba mendownload dokumen milik orang lain. |
| 404 | `NOT_FOUND` | Dokumen tidak ditemukan atau berstatus soft-deleted. |

### Service Boundary
- Calls: `src/modules/document/service.ts` -> `generateDownloadUrl(documentId, currentUser)`
- Storage provider: `IStorageProvider.getTemporaryUrl(filePath, expirySeconds = 300)`.

### Side Effects
- Audit: Mencatat `DOCUMENT_DOWNLOADED` (status `SUCCESS`/`FAILED`).

---

## Server Action: `softDeleteDocumentAction(id)`

**Status:** Ready for review
**Module:** `document`
**Handler Type:** Server Action
**Frontend Caller:** Tombol "Hapus" di daftar dokumen
**Minimum Role:** EMPLOYEE+
**Ownership Rule:**
- Pegawai hanya boleh menghapus dokumen miliknya sendiri jika statusnya masih `PENDING` atau `REJECTED`. Dokumen `APPROVED` tidak boleh dihapus secara mandiri oleh pegawai.
- STAFF dan ADMIN dapat melakukan soft-delete untuk dokumen siapa saja dalam status apa saja.

### Purpose
Melakukan soft delete terhadap data dokumen dengan mengeset kolom `deletedAt = now()`. File fisik di storage tetap dipertahankan selama masa retensi.

### Request
- `id`: string (ID DocumentRecord)

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
- `NOT_FOUND`: Dokumen tidak ditemukan.
- `BUSINESS_RULE_VIOLATION`: Pegawai mencoba menghapus dokumen `APPROVED`.

### Side Effects
- Database: Mengupdate `deletedAt = now()` dan `isCurrent = false` pada record `DocumentRecord`.
- Audit: Mencatat event `DOCUMENT_DELETED`.

---

## Server Action: `restoreDocumentAction(id)`

**Status:** Ready for review
**Module:** `document`
**Handler Type:** Server Action
**Frontend Caller:** Admin Recycle Bin UI
**Minimum Role:** ADMIN
**Ownership Rule:** N/A (Admin only)

### Purpose
Mengembalikan dokumen yang telah dihapus (soft-deleted) ke status aktif jika masih dalam batas masa retensi (`soft_delete_retention_days`).

### Request
- `id`: string (ID DocumentRecord)

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
- Database: Mengeset `deletedAt = null` pada `DocumentRecord` terkait.
- Audit: Mencatat event `DOCUMENT_RESTORED`.

---

## Frontend Cache Invalidation

| Mutasi | Invalidate Query Keys |
|---|---|
| Upload Dokumen | `["documents", ownerId]`, `["statistics"]` |
| Soft Delete Dokumen | `["documents", ownerId]`, `["statistics"]` |
| Restore Dokumen | `["documents"]`, `["statistics"]` |
| CRUD DocumentType | `["documentTypes"]` |
