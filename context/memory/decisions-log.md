# Decisions Log — SIMDP

File ini adalah log keputusan jangka panjang proyek. Jangan menghapus keputusan lama. Jika keputusan berubah, tambahkan entri baru dengan label `REVISED` dan referensikan keputusan sebelumnya.

## [2026-07-22] API v1 Rate Limiting Coverage
- Konteks: slice security hardening perlu memastikan endpoint API v1 tidak hanya login yang dibatasi, tetapi juga endpoint upload, download, export, statistik, realtime, dan cron internal.
- Keputusan: SIMDP memakai helper server-only `enforceApiRateLimit()` dengan kategori limit per jenis endpoint. Counter sementara memakai bucket in-memory per proses, sedangkan `SecurityLog` hanya mencatat event `API_RATE_LIMIT_CHECK` saat request terkena 429. `resource` tetap memakai hash berdasarkan kategori + user/IP agar key mentah tidak terekspos.
- Alasan: menjaga scope tetap kecil tanpa menambah dependency/store baru, menghindari audit log menjadi hot path untuk setiap request, tetap memberi audit trail untuk percobaan yang dibatasi, dan memungkinkan limit per kategori yang berbeda.
- Batasan: counter in-memory bersifat per proses/runtime dan belum global antar instance. Endpoint provider-managed Inngest tidak memakai generic limiter sebelum verifikasi provider untuk menghindari DoS terhadap webhook valid. Evaluasi Redis atau tabel rate-limit khusus saat traffic meningkat.
- Referensi: #196.

## [2026-07-22] QR Verification untuk PDF Profil Pegawai
- Konteks: PDF profil pegawai yang diunduh perlu bisa dicek keasliannya oleh pihak yang menerima dokumen tanpa login ke SIMDP.
- Keputusan: QR Code pada PDF hanya berisi URL publik `/verify-document?code=...` dengan kode random 128-bit berformat `SIMDP-` + 32 karakter hex uppercase. Detail verifikasi disimpan di tabel `DocumentVerification`; halaman publik hanya menampilkan data minimal yang aman seperti status, jenis dokumen, nama pegawai, identifier termasking, unit/jabatan, tanggal terbit, dan hash file.
- Alasan: menghindari penyimpanan data pegawai lengkap di QR, memungkinkan dokumen dicabut/revoked di masa depan, dan memberi audit/integritas lebih baik melalui record server-side.
- Batasan: scope awal hanya PDF profil pegawai. Verifikasi dokumen upload lain, upload ulang file untuk mencocokkan hash, expiry policy, dan revoke UI dapat dibuat sebagai issue lanjutan.
- Referensi: #201.

## [2026-07-22] Branch Utama `main` dan `development`
- Konteks: workflow SIMDP perlu memisahkan branch final dari branch eksperimen/iterasi.
- Keputusan: `main` menjadi branch final/stable yang tidak berubah kecuali pekerjaan sudah benar-benar final dan user menyetujui release. `development` menjadi branch integrasi aktif untuk eksperimen, iterasi, dan feature branch harian.
- Alasan: menjaga `main` tetap stabil sambil memberi ruang iterasi yang lebih bebas di `development`.
- Dampak ke workflow: feature branch normal dibuat dari `development` dan PR normal menargetkan `development`; merge `development` ke `main` hanya dilakukan saat user menyatakan hasilnya final.

## [2026-07-18] SecurityLog Event Taxonomy dan Actor/Status Enum
- Konteks: `SecurityLog.status` dan `actorRole` masih string bebas, sedangkan `eventType` punya banyak event append-only dari auth, dokumen, employee, settings, dan cron.
- Keputusan: `SecurityLog.status` dan `SecurityLog.actorRole` memakai Prisma enum canonical uppercase. `SecurityLog.eventType` tetap string tetapi dikontrol typed constants TypeScript dan dokumentasi taxonomy.
- Alasan: status/aktor punya set nilai kecil dan stabil, sedangkan event audit akan bertambah seiring fitur sehingga terlalu kaku jika setiap event baru perlu migration database.
- Legacy mapping: `Public` → `PUBLIC`, `System` → `SYSTEM`, status unknown → `FAILED`, actor unknown → `SYSTEM`.
- Dampak ke modul: security, auth/document/employee/settings callers, Prisma migration, seed, UI filter security log.
- Referensi: #141, #142.

## [2026-07-18] Internal Event Bus untuk Side Effect Notification
- Konteks: Alur verifikasi dokumen, reminder kedaluwarsa, dan dispatch notification masih memiliki coupling langsung antar modul.
- Keputusan: SIMDP memakai internal event bus berbasis Inngest untuk side effect notification lintas modul. Event name dan payload type dipusatkan di `src/lib/events/`, publisher memakai wrapper `publishEvent()`, dan subscriber terdaftar di route Inngest.
- Alasan: Modul domain cukup mempublikasikan fakta domain, sementara modul notification menjalankan side effect miliknya sendiri secara async.
- Batasan: Refaktor ini mencakup side effect notification. Audit trail `logActivity()` tetap panggilan service langsung karena append-only audit masih bagian dari flow sensitif yang harus deterministik.
- Dampak ke modul: document, verification, notification, lib events, route Inngest.
- Referensi: #163.

## [2026-07-18] Remaining Canonical Prisma Enums
- Konteks: `Employee.religion`, `DocumentRecord.storageProvider`, dan `Notification.type`/`relatedEntityType` masih berupa string walau option/constants canonical sudah tersedia.
- Keputusan: Tambahkan Prisma enum untuk agama pegawai, provider storage, tipe notifikasi, dan related entity notifikasi. `StorageProvider` dan `NotificationRelatedEntityType` memakai enum mapping Prisma agar DB tetap menyimpan nilai legacy kompatibel (`local`, `DocumentRecord`) sementara TypeScript memakai value canonical (`LOCAL`, `DOCUMENT_RECORD`).
- Alasan: mengurangi magic string tanpa memutus data lama dan tetap menjaga label UI Indonesia.
- Dampak ke modul: employee, document, notification, prisma migrations, seed.
- Referensi: #135, #139, #140.

## [2026-07-18] Employee Profile Enum Canonical English
- Konteks: Kolom profil pegawai `status`, `gender`, dan `maritalStatus` sebelumnya menyimpan string Indonesia sehingga rawan magic string dan sulit disejajarkan dengan Prisma enum.
- Keputusan: Database memakai Prisma enum English (`EmployeeStatus`, `EmployeeGender`, `EmployeeMaritalStatus`). UI tetap menampilkan label Bahasa Indonesia melalui mapping constants, dan schema/service masih menerima legacy value Indonesia untuk transisi/import CSV.
- Alasan: canonical value stabil untuk DB/API internal, tetapi UX tetap sesuai bahasa pengguna.
- Dampak ke modul: employee, prisma migrations, seed.
- Referensi: #133, #134, #136.

## [2026-07-08] Pemisahan User dan Employee menjadi 2 tabel
- Konteks: perlu memisahkan concern akun login dari profil kepegawaian.
- Keputusan: `User` hanya menyimpan email, password, dan role. `Employee` menyimpan seluruh data kepegawaian dengan relasi 1-1 ke `User`.
- Alasan: memudahkan manajemen akun terpisah dari data HR.
- Dampak ke modul: auth, employee.
- Referensi: §8.4 PRD.

## [2026-07-08] Pluggable Storage Provider
- Konteks: perlu storage yang bisa dipakai lokal saat development tanpa konfigurasi cloud, tetapi tetap siap pindah ke Supabase atau S3.
- Keputusan: gunakan interface `IStorageProvider` dengan `LocalStorageProvider` untuk development, `SupabaseStorageProvider` untuk production option A, dan `S3StorageProvider` untuk production option B/future-proof.
- Alasan: portabilitas; pindah provider hanya butuh ganti `STORAGE_PROVIDER` tanpa mengubah logika bisnis modul document.
- Dampak ke modul: document, `lib/storage/`.
- Referensi: ADR-003, §13 PRD.

## [2026-07-08] Upload Dokumen Canonical via Server-Mediated IStorageProvider
- Konteks: PRD lama mencampur signed URL upload langsung dan server upload sehingga membingungkan implementasi local vs Supabase vs S3.
- Keputusan: v1 memakai `POST /api/v1/documents/upload` multipart/form-data; server melakukan validasi, hash, generate `filePath`, lalu memanggil `IStorageProvider.upload()`.
- Alasan: satu kontrak storage konsisten untuk local, Supabase, dan S3; validasi MIME dan SHA-256 lebih aman.
- Dampak ke modul: document, `lib/storage/`, `app/api/v1/documents/upload`.
- Referensi: §9.3, §11.1, §13 PRD.

## [2026-07-08] Reminder Expiry Dipisah per Tahap
- Konteks: satu kolom `reminderSentAt` tidak cukup untuk reminder H-30, H-7, dan H-1 karena reminder pertama akan menghalangi reminder berikutnya.
- Keputusan: gunakan `reminderH30SentAt`, `reminderH7SentAt`, dan `reminderH1SentAt` di `DocumentRecord`.
- Alasan: sederhana untuk junior programmer dan eksplisit di query cron.
- Dampak ke modul: document, notification, cron/check-expiry, database schema.
- Referensi: §3.3, §8.5, §9.5 PRD.

## [2026-07-08] S3StorageProvider Disiapkan sebagai Provider Resmi
- Konteks: sistem perlu fleksibel jika storage production tidak selalu memakai Supabase.
- Keputusan: `IStorageProvider` mendukung provider `local`, `supabase`, dan `s3`.
- Alasan: menjaga portabilitas storage dan menghindari vendor lock-in.
- Dampak ke modul: `lib/storage/`, document.
- Referensi: ADR-003, §13 PRD.

## [2026-07-08] Custom JWT + Single-Device Login
- Konteks: butuh kontrol penuh atas sesi dan token.
- Keputusan: Custom JWT 15 menit + Refresh Token hash di DB. Login baru otomatis revoke semua sesi lama.
- Alasan: mencegah akses bersamaan dari multiple device.
- Dampak ke modul: auth.
- Referensi: ADR-004, ADR-006, §9.1 PRD.

## [2026-07-08] Login Identifier Fleksibel (NIP / NIK / Email)
- Konteks: pegawai non-IT lebih hafal NIP daripada email.
- Keputusan: satu field identifier yang dideteksi otomatis di server.
- Alasan: UX lebih baik; user tidak perlu pilih tipe identifier sebelum login.
- Dampak ke modul: auth.
- Referensi: ADR-007, §9.1 PRD.

## [2026-07-08] Format Nama File Dokumen
- Konteks: perlu nama file yang konsisten di semua storage provider.
- Keputusan awal: `{KODE-DOKUMEN}-{URUTAN}-{NIP-atau-NIK}.{ext}`. Gunakan NIP jika ada; jika pegawai tidak memiliki NIP, gunakan NIK. Contoh: `STR-1-198501012010011001.pdf`.
- Alasan: mudah dibaca manusia dan konsisten antar provider.
- Dampak ke modul: document.
- Referensi: §16.1 PRD.

## [2026-07-18] REVISED Format Nama File Dokumen
- Konteks: format nama file perlu lebih mudah ditelusuri dari identitas pegawai, kategori arsip, kode jenis dokumen, tanggal dokumen, dan versi.
- Keputusan: gunakan `{NIK-atau-NIP}_{KATEGORI-ARSIP}_{KODE-DOKUMEN}_{YYYYMMDD}_{VERSI}.{ext}`. Prioritas identifier adalah NIK terlebih dahulu, lalu NIP. Tanggal memakai tanggal terbit dokumen jika tersedia, fallback ke tanggal upload.
- Contoh: `198501012010011001_PERSONAL_KTP_20260115_1.pdf`, `198501012010011001_CERTIFICATION_STR-MEDIS_20260115_2.pdf`.
- Dampak ke modul: document upload/replace filename generation dan storage path.
- Referensi: revisi review blocker upload filename.

## [2026-07-08] ArchiveCategory: PERSONAL/EDUCATION/EMPLOYMENT/CERTIFICATION/LEGAL
- Konteks: PRD lama memakai `UTAMA/KONDISIONAL/PROFESI`; skema SQL baru memakai enum berbeda.
- Keputusan: ikuti skema SQL baru sebagai ground truth.
- Alasan: SQL adalah ground truth; kategori baru lebih universal.
- Dampak ke modul: document.
- Referensi: §8.3 PRD.

## [2026-07-08] UI shadcn/ui-first dan Charting Tremor
- Konteks: perlu menyamakan arah visual SIMDP agar UI konsisten, modern, dan mudah diimplementasikan dengan komponen siap pakai.
- Keputusan: design system SIMDP wajib mengikuti estetika dan pola komponen shadcn/ui. Semua komponen umum memakai shadcn/ui atau wrapper internal berbasis shadcn/ui. Chart dashboard memakai Tremor Charts pola Tremor Raw berbasis `recharts`: komponen reusable berada di `src/components/charts/`, utility di `src/lib/chartUtils.ts`, dan pemakaian domain tetap dibungkus layout/state shadcn/ui.
- Alasan: shadcn/ui memberi foundation design system yang clean dan mudah dikustomisasi; Tremor mempercepat implementasi chart/dashboard tanpa mengganti primitive UI umum.
- Dampak ke modul: UI shared components, statistics dashboard, semua page/form/table/dialog.
- Referensi: §4, §9.7, §17, §19 PRD.

## [2026-07-08] NIP Optional, NIP atau NIK Wajib
- Konteks: tidak semua pegawai memiliki NIP; pegawai tanpa NIP harus tetap bisa dibuat dan login memakai NIK.
- Keputusan: `Employee.employeeId` (NIP) dan `Employee.nik` (NIK) sama-sama unik nullable, tetapi minimal salah satu wajib diisi melalui constraint database dan validasi aplikasi.
- Alasan: model data mengikuti kondisi nyata pegawai RSUD tanpa mengorbankan identitas login unik.
- Dampak ke modul: employee, auth, document filename generation, database schema.
- Referensi: §8.1, §9.1, §16.1 PRD.

## 2026-07-09 — SIMDP agent orchestration baseline

- Keputusan: SIMDP memakai Hermes/mes sebagai orchestrator dan senior reviewer, Antigravity sebagai developer agent, dan `agent-skills` personas sebagai reviewer/test/security/performance lenses.
- User tetap menjadi final GitHub approver/merger.
- Root `AGENTS.md` menjadi instruksi operasional untuk Antigravity dan agent coding lain: wajib membaca context relevan, menjaga scope, tidak melakukan drive-by work, dan tidak melakukan tindakan high-risk tanpa approval.

## [2026-07-16] Pemisahan `/settings` user dan `/system-settings` admin
- Konteks: Halaman `/settings` perlu menampung pengaturan pribadi user seperti ganti password, sementara konfigurasi reminder/upload/retensi adalah pengaturan sistem admin.
- Keputusan: `/settings` dipakai untuk semua user login sebagai pengaturan akun pribadi. Pengaturan sistem admin dipindahkan ke `/system-settings` tanpa memakai prefix role seperti `/admin/*`.
- Alasan: Menjaga `/profile` tetap fokus ke data pegawai, memisahkan concern akun pribadi dari konfigurasi sistem, dan mengikuti konvensi URL bersih SIMDP.
- Dampak ke modul: auth, settings, navigation, i18n.
- Referensi: Issue #112.

## [2026-07-18] Standarisasi Nilai Enum Database & Migrasi
- Konteks: Nilai enum di database (PostgreSQL/Prisma) dan tata cara melakukan migrasinya.
- Keputusan:
  - Nilai enum database kanonikal wajib menggunakan bahasa Inggris (English). Label bahasa Indonesia disajikan di tingkat UI/mapping label domain.
  - Setiap migrasi enum database wajib menyertakan legacy data mapping eksplisit serta catatan preflight.
- Alasan: Konsistensi bahasa sistem di level database dan portabilitas kode, serta keamanan migrasi data legacy.
- Dampak ke modul: Semua modul yang berinteraksi dengan database/Prisma.
- Referensi: Issue #129.

## [2026-07-18] Penggunaan index.ts sebagai Aggregator dan Evolusi Folder Modul
- Konteks: Struktur modul yang membesar dan pembatasan impor antar modul.
- Keputusan:
  - File `index.ts` di root modul dan subfolder komponen bertindak murni sebagai aggregator/re-export (tidak ada logic internal).
  - Untuk modul yang besar, struktur folder modul dapat berkembang menggunakan subfolder fokus seperti `services/`, `repositories/`, `hooks/`, `components/`, `constants/`.
  - Impor eksternal dari modul lain harus menggunakan service/public boundary yang diekspos melalui aggregator jika tersedia.
- Alasan: Modularitas, meminimalkan circular dependency, dan menyederhanakan API permukaan modul.
- Dampak ke modul: Semua modul.
- Referensi: Issue #129, #130, #131.

## [2026-07-18] Employee.lastEducation Menunggu Audit Distinct Value Sebelum Enum
- Konteks: `Employee.lastEducation` saat ini masih string dan opsi UI memakai jenjang pendidikan Indonesia seperti `SD`, `SMP`, `SMA`, `D1`, `S1`, `Profesi`, dan `Sp-2`.
- Keputusan: `Employee.lastEducation` diperlakukan sebagai kandidat enum, tetapi migration database ditunda sampai ada audit distinct value dari data production/local dan mapping legacy yang disetujui. Untuk sementara, kode boleh menyediakan canonical English mapping (`ELEMENTARY_SCHOOL`, `BACHELOR`, `PROFESSIONAL`, dst.) tanpa mengubah nilai yang disimpan.
- Alasan: Pendidikan memiliki kemungkinan variasi historis/singkatan sehingga migration langsung berisiko mengunci data yang belum diaudit.
- Dampak ke modul: employee, Prisma migration lanjutan.
- Referensi: Issue #137.
