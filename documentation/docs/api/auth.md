---
title: Auth API
---

# Auth API

## Login

```txt
POST /api/v1/auth/login
```

Body:

```json
{
  "identifier": "email atau NIP atau NIK",
  "password": "password"
}
```

Hasil:

- set access token cookie;
- set refresh token cookie;
- revoke sesi lama user tersebut;
- audit login success/failure.

## Refresh

```txt
POST /api/v1/auth/refresh
```

Flow:

- baca refresh cookie;
- hash token;
- validasi record;
- revoke token lama;
- buat token baru;
- set cookie baru.

## Logout

```txt
POST /api/v1/auth/logout
```

Flow:

- revoke refresh token jika ada;
- hapus cookie;
- audit logout.

## Forgot password

```txt
POST /api/v1/auth/forgot-password
```

Response selalu generik agar tidak membocorkan apakah email terdaftar.

## Reset password

```txt
POST /api/v1/auth/reset-password
```

Token reset disimpan sebagai hash di database dan hanya berlaku satu kali.
