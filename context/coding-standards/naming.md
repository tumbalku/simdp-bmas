# Naming Standards — SIMDP

**Status:** Draft awal
**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §15-16 dan `CONTRIBUTING.md`
**Terakhir diperbarui:** 2026-07-08

## Kode

| Elemen | Konvensi | Contoh |
|---|---|---|
| Folder modul | kebab-case | `document/`, `employee/` |
| Komponen React | PascalCase | `DocumentTabs.tsx`, `EmployeeCard.tsx` |
| File service/repository/schema | nama standar per modul | `service.ts`, `repository.ts`, `schema.ts` |
| Custom hook | camelCase, prefix `use` | `useDocuments`, `useEmployee` |
| Zod schema | camelCase, suffix `Schema` | `createDocumentSchema`, `loginSchema` |
| Tipe domain | PascalCase | `DocumentRecord`, `Employee` |
| Server Action | camelCase, suffix `Action` | `uploadDocumentAction`, `verifyDocumentAction` |
| Path alias | wajib `@/` ke `src/` | `@/lib/prisma` |
| Env variable | `SCREAMING_SNAKE_CASE` | `DATABASE_URL`, `JWT_SECRET` |

## Branch

Format dari `CONTRIBUTING.md`:

```txt
<type>/<issue-number>-<short-description>
```

Contoh:

```txt
feat/12-upload-dokumen
fix/18-login-refresh-token
docs/09-update-prd-storage-provider
```

Type umum:

| Type | Kapan dipakai |
|---|---|
| `feat` | Fitur baru |
| `fix` | Bug fix |
| `docs` | Dokumentasi/PRD/context |
| `chore` | Setup/config/dependency/maintenance |
| `refactor` | Perubahan struktur tanpa behavior baru |
| `test` | Penambahan/perbaikan test |
| `ci` | GitHub Actions/deployment pipeline |

## Commit

Gunakan Conventional Commits:

```txt
<type>(<scope>): <short description>
```

Contoh:

```txt
feat(document): add upload endpoint
fix(auth): revoke refresh token on logout
docs(context): add technical standards
```

## File Upload Pegawai

Format storage path:

```txt
{NIK-atau-NIP}_{KATEGORI-ARSIP}_{KODE-DOKUMEN}_{YYYYMMDD}_{VERSI}.{ext}
```

Contoh:

```txt
198501012010011001_PERSONAL_KTP_20260115_1.pdf
198501012010011001_EDUCATION_IJAZAH_20260115_1.pdf
198501012010011001_CERTIFICATION_STR-MEDIS_20260115_2.pdf
```

Aturan:
- tidak boleh spasi;
- hanya `[A-Za-z0-9._-]`;
- prioritas identifier adalah NIK terlebih dahulu, lalu NIP;
- extension lowercase;
- maksimal 150 karakter.

## Dokumen Teknis

Format:

```txt
{DOC-TYPE}-{KODE-PROYEK}-v{MAJOR.MINOR}-{YYYYMMDD}.md
```

Contoh:

```txt
PRD-SIMDP-v2.0-20260708.md
```

## Export/Laporan

Format:

```txt
{Nama-Laporan}_{Scope}_{YYYYMMDD}_{HHmm}.{ext}
```

Contoh:

```txt
Export-Data-Pegawai_Seluruh-Unit_20260708_0900.csv
```
