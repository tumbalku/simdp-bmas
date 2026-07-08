# ADR-004: Custom JWT + Refresh Token

**Status:** Accepted
**Tanggal:** 2026-07-08

## Konteks

SIMDP memiliki tabel `User`, `RefreshToken`, dan `PasswordResetToken` yang dirancang custom. Sistem membutuhkan kontrol penuh atas sesi, single-device login, reset password, dan audit auth event.

## Keputusan

Gunakan **custom JWT access token** dan **refresh token**.

- Access token: JWT, 15 menit, httpOnly cookie.
- Refresh token: random 256-bit, simpan hash di database, httpOnly cookie.
- Refresh token dirotasi setiap refresh.

## Konsekuensi

Positif:
- Kontrol penuh atas session lifecycle.
- Mudah menerapkan single-device login.
- Cocok dengan audit trail custom.
- Tidak tergantung pada model auth eksternal.

Negatif:
- Implementasi auth harus sangat hati-hati.
- Perlu handling cookie, rotation, revoke, expiry, dan rate limit sendiri.

## Alternatif yang Ditolak

- **NextAuth:** cepat, tetapi tidak sejalan dengan schema custom dan single-device requirement.
- **Supabase Auth:** kuat, tetapi PRD memilih `User`/token custom dan menghindari coupling auth ke provider.
