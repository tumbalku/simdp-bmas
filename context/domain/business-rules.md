# Domain Business Rules — SIMDP

**Status:** Draft awal
**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §3.3
**Terakhir diperbarui:** 2026-07-08

Aturan di file ini adalah aturan domain yang tidak boleh dilanggar oleh implementasi.

## BR-001 — Satu Current Document untuk Non-Multiple DocumentType

Satu `Employee` hanya boleh punya satu dokumen `isCurrent = true` per `DocumentType` jika `DocumentType.allowMultiple = false`.

Penegak utama:
- partial unique index `uniq_current_document_per_type`;
- trigger DB `handle_document_replacement()`.

## BR-002 — Dokumen Lama Otomatis Jadi REPLACED

Saat dokumen baru diunggah untuk `DocumentType.allowMultiple = false`, dokumen current lama otomatis:

- `status = REPLACED`
- `isCurrent = false`

Aturan ini ditangani oleh trigger database, bukan logic aplikasi manual.

## BR-003 — DocumentType Multiple Boleh Banyak Current

Dokumen dengan `allowMultiple = true` boleh memiliki banyak `DocumentRecord.isCurrent = true` sekaligus.

Contoh: sertifikat diklat/pelatihan.

## BR-004 — Perubahan Status Dokumen Wajib Punya VerificationHistory

Setiap approve/reject wajib:

1. Update `DocumentRecord.status`.
2. Tambah baris ke `VerificationHistory`.
3. Kirim notifikasi ke Employee pemilik dokumen.
4. Catat `SecurityLog`.

Tidak boleh ada perubahan status approve/reject tanpa history.

## BR-005 — Target DocumentType Mengikuti OR per Kategori dan AND antar Kategori

Target `DocumentType` bisa berdasarkan:

- ProfessionGroup
- EmploymentStatus
- EmployeeGroup
- EmployeeRank
- Workplace

Aturan matching:

- Dalam kategori yang sama memakai OR.
- Antar kategori memakai AND.
- Jika kategori target tidak punya baris relasi, kategori tersebut berlaku untuk semua pegawai.

Contoh:

`ProfessionGroup = Medis OR Keperawatan` dan `Workplace = IGD` berarti:

```txt
(Medis OR Keperawatan) AND IGD
```

## BR-006 — Reminder Expiry Dipisah per Tahap

Dokumen yang mendekati `expiryDate` memicu reminder H-30, H-7, dan H-1.

Setiap tahap punya field sendiri:

- `reminderH30SentAt`
- `reminderH7SentAt`
- `reminderH1SentAt`

Tujuan: setiap reminder hanya dikirim satu kali per tahap.

## BR-007 — Employee Hanya Boleh Akses Data Milik Sendiri

Employee hanya boleh melihat/mengelola dokumen miliknya sendiri.

Query wajib filter ownership:

```txt
DocumentRecord.ownerId = currentEmployee.id
```

Client UI boleh menyembunyikan tombol, tetapi pengaman utama harus di server.

## BR-008 — SecurityLog Append-only

`SecurityLog` adalah audit trail append-only.

Aplikasi tidak boleh menyediakan operasi:

- update `SecurityLog`;
- delete `SecurityLog`;
- soft delete `SecurityLog`.

## BR-009 — Soft-deleted Records Disembunyikan dari Query Normal

Semua tabel yang punya `deletedAt` wajib difilter di query normal:

```txt
deletedAt IS NULL
```

Restore hanya boleh oleh Admin sesuai aturan retention.

## BR-010 — Upload Dokumen v1 Server-mediated

Upload dokumen v1 wajib lewat server:

```txt
POST /api/v1/documents/upload
```

Server wajib melakukan:

- auth check;
- role/ownership check;
- Zod validation;
- validasi aturan `DocumentType`;
- validasi ukuran;
- verifikasi MIME dari isi file;
- hitung SHA-256;
- generate `filePath` standar;
- simpan file via `IStorageProvider.upload()`;
- simpan metadata ke `DocumentRecord`;
- kirim notifikasi pending;
- audit `DOCUMENT_UPLOADED`.

## BR-011 — EXPIRED Adalah Status Terkini

Jika `expiryDate` sudah lewat, dokumen menjadi `EXPIRED`.

Jika sebelumnya `APPROVED`, riwayat approval tetap tersimpan di `VerificationHistory`.

## BR-012 — Statistics Module Read-only

Modul `statistics` hanya boleh melakukan query/agregasi read-only.

Tidak boleh:

- menulis data;
- update tabel agregat;
- mengubah status dokumen;
- membuat side effect.

## BR-013 — Soft Delete v1 Tidak Hard Delete Otomatis

`soft_delete_retention_days` hanya membatasi kemampuan restore di UI.

Hard delete permanen otomatis berada di luar scope aplikasi v1 kecuali ada keputusan baru.
