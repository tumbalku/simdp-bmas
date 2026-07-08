# Security Auth Flow — SIMDP

**Status:** Draft awal
**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §9.1, §10.1, §10.2
**Terakhir diperbarui:** 2026-07-08

## 1. Prinsip Auth

- SIMDP memakai **custom JWT** + refresh token, bukan NextAuth/Supabase Auth.
- Token disimpan di **httpOnly cookie**, bukan localStorage.
- Refresh token yang disimpan di database adalah **hash**, bukan plaintext.
- Satu user hanya boleh punya **satu sesi aktif**.
- Semua event auth penting wajib masuk `SecurityLog`.

## 2. Login Identifier Fleksibel

Endpoint:

```txt
POST /api/v1/auth/login
```

Request menerima satu field:

```json
{
  "identifier": "NIP atau NIK atau email",
  "password": "password"
}
```

Deteksi identifier di server:

1. Jika numerik murni dan panjang 16 digit → anggap NIK, cari via `Employee.nik`.
2. Jika numerik murni dan panjang minimal 10 digit → anggap NIP, cari via `Employee.employeeId`.
3. Selain itu → anggap email, cari via `User.email`.

> Catatan implementasi: NIK 16 digit juga memenuhi syarat numerik ≥ 10 digit. Karena itu server wajib mengecek NIK 16 digit lebih dulu sebelum fallback ke pola NIP.

## 3. Login Flow

```txt
Client
  -> POST /api/v1/auth/login { identifier, password }
Server
  -> validasi body dengan Zod
  -> deteksi tipe identifier
  -> cari User + Employee sesuai identifier
  -> pastikan User aktif dan belum soft-deleted
  -> verifikasi password dengan Argon2id
  -> jika gagal: rate limit dan log AUTH_LOGIN_FAILED
  -> jika berhasil:
       1. revoke semua RefreshToken aktif milik user
       2. log AUTH_FORCE_LOGOUT_OTHERS jika ada token lama
       3. buat access token JWT 15 menit
       4. buat refresh token random 256-bit
       5. simpan hash refresh token SHA-256 ke DB
       6. set access_token dan refresh_token ke httpOnly cookie
       7. update lastLoginAt
       8. log AUTH_LOGIN_SUCCESS
  -> return data user minimal
```

## 4. Rate Limiting Login

Batas login gagal:

```txt
maks 5x percobaan gagal / 15 menit / IP
```

Setiap gagal login wajib dicatat ke `SecurityLog` dengan status `FAILED`.

## 5. Access Token

- Jenis: JWT.
- Masa berlaku: 15 menit.
- Storage client: httpOnly cookie.
- Isi token minimal:
  - `userId`
  - `role`
  - `employeeId` jika ada

Access token dipakai middleware untuk inject context request.

## 6. Refresh Token

Endpoint:

```txt
POST /api/v1/auth/refresh
```

Flow:

```txt
Client
  -> POST /api/v1/auth/refresh dengan cookie refresh_token
Server
  -> hash token dari cookie
  -> cari RefreshToken by hash
  -> pastikan belum revoked dan belum expired
  -> revoke token lama
  -> buat token baru
  -> simpan hash token baru
  -> set cookie baru
  -> return access token baru
```

Jika token invalid/expired:

- revoke jika masih ada record;
- hapus cookie;
- paksa logout;
- log event failure.

## 7. Single-device Enforcement

Saat login sukses:

```txt
UPDATE RefreshToken
SET revokedAt = now()
WHERE userId = currentUser.id AND revokedAt IS NULL
```

Lalu buat refresh token baru.

Efek: perangkat/browser lain otomatis logout saat mencoba refresh.

## 8. Forgot Password

Endpoint:

```txt
POST /api/v1/auth/forgot-password
```

Flow:

1. User memasukkan email.
2. Server validasi email.
3. Jika email ada, buat `PasswordResetToken` satu-pakai.
4. Token expired 1 jam.
5. Kirim link reset via email.
6. Response harus generik agar tidak membocorkan apakah email terdaftar.

## 9. Reset Password

Endpoint:

```txt
POST /api/v1/auth/reset-password
```

Flow:

1. Validasi token: `usedAt IS NULL` dan `expiresAt > now()`.
2. Validasi password baru.
3. Update `User.passwordHash`.
4. Isi `PasswordResetToken.usedAt`.
5. Revoke semua `RefreshToken` user.
6. Log reset password success.

## 10. Logout

Endpoint:

```txt
POST /api/v1/auth/logout
```

Flow:

1. Ambil refresh token dari cookie.
2. Hash dan revoke token jika ditemukan.
3. Hapus cookie access dan refresh.
4. Log `AUTH_LOGOUT`.

## 11. Cookie Security

Cookie auth wajib:

- `httpOnly: true`
- `secure: true` di production
- `sameSite: lax` atau lebih ketat jika memungkinkan
- path sesuai kebutuhan aplikasi
- expiry sesuai umur token

## 12. Event Auth yang Perlu Diaudit

Minimal event:

- `AUTH_LOGIN_SUCCESS`
- `AUTH_LOGIN_FAILED`
- `AUTH_FORCE_LOGOUT_OTHERS`
- `AUTH_REFRESH_SUCCESS`
- `AUTH_REFRESH_FAILED`
- `AUTH_LOGOUT`
- `AUTH_PASSWORD_RESET_REQUESTED`
- `AUTH_PASSWORD_RESET_SUCCESS`
- `AUTH_PASSWORD_CHANGED`
