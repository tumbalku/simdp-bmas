# Auth API Contracts — SIMDP

**Status:** Ready for review
**Backlog:** `SIMDP-API-DOCS-002`
**Terakhir diperbarui:** 2026-07-09

Dokumen ini berisi spesifikasi kontrak API untuk seluruh modul Authentication di SIMDP.

---

## POST /api/v1/auth/login

**Status:** Ready for review
**Module:** `auth`
**Handler Type:** Route Handler
**Frontend Caller:** `src/modules/auth/api.ts` -> `login(data)`
**Minimum Role:** Public
**Ownership Rule:** N/A (Endpoint Publik)

### Purpose
Melakukan otentikasi user menggunakan pengenal fleksibel (email, NIP, atau NIK) dan password. Menetapkan cookie HTTP-only token akses dan refresh.

### Request

#### Params
Tidak ada.

#### Query
Tidak ada.

#### Body (application/json)
```json
{
  "identifier": "198501012010011001",
  "password": "SuperSecurePassword123!"
}
```

### Success Response
```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "usr_99818ab721",
      "email": "pegawai@bahteramas.go.id",
      "role": "EMPLOYEE",
      "employeeId": "emp_01293812"
    }
  },
  "meta": {
    "timestamp": "2026-07-09T03:30:00.000Z"
  }
}
```

### Error Responses

| HTTP Status | Code | Condition |
|---:|---|---|
| 400 | `VALIDATION_ERROR` | Format identifier kosong atau password terlalu pendek |
| 401 | `UNAUTHENTICATED` | Akun tidak aktif, password salah, atau user tidak ditemukan. Gunakan pesan generik "Identifier atau password salah" untuk mencegah user enumeration. |
| 429 | `RATE_LIMITED` | IP telah melakukan percobaan gagal login 5 kali dalam 15 menit. |

### Validation

- Zod schema: `loginSchema`
  - `identifier`: `z.string().min(1, "Identifier wajib diisi")`
  - `password`: `z.string().min(6, "Password minimal 6 karakter")`
- Identifier Detection Logic:
  1. Jika numerik murni dan panjang 16 digit: anggap NIK, cari via `Employee.nik` -> Dapatkan `Employee.userId`.
  2. Jika numerik murni dan panjang minimal 10 digit: anggap NIP, cari via `Employee.employeeId` -> Dapatkan `Employee.userId`.
  3. Selain itu: anggap email, cari via `User.email` -> Dapatkan `User.id`.
  4. Cari record `User` dengan ID yang sesuai dan verifikasi.

### Service Boundary

- Calls: `src/modules/auth/service.ts` -> `login(data)`
- Repository access: internal auth persistence only; employee lookup must use approved auth/employee service boundary and must not import another module repository directly.

### Side Effects

- Database:
  - Mengupdate `lastLoginAt` pada record `User` yang berhasil login.
  - Single-device enforcement: Melakukan revoke terhadap seluruh sesi aktif lainnya untuk user tersebut (`revokedAt = now()` pada `RefreshToken` tabel milik `userId` ini).
  - Menyimpan hash SHA-256 dari `RefreshToken` baru ke database.
- Storage: Tidak ada.
- Notification: Tidak ada.
- Audit:
  - Sukses: Mencatat event `AUTH_LOGIN_SUCCESS` dengan metadata user.
  - Gagal: Mencatat event `AUTH_LOGIN_FAILED` dengan metadata alasan aman (tanpa password).
  - Jika ada sesi lain yang direvoke: Mencatat `AUTH_FORCE_LOGOUT_OTHERS`.

---

## POST /api/v1/auth/refresh

**Status:** Ready for review
**Module:** `auth`
**Handler Type:** Route Handler
**Frontend Caller:** `src/modules/auth/api.ts` -> `refreshSession()`
**Minimum Role:** Authenticated (via cookie `refresh_token`)
**Ownership Rule:** Sesi milik user bersangkutan.

### Purpose
Memperbarui access token JWT yang kadaluwarsa dengan mendeteksi cookie refresh token, melakukan rotasi token (rotates token), dan memberikan access token baru.

### Request

#### Cookies
- `refresh_token`: Plaintext refresh token string (httpOnly).

### Success Response
```json
{
  "ok": true,
  "data": {
    "ok": true
  },
  "meta": {
    "timestamp": "2026-07-09T03:31:00.000Z"
  }
}
```

### Error Responses

| HTTP Status | Code | Condition |
|---:|---|---|
| 401 | `UNAUTHENTICATED` | Cookie `refresh_token` tidak ada atau format salah. |
| 401 | `SESSION_EXPIRED` | Refresh token telah kadaluwarsa, telah direvoke, atau hash-nya tidak cocok di DB. |

### Validation

- Zod schema: Tidak ada payload body, validasi string token dari cookie dengan format non-empty string.

### Service Boundary

- Calls: `src/modules/auth/service.ts` -> `rotateSession(token)`
- Repository access: internal auth persistence only.

### Side Effects

- Database:
  - Menandai token lama sebagai direvoke (`revokedAt = now()`).
  - Menyimpan hash SHA-256 dari token baru yang dirotasi.
- Cookie:
  - Mengupdate cookie `access_token` dan `refresh_token` dengan token baru.
- Audit:
  - Sukses: `AUTH_REFRESH_SUCCESS`.
  - Gagal: `AUTH_REFRESH_FAILED`.

---

## POST /api/v1/auth/logout

**Status:** Ready for review
**Module:** `auth`
**Handler Type:** Route Handler
**Frontend Caller:** `src/modules/auth/api.ts` -> `logout()`
**Minimum Role:** Authenticated
**Ownership Rule:** Sesi milik user bersangkutan.

### Purpose
Mengakhiri sesi aktif user, merevoke refresh token terkait di database, dan menghapus cookie auth.

### Request

#### Cookies
- `refresh_token`: Token sesi.

### Success Response
```json
{
  "ok": true,
  "data": {
    "success": true
  }
}
```

### Error Responses

| HTTP Status | Code | Condition |
|---:|---|---|
| 401 | `UNAUTHENTICATED` | User belum terotentikasi. |

### Service Boundary

- Calls: `src/modules/auth/service.ts` -> `logout(token)`
- Repository access: internal auth persistence only.

### Side Effects

- Database:
  - Menandai `RefreshToken` terkait sebagai direvoke (`revokedAt = now()`).
- Cookie:
  - Menghapus cookie `access_token` dan `refresh_token` (set Max-Age = 0).
- Audit:
  - Mencatat event `AUTH_LOGOUT`.

---

## POST /api/v1/auth/forgot-password

**Status:** Ready for review
**Module:** `auth`
**Handler Type:** Route Handler
**Frontend Caller:** `src/modules/auth/api.ts` -> `forgotPassword(data)`
**Minimum Role:** Public
**Ownership Rule:** N/A

### Purpose
Membuat password reset token satu-kali pakai jika email terdaftar, dan mengirimkan link reset password ke email user.

### Request

#### Body (application/json)
```json
{
  "email": "pegawai@bahteramas.go.id"
}
```

### Success Response
```json
{
  "ok": true,
  "data": {
    "message": "Instruksi reset password telah dikirim ke email Anda jika terdaftar."
  }
}
```
*(Catatan: Kembalikan response sukses generik yang sama baik email terdaftar maupun tidak terdaftar untuk menghindari account enumeration).*

### Error Responses

| HTTP Status | Code | Condition |
|---:|---|---|
| 400 | `VALIDATION_ERROR` | Format email tidak valid |

### Validation

- Zod schema: `forgotPasswordSchema`
  - `email`: `z.string().email("Format email tidak valid")`

### Service Boundary

- Calls: `src/modules/auth/service.ts` -> `requestPasswordReset(email)`
- Repository access: internal auth persistence only.

### Side Effects

- Database:
  - Membuat record baru di `PasswordResetToken` (expires dalam 1 jam, `usedAt = null`).
- Notification:
  - Memicu pengiriman email berisi link token reset password ke email tujuan.
- Audit:
  - Mencatat event `AUTH_PASSWORD_RESET_REQUESTED` (actorId = user ID yang ditemukan, atau null jika email tidak terdaftar).

---

## POST /api/v1/auth/reset-password

**Status:** Ready for review
**Module:** `auth`
**Handler Type:** Route Handler
**Frontend Caller:** `src/modules/auth/api.ts` -> `resetPassword(data)`
**Minimum Role:** Public
**Ownership Rule:** N/A

### Purpose
Mereset password user menggunakan token reset yang valid dan satu-kali pakai.

### Request

#### Body (application/json)
```json
{
  "token": "prt_10283918239abc",
  "password": "NewSuperPassword123!",
  "confirmPassword": "NewSuperPassword123!"
}
```

### Success Response
```json
{
  "ok": true,
  "data": {
    "success": true
  }
}
```

### Error Responses

| HTTP Status | Code | Condition |
|---:|---|---|
| 400 | `VALIDATION_ERROR` | Password tidak cocok atau kurang kuat |
| 400 | `BAD_REQUEST` | Token reset tidak valid, telah kedaluwarsa, atau sudah pernah digunakan |

### Validation

- Zod schema: `resetPasswordSchema`
  - `token`: `z.string().min(1, "Token wajib diisi")`
  - `password`: `z.string().min(8, "Password minimal 8 karakter")`
  - `confirmPassword`: `z.string()`
  - Refinement: `password === confirmPassword`

### Service Boundary

- Calls: `src/modules/auth/service.ts` -> `resetPasswordWithToken(token, newPassword)`
- Repository access: internal auth persistence only.

### Side Effects

- Database:
  - Memperbarui `passwordHash` pada user terkait (di-hash dengan Argon2id).
  - Mengisi `usedAt = now()` pada `PasswordResetToken` terkait.
  - Keamanan: Merevoke seluruh `RefreshToken` aktif milik user tersebut untuk memutus sesi di seluruh device.
- Audit:
  - Mencatat event `AUTH_PASSWORD_RESET_SUCCESS`.

---

## Server Action: `changePasswordAction(data)`

**Status:** Ready for review
**Module:** `auth`
**Handler Type:** Server Action
**Frontend Caller:** Profile settings password change form
**Minimum Role:** Authenticated self
**Ownership Rule:** User hanya dapat mengubah password miliknya sendiri.

### Purpose
Mengubah password user yang sedang login aktif setelah memvalidasi password lama.

### Request

#### Input Data
```json
{
  "oldPassword": "CurrentPassword123!",
  "newPassword": "BrandNewPassword123!",
  "confirmNewPassword": "BrandNewPassword123!"
}
```

### Success Response
```json
{
  "ok": true,
  "data": {
    "success": true
  }
}
```

### Error Responses
- `UNAUTHENTICATED`: User belum login.
- `VALIDATION_ERROR`: Validasi Zod gagal (misalnya password baru terlalu pendek).
- `BUSINESS_RULE_VIOLATION`: Password lama salah.

### Validation

- Zod schema: `changePasswordSchema`
  - `oldPassword`: `z.string().min(1, "Password lama wajib diisi")`
  - `newPassword`: `z.string().min(8, "Password baru minimal 8 karakter")`
  - `confirmNewPassword`: `z.string()`
  - Refinement: `newPassword === confirmNewPassword`

### Service Boundary

- Calls: `src/modules/auth/service.ts` -> `changePassword(userId, oldPassword, newPassword)`
- Repository access: internal auth persistence only.

### Side Effects

- Database:
  - Mengupdate `passwordHash` di record `User` dengan Argon2id hash baru.
- Audit:
  - Mencatat event `AUTH_PASSWORD_CHANGED`.

---

## Server Action: `revokeSessionAction(tokenId)`

**Status:** Ready for review
**Module:** `auth`
**Handler Type:** Server Action
**Frontend Caller:** Sesi list UI (Tombol "Log out device")
**Minimum Role:** Authenticated self
**Ownership Rule:** Hanya boleh merevoke token milik user sendiri.

### Purpose
Merevoke sesi/refresh token tertentu milik user yang sedang aktif.

### Request

#### Input Data
- `tokenId`: string (ID record `RefreshToken`)

### Success Response
```json
{
  "ok": true,
  "data": {
    "success": true
  }
}
```

### Error Responses
- `UNAUTHENTICATED`: User belum login.
- `NOT_FOUND`: Token tidak ditemukan atau bukan milik user ini.

### Service Boundary

- Calls: `src/modules/auth/service.ts` -> `revokeSession(userId, tokenId)`
- Repository access: internal auth persistence only.

### Side Effects

- Database:
  - Mengupdate `revokedAt = now()` pada record `RefreshToken` yang dituju.
- Audit:
  - Mencatat event `AUTH_REFRESH_FAILED` / revoke log untuk session.

---

## Server Action: `revokeAllSessionsAction()`

**Status:** Ready for review
**Module:** `auth`
**Handler Type:** Server Action
**Frontend Caller:** Sesi list UI (Tombol "Log out all other devices")
**Minimum Role:** Authenticated self
**Ownership Rule:** User hanya dapat menghapus sesi miliknya sendiri.

### Purpose
Merevoke seluruh sesi / refresh token aktif milik user saat ini (kecuali refresh token yang sedang digunakan jika diinginkan, namun secara default single-device enforce akan menghapus semua).

### Request
Tidak ada parameter.

### Success Response
```json
{
  "ok": true,
  "data": {
    "success": true
  }
}
```

### Error Responses
- `UNAUTHENTICATED`: User belum login.

### Service Boundary

- Calls: `src/modules/auth/service.ts` -> `revokeAllSessions(userId)`
- Repository access: internal auth persistence only.

### Side Effects

- Database:
  - Mengupdate `revokedAt = now()` untuk semua record `RefreshToken` aktif milik `userId`.
- Audit:
  - Mencatat event `AUTH_FORCE_LOGOUT_OTHERS`.

---

## Cookie Behavior & Security Configuration

Seluruh JWT access token dan refresh token disimpan dalam cookie dengan atribut keamanan berikut:

- **Access Token Cookie (`access_token`)**:
  - `httpOnly: true`
  - `secure: true` di production, ditentukan melalui helper env/config server-side.
  - `sameSite: "lax"`
  - `path: "/"`
  - `maxAge: 900` (15 menit)
- **Refresh Token Cookie (`refresh_token`)**:
  - `httpOnly: true`
  - `secure: true` di production, ditentukan melalui helper env/config server-side.
  - `sameSite: "lax"`
  - `path: "/api/v1/auth"` (hanya dikirim ke endpoint refresh dan logout)
  - `maxAge: 7 * 24 * 60 * 60` (7 hari)

## Frontend Notes & Invalidation Flow

- **Credentials Setup**: Seluruh request Axios/fetch dari frontend ke API endpoint wajib menyertakan `{ credentials: "same-origin" }` agar browser menyertakan cookie auth.
- **Session State**:
  - Disimpan di React Context / global state (misal `useAuthStore`).
  - Ketika menerima response error dengan code `UNAUTHENTICATED` atau `SESSION_EXPIRED`, frontend harus:
    1. Menghapus data user dari state.
    2. Mengarahkan user kembali ke halaman `/login`.
- **Query Cache Invalidation**:
  - Saat logout atau password reset sukses, lakukan clear query cache (TanStack Query: `queryClient.clear()`).
