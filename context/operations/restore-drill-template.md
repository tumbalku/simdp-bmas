# Restore Drill Result Template — SIMDP

**Issue:** #237  
**Tujuan:** mencatat hasil latihan restore Backup & Disaster Recovery.  
**Gunakan untuk:** local/VPS, Supabase, atau environment restore sementara.

> Jangan isi dokumen ini dengan secret, password, connection string, service role key, isi file dokumen, atau data pribadi lengkap. Jika perlu mencatat identifier, gunakan sampel terbatas dan sensor data sensitif.

## 1. Ringkasan drill

| Field | Isi |
|---|---|
| Tanggal drill | `YYYY-MM-DD` |
| Jam mulai | `HH:mm TZ` |
| Jam selesai | `HH:mm TZ` |
| Operator | `Nama/tim` |
| Reviewer/approver | `Nama/tim` |
| Environment asal backup | `local / staging / production` |
| Environment restore | `local / staging-restore / temporary VPS / Supabase restore project` |
| Deployment target | `VPS / Supabase / S3-compatible / lainnya` |
| Status akhir | `PASS / PASS WITH NOTES / FAIL` |

## 2. Target RPO/RTO

| Target | Nilai rencana | Hasil aktual | Status |
|---|---:|---:|---|
| RPO — maksimal data boleh hilang | 24 jam | `...` | `PASS/FAIL` |
| RTO — maksimal waktu pemulihan | 4 jam | `...` | `PASS/FAIL` |

Catatan:

- **RPO**: seberapa jauh data mundur dari waktu kejadian. Contoh: backup terakhir 02:00, incident 10:00, maka potensi data hilang 8 jam.
- **RTO**: total waktu dari mulai proses restore sampai sistem restore bisa dipakai.

## 3. Backup yang digunakan

### 3.1 Database

| Field | Isi |
|---|---|
| Manifest path | `...` |
| Artifact path | `...` |
| Timestamp backup UTC | `YYYYMMDD_HHmmSS` |
| Jenis backup | `daily / weekly / monthly / manual` |
| Ukuran artifact | `... MB/GB` |
| SHA-256 cocok dengan manifest | `Ya/Tidak` |
| Encrypted | `Ya/Tidak` |
| Decryption berhasil | `Ya/Tidak/N/A` |

### 3.2 Storage dokumen

| Field | Isi |
|---|---|
| Manifest path | `...` |
| Artifact path / bucket source | `...` |
| Timestamp backup UTC | `YYYYMMDD_HHmmSS` |
| Jenis backup | `daily / weekly / monthly / manual` |
| Ukuran artifact / total object | `... MB/GB / ... object` |
| SHA-256 cocok dengan manifest | `Ya/Tidak/N/A` |
| Encrypted | `Ya/Tidak` |
| Decryption berhasil | `Ya/Tidak/N/A` |

## 4. Persiapan restore

- [ ] Environment restore sementara sudah dibuat.
- [ ] Environment restore tidak memakai database production aktif.
- [ ] Environment restore tidak mengekspos storage/file secara publik.
- [ ] Secret production tidak dicatat di dokumen ini.
- [ ] Operator tahu artifact backup mana yang dipakai.
- [ ] Database backup dan storage backup berasal dari timestamp yang cocok.
- [ ] Ada ruang disk cukup untuk restore DB + storage.
- [ ] Akses restore hanya diberikan ke operator/reviewer.

Catatan persiapan:

```txt
...
```

## 5. Langkah restore database

| No | Langkah | Hasil | Catatan |
|---:|---|---|---|
| 1 | Verifikasi checksum database artifact | `PASS/FAIL` | `...` |
| 2 | Decrypt database artifact jika `.enc` | `PASS/FAIL/N/A` | `...` |
| 3 | Buat database restore sementara | `PASS/FAIL` | `...` |
| 4 | Restore dump PostgreSQL | `PASS/FAIL` | `...` |
| 5 | Cek tabel utama tersedia | `PASS/FAIL` | `...` |
| 6 | Cek jumlah pegawai masuk akal | `PASS/FAIL` | `...` |
| 7 | Cek jumlah document record masuk akal | `PASS/FAIL` | `...` |
| 8 | Cek audit/security log tersedia | `PASS/FAIL` | `...` |

Durasi restore database:

```txt
...
```

## 6. Langkah restore storage

| No | Langkah | Hasil | Catatan |
|---:|---|---|---|
| 1 | Verifikasi checksum storage artifact/manifest | `PASS/FAIL/N/A` | `...` |
| 2 | Decrypt storage artifact jika `.enc` | `PASS/FAIL/N/A` | `...` |
| 3 | Extract/sync storage ke lokasi restore | `PASS/FAIL` | `...` |
| 4 | Struktur path storage sesuai `DocumentRecord.filePath` | `PASS/FAIL` | `...` |
| 5 | Cek folder/bucket tidak publik | `PASS/FAIL` | `...` |
| 6 | Cek sample file ada secara fisik | `PASS/FAIL` | `...` |

Durasi restore storage:

```txt
...
```

## 7. Validasi aplikasi setelah restore

| Area | Test | Hasil | Catatan |
|---|---|---|---|
| Auth | Login admin/operator test berhasil | `PASS/FAIL` | `...` |
| Employee | Minimal 5 pegawai acak bisa dibuka | `PASS/FAIL` | `...` |
| Document | Minimal 5 dokumen acak bisa preview/download | `PASS/FAIL` | `...` |
| Document | Status dokumen sesuai metadata DB | `PASS/FAIL` | `...` |
| Avatar | Foto profil upload manual tetap muncul jika ada | `PASS/FAIL/N/A` | `...` |
| Audit | Security log bisa dibuka | `PASS/FAIL` | `...` |
| Export | Export CSV/PDF penting berjalan jika relevan | `PASS/FAIL/N/A` | `...` |
| Settings | System settings terbaca | `PASS/FAIL` | `...` |

Sample yang dicek:

| Sample | Jenis data | Identifier tersensor | Hasil | Catatan |
|---|---|---|---|---|
| 1 | Pegawai | `EMP-***` | `PASS/FAIL` | `...` |
| 2 | Dokumen PDF | `DOC-***` | `PASS/FAIL` | `...` |
| 3 | Foto profil | `EMP-***` | `PASS/FAIL/N/A` | `...` |
| 4 | Audit log | `LOG-***` | `PASS/FAIL` | `...` |
| 5 | Export | `N/A` | `PASS/FAIL/N/A` | `...` |

## 8. Hasil pengukuran

| Metrik | Hasil |
|---|---:|
| Durasi persiapan | `... menit` |
| Durasi restore DB | `... menit` |
| Durasi restore storage | `... menit` |
| Durasi validasi aplikasi | `... menit` |
| Total durasi restore drill | `... menit` |
| Perkiraan data gap dari backup terakhir | `... jam/menit` |
| Total ukuran backup DB | `... MB/GB` |
| Total ukuran backup storage | `... MB/GB` |

## 9. Masalah yang ditemukan

| Severity | Masalah | Dampak | Owner | Follow-up issue |
|---|---|---|---|---|
| `HIGH/MEDIUM/LOW` | `...` | `...` | `...` | `#...` |

Catatan detail:

```txt
...
```

## 10. Keputusan akhir

Pilih salah satu:

- [ ] **PASS** — restore berhasil, RPO/RTO terpenuhi, tidak ada blocker.
- [ ] **PASS WITH NOTES** — restore berhasil, ada catatan non-blocking.
- [ ] **FAIL** — restore tidak memenuhi target atau ada blocker.

Ringkasan keputusan:

```txt
...
```

## 11. Tindak lanjut wajib

- [ ] Update `context/operations/backup-disaster-recovery.md` jika runbook berbeda dari kenyataan.
- [ ] Buat/follow-up issue untuk masalah yang ditemukan.
- [ ] Pastikan backup berikutnya tetap berjalan otomatis.
- [ ] Pastikan alert backup gagal sudah diterima operator.
- [ ] Simpan hasil drill di lokasi dokumentasi internal yang aman.

## 12. Sign-off

| Peran | Nama | Tanggal | Catatan |
|---|---|---|---|
| Operator | `...` | `YYYY-MM-DD` | `...` |
| Reviewer | `...` | `YYYY-MM-DD` | `...` |
| Product owner/maintainer | `...` | `YYYY-MM-DD` | `...` |
