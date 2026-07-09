# Employee & Master Data API Contracts — SIMDP

**Status:** Ready for review
**Backlog:** `SIMDP-API-DOCS-003`
**Terakhir diperbarui:** 2026-07-09

Dokumen ini berisi spesifikasi kontrak API untuk modul Employee dan Master Data kepegawaian.

---

## Server Action: `getCurrentProfile()`

**Status:** Ready for review
**Module:** `employee`
**Handler Type:** Server Action (or React query wrapper via action)
**Frontend Caller:** Profile Page, Top Navigation Bar
**Minimum Role:** EMPLOYEE+
**Ownership Rule:** Hanya membaca profil milik user yang sedang aktif.

### Purpose
Mengambil data profil pegawai yang sedang login beserta data relasi master datanya.

### Request
Tidak ada parameter.

### Success Response
```json
{
  "ok": true,
  "data": {
    "id": "emp_102893812",
    "userId": "usr_99818ab721",
    "employeeId": "198501012010011001",
    "nik": "7471010203040001",
    "name": "Andi Pratama, S.Kom.",
    "avatarUrl": "https://storage. Bahteramas.go.id/avatars/emp_102893812.png",
    "gender": "L",
    "birthDate": "1985-01-01",
    "birthPlace": "Kendari",
    "phone": "081122334455",
    "address": "Jl. Bahteramas No. 10, Kendari",
    "religion": "Islam",
    "maritalStatus": "Kawin",
    "employmentStatus": { "id": "status_1", "name": "PNS" },
    "employeeGroup": { "id": "group_1", "name": "III/a" },
    "employeePosition": { "id": "pos_1", "name": "Pranata Komputer Ahli Pertama" },
    "employeeRank": { "id": "rank_1", "name": "Penata Muda" },
    "workplace": { "id": "work_1", "name": "Bidang Rekam Medis" }
  }
}
```

### Error Responses
- `UNAUTHENTICATED`: Belum login.
- `NOT_FOUND`: Profil pegawai tidak ditemukan.

---

## Server Action: `updateProfileAction(data)`

**Status:** Ready for review
**Module:** `employee`
**Handler Type:** Server Action
**Frontend Caller:** Profile Settings Form
**Minimum Role:** EMPLOYEE self
**Ownership Rule:** Pegawai hanya boleh mengupdate profilnya sendiri. Admin tidak menggunakan action ini (Admin menggunakan `crudEmployeeAction`).

### Purpose
Mengupdate data profil personal yang aman diubah secara mandiri oleh pegawai (misalnya alamat, nomor HP, tempat lahir). Data krusial seperti NIP, NIK, jabatan, dan status kepegawaian tidak boleh diubah melalui action ini.

### Request

#### Input Data
```json
{
  "phone": "081122334455",
  "address": "Jl. Bahteramas Baru No. 99, Kendari",
  "birthPlace": "Kendari",
  "birthDate": "1985-01-01",
  "religion": "Islam",
  "maritalStatus": "Kawin"
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
- `UNAUTHENTICATED`: Belum login.
- `VALIDATION_ERROR`: Format HP salah atau tanggal lahir di masa depan.

### Validation
- Zod schema: `updateProfileSchema`
  - `phone`: `z.string().regex(/^[0-9+-\s]*$/, "Format telepon tidak valid").optional()`
  - `address`: `z.string().max(255, "Alamat terlalu panjang").optional()`
  - `birthPlace`: `z.string().optional()`
  - `birthDate`: `z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD").optional()`
  - `religion`: `z.string().optional()`
  - `maritalStatus`: `z.string().optional()`

### Service Boundary
- Calls: `src/modules/employee/service.ts` -> `updateProfile(employeeId, data)`
- Repository access: internal employee persistence only.

### Side Effects
- Database: Mengupdate tabel `Employee` milik user saat ini.
- Audit: Mencatat event `EMPLOYEE_UPDATED` dengan metadata field yang berubah.

---

## Server Action: `crudEmployeeAction(operation, id?, data?)`

**Status:** Ready for review
**Module:** `employee`
**Handler Type:** Server Action
**Frontend Caller:** Admin Employee Management Page
**Minimum Role:** ADMIN
**Ownership Rule:** N/A (Admin bypass)

### Purpose
Menyediakan operasi CRUD untuk entitas Employee (Create, Read, Update, Soft Delete, Restore).

### Request

#### Input Data (Create Example)
```json
{
  "operation": "CREATE",
  "data": {
    "email": "baru@bahteramas.go.id",
    "role": "EMPLOYEE",
    "employeeId": "199001012015011002",
    "nik": "7471010203040002",
    "name": "Budi Santoso",
    "gender": "L",
    "employmentStatusId": "status_1",
    "employeePositionId": "pos_1"
  }
}
```

#### Input Data (Soft Delete Example)
```json
{
  "operation": "DELETE",
  "id": "emp_102893812"
}
```

#### Input Data (Restore Example)
```json
{
  "operation": "RESTORE",
  "id": "emp_102893812"
}
```

### Success Response
```json
{
  "ok": true,
  "data": {
    "id": "emp_102893812",
    "name": "Budi Santoso"
  }
}
```

### Error Responses
- `FORBIDDEN`: Bukan Admin.
- `VALIDATION_ERROR`: Format salah atau melanggar aturan NIP/NIK.
- `CONFLICT`: NIP atau NIK atau Email sudah terdaftar.

### Validation
- Zod schema: `crudEmployeeSchema`
  - `operation`: `z.enum(["CREATE", "UPDATE", "DELETE", "RESTORE"])`
  - `id`: `z.string().optional()`
  - `data`: Objek detail pegawai.
- Aturan NIP/NIK:
  - `employeeId` (NIP) dan `nik` (NIK) boleh nullable, namun **minimal salah satu wajib ada**.
  - Zod refinement: `data.employeeId || data.nik` must be true. Jika NIP kosong, NIK digunakan sebagai identifier utama.

### Service Boundary
- Calls: `src/modules/employee/service.ts` -> `handleEmployeeCrud(operation, id, data)`
- Repository access: internal employee persistence only; user-account changes must go through an approved auth/user service boundary, not a cross-module repository import.

### Side Effects
- Database:
  - `CREATE`: Membuat `User` baru dan `Employee` baru.
  - `DELETE`: Mengisi `deletedAt = now()` pada `Employee` dan `User` terkait.
  - `RESTORE`: Mengeset `deletedAt = null` pada `Employee` dan `User`.
- Audit:
  - `EMPLOYEE_CREATED`, `EMPLOYEE_UPDATED`, `EMPLOYEE_DELETED` status `SUCCESS`/`FAILED`.

---

## Server Action: `importEmployeesAction(formData)`

**Status:** Ready for review
**Module:** `employee`
**Handler Type:** Server Action (Multipart FormData)
**Frontend Caller:** Admin Import CSV Button
**Minimum Role:** ADMIN
**Ownership Rule:** N/A

### Purpose
Mengimpor data pegawai secara massal via file CSV.

### Request

#### Input FormData
- `file`: File CSV berisi kolom wajib (`email`, `name`, `employeeId`/`nik`, dll).

### Success Response
```json
{
  "ok": true,
  "data": {
    "importedCount": 45,
    "failedCount": 2,
    "errors": [
      { "row": 12, "error": "Email sudah digunakan" },
      { "row": 15, "error": "NIP atau NIK wajib diisi" }
    ]
  }
}
```

### Validation
- Server memvalidasi struktur kolom CSV dan tipe data baris per baris.

### Service Boundary
- Calls: `src/modules/employee/service.ts` -> `importFromCsv(stream)`

### Side Effects
- Database: Insert multiple `User` dan `Employee` records.
- Audit: `EMPLOYEE_CREATED` per pegawai atau summary log `EMPLOYEE_BULK_IMPORTED`.

---

## Server Action: `addCareerHistoryAction(data)`

**Status:** Ready for review
**Module:** `employee`
**Handler Type:** Server Action
**Frontend Caller:** Employee Detail Admin Page (Tab Riwayat Karier)
**Minimum Role:** ADMIN
**Ownership Rule:** N/A

### Purpose
Menambahkan riwayat mutasi karier pegawai (perubahan jabatan, unit, pangkat, dll).

### Request

#### Input Data
```json
{
  "employeeId": "emp_102893812",
  "employmentStatusId": "status_1",
  "employeeGroupId": "group_2",
  "employeePositionId": "pos_2",
  "employeeRankId": "rank_2",
  "workplaceId": "work_2",
  "effectiveDate": "2026-07-01",
  "note": "Kenaikan Jabatan Fungsional"
}
```

### Success Response
```json
{
  "ok": true,
  "data": {
    "id": "hstr_102839128",
    "effectiveDate": "2026-07-01"
  }
}
```

### Validation
- Zod schema: `addCareerHistorySchema`
  - `employeeId`: `z.string().min(1)`
  - `employmentStatusId`: `z.string().optional()`
  - `employeeGroupId`: `z.string().optional()`
  - `employeePositionId`: `z.string().optional()`
  - `employeeRankId`: `z.string().optional()`
  - `workplaceId`: `z.string().optional()`
  - `effectiveDate`: `z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD")`
  - `note`: `z.string().optional()`

### Service Boundary
- Calls: `src/modules/employee/service.ts` -> `addCareerHistory(data)`
- Repository access: internal employee persistence only for career history and current assignment synchronization.

### Side Effects
- Database:
  - Insert record ke `EmployeeCareerHistory`.
  - Sinkronisasi: Mengupdate assignment saat ini di `Employee` (`employmentStatusId`, `employeePositionId`, etc.) jika `effectiveDate` adalah yang terbaru.
- Audit: Mencatat event `EMPLOYEE_UPDATED` untuk mutasi pegawai.

---

## Server Actions: CRUD Master Data

SIMDP memiliki 6 entitas Master Data kepegawaian yang dikelola Admin:
1. **EmploymentStatus** (PNS, PPPK, Honorer, dll)
2. **EmployeeGroup** (Golongan III/a, Golongan IV/b, dll)
3. **ProfessionGroup** (Medis, Keperawatan, Administrasi, dll)
4. **EmployeePosition** (Pranata Komputer, Dokter Gigi, Perawat Pertama, dll)
5. **EmployeeRank** (Penata Muda, Pembina, dll)
6. **Workplace** (Unit Rekam Medis, Instalasi Gawat Darurat, dll)

Operasi CRUD disatukan melalui action modul masing-masing atau general action:
`crudMasterDataAction(entityType, operation, id?, data?)`

**Minimum Role:** ADMIN
**Rule:**
- Read list: STAFF dan ADMIN.
- Create/Update/Delete: ADMIN saja.
- Soft delete tidak digunakan di master data ini (hard delete dicegah jika ada relasi/foreign key constraint, melainkan disarankan edit/disable).

### Success Response Example
```json
{
  "ok": true,
  "data": {
    "id": "work_1",
    "name": "Ruang ICU"
  }
}
```

### Audit Events
- `MASTER_DATA_CREATED`, `MASTER_DATA_UPDATED`, `MASTER_DATA_DELETED` dengan metadata nama entity dan id.

---

## Frontend Table/Form Notes & Caching

- **Pagination & Filters**:
  - Employee list di Admin/Staff wajib mendukung paginasi (`page`, `pageSize`), pencarian nama/NIP (`search`), dan filter unit (`workplaceId`), status (`employmentStatusId`).
  - Response harus menyertakan envelope pagination (`meta.pagination`).
- **Cache Invalidation**:
  - `updateProfileAction`: memicu invalidasi query `["currentProfile"]`.
  - `crudEmployeeAction`: memicu invalidasi query `["employees"]` dan `["employeeDetail", id]`.
  - `addCareerHistoryAction`: memicu invalidasi `["careerHistory", employeeId]` dan `["employeeDetail", employeeId]`.
  - `crudMasterDataAction`: memicu invalidasi data dropdown master terkait (e.g. `["workplaces"]`).
