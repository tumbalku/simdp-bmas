## Summary

- 

## Linked Issue

Closes #

## Type of Change

- [ ] feat — fitur baru
- [ ] fix — bug fix
- [ ] docs — dokumentasi/PRD/context
- [ ] chore — setup/config/maintenance
- [ ] refactor — perubahan struktur tanpa behavior baru
- [ ] test — test only
- [ ] ci — workflow/deployment

## Test Plan

Tuliskan command yang dijalankan dan hasilnya.

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] Manual test:

## SIMDP Architecture Checklist

- [ ] Komponen React tidak memanggil `fetch` langsung; lewat `hooks.ts`.
- [ ] `hooks.ts` hanya memanggil `api.ts` di modul yang sama.
- [ ] Route Handler/Server Action hanya memanggil `service.ts` modul yang sama.
- [ ] Import antar modul hanya lewat `service.ts`, bukan `repository.ts`.
- [ ] Input eksternal divalidasi Zod.
- [ ] Aksi sensitif memanggil `logActivity()`.
- [ ] Query soft-delete memfilter `deletedAt IS NULL`.
- [ ] Tidak ada secret/confidential file ter-commit.

## Screenshots / Evidence

Tambahkan screenshot, log test, atau output command jika relevan.
