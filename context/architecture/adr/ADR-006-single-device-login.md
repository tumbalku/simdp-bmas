# ADR-006: Single-device Login

**Status:** Accepted
**Tanggal:** 2026-07-08

## Konteks

SIMDP mengelola dokumen pegawai yang sensitif. Untuk mengurangi risiko akun dipakai bersamaan dari banyak perangkat, PRD menetapkan satu user hanya boleh punya satu sesi aktif.

## Keputusan

Saat login berhasil, server wajib merevoke semua `RefreshToken` aktif milik user tersebut sebelum membuat token baru.

Event ini dicatat sebagai `AUTH_FORCE_LOGOUT_OTHERS` jika ada token lama yang direvoke.

## Konsekuensi

Positif:
- Mengurangi risiko akun dipakai bersama.
- Session management lebih mudah dipahami.
- Jika user login di perangkat baru, perangkat lama otomatis keluar.

Negatif:
- User tidak bisa aktif di laptop dan HP sekaligus.
- Perlu UX yang jelas saat sesi expired karena login di perangkat lain.

## Alternatif yang Ditolak

- **Multi-device sessions:** lebih fleksibel, tetapi lebih kompleks dan kurang ketat untuk sistem dokumen sensitif.
- **Session management manual banyak perangkat:** ditunda sampai ada kebutuhan nyata.
