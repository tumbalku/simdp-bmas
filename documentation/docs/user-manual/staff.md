---
title: Staff
---

# Panduan Staff

Staff adalah petugas yang membantu memverifikasi dokumen dan membaca data pegawai.

## Tanggung jawab Staff

- Melihat dokumen pegawai.
- Memeriksa dokumen yang masuk queue verifikasi.
- Approve atau reject dokumen.
- Menulis catatan penolakan yang jelas.
- Memantau status dokumen dan reminder.

## Verifikasi dokumen

Alur umum:

1. Buka halaman Verifikasi.
2. Pilih dokumen dengan status `PENDING`.
3. Buka preview/download dokumen.
4. Cocokkan metadata dokumen.
5. Approve jika valid.
6. Reject jika tidak valid dan isi catatan minimal yang membantu pegawai memperbaiki.

## Catatan reject yang baik

Catatan sebaiknya menjawab:

- apa yang salah;
- bagian mana yang perlu diperbaiki;
- apakah perlu upload ulang;
- dokumen apa yang benar.

Contoh:

```txt
Tanggal terbit pada metadata tidak sama dengan tanggal pada file. Mohon upload ulang dengan metadata yang sesuai.
```

## Batasan Staff

Staff tidak boleh:

- mengubah role user;
- mengubah master data;
- menghapus permanen pegawai/dokumen;
- melihat Security Log jika tidak diberi role Admin.
