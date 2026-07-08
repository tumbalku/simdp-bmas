# ADR-007: Login Identifier Fleksibel

**Status:** Accepted
**Tanggal:** 2026-07-08

## Konteks

Pegawai RSUD mungkin lebih mudah mengingat NIP atau NIK daripada email. Tidak semua pegawai memiliki NIP; jika NIP tidak ada, NIK menjadi identifier utama. Login dengan pilihan terpisah akan menambah friction untuk user non-IT.

## Keputusan

Form login memakai satu field `identifier` yang menerima:

- NIP (`Employee.employeeId`);
- NIK (`Employee.nik`);
- email (`User.email`).

Server mendeteksi tipe identifier otomatis.

## Konsekuensi

Positif:
- UX lebih sederhana.
- Pegawai bisa login dengan identifier yang paling mereka ingat.
- Satu form login cukup untuk semua role.

Negatif:
- Server harus hati-hati membedakan NIP vs NIK.
- Error message harus generik agar tidak membocorkan akun mana yang terdaftar.

## Alternatif yang Ditolak

- **Login email-only:** tidak ramah untuk pegawai yang lebih mengenal NIP/NIK.
- **Dropdown tipe identifier:** lebih eksplisit, tetapi menambah langkah UI.
