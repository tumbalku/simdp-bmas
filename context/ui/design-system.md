# UI Design System — SIMDP

**Status:** Draft awal
**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §17
**Terakhir diperbarui:** 2026-07-08

## 1. Arah Utama

Design system SIMDP memakai pendekatan **shadcn/ui-first**.

Artinya:
- tampilan utama harus mengikuti estetika `https://ui.shadcn.com`;
- UI harus clean, minimal, rapi, banyak whitespace, border halus, radius konsisten, dan typography tajam;
- brand rumah sakit dipakai sebagai aksen, bukan membuat style sendiri yang jauh dari shadcn/ui;
- semua komponen umum wajib memakai **shadcn/ui** atau wrapper internal yang dibangun di atas shadcn/ui.

## 2. Aturan Wajib Komponen

Gunakan shadcn/ui untuk primitive umum:

- `Button`
- `Input`
- `Textarea`
- `Label`
- `Form`
- `Select`
- `Checkbox`
- `RadioGroup`
- `Switch`
- `Card`
- `Badge`
- `Table`
- `Dialog`
- `AlertDialog`
- `DropdownMenu`
- `Sheet`
- `Tabs`
- `Command`
- `Skeleton`
- `Alert`
- `Toast` / `Sonner`
- `Pagination`

Jangan membuat custom component dari nol jika equivalent shadcn/ui tersedia.

Custom component diperbolehkan hanya sebagai **komposisi domain**, misalnya:

- `StatusBadge`
- `MetricCard`
- `DocumentDataTable`
- `VerificationQueueTable`
- `EmployeeProfileCard`
- `DocumentUploadDropzone`

Komponen domain tetap harus memakai primitive shadcn/ui + Tailwind token.

## 3. Charting

Charting canonical v1 adalah **Tremor Charts** pola Tremor Raw berbasis `recharts`.

Aturan chart:
- Tremor hanya untuk chart/dashboard visualization, bukan untuk menggantikan komponen umum shadcn/ui.
- Chart wajib dibungkus dengan container shadcn/ui seperti `Card`, `CardHeader`, `CardContent`, `Tabs`, `Select`, dan `Skeleton`.
- Komponen chart reusable diletakkan di `src/components/charts/*Chart.tsx`, dengan utility di `src/lib/chartUtils.ts` mengikuti struktur Tremor Raw. Modul `statistics` hanya membuat wrapper domain yang memakai chart reusable tersebut.
- Modul lain tidak boleh bergantung langsung pada detail konfigurasi Tremor.
- Warna chart harus memakai token SIMDP/shadcn, bukan warna default acak.

Chart minimal untuk dashboard:
- line chart: tren upload dokumen per bulan;
- bar chart: breakdown kategori/status;
- donut/pie chart: distribusi status dokumen;
- area/line chart: tren compliance jika data tersedia.

## 4. Palet Warna

| Peran | Warna | Hex |
|---|---|---|
| Primary / aksi utama | Teal medis sebagai brand accent | `#0F766E` |
| Primary light / hover bg | Teal muda | `#CCFBF1` |
| Secondary / accent | Biru langit | `#0EA5E9` |
| Success / Approved | Hijau | `#16A34A` |
| Warning / Pending / Expiring | Amber | `#D97706` |
| Danger / Rejected / Expired | Merah | `#DC2626` |
| Neutral / Replaced | Abu gelap | `#64748B` |
| Background | Slate sangat terang | `#F8FAFC` |
| Text utama | Slate gelap | `#0F172A` |
| Border / divider | Slate muda | `#E2E8F0` |

Implementasi warna harus melalui **Tailwind theme + CSS variables** agar kompatibel dengan pola shadcn/ui dan siap light/dark mode.

## 5. Tipografi

- Font utama: **Inter** atau **Plus Jakarta Sans**.
- Heading: semi-bold / bold.
- Body text: regular.
- Hierarki ukuran: `12 / 14 / 16 / 20 / 24 / 32px`.
- Hindari terlalu banyak variasi font size di satu halaman.

## 6. Komponen Kunci SIMDP

### StatusBadge

Status dokumen:

| Status | Warna |
|---|---|
| `PENDING` | Amber |
| `APPROVED` | Hijau |
| `REJECTED` | Merah |
| `EXPIRED` | Abu gelap / merah jika butuh perhatian |
| `REPLACED` | Abu muda |

Gunakan bentuk `pill` / `rounded-full`.

### MetricCard

Untuk dashboard statistik:
- basis shadcn/ui `Card`;
- angka besar sebagai fokus;
- label singkat;
- optional trend indicator `▲` / `▼`;
- icon line-style, preferably medical/office-related.

### Sidebar

- Sidebar persisten di kiri untuk dashboard desktop.
- Menu berbeda berdasarkan role.
- Item aktif harus jelas secara visual.
- Gunakan icon + label.

### Empty State

Empty state harus ramah:
- ada judul yang jelas;
- deskripsi membantu user;
- CTA jika ada aksi berikutnya;
- jangan hanya menampilkan `No data`.

## 7. Aksesibilitas & Responsivitas

- Kontras minimal WCAG AA.
- Semua form field harus punya label jelas.
- State loading, error, dan empty wajib terlihat.
- Halaman Employee mobile-first.
- Halaman Admin/Staff desktop-first karena banyak tabel dan dashboard.

## 8. Larangan

- Jangan memakai library UI lain untuk komponen umum tanpa keputusan baru.
- Jangan membuat style custom yang bertabrakan dengan shadcn/ui.
- Jangan memakai Tremor sebagai pengganti form/table/dialog/button.
- Jangan hardcode warna chart jika token sudah tersedia.
