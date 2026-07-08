# Security RBAC — SIMDP

**Status:** Draft awal
**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §10.3-10.5
**Terakhir diperbarui:** 2026-07-08

## 1. Hierarki Role

```ts
const ROLE_LEVEL = {
  EMPLOYEE: 1,
  STAFF: 2,
  ADMIN: 3,
} as const;

const ROLE_LABELS = {
  EMPLOYEE: "Pegawai",
  STAFF: "Staff",
  ADMIN: "Admin",
} as const;
```

`assertRole(userRole, minRole)` harus menolak request jika level role user lebih rendah dari minimum role.

## 2. Layer Security

RBAC SIMDP wajib berlapis:

1. **Middleware**
   - verifikasi JWT;
   - inject `{ userId, role, employeeId }` ke request context.

2. **Route Handler / Server Action**
   - panggil auth check;
   - panggil `assertRole(minRole)`;
   - validasi input Zod;
   - jalankan business logic via `service.ts` modul sendiri;
   - audit jika aksi sensitif.

3. **Repository Query**
   - enforce row-level ownership untuk Employee;
   - filter `deletedAt IS NULL` untuk query normal.

4. **Client UI**
   - sembunyikan tombol/menu yang tidak relevan;
   - hanya kosmetik, bukan pengaman utama.

## 3. Row-level Ownership

Employee hanya boleh mengakses data miliknya sendiri.

Contoh aturan:

```txt
DocumentRecord.ownerId = currentEmployee.id
Employee.id = currentEmployee.id untuk profil sendiri
Notification.userId = currentUser.id
```

Staff/Admin boleh melihat dokumen semua pegawai sesuai permission matrix.

## 4. Pattern Server Action Aman

Urutan wajib:

```txt
1. requireAuth()
2. assertRole(minRole)
3. validate input dengan Zod
4. ownership check jika role Employee atau resource bersifat personal
5. panggil service.ts modul sendiri
6. logActivity() jika aksi sensitif
7. return result aman untuk client
```

## 5. Pattern Route Handler Aman

Untuk REST endpoint:

```txt
1. parse request
2. auth check jika endpoint tidak public
3. assertRole / CRON_SECRET check
4. Zod validation
5. service call
6. audit
7. response dengan status code jelas
```

Endpoint public seperti login/reset password tetap wajib rate limit dan tidak boleh membocorkan data sensitif.

## 6. Permission Matrix Ringkas

| Kemampuan | Minimum Role | Extra Check |
|---|---|---|
| Upload dokumen sendiri | `EMPLOYEE` | owner = current employee |
| Lihat dokumen sendiri | `EMPLOYEE` | owner = current employee |
| Soft-delete dokumen sendiri PENDING/REJECTED | `EMPLOYEE` | owner + status allowed |
| Lihat dokumen semua pegawai | `STAFF` | none |
| Approve/reject dokumen | `STAFF` | document exists, not soft-deleted |
| CRUD Employee | `ADMIN` | none |
| CRUD User & role | `ADMIN` | none |
| CRUD master data | `ADMIN` | none |
| CRUD DocumentType | `ADMIN` | none |
| Restore dokumen/employee | `ADMIN` | within retention |
| Lihat Security Log | `ADMIN` | read-only |
| Ubah SystemSetting | `ADMIN` | audit required |
| Cron check-expiry | System | valid `CRON_SECRET` |

## 7. Forbidden Defaults

Jika permission belum jelas:

- jangan default allow;
- default deny atau Admin only;
- catat ambiguitas di `context/memory/known-issues.md`;
- minta keputusan project owner.

## 8. Hal yang Dilarang

- Mengandalkan client UI sebagai security utama.
- Mengambil role dari request body.
- Query dokumen Employee tanpa ownership filter.
- Mengimpor repository modul lain langsung untuk bypass service.
- Menampilkan security/audit log ke non-Admin.
