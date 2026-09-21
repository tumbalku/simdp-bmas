# Decisions Log — SIMDP

File ini adalah log keputusan jangka panjang proyek. Jangan menghapus keputusan lama. Jika keputusan berubah, tambahkan entri baru dengan label `REVISED` dan referensikan keputusan sebelumnya.

## [2026-09-21] Sumber Kebenaran Status Auto-Final Adalah Trigger DB, Service Hanya Mencerminkan
- Status: **Diterima**.
- Konteks: schema v2.3 menambahkan `DocumentType.adminUploadAutoFinal` dan `uploaderRole`. Trigger `handle_document_replacement` (`trg_03`) menimpa `NEW.status := 'APPROVED'` + `NEW.isFinal := true` saat admin/staff mengunggah dokumen dengan `adminUploadAutoFinal = true`, lalu trigger `auto_verification_history_for_final` (`trg_04`) membuat `VerificationHistory` APPROVED. Sebelum perbaikan, service `uploadDocumentRecord`/`replaceDocumentFile` selalu menulis `status: "PENDING"` dan membuat `VerificationHistory` PENDING, sehingga ada dua sumber kebenaran dan potensi history ganda (REVIEW.md H-2).
- Keputusan: **trigger DB adalah sumber kebenaran tunggal** untuk `status`, `isFinal`, `replacesDocumentId`, dan `allowMultipleSnapshot` pada insert `DocumentRecord`. Service menghitung `resolveAutoFinalFields(docType, session.role)` untuk (a) memilih status awal yang **konsisten** dengan trigger, dan (b) **tidak** membuat `VerificationHistory` PENDING pada upload auto-final (guard `initialStatus === "PENDING" && documentRecord.status === "PENDING"` di repository). Service tidak mengandalkan trigger untuk *validasi* — `requiresPeriod`, `requiresDocumentNumber`, `requiresIssueDate`, `requiresExpiryDate`, dan `uploaderRole` divalidasi di service sebagai `AppError` 400 (defense-in-depth).
- Alasan: validasi murni di DB membuat error menjadi exception mentah PostgreSQL → 500 generik dan UX buruk; sebaliknya, penulisan status murni di service akan hilang pada dump/restore tanpa trigger. Pembagian ini: **service memvalidasi input, DB menetapkan status final**.
- Dampak: route upload menerjemahkan `Prisma.PrismaClientKnownRequestError` dari trigger menjadi `AppError` 400 via `translateDatabaseTriggerError()`. Pada DB tanpa trigger (test mock), status awal yang ditulis service sama dengan hasil trigger pada DB nyata; test suite memverifikasi kedua jalur (admin → APPROVED tanpa history PENDING; employee → PENDING + history PENDING).
- Batasan: bila trigger dinonaktifkan di production, status auto-final tidak akan terjadi — ini disengaja (fail-open ke `PENDING` lebih aman daripada fail-closed ke APPROVED).
- Referensi: #319, REVIEW.md H-2, `prisma/migrations-v2/20260920031000_harden_v2_database_rules/migration.sql`, ADR [2026-09-21] Business Rules di Tingkat Database (Trigger).

## [2026-09-21] Post Attachment Scanning Policy (Revisi Kebijakan #212)
- Status: **Diterima**.
- Konteks: keputusan [2026-07-23] Malware Scanning Upload File menyatakan *semua upload/ganti file dokumen wajib melewati abstraction malware scanner*. Modul `post` baru memakai lampiran (gambar/PDF) yang diupload oleh STAFF/ADMIN, tetapi implementasi awalnya (`post.service.ts` versi pertama) hanya memakai `sanitizeFileName` + `normalizeStoragePath` dan menyimpan `mimeType` dari `file.type` yang dikontrol client, tanpa memanggil `scanFileBuffer()` sama sekali (REVIEW.md H-1).
- Keputusan: **seluruh lampiran pengumuman divalidasi isinya dan di-scan**, tanpa pengecualian:
  - `sniffAttachmentMimeType()` di `src/modules/post/utils/file-content.ts` membaca magic bytes buffer (`%PDF-`, PNG 8-byte, JPEG `FFD8FF`, WEBP `RIFF…WEBP`) dan menolak buffer yang tidak cocok signature manapun dengan `AppError` 400. `file.type` hanya dipakai untuk pesan error, tidak untuk `StoredFile.mimeType`.
  - `enforceAttachmentMalwareScan()` memanggil `scanFileBuffer()` **sebelum** file ditulis ke storage, sehingga file yang ditolak tidak pernah tersimpan.
  - Fail-closed sama dengan keputusan #212: `INFECTED` → `AppError` 422; scanner error/unavailable → `AppError` 503. Keduanya dicatat ke `SecurityLog` (`DOCUMENT_MALWARE_DETECTED` / `DOCUMENT_MALWARE_SCAN_FAILED`, status `FAILED`, resource `PostAttachment:<postId>`) tanpa menyimpan isi file.
  - `getActorDisplayName` dari `@/modules/employee/server` di-import dinamis hanya di jalur kegagalan agar upload sehat tidak menanggung query tambahan.
- Alasan: route attachment menyajikan file inline (`SAFE_INLINE_MIME_TYPES`), jadi MIME palsu + payload berbahaya bisa langsung dieksekusi browser. Kebijakan #212 sudah menyatakan server-side validation sebagai sumber kebenaran; pengecualian untuk lampiran non-dokumen tidak punya justifikasi keamanan.
- Konsekuensi: jenis lampiran dibatasi ke PDF/PNG/JPEG/WEBP; lampiran lain ditolak dengan pesan jelas. Lampiran post membutuhkan ClamAV reachable seperti upload dokumen.
- Dampak ke modul: `post` (service + utils), `security` (event constants), route `/api/v1/posts/manage` dan `/api/v1/posts/attachments/[id]`.
- Referensi: #318, REVIEW.md H-1, decisions-log [2026-07-23] Malware Scanning Upload File (#212).

## [2026-09-21] Posts Rate Limiting Coverage (Revisi Kebijakan #196)
- Status: **Diterima**.
- Konteks: keputusan [2026-07-22] API v1 Rate Limiting Coverage dan [2026-08-01] REVISED Scoped API Rate Limit Buckets menyatakan rate limiting diperluas ke endpoint upload, download, export, statistik, realtime, dan cron. Modul `post` baru menambahkan endpoint yang masuk kategori tersebut (`POST /posts/manage` = upload multipart, `GET /posts/attachments/[id]` = streaming file) tetapi semuanya tanpa `enforceApiRateLimit()` (REVIEW.md H-3).
- Keputusan: setiap endpoint posts memakai `enforceApiRateLimit()` dengan kategori dan scope:
  | Endpoint | Kategori |
  |---|---|
  | `GET /api/v1/posts` (feed) | `NOTIFICATION_READ` |
  | `GET /api/v1/posts/manage` | `NOTIFICATION_READ` |
  | `POST /api/v1/posts/manage` | `FILE_UPLOAD` |
  | `GET /api/v1/posts/manage/[id]` | `NOTIFICATION_READ` |
  | `PATCH` / `DELETE /api/v1/posts/manage/[id]` | `FILE_UPLOAD` |
  | `GET /api/v1/posts/target-options` | `NOTIFICATION_READ` |
  | `GET /api/v1/posts/attachments/[id]` | `FILE_DOWNLOAD` |
  Pembagian kategori mengikuti pola scoped bucket decisions-log [2026-08-01]: endpoint write multipart tidak menghabiskan kuota read, dan streaming attachment memakai kategori download tersendiri.
- Konsekuensi: request publish pengumuman dengan banyak lampiran bisa terkena `FILE_UPLOAD` bucket; publish tanpa lampiran tidak. Feed pegawai tidak terpengaruh oleh aktivitas manage admin/staff.
- Dampak ke modul: `app/api/v1/posts/**` (semua route handler).
- Referensi: #320, REVIEW.md H-3, decisions-log [2026-07-22] dan [2026-08-01].

## [2026-09-21] Revisi Enum RegistrationStatus
- Status: **Diterima** (breaking terhadap data v1 — lihat ADR strategi migrasi v1→v2).
- Konteks: enum `RegistrationStatus` v1 memakai `PENDING_ADMIN_REVIEW` dan `EXPIRED` untuk menandai request menunggu admin dan request OTP kedaluwarsa. Pengaluran registrasi v2 menyederhanakan tahapan menjadi: email diverifikasi → menunggu review → keputusan admin.
- Keputusan: nilai `PENDING_ADMIN_REVIEW` dan `EXPIRED` **dihapus**; nilai `EMAIL_VERIFIED` dan `UNDER_REVIEW` **ditambahkan**. Set nilai akhir: `EMAIL_PENDING`, `EMAIL_VERIFIED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`. Kolom `UserRegistrationRequest.employeeId` di-rename menjadi `claimedNip` agar jelas bahwa NIP saat pendaftaran adalah klaim calon user, bukan FK ke data pegawai yang sudah ada.
- Alasan: nama state kini menyatakan status aktual alur (sudah verifikasi email / sedang direview) alih-alih aksi berikutnya yang akan dilakukan admin. `claimedNip` menghilangkan ambiguitas field `employeeId` yang semula terlihat seperti relasi ke `Employee`.
- Konsekuensi: data v1 yang masih memakai `PENDING_ADMIN_REVIEW`/`EXPIRED` wajib dipetakan saat migrasi v1→v2 (lihat ADR strategi migrasi). Filter default `listRegistrationRequests` berubah ke `UNDER_REVIEW`, sehingga bookmark admin lama `?status=PENDING_ADMIN_REVIEW` akan gagal validasi (REVIEW.md L-3, breaking minor yang disengaja).
- Dampak ke modul: `auth` (registrasi service, queue admin, schema validasi), prisma migration.
- Referensi: REVIEW.md B-1/L-3, task registrasi 2026-09-21.

## [2026-09-21] Business Rules di Tingkat Database (Trigger)
- Status: **Diterima** — dengan catatan trade-off testing di bawah.
- Konteks: rules dokumen (siapa boleh upload, apa dokumen final, kapan replace terjadi, kapan `updatedAt` berubah) sebelumnya tersebar di service Prisma dan rawan skip kalau dipanggil dari konteks lain (route handler, tooling, dump yang dipulihkan). Insiden review menunjukkan beberapa rules (mis. `uploaderRole`) tidak diterapkan service sama sekali.
- Keputusan: rules invarian dipindah ke **trigger dan CHECK constraint PostgreSQL** di migration `prisma/migrations-v2/20260920031000_harden_v2_database_rules/migration.sql` (dengan revisi di `20260920113000_support_explicit_document_replacement` dan `20260920114500_allow_controlled_verification_purge`):
  - `trg_01_*_updated_at` — `set_updated_at()` menjadi **satu-satunya** sumber kebenaran `updatedAt`. Komentar SQL secara eksplisit melarang menambah field Prisma `@updatedAt` pada model yang sama; pilih satu mekanisme, bukan dua.
  - `trg_02_validate_document_fields` — `validate_document_fields()` mengecek flag `DocumentType.requiresPeriod`/`requiresExpiryDate`/`requiresIssueDate`/`requiresDocumentNumber` pada setiap INSERT/UPDATE `DocumentRecord`.
  - `trg_03_document_replacement` — `handle_document_replacement()` (BEFORE INSERT): employee hanya upload untuk dirinya, enforce `uploaderRole`, `isFinal` selalu diputus trigger (tidak pernah pass-through client), auto-approve `APPROVED` saat `adminUploadAutoFinal` dan uploader ADMIN/STAFF, final document tidak bisa diganti non-admin/staff, `replacesDocumentId` diisi hanya untuk non-multiple types, dan menandai dokumen current lama `REPLACED`.
  - `trg_04_auto_verification_history` — `auto_verification_history_for_final()` (AFTER INSERT) membuat `VerificationHistory` APPROVED untuk auto-approved final document agar history tetap lengkap.
  - `trg_05_protect_final_document` — `protect_final_document_updates()` (BEFORE UPDATE) memblokir perubahan `storedFileId`, `status`, `isCurrent`, `deletedAt`, `documentTypeId`, `ownerId`, `documentNumber`, `issueDate`, `expiryDate`, `periodStartDate`, `periodEndDate` pada dokumen final oleh non-admin/staff; `updatedBy` wajib diisi.
  - `trg_06`/`trg_07` — `prevent_mutation()` menjadikan `SecurityLog` dan `VerificationHistory` append-only di tingkat DB. Pengecualian terkontrol: purge `VerificationHistory` hanya jika session setting `app.allow_verification_history_purge = on` (dipakai `permanentlyDeleteDocumentRecord`).
  - `trg_08_post_visibility_check` — `validate_post_visibility_targets()` (`DEFERRABLE INITIALLY DEFERRED`): post `TARGETED` tidak boleh `PUBLISHED` tanpa minimal satu target visibility.
  - `trg_09`–`trg_12` — `prevent_orphaning_targeted_post()` mencegah menghapus target terakhir dari post `PUBLISHED TARGETED`.
  - Partial unique index `uniq_storedfile_provider_path` (`storageProvider`, `filePath` WHERE `deletedAt IS NULL`) dan `uniq_current_document_per_type`, serta CHECK constraint yang tidak bisa direpresentasikan Prisma.
- Alasan: invarian data tidak boleh bergantung pada setiap pemanggil service menentukan rules yang sama. Trigger memastikan rules berlaku tak tergantung client, tooling, atau jalur masuk mana pun; constraint `DEFERRABLE` memungkinkan insert post + targets dalam satu transaksi tanpa peduli urutan.
- Konsekuensi (trade-off yang disadari): **seluruh test suite mem-mock Prisma Client** (`tests/setup.ts`), sehingga trigger **tidak teruji** oleh 499 test yang lulus. Perilaku production nyata (auto-approve admin, append-only audit, orphan guard) hanya bisa diverifikasi pada database nyata. Oleh karena itu **validasi paralel di service tetap wajib** (defense-in-depth sesuai `context/security/rbac.md`): service harus memberikan `AppError` 400 yang ramah untuk `requiresPeriod`, membaca `uploaderRole`/`adminUploadAutoFinal` untuk menentukan status awal yang konsisten dengan trigger, dan route handler harus menerjemahkan `PrismaClientKnownRequestError` dari trigger menjadi error 400 yang berpesan (REVIEW.md H-2 — diturunkan ke issue #319).
- Dampak ke modul: prisma migrations, seluruh modul yang menulis `DocumentRecord`/`SecurityLog`/`VerificationHistory`/`Post`+`PostVisibility*`.
- Referensi: REVIEW.md B-1/H-2/§8.2, issue #319 (validasi paralel di service), #325 (gap test trigger DB).

## [2026-09-21] Pemisahan StoredFile dari DocumentRecord
- Status: **Diterima**.
- Konteks: `DocumentRecord` sebelumnya menyimpan metadata file (`fileName`, `filePath`, `fileSize`, `mimeType`, `fileHash`, `storageProvider`) langsung di baris dokumen. Akibatnya setiap replace/ganti dokumen menduplikasi metadata, path file tidak unik per provider secara terjamin, dan satu file fisik tidak bisa direferensikan ulang oleh lebih satu record.
- Keputusan: metadata file dipindah ke model `StoredFile` (tabel tersendiri); `DocumentRecord` merujuknya lewat `storedFileId` **NOT NULL**. `PostAttachment` juga memakai `StoredFile` sehingga lampiran pengumuman dan dokumen pegawai berbagi abstraksi file yang sama. Partial unique index `uniq_storedfile_provider_path` pada `(storageProvider, filePath) WHERE deletedAt IS NULL` memastikan satu path hanya dipakai satu file aktif per provider. Mapper `withStoredFileMetadata()` di `src/modules/document/repositories/stored-file.ts` meratakan field `storedFile` ke top-level sehingga konsumen lama tetap menerima shape yang sama.
- Alasan: (1) satu file bisa direferensikan ulang oleh beberapa record (mis. lampiran post dan dokumen, atau multi-snapshot); (2) path unik per provider mencegah tulis timpa tak sengaja; (3) metadata file tidak terduplikasi setiap replace; (4) `DocumentRecord` menjadi murni data kepegawaian + status verifikasi, bukan campuran adukan file dan domain.
- Konsekuensi: **breaking** untuk database v1 — setiap baris `DocumentRecord` existing harus diberi `StoredFile` baru (backfill) sebelum kolom file lama di-drop dan `storedFileId` di-set NOT NULL; lihat ADR strategi migrasi v1→v2. Konsumen yang membaca field file langsung dari `DocumentRecord` harus lewat mapper.
- Dampak ke modul: `document` (mapper, upload/replace/download repository), `post` (attachment), prisma schema + migration.
- Referensi: REVIEW.md B-1/§8.1, issue #317.

## [2026-09-21] Strategi Migrasi v1 → v2 (folder `prisma/migrations-v2`)
- Status: **Diterima** untuk struktur repo; **TUNGGU PERSETUJUAN USER** untuk eksekusi di production.
- Konteks: schema v2.3 bersifat breaking (lihat ADR di atas + REVIEW.md B-1): kolom file pindah ke `StoredFile` dengan FK NOT NULL baru, `DocumentRecord.createdBy` menjadi NOT NULL, rename `employeeId` → `claimedNip`, nilai enum `RegistrationStatus` dihapus/ditambah, `Employee.user` `onDelete` berubah `Cascade` → `Restrict`. Sementara itu production RSUD sudah berjalan dengan schema v1 **dan sudah ada data pegawai**.
- Keputusan:
  - Folder migrasi aktif dipindah ke `prisma/migrations-v2` melalui `prisma.config.ts` (6 migration). Folder v1 lama `prisma/migrations` (20 migration) **diarsipkan** dan tidak boleh dipakai tooling/dev lagi — memakainya akan menyebabkan baseline ganda dan `prisma migrate diff` mengambil baseline salah. Migration pertama `20260920024915_init_v2` adalah `CREATE TABLE` penuh untuk database **baru** (fresh install), bukan upgrade.
  - Migrasi transisi `migrate_v1_to_v2` (issue #317, branch `fix/317-database-v1-to-v2-migration`) berurutan: `CREATE TABLE "StoredFile"` → backfill dari `DocumentRecord` (`gen_random_uuid()`) → add column `storedFileId` → update → `SET NOT NULL` → drop kolom file lama; `RENAME COLUMN "employeeId" TO "claimedNip"`; mapping enum registrasi (`PENDING_ADMIN_REVIEW` → `UNDER_REVIEW`, `EXPIRED` → `EMAIL_PENDING`) **sebelum** `ALTER TYPE` karena PostgreSQL tidak bisa menghapus nilai enum yang masih dipakai; backfill `createdBy` (fallback user admin pertama) sebelum `SET NOT NULL`; penyesuaian FK/`onDelete` `Employee.userId`.
  - Runbook + preflight + rollback direncanakan di `context/technical/` (lihat rencana eksekusi review).
- Konsekuensi: environment baru (development segar, disposable DB) bisa langsung memakai branch ini. Environment existing (local dev yang sudah di-seed v1, staging, production RSUD) **tidak bisa** ikut sebelum migration transisi selesai. Menjalankan `prisma migrate deploy` pada database existing dengan rantai saat ini akan gagal atau menghancurkan data.
- Batasan high-risk: eksekusi migrasi di production adalah tindakan high-risk per `AGENTS.md` §10 — **wajib persetujuan eksplisit user (Arsi) dan jendela maintenance**, serta wajib diuji di salinan database production asli (rehearsal) sebelumnya. **Jangan dijalankan tanpa persetujuan.**
- Dampak ke modul: prisma config/migrations, tooling CI, runbook operasional.
- Referensi: REVIEW.md B-1/M-6, issue #317, `context/plans/review-execution-plan.md` Fase 1, decisions-log [2026-07-22] Branch Utama `main` dan `development`.

## [2026-09-21] Pencarian Pengumuman Dibatasi pada Judul Saja (Opsi A)
- Konteks: pencarian feed/manajemen pengumuman memakai Prisma `contains` pada `Post.title` **dan** `Post.content`. Kolom `content` adalah string JSON Tiptap (`{"type":"doc","content":[{"type":"paragraph",...}]}`), sehingga kata kunci struktural seperti `paragraph`, `heading`, `text`, atau `attrs` cocok dengan hampir semua post dan menghasilkan false positive (review H-4).
- Keputusan: untuk v1, pencarian pengumuman (feed pegawai dan daftar manage admin/staff) hanya mencocokkan `title`. Klausa `content` dihapus dari `findVisiblePosts`/`countVisiblePosts` di `post.repository.ts`; daftar manage sudah hanya memakai `title`.
- Alasan: perbaikan paling sederhana dan sesuai scope v1 — akar masalahnya adalah JSON mentah yang tidak dimaksudkan sebagai teks yang dicari.
- Batasan: isi teks pengumuman tidak bisa dicari sampai ada kolom teks yang diindeks.
- Dampak: pencarian lebih akurat; query DB tetap ringan. Pencaharian isi konten akan butuh perbaikan lanjutan.
- Follow-up: Opsi B yang ditolak untuk sekarang adalah menambah kolom `contentText` (generated dari rich text saat simpan) yang diindeks dan dipakai untuk pencarian, serta memperbaiki akurasi excerpt. Dibuka sebagai issue terpisah bila dibutuhkan.
- Referensi: #321, REVIEW.md H-4.

## [2026-09-21] Excerpt Pengumuman Dibuat Client-Side dari Rich Text
- Konteks: feed pengumuman perlu menampilkan ringkasan agar terbaca seperti berita, tetapi tidak ada kolom `summary`/`excerpt` di database dan prompt melarang perubahan schema.
- Keputusan: excerpt dihitung di sisi client lewat helper `getPostExcerpt()` di `src/modules/post/utils/rich-content.ts`, yang menggunakan `getPostContentText()` (ekstrak teks dari dokumen JSON Tiptap) lalu memotong pada batas kata terakhir sebelum 180 karakter (default) dengan ellipsis. Helper murni/isomorphic sehingga aman dipakai di client component maupun service.
- Alasan: nol perubahan schema, dependency, dan service; payload feed tidak berubah; fallback tetap berfungsi untuk konten teks biasa lama (bukan JSON).
- Dampak: payload JSON Tiptap penuh tetap dikirim ke client. Jika feed menjadi berat nanti, pindahkan komputasi excerpt ke `getPostFeed` (tambah field `excerpt` di `PostFeedItem` + mapper) sebagai follow-up terpisah.
- Referensi: task format announcement seperti berita, 2026-09-21.

## [2026-09-21] Feed Pengumuman Memakai Daftar Vertikal, Detail Memakai Layout Artikel
- Konteks: feed sebelumnya memakai grid 2 kolom `CardContainer` yang membuat judul terjepit 14px dan terasa seperti dashboard widget, bukan berita.
- Keputusan: feed memakai daftar vertikal `max-w-4xl` dengan primitif `Card` (headline `h2` bold, badge "Baru", tanggal+penulis, excerpt, "Baca selengkapnya", thumbnail kanan di desktop). Halaman detail memakai `<article>` `max-w-3xl` dengan headline besar, byline publikasi (`Dipublikasikan pada … • Oleh …`), separator, galeri, dan "Dokumen Lampiran". `CardContainer` tidak dipakai di kedua tampilan karena memaksakan icon + judul 14px.
- Alasan: sesuai design system SIMDP (shadcn/ui primitive, token semantic, spacing 4px) sekaligus memberi hierarki semantik berita (`h1`/`h2`/`article`), menjaga measure 65–75 karakter di detail, dan tetap profesional untuk sistem internal RSUD.
- Dampak: hanya komponen presentasi modul post yang berubah; tidak ada perubahan route, API, atau database.
- Referensi: task format announcement seperti berita, 2026-09-21.

## [2026-09-08] Registrasi User Sementara Menggunakan Tabel Staging Terpisah
- Konteks: pengisian data pegawai perlu dipercepat dengan registrasi mandiri, tetapi fitur ini kemungkinan dinonaktifkan setelah masa input awal selesai.
- Keputusan: registrasi mandiri memakai tabel `UserRegistrationRequest` tanpa foreign key ke tabel utama. Row `User` dan `Employee` baru dibuat hanya ketika admin approve setelah email user diverifikasi OTP.
- Alasan: fitur dapat dimatikan atau tabel staging dihapus tanpa mengganggu data utama, login tetap aman karena calon user belum punya akun aktif sebelum approval, dan admin tetap punya audit/notifikasi atas setiap pendaftar.
- Dampak: data unit kerja/catatan bebas disimpan sebagai konteks review di staging; profil `Employee` hasil approval hanya memakai field inti yang memang tersedia di model utama.

## [2026-09-08] REVISED Unit Kerja dan Pengiriman Email Registrasi
- Merevisi keputusan staging di atas: registrasi publik tidak lagi meminta unit kerja bebas. Admin menetapkan relasi master unit kerja melalui data pegawai setelah approval. Teks unit kerja permohonan lama tetap tersimpan sebagai konteks review dan tidak otomatis menjadi relasi `Employee.workplaceId`.
- Validasi seluruh form dilakukan di client dan server; OTP dikirim hanya setelah penyimpanan permohonan berhasil. Email persetujuan dikirim sesudah transaksi pembuatan akun berhasil, ke email yang sudah diverifikasi.
- Jika provider menolak email persetujuan, akun tetap aktif dan admin mendapat peringatan. Status pengiriman berhasil berarti provider menerima permintaan, bukan jaminan email sudah masuk inbox.

## [2026-09-10] REVISED Registrasi Aktif dan Material Kredensial Staging
- Merevisi keputusan staging registrasi: unique constraint untuk email, NIK, dan NIP pada `UserRegistrationRequest` hanya berlaku pada request aktif (`EMAIL_PENDING` dan `PENDING_ADMIN_REVIEW`) melalui partial unique index SQL. Request selesai tetap menyimpan identitas sebagai histori review, tetapi tidak memblokir pendaftaran baru.
- Request `PENDING_ADMIN_REVIEW` tidak boleh di-reset oleh submit ulang dari publik. Request `EMAIL_PENDING` yang OTP-nya sudah kedaluwarsa tidak lagi menjadi reservasi aktif identitas.
- `passwordHash`, `emailOtpHash`, dan expiry OTP di tabel staging dibersihkan saat request menjadi `EXPIRED`, `REJECTED`, atau `APPROVED`; akun hasil approval menyimpan hash password di tabel `User`.
- OTP registrasi memakai HMAC berbasis secret aplikasi dan dibandingkan dengan timing-safe equality untuk mengurangi risiko brute force jika tabel staging bocor.
- Transisi `EMAIL_PENDING -> PENDING_ADMIN_REVIEW`, `PENDING_ADMIN_REVIEW -> APPROVED`, dan reject admin memakai conditional update dengan status lama sebagai guard agar dua aksi paralel tidak saling menimpa hasil review.

## [2026-09-10] Profil Mandiri Pegawai dengan Cooldown 90 Hari
- Konteks: setelah registrasi disetujui, pegawai hanya membawa data inti sehingga admin tetap harus melengkapi banyak field saat jumlah pendaftar besar.
- Keputusan: role `EMPLOYEE` boleh melengkapi data pribadi dan data kerja dari halaman `/profile`, tetapi setiap simpan self-service mengisi `Employee.profileSelfUpdatedAt` dan mengunci edit mandiri berikutnya selama 90 hari.
- Batasan: email, role, status akun, NIP, dan NIK tetap dikelola admin. Cooldown tidak berlaku untuk panel admin/staff yang memperbarui data melalui flow master data.
- Referensi: #308.

## [2026-09-08] REVISED Backup Operasional Dipisah dari Repo SIMDP
- Konteks: project backup/restore yang ramah operator sudah dipisahkan ke project terpisah `SIMDP Backup Ops Hub`, sehingga repo SIMDP tidak perlu lagi membawa Ops Hub lama, helper shell backup lokal/VPS, adapter `IBackupTarget`, env `BACKUP_*`, atau runbook backup operasional.
- Keputusan: SIMDP kembali fokus sebagai aplikasi web utama. Backup/restore operasional dikelola di project `SIMDP Backup Ops Hub`. Repo SIMDP hanya mempertahankan proteksi `.gitignore` untuk folder/artefak backup lokal agar data backup tidak ikut ter-commit.
- Dampak: keputusan backup provider-agnostic Issue #237 dan helper backup lokal/VPS sebelumnya dinyatakan superseded untuk repo SIMDP. Jika dokumentasi backup masih diperlukan, tulis dan jalankan dari project backup terpisah.
- Referensi: cleanup pemisahan Ops Hub 2026-09-08.

## [2026-08-01] REVISED Scoped API Rate Limit Buckets
- Konteks: kategori rate limit seperti `EXPORT` dipakai oleh beberapa endpoint berbeda. Bucket yang hanya berbasis kategori + user/IP membuat download PDF profil, PDF dokumen, CSV pegawai, dan export lain saling menghabiskan kuota walaupun aksi yang dilakukan berbeda.
- Keputusan: `enforceApiRateLimit()` mendukung `scope` aksi opsional. Key bucket dibentuk dari kategori + scope + user/IP, dengan default `scope:global` untuk endpoint yang belum membutuhkan pemisahan aksi.
- Alasan: rate limiting tetap aktif untuk mencegah spam pada satu aksi, tetapi aktivitas di endpoint lain tidak menyebabkan 429 akumulatif yang tidak intuitif.
- Referensi: revisi issue #196/#222, diskusi rate limit export 2026-08-01.

## [2026-07-29] Docusaurus sebagai Portal Dokumentasi Resmi
- Konteks: SIMDP membutuhkan dokumentasi yang mudah dibaca developer, operator, auditor keamanan, dan user internal tanpa menghilangkan detail historis yang sudah ada di folder `context/`.
- Keputusan: dokumentasi resmi yang dapat dipublish dibuat dengan Docusaurus di folder `documentation/` dalam repo yang sama. Folder `context/` tetap menjadi memori detail/source historis, sedangkan Docusaurus menjadi portal baca utama dengan struktur Architecture, Developer Guide, Operator Guide, Security, API, User Manual, dan Reference.
- Alasan: satu repo membuat perubahan kode dan docs bisa direview dalam PR yang sama, tidak perlu sinkron antar repo, dan cocok untuk fase project yang masih aktif berkembang.
- Batasan: jika di masa depan docs perlu lifecycle atau akses publik yang berbeda dari source code, dokumentasi bisa dipindahkan ke repo terpisah.
- Referensi: diskusi dokumentasi project 2026-07-29.

## [2026-07-29] Verifikasi PDF Direktori Pegawai
- Konteks: export PDF laporan kepegawaian dari halaman daftar pegawai berisi banyak pegawai sesuai query pencarian, sehingga tidak tepat jika QR verifikasi dikaitkan ke satu `Employee` seperti PDF profil pegawai.
- Keputusan: `DocumentVerification` mendukung tipe `EMPLOYEE_DIRECTORY` dan `subjectEmployeeId` boleh kosong untuk dokumen agregat/direktori. QR tetap berisi URL publik `/verify-document?code=...`, sedangkan hash PDF dan metadata filter export disimpan di record verifikasi.
- Alasan: menjaga integritas verifikasi PDF direktori tanpa menumpangkan subject ke pegawai pertama atau pegawai acak, serta tetap memakai alur verifikasi publik yang sudah ada.
- Batasan: halaman publik menampilkan ringkasan aman untuk laporan direktori dan hash file, bukan seluruh isi data pegawai.
- Referensi: permintaan export PDF laporan kepegawaian dengan QR verifikasi 2026-07-29.

## [2026-07-29] Prioritas Target Backup Production
- Konteks: setelah fondasi backup provider-agnostic dibuat, production SIMDP perlu urutan target yang jelas agar operator tidak menganggap semua opsi setara.
- Keputusan: target utama offsite backup adalah Google Drive service account (`BACKUP_TARGET=gdrive`). Jalur VPS/local (`BACKUP_TARGET=folder|local`) menjadi opsi kedua untuk server lokal/VPS dengan copy offsite. S3/S3-compatible menjadi opsi terakhir/future sampai target bucket, credential, dan adapter/job resmi dipilih.
- Alasan: Google Drive paling realistis untuk kesiapan awal RSUD karena mudah diaudit operator, terpisah dari runtime aplikasi, dan sudah punya adapter upload awal. VPS/local tetap penting untuk backup cepat di server sendiri, sedangkan S3 memerlukan keputusan infrastruktur tambahan.
- Referensi: #237.

## [2026-07-29] Sumber Storage Helper Backup VPS Dipilih dari STORAGE_PROVIDER
- Konteks: helper backup lokal/VPS perlu bisa berjalan di dua deployment yang paling umum: storage lokal pada VPS sendiri dan storage Supabase pada deployment hybrid/Vercel.
- Keputusan: `scripts/backup-local-vps.sh` boleh membaca sumber storage aktif dari `STORAGE_PROVIDER`. Nilai `local` mengambil folder `SIMDP_STORAGE_DIR` atau default `uploads/`, sedangkan `supabase` menyalin object dari bucket Supabase ke snapshot sementara sebelum diarsipkan.
- Batasan: keputusan ini hanya untuk helper backup lokal/VPS. Boundary storage aplikasi tetap memakai `STORAGE_PROVIDER` di `src/lib/storage/`, dan target backup offsite tetap memakai `BACKUP_TARGET`.
- Referensi: #237.

## [2026-07-23] Middleware Auth Coverage untuk Route Dashboard
- Konteks: route group `(dashboard)` menghasilkan URL seperti `/documents`, `/master-data/*`, `/profile`, `/settings`, dan `/verification/*`, sementara middleware sebelumnya hanya menganggap `/dashboard` dan `/admin` sebagai protected route.
- Keputusan: middleware memakai daftar eksplisit `PROTECTED_ROUTE_PREFIXES` yang mencerminkan seluruh top-level folder di `src/app/(dashboard)`. Route baru di group dashboard wajib tercakup oleh prefix ini; architecture guard akan gagal jika ada prefix yang luput.
- Batasan: middleware hanya defense-in-depth untuk autentikasi umum. Guard role/RBAC dan ownership tetap wajib di page/server action/service melalui `requireAuth()` dan business rule server-side.
- UX: request unauthenticated ke protected route diarahkan ke `/login?next=<target>` agar target tujuan tersimpan.
- Referensi: #214.

## [2026-07-27] Backup & Disaster Recovery untuk Database dan Storage
- Konteks: SIMDP menyimpan metadata pegawai, audit log, dan file dokumen legal/asli. Kehilangan database atau storage dapat membuat dokumen tidak dapat diverifikasi atau dibuka kembali.
- Keputusan: production readiness wajib memiliki Backup & Disaster Recovery plan yang mencakup database PostgreSQL dan document storage sebagai satu paket recovery. Admin export/import dianggap fitur operasional, bukan pengganti backup disaster recovery.
- Target awal: RPO 24 jam, RTO 4 jam, retention backup harian 14 hari, mingguan 8 minggu, dan bulanan 12 bulan. Target dapat diperketat setelah deployment production final ditetapkan.
- Batasan: PR awal hanya mendokumentasikan SOP, checklist, dan runbook. Implementasi backup otomatis, monitoring, dan restore drill dibuat sebagai follow-up ops setelah target deployment final jelas.
- Referensi: #237.

## [2026-07-27] Backup Target Dipisah dari Document Storage Provider
- Konteks: Deployment SIMDP bisa memakai Vercel + Supabase, VPS + PostgreSQL lokal, atau hybrid. Storage dokumen aplikasi dan lokasi backup/offsite punya concern berbeda, credential berbeda, dan lifecycle restore berbeda.
- Keputusan: `STORAGE_PROVIDER` tetap khusus untuk kontrak dokumen aplikasi `IStorageProvider`, sedangkan artifact backup memakai `BACKUP_TARGET` lewat kontrak `IBackupTarget`. Env backup tervalidasi fail-fast di `src/lib/env.ts`, dengan guard context seperti larangan filesystem runtime untuk `DEPLOYMENT_CONTEXT=vercel-supabase`.
- Target awal: `BACKUP_TARGET=local|folder|gdrive|s3`, dengan local/folder dan Google Drive service-account target tersedia di `src/lib/backup/index.ts`. S3 target tervalidasi env-nya tetapi adapter upload belum aktif sampai dependency/SigV4 resmi dipilih.
- Alasan: menjaga boundary storage dokumen tetap bersih, mencegah backup tersimpan di lokasi yang sama dengan storage utama, dan membuat recovery operator-driven tetap jelas.
- Referensi: #237.

## [2026-07-23] Malware Scanning Upload File
- Konteks: magic-byte check memastikan tipe file, tetapi tidak mendeteksi PDF/dokumen/gambar yang disisipi malware, exploit payload, atau konten berbahaya lain.
- Keputusan: semua upload/ganti file dokumen wajib melewati abstraction malware scanner setelah magic-byte check dan sebelum hash/storage/database reservation. Provider default aman adalah ClamAV melalui `clamd` (`MALWARE_SCANNER_PROVIDER=clamav`).
- Kebijakan: fail closed. Jika scanner mendeteksi malware, timeout, error, atau unavailable, file tidak boleh disimpan sebagai dokumen aktif. Event `DOCUMENT_MALWARE_DETECTED` atau `DOCUMENT_MALWARE_SCAN_FAILED` dicatat ke SecurityLog tanpa menyimpan isi file atau secret.
- Alasan: menjaga server-side validation sebagai sumber kebenaran dan mencegah file valid secara tipe tetapi berbahaya masuk ke storage dokumen pegawai.
- Referensi: #212.

## [2026-07-23] Google OAuth Rate-Limit UX
- Konteks: callback Google OAuth adalah navigasi browser, sehingga response JSON 429 tampil mentah kepada user ketika limit auth publik tercapai.
- Keputusan: limit `AUTH_PUBLIC` menjadi 15 request per 15 menit. Endpoint Google OAuth start/callback tetap rate-limited, tetapi mengarahkan browser ke `/login?oauth_error=rate_limited` agar UI menampilkan pesan yang dapat dipahami. Endpoint API lain tetap menggunakan response JSON.
- Alasan: satu percobaan OAuth menghasilkan request start dan callback, sementara rate limiting tetap diperlukan untuk mencegah abuse.
- Referensi: #209.

## [2026-07-27] RateLimitBucket sebagai Strategi Shared Rate Limiting
- Konteks: deployment multi-instance tidak boleh mengandalkan counter in-memory per proses, dan login gagal tidak boleh menulis `SecurityLog` berulang pada hot path yang sama.
- Keputusan: rate limiting API dan login memakai tabel PostgreSQL `RateLimitBucket` sebagai shared store awal. Upsert raw SQL menjaga increment per bucket atomik antar instance. `SecurityLog` hanya dicatat untuk rate limit ketika `limitedLoggedAt` berhasil diklaim atau untuk gagal login pertama dalam window bucket.
- Alasan: tidak menambah dependency baru, cukup untuk production awal/internal RSUD, dan tetap global antar instance selama semua instance memakai database yang sama.
- Batasan: PostgreSQL tetap menjadi hot path limiter. Jika traffic naik atau deployment scale-out agresif, migrasi store ke Redis/Upstash atau edge/provider limiter tanpa mengubah kontrak `enforceApiRateLimit()`.
- Referensi: #222, #223.

## [2026-07-23] Automatic Access-Token Refresh
- Konteks: access token 15 menit sebelumnya membuat user aktif dipaksa login ulang karena endpoint refresh belum dipanggil otomatis dari dashboard.
- Keputusan: access token berlaku 30 menit. Client dashboard menjalankan refresh session setiap 20 menit dan saat tab kembali aktif setelah 15 menit, sedangkan refresh token tetap httpOnly dan dirotasi server-side. Guard promise mencegah duplicate refresh request dalam satu browser context, dan rotasi database memakai conditional update agar token hanya dapat dipakai sekali secara atomik.
- Alasan: memberi margin sebelum access token expired, mempertahankan secret/token agar tidak masuk JavaScript storage, dan mencegah dua request refresh memakai token lama secara bersamaan.
- Batasan: refresh token saat ini tetap memiliki masa berlaku 7 hari sejak setiap rotasi sesuai perilaku session service yang sudah ada. Kegagalan jaringan sementara dicoba ulang pada interval berikutnya; hanya response 401 yang mengakhiri sesi.
- Referensi: #207.

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
