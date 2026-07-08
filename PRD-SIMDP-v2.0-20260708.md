# PRD — SIMDP (Sistem Informasi Manajemen Dokumen Pegawai)
### RSUD Bahteramas Kendari
### Monolit Modular — REST API First, Siap Upgrade ke Microservice

---

## 0. Document Control

| Field | Value |
|---|---|
| **Document ID** | `PRD-SIMDP-v2.0-20260708` |
| **Judul Dokumen** | Product Requirement Document — SIMDP |
| **Kode Proyek** | `SIMDP` |
| **Versi** | 2.0 |
| **Status** | `Draft untuk Implementasi` |
| **Tanggal Dibuat** | 2026-07-08 |
| **Ditulis untuk** | Junior Programmer (Next.js/TypeScript) & AI Coding Agent |
| **Gaya Arsitektur** | Monolit Modular, komunikasi REST API & Server Actions |
| **Supersedes** | `PRD-SMDP-PORTAL-v1.0-20260627`, `PRD.md (draft 07 Juli 2026)` |

> **Cara Membaca:** Dokumen ini adalah *single source of truth* agar AI agent & programmer dapat membangun sistem ini dengan minim halusinasi dan minim revisi. Setiap keputusan desain disertai alasannya. Perubahan apapun terhadap dokumen ini wajib dicatat di `context/memory/decisions-log.md`.

---

## 1. Filosofi Dokumen — Keep It Simple, But Complete (KISBC)

Dokumen ini ditulis dengan satu prinsip utama: **mudah dikerjakan, mudah dipahami, dan tidak ada ambiguitas**.

**Asumsi kemampuan tim:**
- Mengerti dasar **RESTful API** dan autentikasi berbasis token (JWT).
- Mengerti **Next.js** App Router dengan TypeScript.
- Mengerti **Tailwind CSS** dan **shadcn/ui**.
- Mengerti dasar **PostgreSQL** (tabel, relasi, query, index).
- Mengerti ORM **Prisma** untuk operasi database.

**Prinsip desain:**
- **Tidak ada** pola arsitektur rumit (event bus, message queue, dependency injection framework) kecuali kebutuhan nyata muncul.
- **Tidak ada** gRPC atau GraphQL — **REST API + Server Actions** adalah satu-satunya cara komunikasi.
- Setiap modul fitur hanya punya **beberapa file dengan nama yang jelas** (`service.ts`, `repository.ts`, `schema.ts`, `actions.ts`, `types.ts`).
- Aturan antar modul cukup **satu kalimat**: *"modul lain hanya boleh dipanggil lewat `service.ts`-nya."*
- Proyek dimulai sebagai **monolit**, tetapi disusun rapi sejak awal agar pemisahan ke microservice tidak perlu menulis ulang logika bisnis.

---

## 2. Ringkasan Bisnis

### 2.1 Latar Belakang

RSUD Bahteramas Kendari saat ini mengelola dokumen kepegawaian (KTP, Ijazah, SK, Sertifikat, STR, SIP, dokumen legal, dll) secara **manual dan tersebar**. Hal ini menyebabkan:
- Dokumen hilang atau kadaluarsa tanpa pemberitahuan.
- Sulit melacak riwayat verifikasi dokumen (siapa yang approve, kapan, alasannya apa).
- Tidak ada visibilitas terpusat bagi manajemen (jumlah pegawai, status dokumen, compliance rate).
- Tidak ada jejak audit untuk aksi-aksi sensitif (upload, approve, hapus, ubah data).

### 2.2 Tujuan Produk

Membangun **SIMDP**, sebuah Document Management System (DMS) berbasis web yang:
1. Memusatkan penyimpanan dokumen pegawai secara **digital dan aman**.
2. Menyediakan alur **verifikasi dokumen berjenjang** (Employee → Staff → Admin).
3. Memberi **notifikasi otomatis** untuk dokumen kadaluarsa/butuh tindakan.
4. Memberi **dashboard statistik** kepegawaian & dokumen untuk Admin dan Staff.
5. Mencatat **seluruh jejak audit** (siapa melakukan apa, kapan, dari IP mana).
6. Menjadi dasar arsitektur yang **monolith-first** namun **siap dipecah menjadi microservice** di masa depan.

### 2.3 Target Pengguna

| Peran | Kode DB | Label UI | Deskripsi                                      |
|---|---|---|------------------------------------------------|
| Admin | `ADMIN` | Admin | Administrator sistem, superuser                |
| Staff | `STAFF` | Staff | Petugas Kepegawaian yang memverifikasi dokumen |
| Pegawai | `EMPLOYEE` | Pegawai | Seluruh pegawai RSUD Bahteramas                |

### 2.4 Indikator Keberhasilan (Success Metrics)

- 100% dokumen wajib pegawai tersimpan digital dalam 3 bulan pertama.
- Waktu verifikasi dokumen rata-rata < 2x24 jam.
- 0 insiden kebocoran dokumen (audit trail lengkap).
- Admin dapat menghasilkan laporan statistik real-time tanpa query manual ke database.

### 2.5 Di Luar Cakupan (Out of Scope) — Versi 1.0

- Integrasi dengan sistem payroll/absensi.
- Tanda tangan digital bersertifikat (e-signature resmi Kominfo/BSrE).
- Aplikasi mobile native (hanya responsive web).
- Multi-tenant (satu instance untuk satu rumah sakit).

---

## 3. Domain & Glosarium

### 3.1 Entitas Inti

| Entitas | Fungsi |
|---|---|
| `User` | Akun login (email, password, role, status aktif, soft delete) |
| `Employee` | Profil pegawai lengkap (1-1 dengan `User`) |
| `EmploymentStatus` | Status kepegawaian (mis. PNS, Kontrak, Honorer) |
| `EmployeeGroup` | Kelompok pegawai, turunan dari `EmploymentStatus` |
| `ProfessionGroup` | Rumpun profesi (mis. Medis, Non-Medis) |
| `EmployeePosition` | Jabatan, turunan dari `ProfessionGroup` |
| `EmployeeRank` | Pangkat/Golongan |
| `Workplace` | Unit kerja/lokasi kerja |
| `EmployeeCareerHistory` | Riwayat mutasi jabatan/pangkat/status/unit kerja |
| `DocumentType` | Master jenis dokumen beserta aturan validasinya |
| `DocumentType[X]` (5 tabel relasi) | Aturan "jenis dokumen ini wajib/berlaku untuk kelompok X" |
| `DocumentRecord` | File dokumen yang diunggah pegawai (dengan full metadata file) |
| `VerificationHistory` | Riwayat setiap tindakan verifikasi terhadap satu dokumen |
| `Notification` | Notifikasi in-app per user |
| `SecurityLog` | Audit trail seluruh aktivitas sensitif (append-only) |
| `SystemSetting` | Konfigurasi sistem key-value (tanpa redeploy) |
| `RefreshToken` | Token refresh untuk rotasi sesi (jangan simpan plaintext) |
| `PasswordResetToken` | Token one-time untuk reset password via email |

### 3.2 Glosarium Istilah

| Istilah | Definisi |
|---|---|
| **Snapshot Dokumen** | Setiap unggahan baru dianggap versi/snapshot baru. Untuk `DocumentType` dengan `allowMultiple = false`, hanya satu snapshot yang boleh `isCurrent = true`. |
| **TMT** | Terhitung Mulai Tanggal — tanggal efektif suatu perubahan status kepegawaian. |
| **Kadaluarsa (Expired)** | Dokumen dengan `expiryDate` yang telah lewat dan belum diperbarui. |
| **Archive Category** | Pengelompokan dokumen: `PERSONAL`, `EDUCATION`, `EMPLOYMENT`, `CERTIFICATION`, `LEGAL`. |
| **Soft Delete** | Data tidak benar-benar dihapus dari database, melainkan kolom `deletedAt` diisi. Data dapat di-restore oleh Admin dalam batas waktu tertentu. |
| **Audit Trail** | Catatan semua aktivitas sensitif yang tidak bisa diubah/dihapus oleh aplikasi. |
| **Compliance Rate** | Persentase pegawai yang sudah mengunggah semua `DocumentType` wajib (`isMandatory = true`) yang relevan dengan grup mereka. |

### 3.3 Business Rules Kunci

1. Satu `Employee` hanya boleh punya satu dokumen **current** per `DocumentType` **jika** `allowMultiple = false` — dijamin oleh partial unique index + trigger `handle_document_replacement` di database.
2. Saat dokumen baru diunggah menggantikan dokumen lama (non-multiple), dokumen lama otomatis berstatus `REPLACED` dan `isCurrent = false` (ditangani trigger, bukan aplikasi).
3. Dokumen dengan `allowMultiple = true` (mis. Sertifikat Diklat) boleh memiliki banyak `isCurrent = true` sekaligus — riwayat sertifikat tidak saling menggantikan.
4. Setiap perubahan status dokumen (approve/reject) **wajib** dicatat di `VerificationHistory` — tidak boleh ada perubahan status tanpa jejak riwayat.
5. `DocumentType` dapat memiliki aturan target opsional berdasarkan ProfessionGroup / EmploymentStatus / EmployeeGroup / EmployeeRank / Workplace. Jika satu kategori target tidak memiliki baris relasi, kategori tersebut dianggap berlaku untuk semua pegawai.
6. Logika target `DocumentType`: dalam kategori yang sama menggunakan **OR**, sedangkan antar kategori target menggunakan **AND**. Contoh: ProfessionGroup = Medis/Keperawatan dan Workplace = IGD berarti `(Medis OR Keperawatan) AND IGD`.
7. Dokumen yang `expiryDate`-nya mendekati threshold H-30, H-7, dan H-1 memicu `Notification` otomatis. Setiap tahap reminder harus punya jejak sendiri (`reminderH30SentAt`, `reminderH7SentAt`, `reminderH1SentAt`) agar reminder H-30, H-7, dan H-1 masing-masing hanya dikirim satu kali.
8. Employee hanya bisa melihat/mengelola dokumen **miliknya sendiri** (`ownerId = employee.id milik user login`).
9. `SecurityLog` bersifat **append-only** — tidak ada UPDATE/DELETE dari aplikasi.
10. Soft-deleted records tidak boleh muncul di query normal. Semua query normal wajib menambahkan filter `deletedAt IS NULL` untuk tabel yang mendukung soft delete.
11. Upload dokumen v1 memakai **server-mediated upload** lewat kontrak `IStorageProvider.upload()`. File boleh melewati server agar validasi MIME, hash SHA-256, dan pergantian provider local → Supabase → S3 tetap konsisten.
12. `DocumentStatus.EXPIRED` adalah status terkini dokumen setelah melewati `expiryDate`. Jika dokumen sebelumnya `APPROVED`, riwayat approval tetap tersimpan di `VerificationHistory`.
13. Modul `statistics` adalah modul reporting read-only. Ia boleh melakukan query Prisma lintas tabel melalui repository sendiri untuk kebutuhan agregasi, tetapi tidak boleh menulis data.
14. Soft delete v1 tidak melakukan hard delete otomatis. `soft_delete_retention_days` hanya membatasi kemampuan restore di UI. Penghapusan permanen manual berada di luar scope aplikasi v1.

---

## 4. Tech Stack

| Layer | Teknologi | Alasan |
|---|---|---|
| Framework | **Next.js 15+** (App Router, TypeScript) | Satu framework untuk frontend & backend, Server Components mengurangi bundle JS |
| Styling / UI Components | **Tailwind CSS** + **shadcn/ui** | Canonical design system. Semua komponen aplikasi wajib memakai primitives/pattern shadcn/ui terlebih dahulu |
| Data Fetching (Client) | **TanStack Query** (`@tanstack/react-query`) | Mengurus cache, loading, error, dan refetch otomatis |
| Database | **PostgreSQL** (hosted di Supabase) | Relasional, mendukung enum, partial index, trigger, jsonb |
| ORM | **Prisma** | Query database aman dari SQL Injection, type-safe |
| File Storage | **Pluggable Storage Provider** — `LocalStorageProvider` (development) / `SupabaseStorageProvider` atau `S3StorageProvider` (production) | Abstraksi storage agar mudah ganti provider tanpa mengubah logika bisnis |
| Autentikasi | **Custom JWT** (access token + refresh token) | Sesuai tabel `RefreshToken`/`PasswordResetToken` yang dirancang custom |
| Validasi | **Zod** (shared schema client-server) | Memastikan data yang masuk ke API sudah benar sebelum diproses |
| Password Hashing | **Argon2id** | Lebih aman dari bcrypt, standar industri modern |
| Charting | **Tremor Charts** (`@tremor/react`) | Chart dashboard siap pakai dengan default visual rapi; gunakan untuk chart/statistik, disesuaikan agar visualnya konsisten dengan shadcn/ui |
| Job Terjadwal | **Vercel Cron Jobs** | Memanggil Route Handler internal untuk cek expiry & kirim notifikasi |
| Email | **Resend** atau **Supabase SMTP** | Reset password & reminder kadaluarsa via email |
| Testing | **Vitest** (unit) + **Playwright** (E2E) | — |

> **Catatan penting (Storage Provider):** Akses file diatur melalui satu interface `IStorageProvider`. Di development, file disimpan di folder `LocalStorage/` dalam project. Di production, file dapat disimpan di Supabase Storage atau S3-compatible storage. Pergantian provider cukup dengan mengubah `STORAGE_PROVIDER` tanpa mengubah logika bisnis modul `document`. Detail kontrak provider di §13.

---

## 5. Aturan Emas — Wajib Diingat Setiap Mengerjakan Fitur

1. Komponen React **tidak pernah** memanggil `fetch` langsung → selalu lewat custom hook (`hooks.ts`).
2. Custom hook hanya boleh memanggil `api.ts` **di modul yang sama**.
3. Server Action/Route Handler hanya boleh memanggil `service.ts` **di modul yang sama**.
4. Kalau modul A butuh data dari modul B → modul A **hanya boleh** memanggil fungsi yang diekspor `service.ts` milik modul B. **Dilarang** mengimpor `repository.ts` modul lain secara langsung.
5. Semua input dari luar (form, query string, body request) **wajib** divalidasi dengan Zod sebelum diproses.
6. Setiap Server Action wajib urutan: **(1) auth check → (2) role check → (3) Zod validation → (4) business logic via `service.ts` → (5) audit log jika aksi sensitif**.
7. Aksi penting (upload, approve/reject, hapus, ubah master data, ubah setting) **wajib** dicatat ke `SecurityLog` lewat fungsi `logActivity()`.
8. Semua komunikasi API memakai **REST (JSON di atas HTTP)** atau **Server Actions** — bukan gRPC, bukan GraphQL.
9. Halaman (`page.tsx`) hanya berisi: cek hak akses (`requireRole`) + render satu komponen dari modul. Logika tampilan **tidak** ditulis di `page.tsx`.
10. Soft-deleted data **tidak boleh** muncul di query normal. Gunakan scope `WHERE deletedAt IS NULL` di semua query yang relevan.

---

## 6. Arsitektur: Monolit Modular Sederhana

### 6.1 Konsep Dasar (Analogi Gedung Kantor)

Bayangkan aplikasi ini seperti **gedung kantor dengan beberapa departemen** (Auth, Employee, Document, Verification, dst). Setiap departemen punya **satu meja resepsionis** (`service.ts`). Departemen lain yang butuh sesuatu **wajib lewat resepsionis itu**, tidak boleh langsung masuk ke ruang arsip (`repository.ts`) departemen lain.

Keuntungannya: kalau suatu hari satu departemen dipindah ke gedung lain (microservice), departemen lain tidak perlu tahu — mereka tetap "menelepon resepsionis yang sama", hanya saja di baliknya resepsionis itu sekarang meneruskan permintaan lewat REST API ke gedung sebelah.

### 6.2 Diagram Arsitektur

```
+----------------------------------------------------------+
|                     Client (Browser)                      |
|         Next.js App Router (React Server Components)      |
+----------------------------+------------------------------+
                             | HTTPS
+----------------------------v------------------------------+
|                Next.js App (Vercel - Serverless)          |
|  +----------+ +----------+ +----------+ +------------+   |
|  |   auth   | | employee | | document | |verification|   |
|  +----------+ +----------+ +----------+ +------------+   |
|  +----------+ +----------+ +----------+ +------------+   |
|  |notifi-   | |statistics| | security | |  settings  |   |
|  |cation    | |          | |          | |            |   |
|  +----------+ +----------+ +----------+ +------------+   |
+----------+--------------------------------------------+--+
           | Prisma / SQL                | Storage Provider SDK
+----------v------------------+ +--------v----------------+
|  PostgreSQL (Supabase)       | |  File Storage Provider  |
|                              | |  local / Supabase / S3  |
+------------------------------+ +------------------------+
```

### 6.3 Pembagian Modul (Bounded Context)

```
/src/modules
├── auth/           → login, refresh token, reset password, session management
├── employee/       → Employee, master data kepegawaian, Career History
├── document/       → DocumentType, DocumentRecord, upload, versi/snapshot
├── verification/   → VerificationHistory, alur approve/reject
├── notification/   → Notification, scheduled reminder job
├── statistics/     → agregasi read-only untuk dashboard (hanya baca, tidak menulis)
├── security/       → SecurityLog, audit middleware, logActivity()
└── settings/       → SystemSetting
```

### 6.4 Struktur di Dalam Satu Modul

| File | Isi |
|---|---|
| `service.ts` | Logika bisnis. **Satu-satunya** file yang boleh diimpor modul lain. |
| `repository.ts` | Query Prisma ke database. Hanya dipanggil oleh `service.ts` modul yang sama. |
| `schema.ts` | Skema Zod untuk validasi request. |
| `types.ts` | Tipe data/interface milik modul. |
| `actions.ts` | Server Actions Next.js untuk modul ini. |
| `api.ts` *(frontend)* | Fungsi `fetch()` ke endpoint REST modul ini. |
| `hooks.ts` *(frontend)* | `useQuery`/`useMutation` yang membungkus `api.ts`. |
| `components/` *(frontend)* | Komponen React/halaman untuk modul ini. |

### 6.5 Aturan Antar Modul

```ts
// src/modules/document/service.ts
import { getEmployeeById } from "@/modules/employee/service"; // BENAR - lewat service.ts

// import { findEmployeeById } from "@/modules/employee/repository"; // DILARANG
```

### 6.6 Keputusan Arsitektur (ADR)

| # | Keputusan | Alasan |
|---|---|---|
| ADR-001 | Next.js App Router (bukan Pages Router) | Server Components mengurangi bundle JS, cocok untuk halaman data-heavy |
| ADR-002 | Prisma ORM di atas skema SQL yang sudah ada | Skema dirancang manual di SQL; Prisma mengikuti via `@@map` |
| ADR-003 | Pluggable Storage Provider dengan interface `IStorageProvider` | Memisahkan kontrak storage dari implementasinya; mudah ganti provider (local → Supabase → S3) tanpa mengubah logika bisnis |
| ADR-004 | Custom JWT (bukan NextAuth/Supabase Auth) | Skema `User`/`RefreshToken`/`PasswordResetToken` dirancang custom; butuh kontrol penuh |
| ADR-005 | Statistics module hanya baca (read-only), tidak ada tabel agregat terpisah v1 | Menghindari kompleksitas data warehouse; dioptimasi dengan index |
| ADR-006 | Single-device login: login baru otomatis revoke semua sesi lama | Mencegah akses bersamaan dari multiple perangkat; satu user = satu sesi aktif |
| ADR-007 | Login identifier fleksibel (NIP / NIK / email) | Pegawai punya kebiasaan berbeda; NIP lebih mudah diingat dari email untuk pegawai non-IT |
| ADR-008 | REST API sebagai protokol komunikasi (bukan gRPC/GraphQL) | Mudah dipahami pemula, debugging mudah |

---

## 7. Struktur Folder Proyek

```
simdp/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/                            # Next.js App Router (routing only - tipis)
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── (dashboard)/               # Halaman yang butuh login
│   │   │   ├── layout.tsx             # Sidebar + Navbar + auth guard
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── documents/page.tsx
│   │   │   ├── documents/[id]/page.tsx
│   │   │   ├── verification/page.tsx
│   │   │   ├── verification/[id]/page.tsx
│   │   │   ├── employees/page.tsx
│   │   │   ├── employees/[id]/page.tsx
│   │   │   ├── master-data/page.tsx
│   │   │   ├── statistics/page.tsx
│   │   │   ├── security-log/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── api/
│   │       └── v1/                    # Route Handlers (endpoint eksternal/cron)
│   │           ├── auth/login/route.ts
│   │           ├── auth/refresh/route.ts
│   │           ├── auth/forgot-password/route.ts
│   │           ├── auth/reset-password/route.ts
│   │           ├── documents/upload/route.ts         # Upload endpoint (server sebagai proxy untuk LocalProvider)
│   │           ├── documents/download/[id]/route.ts  # Download / redirect ke signed URL
│   │           └── cron/
│   │               └── check-expiry/route.ts         # Cron job harian
│   ├── modules/                       # Bounded context - lihat §6.3
│   │   ├── auth/        { service.ts, repository.ts, schema.ts, types.ts, actions.ts, api.ts, hooks.ts, components/ }
│   │   ├── employee/    { service.ts, repository.ts, schema.ts, types.ts, actions.ts, api.ts, hooks.ts, components/ }
│   │   ├── document/    { service.ts, repository.ts, schema.ts, types.ts, actions.ts, api.ts, hooks.ts, components/ }
│   │   ├── verification/{ service.ts, repository.ts, schema.ts, types.ts, actions.ts, api.ts, hooks.ts, components/ }
│   │   ├── notification/{ service.ts, repository.ts, schema.ts, types.ts, actions.ts, api.ts, hooks.ts, components/ }
│   │   ├── statistics/  { service.ts, repository.ts, types.ts, hooks.ts, components/ }
│   │   ├── security/    { service.ts, repository.ts, types.ts, hooks.ts, components/ }
│   │   └── settings/    { service.ts, repository.ts, schema.ts, types.ts, actions.ts, components/ }
│   ├── components/                    # UI bersama (design system berbasis shadcn/ui)
│   │   ├── ui/                        # shadcn/ui components (canonical primitives)
│   │   ├── layout/                    # Sidebar, Navbar, PageHeader
│   │   └── shared/                    # StatusBadge, DataTable, EmptyState, dll
│   ├── lib/
│   │   ├── prisma.ts                  # Satu koneksi Prisma untuk semua modul
│   │   ├── jwt.ts                     # signToken(), verifyToken(), refreshToken()
│   │   ├── auth-utils.ts              # requireRole(), hasRole(), assertRole()
│   │   ├── storage/
│   │   │   ├── types.ts               # Interface IStorageProvider & StorageFile
│   │   │   ├── index.ts               # getStorageProvider() - factory function
│   │   │   ├── local.provider.ts      # LocalStorageProvider (development)
│   │   │   ├── supabase.provider.ts   # SupabaseStorageProvider (production option A)
│   │   │   └── s3.provider.ts         # S3StorageProvider (production option B)
│   │   ├── api-client.ts              # fetch wrapper untuk api.ts modul
│   │   └── env.ts                     # Validasi env variable via Zod saat startup
│   └── config/
│       ├── roles.ts                   # ROLE_LEVEL, ROLE_LABELS, permission map
│       └── constants.ts               # Nilai konstanta global
├── LocalStorage/                      # File upload dev (di-gitignore, hanya ada di local)
├── context/                           # Ingatan & panduan jangka panjang untuk AI agent - lihat §23
│   ├── business/                      # Konteks bisnis non-teknis
│   │   ├── overview.md
│   │   ├── scope.md
│   │   └── glossary.md
│   ├── domain/                        # Aturan domain yang tidak boleh dilanggar
│   │   ├── entities.md
│   │   ├── business-rules.md
│   │   └── rbac.md
│   ├── architecture/                  # Keputusan arsitektur & batas modul
│   │   ├── system-overview.md
│   │   ├── module-boundaries.md
│   │   ├── patterns.md
│   │   └── adr/
│   │       ├── ADR-001-app-router.md
│   │       ├── ADR-002-prisma-orm.md
│   │       ├── ADR-003-storage-provider.md
│   │       ├── ADR-004-custom-jwt.md
│   │       ├── ADR-005-statistics-readonly.md
│   │       ├── ADR-006-single-device-login.md
│   │       ├── ADR-007-flexible-identifier.md
│   │       └── ADR-008-rest-api.md
│   ├── technical/                     # Referensi teknis implementasi
│   │   ├── tech-stack.md
│   │   ├── database.md
│   │   ├── api-contracts.md
│   │   ├── storage-provider.md
│   │   └── environment.md
│   ├── coding-standards/              # Standar kode wajib diikuti
│   │   ├── golden-rules.md
│   │   ├── naming.md
│   │   ├── file-structure.md
│   │   └── checklist.md
│   ├── security/                      # Panduan keamanan & auth
│   │   ├── auth-flow.md
│   │   ├── rbac.md
│   │   └── audit.md
│   ├── ui/                            # Panduan desain UI
│   │   ├── design-system.md
│   │   └── pages.md
│   ├── memory/                        # Ingatan jangka panjang - WAJIB dibaca sebelum task
│   │   ├── decisions-log.md
│   │   ├── known-issues.md
│   │   └── changelog.md
│   └── progress/                      # Progres pengerjaan
│       ├── roadmap.md
│       ├── sprint-log.md
│       └── task-board.md
├── public/
├── components.json                    # shadcn/ui config
└── next.config.ts
```

---

## 8. Desain Database

### 8.1 Prinsip Skema

- Skema **ground truth** adalah file `dms_pegawai_schema.sql`. File `schema.prisma` harus sinkron dengan SQL tersebut (lewat `@@map` untuk nama tabel).
- Semua nama tabel **PascalCase** (via `@@map` di Prisma), kolom **camelCase**.
- Semua tabel utama memiliki `createdAt` dan `updatedAt` (diisi otomatis oleh trigger `set_updated_at`).
- Tabel yang mendukung **soft delete** memiliki kolom `deletedAt` (null = aktif, isi timestamp = terhapus).
- Tabel yang mendukung **audit trail** memiliki kolom `createdBy` dan `updatedBy` (FK ke `User.id`).
- Identitas pegawai wajib memiliki **minimal salah satu** dari NIP (`Employee.employeeId`) atau NIK (`Employee.nik`). Tidak semua pegawai memiliki NIP; jika NIP tidak ada, NIK menjadi identifier utama.

### 8.2 Enum Database

| Enum | Nilai | Catatan |
|---|---|---|
| `Role` | `ADMIN`, `STAFF`, `EMPLOYEE` | Langsung di database. Label UI: Admin, Staff, Pegawai |
| `DocumentStatus` | `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`, `REPLACED` | Status terkini dokumen + status snapshot lama |
| `ArchiveCategory` | `PERSONAL`, `EDUCATION`, `EMPLOYMENT`, `CERTIFICATION`, `LEGAL` | Pengelompokan jenis dokumen |

### 8.3 Kategori Arsip Dokumen

| Kategori | Definisi | Contoh |
|---|---|---|
| `PERSONAL` | Dokumen identitas pribadi | KTP, KK, Akta Lahir, Paspor |
| `EDUCATION` | Dokumen pendidikan/akademik | Ijazah, Transkrip Nilai |
| `EMPLOYMENT` | Dokumen terkait kepegawaian | SK Pengangkatan, SK Mutasi, Kontrak Kerja |
| `CERTIFICATION` | Sertifikat kompetensi & izin praktik | STR, SIP, SIK, Sertifikat Diklat |
| `LEGAL` | Dokumen legal lainnya | NPWP, BPJS, Surat Keterangan |

### 8.4 Daftar Tabel & Fungsinya

#### Auth & Sesi

| Tabel | Soft Delete | Audit (createdBy/updatedBy) | Keterangan |
|---|:---:|:---:|---|
| `User` | Yes (`deletedAt`) | — | Akun login |
| `RefreshToken` | — | — | Sesi aktif per perangkat |
| `PasswordResetToken` | — | — | Token one-time reset password |

#### Master Data Kepegawaian

| Tabel | Soft Delete | Audit (createdBy/updatedBy) | Keterangan |
|---|:---:|:---:|---|
| `EmploymentStatus` | — | Yes | Status kepegawaian (PNS, Kontrak, Honorer) |
| `EmployeeGroup` | — | Yes | Kelompok turunan dari EmploymentStatus |
| `ProfessionGroup` | — | Yes | Rumpun profesi |
| `EmployeePosition` | — | Yes | Jabatan, turunan dari ProfessionGroup |
| `EmployeeRank` | — | Yes | Pangkat/Golongan |
| `Workplace` | — | Yes | Unit kerja/lokasi |

#### Pegawai

| Tabel | Soft Delete | Audit | Keterangan |
|---|:---:|:---:|---|
| `Employee` | Yes (`deletedAt`) | Yes | Profil lengkap pegawai, 1-1 dengan User |
| `EmployeeCareerHistory` | — | Yes (createdBy saja) | Riwayat mutasi/jabatan/karier |

#### Dokumen

| Tabel | Soft Delete | Audit | Keterangan |
|---|:---:|:---:|---|
| `DocumentType` | Yes (`deletedAt`) | Yes | Master jenis dokumen |
| `DocumentTypeProfessionGroup` | — | — | Relasi: DocumentType - ProfessionGroup |
| `DocumentTypeEmploymentStatus` | — | — | Relasi: DocumentType - EmploymentStatus |
| `DocumentTypeEmployeeGroup` | — | — | Relasi: DocumentType - EmployeeGroup |
| `DocumentTypeEmployeeRank` | — | — | Relasi: DocumentType - EmployeeRank |
| `DocumentTypeWorkplace` | — | — | Relasi: DocumentType - Workplace |
| `DocumentRecord` | Yes (`deletedAt`) | Yes | File dokumen yang diunggah |
| `VerificationHistory` | — | — | Log verifikasi per dokumen (append-only) |

#### Sistem

| Tabel | Soft Delete | Audit | Keterangan |
|---|:---:|:---:|---|
| `Notification` | — | — | Notifikasi in-app per user |
| `SecurityLog` | — | — | Audit trail seluruh aktivitas (append-only) |
| `SystemSetting` | — | Yes (updatedBy) | Konfigurasi key-value |

### 8.5 Kolom Penting di DocumentRecord

| Kolom | Tipe | Keterangan |
|---|---|---|
| `isCurrent` | boolean | Apakah ini versi dokumen yang aktif/terkini |
| `allowMultipleSnapshot` | boolean | Snapshot dari `DocumentType.allowMultiple` saat upload — diisi trigger |
| `fileSize` | bigint | Ukuran file dalam bytes |
| `mimeType` | text | MIME type yang diverifikasi server |
| `fileHash` | text | SHA-256 hash file (untuk deteksi duplikasi/tamper) |
| `storageProvider` | text | Provider storage yang digunakan (`local`, `supabase`, atau `s3`) |
| `reminderH30SentAt` | timestamp | Kapan reminder H-30 dikirim; `NULL` berarti belum pernah dikirim |
| `reminderH7SentAt` | timestamp | Kapan reminder H-7 dikirim; `NULL` berarti belum pernah dikirim |
| `reminderH1SentAt` | timestamp | Kapan reminder H-1 dikirim; `NULL` berarti belum pernah dikirim |

### 8.6 Trigger Database (Otomatis, Tidak Perlu di Kode Aplikasi)

| Trigger | Tabel | Fungsi |
|---|---|---|
| `trg_handle_document_replacement` | `DocumentRecord` (BEFORE INSERT) | Isi `allowMultipleSnapshot` dari `DocumentType.allowMultiple`, dan set dokumen lama jadi `REPLACED` + `isCurrent = false` bila `allowMultiple = false` |
| `trg_*_updated_at` | Semua tabel utama (BEFORE UPDATE) | Auto-update kolom `updatedAt` ke `now()` |

### 8.7 Partial Unique Index Penting

```sql
-- Hanya berlaku untuk non-multiple document: maksimal 1 isCurrent=true per owner per documentType
CREATE UNIQUE INDEX uniq_current_document_per_type
ON "DocumentRecord" ("ownerId", "documentTypeId")
WHERE "isCurrent" = true AND "allowMultipleSnapshot" = false;
```

### 8.8 Aturan Cascading & Integritas

- Hapus `User` → hapus `RefreshToken`, `PasswordResetToken`, `Notification` (CASCADE).
- Hapus `Employee` → hapus `DocumentRecord` dan `EmployeeCareerHistory` (CASCADE).
- `VerificationHistory` dan `SecurityLog` **tidak boleh terhapus**. Relasi `reviewedById`/`actorId` di-set `SetNull` kalau user-nya dihapus.
- Soft delete `User` dan `Employee` dilakukan aplikasi (isi `deletedAt`), bukan hard delete.

---

## 9. Fitur Lengkap (Functional Requirements)

### 9.1 Modul Autentikasi & Manajemen Sesi

**Login — Identifier Fleksibel (NIP / NIK / Email):**
- Satu field `identifier` menerima salah satu dari: **NIP** (`Employee.employeeId`), **NIK** (`Employee.nik`), atau **Email** (`User.email`).
- Server mendeteksi otomatis jenis identifier (tanpa user perlu pilih tipe):
  - Jika cocok dengan pola NIK (numerik murni, 16 digit) → cari via `Employee.nik`.
  - Jika cocok dengan pola NIP (numerik murni, ≥ 10 digit) → cari via `Employee.employeeId`.
  - Selainnya → cari via `User.email`.
- Server lalu verifikasi `passwordHash` dengan Argon2id.
- Rate limiting: maks **5x percobaan gagal / 15 menit / IP**. Catat ke `SecurityLog`.

**Aturan Pembuatan User (Wajib):**
- Saat Admin membuat user baru, field yang **wajib diisi** adalah:
  - `email` (unik, dipakai untuk reset password & notifikasi)
  - `employeeId` (NIP, unik) **atau** `nik` (NIK, unik) — minimal salah satu.
- Sistem tidak boleh membuat `User` tanpa `email` atau tanpa setidaknya satu dari NIP/NIK.

**Single-Device Login (Satu Sesi Aktif):**
- Saat login berhasil, server **wajib merevoke SEMUA `RefreshToken` aktif milik user tersebut** sebelum membuat token baru.
- Efeknya: perangkat/browser lain yang sedang login otomatis ter-logout saat user login di perangkat baru.
- Ini menjamin **satu user = satu sesi aktif** di satu waktu.
- `SecurityLog` mencatat event `AUTH_FORCE_LOGOUT_OTHERS` saat ini terjadi.

**Refresh Token:**
- Client kirim `POST /api/v1/auth/refresh` dengan refresh token di cookie.
- Server verifikasi token di tabel `RefreshToken` (pastikan belum `revokedAt` & belum `expiresAt`).
- Rotasi token: token lama di-revoke (`revokedAt = now()`), token baru dibuat.
- Jika refresh token tidak valid/expired → force logout, hapus cookie.

**Forgot Password / Reset Password:**
- User kirim email → server buat `PasswordResetToken` (satu-pakai, expired 1 jam) → kirim link via email.
- User klik link → input password baru → server validasi token (`usedAt IS NULL`, `expiresAt > now()`) → update `passwordHash` → isi `usedAt` → revoke semua `RefreshToken` user tersebut.

**Manajemen Sesi Aktif:**
- Karena single-device, biasanya hanya ada satu sesi aktif. Tetap tampilkan info sesi (device/userAgent/IP/createdAt).
- Tombol "Logout dari perangkat ini" tetap tersedia.

**Logout:**
- Revoke refresh token yang aktif, hapus cookie. Catat ke `SecurityLog`.

### 9.2 Modul Manajemen Pegawai

**CRUD Employee (Admin only):**
- Tambah pegawai: buat `User` + buat `Employee` dalam satu transaksi. Employee mendapat email undangan untuk set password.
- Edit data pegawai (nama, kontak, dll). Data kritis (NIP, NIK, role) hanya Admin.
- Perubahan jabatan/status kepegawaian → wajib catat ke `EmployeeCareerHistory`.
- Soft delete pegawai (isi `deletedAt` di `Employee` + `User`).
- Restore pegawai yang di-soft-delete (Admin only, dalam batas `soft_delete_retention_days`).
- Import pegawai dari CSV (template disediakan, validasi Zod per baris).
- Export pegawai ke CSV.

**Profil Pegawai (Self-service, semua role):**
- Update data non-kritis (telepon, alamat, foto avatar).
- Lihat riwayat karier (`EmployeeCareerHistory`) sebagai timeline.
- Ganti password (verifikasi password lama dulu).

**Riwayat Karier / Mutasi (Admin):**
- Tambah entri baru di `EmployeeCareerHistory` (jabatan baru, pangkat, unit kerja, effectiveDate, endDate opsional, catatan).
- Update FK terkait di `Employee` (jabatan/pangkat/status/unit kerja saat ini).
- Tampilkan sebagai timeline kronologis di profil pegawai.

**Master Data Kepegawaian (Admin only):**
- CRUD: `EmploymentStatus`, `EmployeeGroup`, `ProfessionGroup`, `EmployeePosition`, `EmployeeRank`, `Workplace`.
- Semua aksi CRUD dicatat ke `SecurityLog` dengan `createdBy`/`updatedBy`.

### 9.3 Modul Manajemen Dokumen

**Master Jenis Dokumen — DocumentType (Admin only):**
- CRUD jenis dokumen: kode unik, nama, deskripsi, kategori arsip, apakah wajib, apakah boleh multiple, field yang dibutuhkan (expiryDate/issueDate/documentNumber), format file, ukuran max, ikon.
- Atur target grup: relasi ke ProfessionGroup / EmploymentStatus / EmployeeGroup / EmployeeRank / Workplace.
  - Jika satu kategori target tidak punya relasi, kategori itu dianggap cocok untuk semua.
  - Dalam kategori yang sama berlaku OR.
  - Antar kategori target berlaku AND.
- Soft delete `DocumentType`.

**Upload Dokumen — Canonical v1:**
1. Employee pilih `DocumentType` → sistem tampilkan field yang dibutuhkan.
2. Employee pilih file → frontend validasi format & ukuran untuk UX saja.
3. Client mengirim `POST /api/v1/documents/upload` sebagai `multipart/form-data`.
4. Server melakukan auth check, role check, validasi Zod, validasi aturan `DocumentType`, validasi ukuran, dan verifikasi MIME type dari isi file.
5. Server menghitung `fileHash` SHA-256.
6. Server membuat `filePath` standar dengan `generateDocumentFileName()`.
7. Server menyimpan file lewat kontrak `getStorageProvider().upload(filePath, file)`. Implementasi provider boleh `local`, `supabase`, atau `s3`, tetapi modul `document` tidak boleh tahu detail provider.
8. Server menyimpan `DocumentRecord` beserta metadata file (`fileName`, `filePath`, `fileSize`, `mimeType`, `fileHash`, `storageProvider`).
9. Trigger database otomatis menangani penggantian dokumen lama untuk `allowMultiple = false`.
10. Notifikasi dikirim ke Staff/Admin: ada dokumen baru di antrian.
11. `logActivity("DOCUMENT_UPLOADED")`.

> **Keputusan v1:** Upload langsung via signed URL dari browser tidak menjadi alur utama karena membuat LocalStorage, Supabase, dan S3 punya alur berbeda. Jika nanti file besar atau limit Vercel menjadi masalah, direct-to-storage upload boleh ditambahkan sebagai optimasi baru di balik kontrak storage tanpa mengubah aturan bisnis modul `document`.

**Lihat Dokumen:**
- Employee: dokumen milik sendiri saja.
- Staff/Admin: dokumen semua pegawai.
- Dikelompokkan per `ArchiveCategory` (5 tab).
- Filter: per kategori, per status, per jenis dokumen, per unit kerja (Staff/Admin).
- Preview file (PDF/image) via signed URL sementara (5 menit).

**Riwayat Versi Dokumen:**
- Tampilkan versi-versi sebelumnya (status `REPLACED`) sebagai read-only.

**Hapus Dokumen — Soft Delete:**
- Employee: hanya bisa soft-delete dokumen PENDING/REJECTED milik sendiri.
- Admin: bisa soft-delete dokumen siapapun, termasuk yang APPROVED.
- Restore: Admin only, dalam batas `soft_delete_retention_days`.

### 9.4 Modul Verifikasi

**Antrian Verifikasi (Staff & Admin):**
- Daftar dokumen berstatus `PENDING`, diurutkan `uploadedAt` (terlama duluan).
- Filter: per jenis dokumen, per unit kerja, per tanggal, per pegawai.
- Lihat detail: metadata lengkap + preview file + riwayat verifikasi.

**Aksi Verifikasi:**
- **Approve**: set `DocumentRecord.status = APPROVED` + tambah baris ke `VerificationHistory`.
- **Reject**: set `DocumentRecord.status = REJECTED` + tambah baris ke `VerificationHistory` (`reviewNote` wajib diisi).
- Setelah aksi → kirim `Notification` ke Employee pemilik dokumen.
- `logActivity("DOCUMENT_APPROVED" / "DOCUMENT_REJECTED")`.

### 9.5 Modul Notifikasi

**Jenis Notifikasi:**

| Jenis (`type`) | Penerima | Pemicu |
|---|---|---|
| `DOCUMENT_APPROVED` | Employee | Dokumen di-approve |
| `DOCUMENT_REJECTED` | Employee | Dokumen di-reject |
| `DOCUMENT_PENDING` | Staff + Admin | Dokumen baru masuk antrian |
| `DOCUMENT_EXPIRING` | Employee + Admin | Dokumen mendekati kadaluarsa (H-30, H-7, H-1) |
| `DOCUMENT_EXPIRED` | Employee + Admin | Dokumen sudah kadaluarsa (otomatis cron) |
| `PASSWORD_RESET` | User | Link reset password berhasil dikirim |

**Notification Center (UI):**
- Ikon lonceng di navbar dengan badge jumlah unread.
- Halaman daftar notifikasi, filter semua/belum dibaca.
- Tandai satu atau semua sebagai sudah dibaca.
- Klik notifikasi → redirect ke halaman terkait.

**Job Terjadwal (Vercel Cron):**
- Berjalan setiap hari jam 08.00 WIB.
- Endpoint: `GET /api/v1/cron/check-expiry` (diamankan dengan `CRON_SECRET`).
- Logika:
  1. Query `DocumentRecord` yang `expiryDate` sudah lewat + status bukan `EXPIRED` → update jadi `EXPIRED`.
  2. Query dokumen yang akan expired H-30 dan `reminderH30SentAt IS NULL` → kirim `DOCUMENT_EXPIRING` dan isi `reminderH30SentAt`.
  3. Query dokumen yang akan expired H-7 dan `reminderH7SentAt IS NULL` → kirim `DOCUMENT_EXPIRING` dan isi `reminderH7SentAt`.
  4. Query dokumen yang akan expired H-1 dan `reminderH1SentAt IS NULL` → kirim `DOCUMENT_EXPIRING` dan isi `reminderH1SentAt`.
  5. Threshold diambil dari `SystemSetting`.

### 9.6 Modul Audit Trail (Security Log)

**Pencatatan Otomatis via `logActivity()`:**
- `logActivity()` diekspor dari `@/modules/security/service` agar tetap mengikuti aturan boundary modul.
- Dipanggil dari setiap Server Action/Route Handler setelah aksi sensitif.
- Field: `actorId`, `actorName`, `actorRole`, `eventType`, `resource`, `ipAddress`, `status` (SUCCESS/FAILED), `metadata` (JSON detail).
- Untuk tabel master yang punya `createdBy`/`updatedBy`, aksi sensitif tetap wajib mengisi kolom audit **dan** menulis `SecurityLog`. Kolom audit menunjukkan state terakhir; `SecurityLog` menyimpan riwayat append-only.

**Event Types Wajib Dicatat:**

| `eventType` | Pemicu |
|---|---|
| `DOCUMENT_UPLOADED` | Upload dokumen |
| `DOCUMENT_APPROVED` / `DOCUMENT_REJECTED` | Verifikasi dokumen |
| `DOCUMENT_DELETED` / `DOCUMENT_RESTORED` | Hapus/restore dokumen |
| `EMPLOYEE_CREATED` / `EMPLOYEE_UPDATED` / `EMPLOYEE_DELETED` | CRUD pegawai |
| `MASTER_DATA_CREATED` / `MASTER_DATA_UPDATED` / `MASTER_DATA_DELETED` | CRUD master data |
| `SYSTEM_SETTING_UPDATED` | Ubah pengaturan sistem |
| `USER_ROLE_CHANGED` | Ubah role user |

**UI Security Log (Admin only):**
- Tabel dengan filter: per eventType, per aktor, per rentang tanggal, per status.
- Read-only. Tidak ada tombol hapus.
- Export ke CSV.

### 9.7 Modul Dashboard & Statistik

**Akses:** Admin & Staff (penuh)

**Statistik Wajib:**
- Jumlah pegawai total, breakdown per gender, per `EmploymentStatus`, per `EmployeeGroup`, per `Workplace`, per `ProfessionGroup`.
- Piramida usia pegawai (dari `Employee.birthDate`).
- Jumlah dokumen per status (`PENDING`/`APPROVED`/`REJECTED`/`EXPIRED`/`REPLACED`).
- Jumlah dokumen per `ArchiveCategory`.
- Dokumen yang akan kadaluarsa dalam 30 hari (list + count).
- **Compliance rate**: persentase pegawai yang sudah upload semua `DocumentType` wajib yang relevan.
- Tren upload dokumen per bulan (line chart — Tremor Charts).
- Rata-rata waktu verifikasi (dari `uploadedAt` ke `reviewedAt` pertama).
- Antrian verifikasi saat ini (jumlah `PENDING`).

### 9.8 Modul Pengaturan Sistem (Admin only)

| Key | Default | Keterangan |
|---|---|---|
| `reminder_days_h1` | `1` | Hari sebelum expired untuk reminder H-1 |
| `reminder_days_h7` | `7` | Hari sebelum expired untuk reminder H-7 |
| `reminder_days_h30` | `30` | Hari sebelum expired untuk reminder H-30 |
| `default_max_upload_mb` | `10` | Ukuran file max default (MB) |
| `soft_delete_retention_days` | `30` | Berapa hari data soft-deleted bisa di-restore |

---

## 10. Autentikasi & Otorisasi (RBAC)

### 10.1 Alur Autentikasi

```
Login:
  Client -> POST /api/v1/auth/login ({ identifier: NIP/NIK/email, password })
  Server -> deteksi tipe identifier (NIK=numerik 16 digit, NIP=numerik>=10, else=email)
         -> cari User via identifier yang relevan
         -> verifikasi Argon2id hash
         -> REVOKE SEMUA RefreshToken aktif milik user (single-device enforcement)
         -> logActivity("AUTH_FORCE_LOGOUT_OTHERS") jika ada token yang direvoke
         -> buat access token baru (JWT, 15 mnt, httpOnly cookie)
         -> buat refresh token baru (hash di DB, httpOnly cookie, expires 30 hari)
         -> logActivity("AUTH_LOGIN_SUCCESS")

Refresh:
  Client -> POST /api/v1/auth/refresh (cookie: refresh_token)
  Server -> verifikasi refresh token di DB -> rotasi token (revoke lama, buat baru)
         -> kembalikan access token baru

Request Terautentikasi:
  Client -> request + cookie: access_token
  Middleware -> verifikasi JWT -> inject { userId, role, employeeId } ke context
```

### 10.2 Penyimpanan Token

- **Access token**: JWT, disimpan di **httpOnly cookie** (bukan localStorage).
- **Refresh token**: string acak 256-bit, simpan **hash SHA-256-nya** di tabel `RefreshToken` (bukan plaintext), dikirim via httpOnly cookie.

### 10.3 RBAC — Hierarki Role

```ts
// src/config/roles.ts
const ROLE_LEVEL = { EMPLOYEE: 1, STAFF: 2, ADMIN: 3 } as const;
const ROLE_LABELS = { EMPLOYEE: 'Pegawai', STAFF: 'Staff', ADMIN: 'Admin' } as const;

function assertRole(userRole: Role, minRole: Role) {
  if (ROLE_LEVEL[userRole] < ROLE_LEVEL[minRole]) throw new ForbiddenError();
}
```

### 10.4 Tabel Hak Akses

| Kemampuan | Employee | Staff | Admin |
|---|:---:|:---:|:---:|
| Upload dokumen milik sendiri | Yes | Yes | Yes |
| Lihat dokumen milik sendiri | Yes | Yes | Yes |
| Edit profil sendiri (non-kritis) | Yes | Yes | Yes |
| Ganti password sendiri | Yes | Yes | Yes |
| Kelola sesi aktif sendiri | Yes | Yes | Yes |
| Soft-delete dokumen PENDING/REJECTED milik sendiri | Yes | Yes | Yes |
| Lihat dokumen semua pegawai (read) | No | Yes | Yes |
| Verifikasi (approve/reject) dokumen | No | Yes | Yes |
| Lihat dashboard statistik | No | Yes (terbatas) | Yes (penuh) |
| CRUD Employee (pegawai) | No | No | Yes |
| CRUD User & role | No | No | Yes |
| CRUD master data kepegawaian | No | No | Yes |
| CRUD DocumentType | No | No | Yes |
| Soft-delete / restore dokumen siapapun | No | No | Yes |
| Restore Employee/DocumentType yang di-soft-delete | No | No | Yes |
| Lihat Security Log | No | No | Yes |
| Ubah System Setting | No | No | Yes |
| Export Security Log ke CSV | No | No | Yes |

### 10.5 Implementasi RBAC Berlapis

1. **Middleware** (`middleware.ts`) — verifikasi JWT & inject `role` ke request context.
2. **Server Action/Route Handler** — wajib panggil `assertRole(minimumRole)` di baris pertama.
3. **Row-level ownership** — query dokumen/profil wajib filter `WHERE ownerId = currentEmployeeId` untuk Employee.
4. **Client UI** (`hasRole()`) — sembunyikan tombol/menu yang tidak relevan (kosmetik, bukan pengaman utama).

---

## 11. Endpoint & Server Actions

### 11.1 Route Handlers (REST API — `/api/v1/`)

| Endpoint | Method | Fungsi | Role |
|---|:---:|---|---|
| `/api/v1/auth/login` | `POST` | Login | Public |
| `/api/v1/auth/refresh` | `POST` | Rotasi refresh token | Authenticated (cookie) |
| `/api/v1/auth/logout` | `POST` | Revoke token + hapus cookie | Authenticated |
| `/api/v1/auth/forgot-password` | `POST` | Kirim email reset password | Public |
| `/api/v1/auth/reset-password` | `POST` | Reset password dengan token | Public |
| `/api/v1/documents/upload` | `POST` | Upload dokumen via server-mediated `IStorageProvider` (`multipart/form-data`) | Employee+ |
| `/api/v1/documents/download/[id]` | `GET` | Generate temporary download/preview URL | Pemilik / Staff / Admin |
| `/api/v1/cron/check-expiry` | `GET` | Job: cek expiry + kirim reminder | System (CRON_SECRET) |

### 11.2 Server Actions (Mutasi Dalam Aplikasi)

| Action | Modul | Role Minimum |
|---|---|---|
| `softDeleteDocumentAction(id)` | document | Employee (milik sendiri) |
| `restoreDocumentAction(id)` | document | Admin |
| `verifyDocumentAction(id, decision, note)` | verification | Staff |
| `crudDocumentTypeAction()` | document | Admin |
| `crudEmployeeAction()` | employee | Admin |
| `addCareerHistoryAction(data)` | employee | Admin |
| `crudMasterDataAction()` | employee | Admin |
| `updateProfileAction(data)` | employee | Employee (self) |
| `changePasswordAction(data)` | auth | Employee |
| `revokeSessionAction(tokenId)` | auth | Employee (self) |
| `revokeAllSessionsAction()` | auth | Employee (self) |
| `markNotificationReadAction(id)` | notification | Employee (self) |
| `markAllNotificationsReadAction()` | notification | Employee (self) |
| `getStatisticsAction(filter)` | statistics | Staff |
| `getSecurityLogAction(filter)` | security | Admin |
| `updateSystemSettingAction(data)` | settings | Admin |
| `importEmployeesAction(csv)` | employee | Admin |

### 11.3 Aturan Pemilihan REST API vs Server Actions

| Kebutuhan | Gunakan | Alasan |
|---|---|---|
| Auth publik (`login`, `refresh`, `logout`, reset password) | REST Route Handler | Perlu kontrol cookie dan bisa dipanggil tanpa UI internal |
| Upload/download/preview file | REST Route Handler | Perlu `multipart/form-data`, buffer/stream file, dan response URL/redirect |
| Cron/internal system job | REST Route Handler | Dipanggil Vercel Cron dengan `CRON_SECRET` |
| Mutasi internal dari dashboard/form | Server Actions | Cocok untuk operasi aplikasi yang butuh auth, role, validasi Zod, service, audit |
| Read/query data untuk komponen client | `hooks.ts` → `api.ts` → REST endpoint atau Server Action read-only | Komponen tidak boleh `fetch` langsung |

Aturan sederhana untuk junior programmer: **file/auth/cron pakai REST; form mutation internal pakai Server Actions; komponen client selalu lewat hook.**

---

## 12. Pengambilan Data di Frontend — TanStack Query

### 12.1 Setup (Sekali Saja)

```tsx
// src/app/providers.tsx
"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
  }));
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

### 12.2 Pola per Modul: `api.ts` -> `hooks.ts` -> Komponen

```ts
// src/modules/document/api.ts
import { apiClient } from "@/lib/api-client";

export const documentApi = {
  getDownloadUrl: (id: string) =>
    apiClient.get<{ url: string }>(`/api/v1/documents/download/${id}`),
};
```

```ts
// src/modules/document/hooks.ts
import { useQuery } from "@tanstack/react-query";
import { documentApi } from "./api";

export function useDocumentDownloadUrl(id: string) {
  return useQuery({
    queryKey: ["document-download-url", id],
    queryFn: () => documentApi.getDownloadUrl(id),
    staleTime: 4 * 60 * 1000, // 4 menit (URL expired setelah 5 menit)
  });
}
```

### 12.3 Aturan TanStack Query

1. Dilarang `fetch`/`useEffect` manual untuk ambil data di komponen — selalu lewat hook.
2. Setiap mutation wajib `invalidateQueries` supaya data di layar otomatis ter-update.
3. Server Actions dipanggil dari komponen "use client" lewat `useMutation`, bukan langsung.

---

## 13. Storage Provider — Kontrak & Alur Upload

### 13.1 Prinsip Utama Storage Provider

SIMDP wajib punya **kontrak storage tunggal** agar upload dokumen tetap fleksibel saat berpindah dari `local` → `supabase` → `s3` tanpa menulis ulang logika bisnis modul `document`.

Aturan wajib:
1. Kode di luar `src/lib/storage/` **tidak boleh** memanggil SDK Supabase, SDK S3, atau filesystem langsung.
2. Modul `document` hanya boleh memanggil `getStorageProvider()` dan interface `IStorageProvider`.
3. `DocumentRecord.filePath` menyimpan path standar lintas provider (§16.1), bukan URL publik.
4. `DocumentRecord.storageProvider` menyimpan nama provider (`local`, `supabase`, atau `s3`) agar file lama tetap bisa dilacak walaupun provider aktif berubah di masa depan.
5. URL akses file harus sementara/terkontrol lewat `getUrl()`, bukan URL publik permanen.

### 13.2 Interface IStorageProvider (Kontrak Wajib)

Setiap storage provider **wajib** mengimplementasikan interface berikut. Tidak boleh ada kode di luar `storage/` yang mengakses storage secara langsung.

```ts
// src/lib/storage/types.ts

export type StorageProviderName = "local" | "supabase" | "s3";

export interface StorageFile {
  buffer: Buffer;       // isi file setelah diterima server
  mimeType: string;     // MIME type yang sudah diverifikasi server
  size: number;         // ukuran dalam bytes
}

export interface StorageUploadResult {
  provider: StorageProviderName;
  filePath: string;     // path standar yang disimpan ke DocumentRecord.filePath
  storageKey: string;   // key/path internal provider; biasanya sama dengan filePath
  etag?: string;        // optional: checksum/version dari S3/Supabase jika tersedia
}

export interface IStorageProvider {
  /** Nama provider aktif, disimpan ke DocumentRecord.storageProvider. */
  readonly providerName: StorageProviderName;

  /**
   * Simpan file ke storage.
   * @param filePath path tujuan file (format: lihat §16.1)
   * @param file data file beserta metadata yang sudah divalidasi server
   */
  upload(filePath: string, file: StorageFile): Promise<StorageUploadResult>;

  /**
   * Dapatkan URL akses sementara untuk membaca file.
   * @param filePath path file di storage
   * @param expiresIn durasi URL valid dalam detik (default: 300)
   */
  getUrl(filePath: string, expiresIn?: number): Promise<string>;

  /**
   * Hapus file dari storage fisik.
   * Catatan: aplikasi normal melakukan soft delete metadata dulu; delete fisik hanya untuk cleanup/admin job terkontrol.
   */
  delete(filePath: string): Promise<void>;
}
```

### 13.3 Factory & Provider Selection

```ts
// src/lib/storage/index.ts
import { LocalStorageProvider } from "./local.provider";
import { SupabaseStorageProvider } from "./supabase.provider";
import { S3StorageProvider } from "./s3.provider";
import type { IStorageProvider } from "./types";

let instance: IStorageProvider | undefined;

export function getStorageProvider(): IStorageProvider {
  if (instance) return instance;

  switch (process.env.STORAGE_PROVIDER) {
    case "supabase":
      instance = new SupabaseStorageProvider();
      break;
    case "s3":
      instance = new S3StorageProvider();
      break;
    case "local":
    case undefined:
      instance = new LocalStorageProvider();
      break;
    default:
      throw new Error(`Unsupported STORAGE_PROVIDER: ${process.env.STORAGE_PROVIDER}`);
  }

  return instance;
}
```

### 13.4 LocalStorageProvider (Development)

- `providerName = "local"`.
- File disimpan di folder `LocalStorage/` di root project (di-gitignore).
- `getUrl()` mengembalikan URL route handler internal: `/api/v1/documents/local/[...path]` yang melayani file dari disk setelah auth/ownership check.
- Tidak perlu konfigurasi cloud; gunakan `STORAGE_PROVIDER=local`.

### 13.5 SupabaseStorageProvider (Production Option A)

- `providerName = "supabase"`.
- File disimpan di bucket privat `employee-documents` di Supabase Storage.
- `getUrl()` mengembalikan signed URL berumur pendek, default 300 detik.
- Membutuhkan env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`.

### 13.6 S3StorageProvider (Production Option B / Future-Proof)

- `providerName = "s3"`.
- File disimpan di bucket privat S3 atau S3-compatible storage.
- `getUrl()` mengembalikan presigned URL berumur pendek, default 300 detik.
- Membutuhkan env: `S3_ENDPOINT` (opsional untuk AWS), `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.

### 13.7 Alur Upload Dokumen — Canonical v1

```txt
1. Employee klik Upload
   |
   v
2. Client validasi format & ukuran (UX saja, tidak aman)
   |
   v
3. Client POST /api/v1/documents/upload
   (multipart/form-data: { documentTypeId, file, title?, documentNumber?, issueDate?, expiryDate? })
   |
   v
4. Server Route Handler:
   a. Auth check -> minimal EMPLOYEE
   b. Ownership check -> upload untuk employee milik user login
   c. Zod validation untuk field metadata
   d. Ambil DocumentType -> cek mandatory fields, allowed MIME/extensions, max size
   e. Verifikasi MIME type dari buffer (bukan hanya ekstensi)
   f. Hitung SHA-256 -> fileHash
   g. Generate filePath standar -> generateDocumentFileName() (§16.1)
   h. Panggil getStorageProvider().upload(filePath, file)
   i. Simpan DocumentRecord ke database:
      - fileName = nama asli file dari user
      - filePath = filePath standar
      - fileSize, mimeType, fileHash
      - storageProvider = uploadResult.provider
      - status = PENDING
   j. Trigger DB handle replacement untuk allowMultiple=false
   k. Buat Notification DOCUMENT_PENDING untuk Staff/Admin
   l. logActivity("DOCUMENT_UPLOADED") dari @/modules/security/service
   m. Return DocumentRecord
```

### 13.8 Alur Download / Preview Dokumen

```txt
1. Client minta URL dokumen
   Client GET /api/v1/documents/download/{id}
   |
   v
2. Server:
   a. Auth check
   b. Role + ownership check
   c. Ambil DocumentRecord.filePath dan storageProvider
   d. Panggil getStorageProvider().getUrl(filePath, 300)
   e. Return: { url }
   |
   v
3. Client pakai URL untuk preview/download
```

> Jika di masa depan file lama tersimpan di provider berbeda dari provider aktif, tambahkan `getStorageProviderByName(record.storageProvider)` agar download memakai provider asal file tersebut.

### 13.9 Catatan Tentang Direct-to-Storage Upload

Direct-to-storage upload (browser langsung upload ke Supabase/S3 via signed URL) **bukan alur utama v1**. Alasannya:
- LocalStorage development tidak punya signed URL alami.
- Validasi MIME dan hash lebih mudah, konsisten, dan aman jika file melewati server.
- Kontrak `IStorageProvider.upload()` membuat pergantian local → Supabase → S3 paling sederhana untuk junior programmer.

Direct-to-storage boleh ditambahkan nanti sebagai optimasi performa dengan kontrak tambahan, misalnya `createUploadSession()` dan `completeUploadSession()`, tetapi keputusan itu harus dicatat di ADR baru dan tidak boleh mengubah aturan bisnis upload.

---

## 14. Keamanan

### 14.1 Autentikasi

- Password di-hash dengan **Argon2id** (bukan bcrypt/MD5/SHA).
- Access token JWT berumur **15 menit**, disimpan di **httpOnly cookie** (bukan localStorage).
- Refresh token: string acak 256-bit, simpan **hash SHA-256-nya** di DB (bukan plaintext), rotasi setiap refresh.
- Rate limiting endpoint login & forgot-password: **5x gagal / 15 menit / IP**.

### 14.2 Otorisasi

- Semua Server Action **fail-closed** (default deny, eksplisit allow per role — §10).
- Row-level ownership check di setiap query dokumen milik pegawai.

### 14.3 Perlindungan Data & File

- Storage production (`supabase` atau `s3`) wajib memakai bucket/container **privat** — akses hanya via signed/presigned URL berumur pendek (**default 5 menit**).
- Validasi **MIME type di server** (bukan hanya ekstensi file) sebelum upload dikonfirmasi.
- `fileHash` (SHA-256) dihitung untuk deteksi duplikasi/tamper.
- Data sensitif (NIK) **tidak boleh ditampilkan penuh** di UI selain untuk Admin. Masking: `32xx...xx01`.

### 14.4 Audit Trail

- Setiap login, upload, verifikasi, perubahan master data, dan perubahan setting wajib dicatat ke `SecurityLog`.
- `SecurityLog` bersifat **append-only** — tidak ada UPDATE/DELETE dari aplikasi.

### 14.5 Kepatuhan (UU PDP)

- Data pegawai hanya diakses oleh pihak berwenang sesuai role.
- Setiap akses ke data personal dicatat di audit log.
- Tidak ada URL publik permanen untuk file kepegawaian.

---

## 15. Standar Penamaan Kode

| Elemen | Konvensi | Contoh |
|---|---|---|
| Folder modul | kebab-case | `document/`, `employee/` |
| Komponen React | PascalCase | `DocumentTabs.tsx`, `EmployeeCard.tsx` |
| File service/repository/schema | camelCase tunggal per modul | `service.ts`, `repository.ts`, `schema.ts` |
| Custom hook | camelCase, prefix `use` | `useDocuments`, `useEmployee` |
| Zod schema | camelCase, suffix `Schema` | `createDocumentSchema`, `loginSchema` |
| Tipe domain | PascalCase di `types.ts` | `DocumentRecord`, `Employee` |
| Server Action | camelCase, suffix `Action` | `uploadDocumentAction`, `verifyDocumentAction` |
| Path alias | wajib `@/` ke `src/` | `import { prisma } from "@/lib/prisma"` |
| Environment variable | `SCREAMING_SNAKE_CASE` | `DATABASE_URL`, `JWT_SECRET`, `CRON_SECRET` |
| Git branch | `<type>/<tiket>-<deskripsi>` | `feat/SIMDP-12-upload-dokumen` |
| Git commit | Conventional Commits | `feat(document): tambah filter per kategori arsip` |

---

## 16. Standar Penamaan File

### 16.1 File yang Diunggah Pegawai (Storage Path)

Format penamaan file dirancang agar **konsisten di semua storage provider** dan mudah dibaca tanpa perlu query database.

```
{KODE-DOKUMEN}-{URUTAN}-{NIP-atau-NIK}.{ext}
```

| Komponen | Sumber Data | Aturan |
|---|---|---|
| `KODE-DOKUMEN` | `DocumentType.code` | Huruf kapital, hanya `[A-Z0-9]` dan `-`. Contoh: `STR`, `DIKLAT`, `KTP` |
| `URUTAN` | Dihitung dari DB | Nomor urut dokumen dengan tipe yang sama milik pegawai ini (mulai dari 1). Untuk `allowMultiple=false`, nilainya selalu 1 (digantikan oleh trigger REPLACED). Untuk `allowMultiple=true`, naik setiap unggahan baru. |
| `NIP-atau-NIK` | `Employee.employeeId` (NIP) atau `Employee.nik` (NIK) | Gunakan NIP jika ada. Jika pegawai tidak memiliki NIP, gunakan NIK. Minimal salah satu wajib ada. Hanya karakter numerik. |
| `ext` | Dari file yang diunggah | Huruf kecil. Contoh: `pdf`, `jpg`, `png` |

**Contoh:**

```
# Dokumen allowMultiple = false (hanya 1 versi aktif, digantikan saat ada yang baru)
STR-1-198501012010011001.pdf
KTP-1-198501012010011001.jpg

# Dokumen allowMultiple = true (riwayat semua versi disimpan, urutan naik)
DIKLAT-1-198501012010011001.pdf
DIKLAT-2-198501012010011001.pdf
DIKLAT-3-198501012010011001.jpg
```

**Fungsi pembuat nama file:** `generateDocumentFileName()` di `src/modules/document/service.ts`.

```ts
// src/modules/document/service.ts
async function generateDocumentFileName(
  documentTypeCode: string,   // mis. "DIKLAT"
  employeeNip: string,        // mis. "198501012010011001"
  fileExt: string,            // mis. "pdf"
  ownerId: string,            // untuk query urutan
  documentTypeId: string,
): Promise<string> {
  const count = await countDocumentsByOwnerAndType(ownerId, documentTypeId);
  const urutan = count + 1;
  return `${documentTypeCode.toUpperCase()}-${urutan}-${employeeNip}.${fileExt.toLowerCase()}`;
}
```

> Nama asli file dari pegawai tersimpan di `DocumentRecord.fileName`. Path yang dipakai di storage (format di atas) tersimpan di `DocumentRecord.filePath`. Format ini berlaku untuk **semua storage provider** — tidak berubah saat pindah dari local ke Supabase.

### 16.2 Dokumen Teknis/Proyek

```
{DOC-TYPE}-{KODE-PROYEK}-v{MAJOR.MINOR}-{YYYYMMDD}.md
```

Contoh: `PRD-SIMDP-v2.0-20260708.md` (dokumen ini).

### 16.3 File Ekspor/Laporan

```
{Nama-Laporan}_{Scope}_{YYYYMMDD}_{HHmm}.{ext}
```

Contoh: `Export-Data-Pegawai_Seluruh-Unit_20260708_0900.csv`

### 16.4 Aturan Umum

1. Tidak boleh spasi — ganti dengan `-`.
2. Hanya karakter `[A-Za-z0-9._-]`.
3. Ekstensi huruf kecil.
4. Maksimal 150 karakter.

---

## 17. Design System & UI Guidelines

### 17.1 Canonical UI Direction: shadcn/ui-first

Design system SIMDP **wajib mengikuti estetika dan pola komponen shadcn/ui**: clean, minimal, banyak whitespace, border halus, radius konsisten, typography tajam, state jelas, dan layout dashboard modern. Inspirasi visual utama adalah website **https://ui.shadcn.com**.

**Aturan wajib:**
- Semua komponen umum aplikasi (button, input, form, dialog, dropdown, table, badge, tabs, card, sheet, toast/sonner, command, navigation, pagination) harus berasal dari **shadcn/ui** atau wrapper internal yang dibangun di atas shadcn/ui.
- Jangan membuat custom component dari nol jika equivalent shadcn/ui tersedia.
- Custom component boleh dibuat hanya sebagai komposisi/wrapper domain, misalnya `StatusBadge`, `MetricCard`, `DocumentDataTable`, tetapi primitive visualnya tetap memakai shadcn/ui + Tailwind token.
- Tremor dipakai **khusus untuk chart/dashboard visualization**, bukan menggantikan komponen umum shadcn/ui.

### 17.2 Konsep Visual: "shadcn/ui Clinical Dashboard"

Menggabungkan **kebersihan visual rumah sakit** (whitespace, rasa steril-tenang) dengan **estetika dashboard modern ala shadcn/ui**. Tema rumah sakit hanya menjadi aksen brand; struktur, spacing, border, card, form, dan navigasi tetap mengikuti pola shadcn/ui.

### 17.3 Palet Warna

| Peran | Warna | Hex |
|---|---|---|
| Primary (aksi utama) | Teal Medis sebagai brand accent | `#0F766E` (teal-700) |
| Primary Light (hover/bg) | Teal muda sebagai accent background | `#CCFBF1` (teal-100) |
| Secondary/Accent | Biru langit | `#0EA5E9` (sky-500) |
| Success / Approved | Hijau | `#16A34A` |
| Warning / Pending / Expiring | Amber | `#D97706` |
| Danger / Rejected / Expired | Merah | `#DC2626` |
| Neutral / Replaced | Abu gelap | `#64748B` |
| Background | Netral/slate sangat terang ala shadcn/ui | `#F8FAFC` (slate-50) |
| Teks utama | Slate gelap | `#0F172A` (slate-900) |
| Border/Divider | Slate muda / border halus | `#E2E8F0` (slate-200) |

Implementasi warna harus melalui **Tailwind theme + CSS variables** agar pola light/dark mode shadcn/ui tetap mudah didukung.

### 17.4 Tipografi

- Font: **Inter** atau **Plus Jakarta Sans** (modern, mudah dibaca di data-heavy table).
- Heading: semi-bold/bold. Body text: regular.
- Hierarki ukuran: 12 / 14 / 16 / 20 / 24 / 32px.

### 17.5 Komponen Kunci

- **Status Badge** sesuai `DocumentStatus` (pill/rounded-full): Pending=amber, Approved=hijau, Rejected=merah, Expired=abu gelap, Replaced=abu muda.
- **Card statistik** di dashboard: gunakan shadcn/ui `Card`; ikon medis line-style, angka besar, trend indicator (▲▼ %).
- **Sidebar navigasi** persisten kiri: ikon + label, menu berbeda sesuai role.
- **Notification Badge** di navbar: jumlah unread.
- **Empty state** ramah: ilustrasi + copy yang jelas, bukan sekadar "No data".
- Gunakan **rounded-xl** dan **soft shadow** untuk card — kesan tenang & rapi.

### 17.6 Chart & Dashboard Visualization

**Canonical charting v1:** gunakan **Tremor Charts** dari `@tremor/react` untuk visualisasi data dashboard/statistik.

Aturan implementasi chart:
- Chart yang wajib tersedia minimal: line chart untuk tren upload dokumen, bar chart untuk breakdown kategori/status, donut/pie chart untuk distribusi status dokumen, dan area/line chart untuk tren compliance bila data tersedia.
- Bungkus chart dalam wrapper internal, misalnya `modules/statistics/components/*Chart.tsx`, agar modul lain tidak bergantung langsung pada detail konfigurasi Tremor.
- Wrapper chart harus memakai container/layout shadcn/ui (`Card`, `CardHeader`, `CardContent`, `Tabs`, `Select`, `Skeleton`) sehingga tampilan keseluruhan tetap seperti shadcn/ui.
- Warna chart harus memakai palette token SIMDP/shadcn (`primary`, `muted`, `destructive`, `warning`, `success`) dan tidak memakai warna default yang bertabrakan dengan tema.
- Empty/loading/error state chart wajib memakai komponen shadcn/ui (`Skeleton`, `Alert`, `EmptyState` internal).

### 17.7 Aksesibilitas & Responsivitas

- Kontras warna minimal **WCAG AA**.
- **Mobile-first** untuk halaman Employee (upload & lihat status nyaman di layar kecil).
- **Desktop-first** untuk halaman Admin/Staff (tabel, dashboard, antrian verifikasi).

---

## 18. Deployment

| Komponen | Layanan | Catatan |
|---|---|---|
| App (Next.js) | **Vercel** | Environment: Production, Preview (per PR), Development |
| Database PostgreSQL | **Supabase** | Gunakan Supabase Pooler (PgBouncer) untuk connection pooling |
| File Storage | **Supabase Storage** atau **S3-compatible Storage** | Bucket privat `employee-documents`; dipilih via `STORAGE_PROVIDER` |
| Cron Job (cek expiry) | **Vercel Cron** | Memanggil `/api/v1/cron/check-expiry`, diamankan `CRON_SECRET` |
| Email | **Resend** atau **Supabase SMTP** | Reset password & reminder kadaluarsa |

### 18.1 Environment Variables (Wajib)

```env
DATABASE_URL=                   # Supabase connection string (pooled)
DIRECT_URL=                     # Supabase direct connection (untuk prisma migrate)
STORAGE_PROVIDER=local          # local | supabase | s3
SUPABASE_URL=                   # Supabase project URL (wajib jika STORAGE_PROVIDER=supabase)
SUPABASE_SERVICE_ROLE_KEY=      # Supabase service role key (server-side only, wajib jika supabase)
SUPABASE_STORAGE_BUCKET=employee-documents
S3_ENDPOINT=                    # Opsional; untuk S3-compatible storage selain AWS
S3_REGION=                      # Wajib jika STORAGE_PROVIDER=s3
S3_BUCKET=                      # Wajib jika STORAGE_PROVIDER=s3
S3_ACCESS_KEY_ID=               # Wajib jika STORAGE_PROVIDER=s3
S3_SECRET_ACCESS_KEY=           # Wajib jika STORAGE_PROVIDER=s3
JWT_SECRET=                     # Secret untuk signing access token JWT
REFRESH_TOKEN_SECRET=           # Secret untuk hashing refresh token
CRON_SECRET=                    # Secret header untuk endpoint cron
RESEND_API_KEY=                 # API key email (atau gunakan SMTP config)
NEXT_PUBLIC_APP_URL=            # URL aplikasi (untuk link di email)
```

> Semua env variable divalidasi saat startup menggunakan Zod di `src/lib/env.ts`.

---

## 19. Rencana Pengembangan (Fase)

| Fase | Fokus | Output |
|---|---|---|
| **Fase 0 — Setup** | Init Next.js, Prisma schema sinkron SQL, setup Supabase, auth dasar (login/logout/refresh token/reset password) | Login/logout jalan, skema ter-migrate |
| **Fase 1 — Core Employee & Document** | Modul `employee` (CRUD, profil, master data), `document` (upload, lihat, DocumentType) | Employee bisa upload & lihat dokumen sendiri |
| **Fase 2 — Verification & Notification** | Modul `verification`, `notification` (in-app + cron expiry) | Staff bisa approve/reject, Employee dapat notifikasi |
| **Fase 3 — Admin & Master Data** | CRUD Employee lengkap, import/export CSV, riwayat karier, User management, soft delete & restore | Admin penuh kelola sistem |
| **Fase 4 — Statistik & Dashboard** | Modul `statistics`, charting Tremor, layout/wrapper shadcn/ui | Dashboard admin/staff lengkap |
| **Fase 5 — Security & Hardening** | Security log UI, rate limiting, session management UI, audit trail lengkap | Sistem siap produksi |
| **Fase 6 — Polish UI/UX** | Tema rumah sakit final, responsive, aksesibilitas, empty states | UI konsisten §17 |

### 19.1 Definition of Done (per Fitur)

- [ ] Unit test business logic di `service.ts` lulus.
- [ ] Role/permission diverifikasi manual untuk 3 role.
- [ ] Audit log (`SecurityLog`) tercatat untuk aksi sensitif.
- [ ] Soft delete bekerja dengan benar (data tidak hilang, bisa di-restore).
- [ ] Entry ditambahkan ke `context/memory/changelog.md`.
- [ ] Tidak ada `any`/error TypeScript (`tsc --noEmit` lulus).
- [ ] Linter berjalan tanpa error.

---

## 20. Rencana Jangka Panjang: Siap Upgrade ke Microservice

Karena setiap modul sudah punya satu pintu resmi (`service.ts`) dan memisahkan domain database secara logis, langkah pemisahan ke microservice jadi sederhana:

| Langkah | Penjelasan |
|---|---|
| 1 | Pilih modul dengan beban tertinggi (kandidat: `document` + `verification`) |
| 2 | Pindahkan tabel modul tersebut ke database baru |
| 3 | Buat REST API baru (service terpisah) yang melayani fungsi-fungsi `service.ts` lama |
| 4 | Ubah isi `service.ts` di monolit: dari query Prisma → jadi `fetch()` ke REST API baru |
| 5 | Modul lain yang memanggilnya **tidak perlu diubah sama sekali** |

**Yang TIDAK berubah saat migrasi:** protokol komunikasi tetap REST, nama fungsi tetap sama, cara pemanggilan dari modul lain tetap sama.

---

## 21. Batasan & Technical Debt (Versi 1.0)

| Status | Item |
|---|---|
| Belum ada | Enkripsi file di storage (rencana: AES-256 saat dianggap mendesak) |
| Belum ada | Tanda tangan digital resmi (hook disiapkan untuk versi mendatang) |
| Sengaja belum | `eslint-plugin-boundaries` untuk menegakkan aturan modul via CI |
| Sengaja belum | Message broker (RabbitMQ/Kafka) — baru relevan saat microservice |
| Perlu evaluasi | Statistics di-query langsung tanpa cache — pantau performa setelah data > 10.000 baris |

---

## 22. Checklist Wajib — AI Coding Agent & Junior Programmer

Sebelum menganggap satu fitur selesai, pastikan:

- [ ] Komponen tidak ada `fetch()` langsung — semua lewat `hooks.ts`.
- [ ] `hooks.ts` hanya memanggil `api.ts` di modul yang sama.
- [ ] Server Action/Route Handler hanya memanggil `service.ts` di modul yang sama.
- [ ] Kalau butuh data modul lain → lewat fungsi `service.ts` modul itu — **bukan** `repository.ts`-nya.
- [ ] Semua input request divalidasi Zod sebelum diproses.
- [ ] Setiap Server Action: auth check -> role check -> Zod validation -> service -> audit log.
- [ ] Aksi sensitif memanggil `logActivity()`.
- [ ] Soft delete: filter `deletedAt IS NULL` ada di semua query yang relevan.
- [ ] Upload file melewati `POST /api/v1/documents/upload`.
- [ ] Semua akses storage hanya lewat `IStorageProvider`.
- [ ] Tidak ada kode di modul `document` yang memanggil SDK Supabase/S3/filesystem langsung.
- [ ] Metadata file tersimpan lengkap: `fileName`, `filePath`, `fileSize`, `mimeType`, `fileHash`, `storageProvider`.
- [ ] Tidak ada token/secret yang disimpan di localStorage.
- [ ] `tsc --noEmit` dan linter berjalan tanpa error.
- [ ] Nama file kode & dokumen mengikuti §15 dan §16.

---

## 23. Folder Context -- Panduan Lengkap untuk AI Agent

Folder `context/` adalah **ingatan jangka panjang proyek**. Tujuannya: agar AI agent yang mengerjakan proyek di sesi yang berbeda tidak mengulang kesalahan, tidak mengambil keputusan yang sudah pernah diputuskan, dan tidak mengerjakan sesuatu di luar scope yang disepakati.

> **Aturan wajib AI Agent:** Sebelum memulai task apapun, baca minimal `context/memory/decisions-log.md` dan `context/memory/known-issues.md`.

---

### 23.1 `context/business/` -- Konteks Bisnis

Berisi deskripsi non-teknis tentang *mengapa* sistem ini dibangun dan *untuk siapa*.

| File | Isi yang Harus Ada |
|---|---|
| `overview.md` | Latar belakang masalah RSUD Bahteramas, tujuan produk, success metrics, out of scope |
| `scope.md` | Daftar fitur yang **masuk** dan **tidak masuk** scope v1.0. Perubahan scope wajib dicatat di sini dan di `decisions-log.md`. Jika ada permintaan fitur baru dari user, cek dulu apakah masuk scope atau perlu diputuskan bersama |
| `glossary.md` | Semua istilah domain: TMT, Snapshot Dokumen, Compliance Rate, Archive Category, Soft Delete, dst. Jika menemukan istilah baru yang ambigu, tambahkan di sini |

---

### 23.2 `context/domain/` -- Aturan Domain & Entitas

Berisi aturan bisnis yang **tidak boleh dilanggar** oleh implementasi apapun.

| File | Isi yang Harus Ada |
|---|---|
| `entities.md` | Daftar semua entitas inti, relasi antar entitas, dan penjelasan singkat fungsi masing-masing tabel. Sumber kebenaran: `dms_pegawai_schema.sql` |
| `business-rules.md` | 9 business rules wajib (lihat §3.3 PRD). Setiap rule diberi nomor. Jika ada rule baru yang muncul saat implementasi, tambahkan di sini |
| `rbac.md` | Tabel hak akses lengkap per role (Employee / Staff / Admin) untuk setiap aksi. Sumber kebenaran: §10.4 PRD. Jika ada ambiguitas siapa boleh melakukan apa, rujuk file ini |

---

### 23.3 `context/architecture/` -- Keputusan Arsitektur

Berisi *mengapa* arsitektur dibuat seperti ini dan batas-batas antar modul yang tidak boleh dilanggar.

| File | Isi yang Harus Ada |
|---|---|
| `system-overview.md` | Diagram arsitektur tingkat tinggi (lihat §6.2 PRD). Update jika ada perubahan signifikan |
| `module-boundaries.md` | Daftar modul, tanggung jawab masing-masing, dan aturan komunikasi antar modul (`service.ts` sebagai satu-satunya pintu). Sumber: §6.3-6.5 PRD |
| `patterns.md` | Pola-pola kode yang wajib diikuti: pola hook -> api.ts -> service.ts, pola Server Action (auth -> role -> zod -> service -> log), pola soft delete query, dst |

**Subfolder `adr/` -- Architecture Decision Records:**

Setiap file ADR mendokumentasikan satu keputusan arsitektur dengan format:

```markdown
# ADR-NNN: Judul Keputusan

**Status:** Accepted | Deprecated | Superseded by ADR-XXX
**Tanggal:** YYYY-MM-DD

## Konteks
Mengapa keputusan ini perlu diambil?

## Keputusan
Apa yang diputuskan?

## Konsekuensi
Apa dampak positif dan negatif dari keputusan ini?

## Alternatif yang Ditolak
Apa saja alternatif yang dipertimbangkan dan kenapa ditolak?
```

| File ADR | Keputusan |
|---|---|
| `ADR-001-app-router.md` | Gunakan Next.js App Router (bukan Pages Router) |
| `ADR-002-prisma-orm.md` | Gunakan Prisma ORM di atas skema SQL yang sudah ada |
| `ADR-003-storage-provider.md` | Pluggable Storage Provider (`IStorageProvider`) - LocalStorage dev, Supabase/S3 prod |
| `ADR-004-custom-jwt.md` | Custom JWT + Refresh Token (bukan NextAuth/Supabase Auth) |
| `ADR-005-statistics-readonly.md` | Statistics module hanya baca, tanpa tabel agregat |
| `ADR-006-single-device-login.md` | Single-device: login baru otomatis revoke semua sesi lama |
| `ADR-007-flexible-identifier.md` | Login identifier fleksibel: NIP, NIK, atau Email |
| `ADR-008-rest-api.md` | REST API sebagai satu-satunya protokol komunikasi |

---

### 23.4 `context/technical/` -- Spesifikasi Teknis

Referensi teknis yang sering dibutuhkan saat implementasi.

| File | Isi yang Harus Ada |
|---|---|
| `tech-stack.md` | Daftar tech stack dengan versi yang digunakan. Update jika ada library baru ditambahkan atau versi di-upgrade |
| `database.md` | Ringkasan semua tabel, enum, index penting, dan trigger database. Referensi cepat tanpa harus buka file SQL |
| `api-contracts.md` | Semua endpoint REST (`/api/v1/*`) dengan method, body, response shape, dan role yang diizinkan. Update setiap kali endpoint baru ditambahkan |
| `storage-provider.md` | Dokumentasi interface `IStorageProvider`, cara konfigurasi provider, dan format penamaan file (§16.1 PRD) |
| `environment.md` | Semua environment variable yang dibutuhkan, penjelasan masing-masing, dan contoh nilai untuk development |

---

### 23.5 `context/coding-standards/` -- Standar Kode

Panduan yang wajib diikuti setiap kali menulis kode baru.

| File | Isi yang Harus Ada |
|---|---|
| `golden-rules.md` | 10 Aturan Emas (§5 PRD). Aturan yang tidak boleh dilanggar dalam kondisi apapun |
| `naming.md` | Konvensi penamaan untuk folder, komponen, hook, tipe, action, env variable, dan git branch/commit (§15 PRD) |
| `file-structure.md` | Struktur file dalam satu modul (service/repository/schema/actions/api/hooks/components) dan kapan boleh memecah file |
| `checklist.md` | Definition of Done (§19.1 PRD) + checklist wajib sebelum PR (§22 PRD). Agent wajib cek sebelum menganggap fitur selesai |

---

### 23.6 `context/security/` -- Keamanan

Panduan keamanan yang wajib dipahami sebelum menyentuh modul auth, dokumen, atau data sensitif.

| File | Isi yang Harus Ada |
|---|---|
| `auth-flow.md` | Alur autentikasi lengkap: login (multi-identifier), single-device enforcement, refresh token rotation, reset password (§10.1 PRD). Termasuk diagram sequence |
| `rbac.md` | Implementasi teknis RBAC: `assertRole()`, middleware, row-level ownership check. Referensi: §10.3-10.5 PRD |
| `audit.md` | Daftar lengkap `eventType` yang wajib dicatat ke `SecurityLog`, format `logActivity()`, dan aturan append-only (§9.6 PRD) |

---

### 23.7 `context/ui/` -- Panduan Desain UI

| File | Isi yang Harus Ada |
|---|---|
| `design-system.md` | Palet warna (hex), tipografi, komponen kunci (StatusBadge, Card statistik, Sidebar, dll), prinsip aksesibilitas (WCAG AA). Sumber: §17 PRD |
| `pages.md` | Daftar semua halaman di aplikasi, akses role masing-masing, komponen utama yang digunakan, dan catatan UX khusus |

---

### 23.8 `context/memory/` -- Ingatan Jangka Panjang (Wajib Dibaca sebelum Task)

Ini adalah folder **paling penting** untuk kontinuitas antar sesi AI.

| File | Isi |
|---|---|
| `decisions-log.md` | Log semua keputusan yang diambil selama development. **Wajib diupdate** setiap kali ada keputusan baru |
| `known-issues.md` | Technical debt yang disengaja, bug yang diketahui tapi belum diperbaiki, dan hal-hal yang sengaja belum diimplementasi beserta alasannya |
| `changelog.md` | Log perubahan per fitur/fase yang selesai dikerjakan (format: Keep a Changelog) |

**Format wajib `decisions-log.md`:**

```markdown
## [YYYY-MM-DD] Judul Keputusan
- Konteks: situasi yang memaksa keputusan ini dibuat
- Keputusan: apa yang diputuskan secara spesifik
- Alasan: mengapa ini dipilih dibanding alternatif lain
- Dampak ke modul: modul mana yang terpengaruh
- Referensi: ADR atau section PRD yang terkait
```

**Entri awal wajib ada di `decisions-log.md` (ditulis saat Fase 0 setup):**

```markdown
## [2026-07-08] Pemisahan User dan Employee menjadi 2 tabel
- Konteks: perlu memisahkan concern akun login dari profil kepegawaian
- Keputusan: User hanya menyimpan email, password, role. Employee menyimpan seluruh data kepegawaian (relasi 1-1 ke User)
- Alasan: memudahkan manajemen akun terpisah dari data HR
- Dampak ke modul: auth, employee
- Referensi: §8.4 PRD

## [2026-07-08] Pluggable Storage Provider
- Konteks: perlu storage yang bisa dipakai lokal saat development tanpa konfigurasi cloud, tetapi tetap siap pindah ke Supabase atau S3
- Keputusan: interface IStorageProvider dengan LocalStorageProvider (dev), SupabaseStorageProvider (prod option A), dan S3StorageProvider (prod option B/future-proof)
- Alasan: portabilitas; pindah provider hanya butuh ganti `STORAGE_PROVIDER` tanpa mengubah logika bisnis modul document
- Dampak ke modul: document, lib/storage/
- Referensi: ADR-003, §13 PRD

## [2026-07-08] Upload Dokumen Canonical via Server-Mediated IStorageProvider
- Konteks: PRD lama mencampur signed URL upload langsung dan server upload sehingga membingungkan implementasi local vs Supabase vs S3
- Keputusan: v1 memakai `POST /api/v1/documents/upload` multipart/form-data; server melakukan validasi, hash, generate filePath, lalu memanggil `IStorageProvider.upload()`
- Alasan: satu kontrak storage konsisten untuk local, Supabase, dan S3; validasi MIME dan SHA-256 lebih aman
- Dampak ke modul: document, lib/storage/, app/api/v1/documents/upload
- Referensi: §9.3, §11.1, §13 PRD

## [2026-07-08] Reminder Expiry Dipisah per Tahap
- Konteks: satu kolom `reminderSentAt` tidak cukup untuk reminder H-30, H-7, dan H-1 karena reminder pertama akan menghalangi reminder berikutnya
- Keputusan: gunakan `reminderH30SentAt`, `reminderH7SentAt`, dan `reminderH1SentAt` di DocumentRecord
- Alasan: sederhana untuk junior programmer dan eksplisit di query cron
- Dampak ke modul: document, notification, cron/check-expiry, database schema
- Referensi: §3.3, §8.5, §9.5 PRD

## [2026-07-08] S3StorageProvider Disiapkan sebagai Provider Resmi
- Konteks: sistem perlu fleksibel jika storage production tidak selalu memakai Supabase
- Keputusan: `IStorageProvider` mendukung provider `local`, `supabase`, dan `s3`
- Alasan: menjaga portabilitas storage dan menghindari vendor lock-in
- Dampak ke modul: lib/storage/, document
- Referensi: ADR-003, §13 PRD

## [2026-07-08] Custom JWT + Single-Device Login
- Konteks: butuh kontrol penuh atas sesi dan token
- Keputusan: Custom JWT (15 mnt) + Refresh Token (hash di DB). Login baru otomatis revoke semua sesi lama
- Alasan: mencegah akses bersamaan dari multiple device
- Dampak ke modul: auth
- Referensi: ADR-004, ADR-006, §9.1 PRD

## [2026-07-08] Login Identifier Fleksibel (NIP / NIK / Email)
- Konteks: pegawai non-IT lebih hafal NIP daripada email
- Keputusan: satu field identifier yang dideteksi otomatis di server
- Alasan: UX lebih baik; tidak perlu pilih tipe sebelum login
- Dampak ke modul: auth
- Referensi: ADR-007, §9.1 PRD

## [2026-07-08] Format Nama File Dokumen
- Konteks: perlu nama file yang konsisten di semua storage provider
- Keputusan: `{KODE-DOKUMEN}-{URUTAN}-{NIP-atau-NIK}.{ext}`. Gunakan NIP jika ada; jika pegawai tidak memiliki NIP, gunakan NIK. Contoh: `STR-1-198501012010011001.pdf`
- Alasan: mudah dibaca manusia, konsisten antar provider
- Dampak ke modul: document
- Referensi: §16.1 PRD

## [2026-07-08] NIP Optional, NIP atau NIK Wajib
- Konteks: tidak semua pegawai memiliki NIP; pegawai tanpa NIP harus tetap bisa dibuat dan login memakai NIK
- Keputusan: `Employee.employeeId` (NIP) dan `Employee.nik` (NIK) sama-sama unik nullable, tetapi minimal salah satu wajib diisi melalui constraint database dan validasi aplikasi
- Alasan: model data mengikuti kondisi nyata pegawai RSUD tanpa mengorbankan identitas login unik
- Dampak ke modul: employee, auth, document filename generation, database schema
- Referensi: §8.1, §9.1, §16.1 PRD

## [2026-07-08] ArchiveCategory: PERSONAL/EDUCATION/EMPLOYMENT/CERTIFICATION/LEGAL
- Konteks: PRD lama memakai UTAMA/KONDISIONAL/PROFESI; skema SQL baru memakai enum berbeda
- Keputusan: ikuti skema SQL baru sebagai ground truth
- Alasan: SQL adalah ground truth; kategori baru lebih universal
- Dampak ke modul: document
- Referensi: §8.3 PRD
```

---

### 23.9 `context/progress/` -- Progres Pengerjaan

| File | Isi |
|---|---|
| `roadmap.md` | 7 fase pengembangan (§19 PRD) beserta status masing-masing fase (Not Started / In Progress / Done) |
| `sprint-log.md` | Log per sprint: tanggal, fitur yang dikerjakan, kendala yang ditemui, dan keputusan yang dibuat. Update di akhir setiap sprint |
| `task-board.md` | Task board aktif: Backlog / In Progress / Done. Format checklist markdown. Diupdate real-time saat pengerjaan |

**Format wajib `task-board.md`:**

```markdown
## Backlog
- [ ] SIMDP-XX: Deskripsi task

## In Progress
- [/] SIMDP-YY: Deskripsi task (mulai: YYYY-MM-DD)

## Done
- [x] SIMDP-ZZ: Deskripsi task (selesai: YYYY-MM-DD)
```

---

### 23.10 Aturan Pemeliharaan Folder Context

1. **Setiap keputusan baru** - tulis ke `memory/decisions-log.md` sebelum lanjut ke task berikutnya.
2. **Setiap fitur selesai** - update `memory/changelog.md` dan centang di `progress/task-board.md`.
3. **Setiap menemukan hal yang sengaja belum diselesaikan** - catat ke `memory/known-issues.md` dengan label `[DEBT]` atau `[KNOWN BUG]`.
4. **Tidak boleh mengubah keputusan yang sudah ada di `decisions-log.md`** - jika keputusan berubah, buat entri baru dengan label `REVISED` dan referensikan entri lama.
5. **Jika ada permintaan fitur yang di luar scope** - cek `business/scope.md` dulu, catat sebagai `[OUT OF SCOPE]` di `known-issues.md`, dan diskusikan dengan user sebelum mengerjakan.

---

## 24. Lampiran — Referensi Cepat

### 24.1 Enum Database

| Enum | Nilai |
|---|---|
| `Role` | `ADMIN`, `STAFF`, `EMPLOYEE` |
| `DocumentStatus` | `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`, `REPLACED` |
| `ArchiveCategory` | `PERSONAL`, `EDUCATION`, `EMPLOYMENT`, `CERTIFICATION`, `LEGAL` |

### 24.2 File Skema Database

| File | Status | Keterangan |
|---|---|---|
| `dms_pegawai_schema.sql` | **Ground truth migrasi database** | Skema SQL yang dieksekusi ke PostgreSQL; wajib diperbarui jika PRD mengubah struktur tabel |
| `schema.prisma` | Mapping ORM | Harus disesuaikan agar match dengan SQL di atas |
| PRD §8 | Dokumentasi konseptual | Jika berbeda dengan SQL, selesaikan konflik dengan memperbarui SQL/Prisma sebelum implementasi |

### 24.3 Ringkasan 7 Fitur Baru vs PRD Lama

| # | Fitur | Implementasi |
|---|---|---|
| 1 | **Audit trail lengkap** | `SecurityLog` + `createdBy`/`updatedBy` di semua tabel master + fungsi `logActivity()` |
| 2 | **File metadata lebih lengkap** | `DocumentRecord` + `fileSize`, `mimeType`, `fileHash`, `storageProvider`, `title`, `isCurrent`, `allowMultipleSnapshot` |
| 3 | **Notifikasi** | Tabel `Notification` + Notification Center UI + Cron job harian |
| 4 | **Soft delete** | Kolom `deletedAt` di `User`, `Employee`, `DocumentType`, `DocumentRecord` |
| 5 | **Auth pendukung: refresh token & password reset** | Tabel `RefreshToken` + `PasswordResetToken` + endpoint `/auth/refresh` + `/auth/forgot-password` + `/auth/reset-password` |
| 6 | **Riwayat mutasi/jabatan pegawai** | Tabel `EmployeeCareerHistory` + UI timeline di profil pegawai |
| 7 | **Reminder dokumen mendekati expired** | Kolom `reminderH30SentAt`, `reminderH7SentAt`, `reminderH1SentAt` di `DocumentRecord` + Cron job + `SystemSetting` untuk threshold |

---

*Akhir dokumen PRD v2.0. Setiap perubahan terhadap dokumen ini wajib dicatat sebagai entri baru di `context/memory/decisions-log.md`.*
