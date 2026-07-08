# Module Boundaries — SIMDP

**Status:** Draft awal
**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §6.3-6.5
**Terakhir diperbarui:** 2026-07-08

## 1. Prinsip Boundary

Setiap modul adalah bounded context. Analogi PRD: modul seperti departemen; `service.ts` adalah resepsionis. Modul lain boleh bicara ke resepsionis, tidak boleh masuk ruang arsip (`repository.ts`).

Rule utama:

```txt
Modul lain hanya boleh mengimpor dari service.ts.
```

Benar:

```ts
import { getEmployeeById } from "@/modules/employee/service";
```

Salah:

```ts
import { employeeRepository } from "@/modules/employee/repository";
```

## 2. Daftar Modul

| Modul | Tanggung Jawab | Catatan Boundary |
|---|---|---|
| `auth` | Login, refresh token, reset password, session management. | Menyediakan auth/session service; tidak boleh mengelola profil pegawai langsung selain lookup perlu. |
| `employee` | Employee, master data kepegawaian, career history. | Source of truth profil pegawai dan master HR. |
| `document` | DocumentType, DocumentRecord, upload, versi/snapshot. | Satu-satunya modul yang mengelola metadata dokumen dan upload. |
| `verification` | VerificationHistory, approve/reject. | Mengubah status dokumen lewat service resmi, wajib membuat history. |
| `notification` | Notification in-app dan reminder. | Mengelola create/read notification. |
| `statistics` | Dashboard aggregation read-only. | Boleh query lintas tabel via repository sendiri, tetapi tidak boleh write. |
| `security` | SecurityLog, audit helper `logActivity()`. | `logActivity()` diekspor untuk dipakai modul lain. SecurityLog append-only. |
| `settings` | SystemSetting. | Mengelola konfigurasi runtime seperti reminder days dan upload limit. |

## 3. Struktur Modul Standar

```txt
src/modules/<module>/
├── service.ts      # public boundary + business logic
├── repository.ts   # Prisma query internal modul
├── schema.ts       # Zod schemas
├── types.ts        # public/internal types
├── actions.ts      # Server Actions
├── api.ts          # client API wrapper
├── hooks.ts        # TanStack Query hooks
└── components/     # UI modul
```

## 4. Import Rules

### Boleh

- `actions.ts` modul memanggil `service.ts` modul yang sama.
- `service.ts` modul memanggil `repository.ts` modul yang sama.
- `service.ts` modul A memanggil public function dari `service.ts` modul B jika benar-benar perlu.
- `hooks.ts` memanggil `api.ts` modul yang sama.
- Komponen memanggil hooks/actions public yang sesuai.

### Dilarang

- Komponen melakukan `fetch()` langsung.
- `hooks.ts` modul A memanggil `api.ts` modul B.
- Modul A mengimpor `repository.ts` modul B.
- Route Handler/Server Action memanggil `repository.ts` langsung.
- Kode di luar `src/lib/storage/` memanggil SDK storage/filesystem langsung.

## 5. Microservice Future-proofing

Jika satu modul dipisah menjadi microservice:

1. Public function di `service.ts` dipertahankan.
2. Isi `service.ts` berubah dari Prisma call menjadi REST client call.
3. Modul lain tidak berubah karena tetap memanggil `service.ts` yang sama.

Kandidat jangka panjang: `document` + `verification`, karena beban file dan workflow verifikasi biasanya paling berat.
