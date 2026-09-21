# Module Boundaries — SIMDP

**Status:** Draft awal
**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §6.3-6.5
**Terakhir diperbarui:** 2026-09-21

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
| `post` | Sistem pengumuman: CRUD `Post`, feed pegawai, visibility targeting (`PUBLIC`/`TARGETED`), lampiran (relasi `StoredFile`), rich text Tiptap, dan notifikasi publish. | Modul ke-9. Boundary public untuk server adalah `server.ts` (re-export `services/post.service.ts` + `constants`); `index.ts` hanya re-export `constants` + `types` untuk client. Memakai `notification.service`, `settings.service`, `security.service` lewat boundary `*/server` modul lain. |

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

Modul yang sudah berkembang (`auth`, `document`, `employee`, `notification`, `security`, `settings`, `statistics`, `verification`, `post`) memakai struktur folder terfokus sesuai §6: `services/`, `repositories/`, `schemas/`, `types/`, `constants/`, `hooks/`, `components/`, `utils/`, masing-masing dengan `index.ts` aggregator. Struktur lengkap modul `post` ada di §3.1.

### 3.1 Contoh: struktur aktual modul `post`

```txt
src/modules/post/
├── index.ts                          # aggregator: re-export constants + types (client-safe)
├── server.ts                         # public boundary server: re-export services/post.service.ts + constants
├── api.ts                            # satu-satunya tempat fetch() di modul ini
├── components/
│   ├── index.ts                      # aggregator komponen
│   ├── PostFeedView.tsx              # feed pegawai (item utama/pin + daftar, badge "Baru", excerpt)
│   ├── PostDetailView.tsx            # layout artikel editorial (byline, cover, galeri, lampiran)
│   ├── PostComposer.tsx              # form buat/edit + urutan lampiran
│   ├── PostEditorView.tsx            # editor Tiptap + submit
│   ├── RichTextEditor.tsx            # editor Tiptap (link/placeholder/underline)
│   ├── RichTextContent.tsx           # renderer React markup tree (bukan dangerouslySetInnerHTML)
│   └── ManagePostsView.tsx           # tabel manajemen admin/staff (DataTable + filter)
├── hooks/
│   ├── index.ts
│   └── post.hooks.ts                 # TanStack Query hooks -> api.ts (query keys feed/manage/targetOptions)
├── schemas/
│   ├── index.ts
│   └── post.schema.ts                # Zod: createPost, updatePost, postListQuery, postFeedQuery, postId
├── services/
│   └── post.service.ts               # business logic: create/update/archive/delete, feed, target options, attachment scan
├── repositories/
│   ├── index.ts
│   └── post.repository.ts            # Prisma internal: findPosts, findVisiblePosts, visibility targets, read states
├── constants/
│   ├── index.ts
│   └── post.constants.ts             # POST_STATUS, POST_VISIBILITY_TYPE + label ID, POST_ATTACHMENT_SETTING_KEYS, DEFAULT_POST_ATTACHMENT_LIMITS
├── types/
│   ├── index.ts
│   └── post.types.ts                 # PostDetail, PostFeedItem, PostSummary, PostListMeta, PostTargetInput, PostVisibilityContext
├── utils/
│   ├── rich-content.ts               # isomorphic: getPostContentText() + getPostExcerpt() dari JSON Tiptap
│   └── file-content.ts               # magic-byte sniffing: sniffAttachmentMimeType() PDF/PNG/JPEG/WEBP
└── __tests__/
    ├── post.service.test.ts
    ├── post-search.test.ts
    ├── post-excerpt.test.ts
    └── post-attachment-scan.test.ts
```

Titik masuk modul lain: **`@/modules/post/server`** untuk Route Handler/Server Action/service modul lain (mengembalikan fungsi service + constants); **`@/modules/post`** hanya untuk constants/types yang aman di client (mis. `POST_ATTACHMENT_SETTING_KEYS` yang dipakai modul `settings`).

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

## 6. Aggregator & Export Boundaries (index.ts)

- Setiap modul menyediakan file `index.ts` di root folder modulnya (misal `src/modules/employee/index.ts`) dan di folder komponen (`components/index.ts`).
- File `index.ts` bertindak murni sebagai aggregator/re-export dari API/komponen publik modul tersebut. Tidak boleh ada logika bisnis atau state di dalam file `index.ts`.
- Impor dari modul eksternal harus melewati aggregator/public boundary ini (`service.ts` atau re-export di `index.ts`) daripada mengimpor file internal seperti `repository.ts`.
- Struktur folder modul dapat berkembang menjadi subfolder terfokus (seperti `services/`, `repositories/`, `hooks/`, `components/`, `constants/`) jika modul tersebut menjadi sangat besar dan memiliki banyak concern terpisah.

## 7. Aturan Naming & Database Enum (Issue #129)

- Nilai enum di database wajib menggunakan bahasa Inggris (English), contoh: `PENDING`, `APPROVED`, `REJECTED`.
- Penulisan label atau deskripsi dalam bahasa Indonesia hanya dilakukan di tingkat UI (React components) atau mapping domain helper.
- Setiap migrasi skema database yang menyangkut enum (terutama penambahan/perubahan/penghapusan nilai) wajib menyertakan script mapping data legacy yang aman serta dokumentasi preflight.

## 8. Catatan Module Boundaries: modul `post` (2026-09-21)

Diverifikasi dari kode saat epic v2.3 di-review:

- **Boundary public terjaga.** `server.ts` hanya re-export `./services/post.service` + `./constants`; `index.ts` hanya re-export `./constants` + `./types`. `api.ts`/`hooks` di-import langsung hanya oleh komponen modul `post` yang sama.
- **Import lintas modul hanya lewat boundary `*/server`:** `createNotification` dari `@/modules/notification/server`, `logActivity` dari `@/modules/security/server`, `getSystemSettingValue` dari `@/modules/settings/server`, serta dynamic import `getActorDisplayName` dari `@/modules/employee/server` (hanya di jalur kegagalan malware scan). Constants notification (`NOTIFICATION_TYPE`, `NOTIFICATION_RELATED_ENTITY_TYPE`) diimpor dari `@/modules/notification` (aggregator client-safe), dan `STORAGE_PROVIDER_VALUE` dari `@/modules/document` (constants boundary).
- **Arah balah:** modul `settings` memakai `@/modules/post` (hanya constants — `POST_ATTACHMENT_SETTING_KEYS`, `DEFAULT_POST_ATTACHMENT_LIMITS`) di `services/system-settings.service.ts` dan `actions/settings.actions.ts`. Tidak ada modul lain yang mengimpor internal `post`.
- **Route handlers** `/api/v1/posts/**` hanya memanggil `@/modules/post/server` + `@/modules/post/schemas` (schema Zod), tidak pernah repository langsung.
- **`page.tsx` tipis:** kelima halaman `src/app/(dashboard)/announcement/` hanya auth/role guard + render komponen `@/modules/post/components` (feed guard `EMPLOYEE`; `detail/[id]` guard `EMPLOYEE` + `getPostByIdForUser`; `edit/[id]` dan `manage` guard `STAFF`; `manage/[id]` redirect legacy ke `routeTo.announcementsManageEdit`).
- **Client component tidak `fetch()` langsung:** seluruh request melalui `post/api.ts`; `post.hooks.ts` (TanStack Query) hanya memanggil `../api`.
