# Golden Rules — SIMDP

**Status:** Draft awal
**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §5
**Terakhir diperbarui:** 2026-07-08

Aturan ini wajib dibaca sebelum menulis kode. Jangan dilanggar tanpa keputusan baru di `context/memory/decisions-log.md`.

## 10 Aturan Emas

1. **Komponen React tidak pernah memanggil `fetch` langsung.**
   Semua data client lewat custom hook (`hooks.ts`).

2. **Custom hook hanya boleh memanggil `api.ts` di modul yang sama.**
   Jangan hook modul A memanggil `api.ts` modul B.

3. **Server Action / Route Handler hanya boleh memanggil `service.ts` di modul yang sama.**
   Ini menjaga boundary modul tetap jelas.

4. **Akses antar modul hanya lewat `service.ts`.**
   Jika modul A butuh data modul B, panggil fungsi exported dari `@/modules/B/service`. Jangan import `repository.ts` modul lain.

5. **Semua input dari luar wajib divalidasi Zod.**
   Termasuk form, body JSON, query string, params, dan multipart metadata.

6. **Urutan Server Action wajib konsisten.**

   ```txt
   auth check -> role check -> Zod validation -> service -> audit log jika sensitif
   ```

7. **Aksi penting wajib audit.**
   Upload, approve/reject, hapus, ubah master data, ubah role, ubah setting, import/export sensitif wajib memanggil `logActivity()`.

8. **Komunikasi request-response hanya REST atau Server Actions.**
   Tidak GraphQL dan tidak gRPC untuk v1. Event bus internal hanya boleh untuk side effect async yang sudah punya keputusan arsitektur.

9. **`page.tsx` harus tipis.**
   Halaman hanya auth/role guard dan render komponen utama dari modul. Logic tampilan tidak ditulis di `page.tsx`.

10. **Soft-deleted data tidak boleh muncul di query normal.**
    Query tabel yang punya `deletedAt` wajib filter `deletedAt IS NULL`.

## Rule Tambahan yang Sering Terlewat

- Upload file wajib lewat `POST /api/v1/documents/upload`.
- Storage hanya lewat `IStorageProvider`.
- Client-side validation hanya untuk UX; server tetap wajib validasi ulang.
- Jangan simpan token/secret di localStorage.
- `SecurityLog` append-only.
- Modul `statistics` read-only.
