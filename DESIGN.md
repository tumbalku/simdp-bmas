---
version: alpha
name: SIMDP shadcn Design System
description: Light-first hospital document-management design system aligned with shadcn/ui semantic tokens.
colors:
  background: '#F8FAFC'
  foreground: '#0F172A'
  card: '#FFFFFF'
  card-foreground: '#0F172A'
  popover: '#FFFFFF'
  popover-foreground: '#0F172A'
  primary: '#0F766E'
  primary-foreground: '#F8FAFC'
  secondary: '#F1F5F9'
  secondary-foreground: '#0F172A'
  muted: '#F1F5F9'
  muted-foreground: '#64748B'
  accent: '#CCFBF1'
  accent-foreground: '#134E4A'
  destructive: '#DC2626'
  destructive-foreground: '#FEF2F2'
  border: '#E2E8F0'
  input: '#E2E8F0'
  ring: '#0F766E'
  success: '#16A34A'
  success-foreground: '#F0FDF4'
  warning: '#D97706'
  warning-foreground: '#FFFBEB'
  info: '#0EA5E9'
  info-foreground: '#F0F9FF'
  neutral: '#64748B'
  neutral-foreground: '#F8FAFC'
  chart-1: '#0F766E'
  chart-2: '#0EA5E9'
  chart-3: '#16A34A'
  chart-4: '#D97706'
  chart-5: '#64748B'
  sidebar: '#FFFFFF'
  sidebar-foreground: '#0F172A'
  sidebar-primary: '#0F766E'
  sidebar-primary-foreground: '#F8FAFC'
  sidebar-accent: '#F1F5F9'
  sidebar-accent-foreground: '#134E4A'
  sidebar-border: '#E2E8F0'
  sidebar-ring: '#0F766E'
  dark-background: '#020617'
  dark-foreground: '#F8FAFC'
  dark-card: '#0F172A'
  dark-card-foreground: '#F8FAFC'
  dark-popover: '#0F172A'
  dark-popover-foreground: '#F8FAFC'
  dark-primary: '#2DD4BF'
  dark-primary-foreground: '#042F2E'
  dark-secondary: '#1E293B'
  dark-secondary-foreground: '#F8FAFC'
  dark-muted: '#1E293B'
  dark-muted-foreground: '#94A3B8'
  dark-accent: '#134E4A'
  dark-accent-foreground: '#CCFBF1'
  dark-destructive: '#F87171'
  dark-destructive-foreground: '#450A0A'
  dark-border: '#1E293B'
  dark-input: '#334155'
  dark-ring: '#2DD4BF'
typography:
  display:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '40px'
    letterSpacing: '-0.02em'
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '32px'
    letterSpacing: '-0.01em'
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '28px'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '24px'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '20px'
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '16px'
  label:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '20px'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '16px'
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '20px'
rounded:
  sm: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  page-mobile: 16px
  page-desktop: 32px
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primary-foreground}'
    typography: '{typography.label}'
    rounded: '{rounded.md}'
    height: 40px
    padding: 16px
  button-primary-hover:
    backgroundColor: '#115E59'
    textColor: '{colors.primary-foreground}'
    typography: '{typography.label}'
    rounded: '{rounded.md}'
    height: 40px
    padding: 16px
  button-secondary:
    backgroundColor: '{colors.secondary}'
    textColor: '{colors.secondary-foreground}'
    typography: '{typography.label}'
    rounded: '{rounded.md}'
    height: 40px
    padding: 16px
  card-default:
    backgroundColor: '{colors.card}'
    textColor: '{colors.card-foreground}'
    rounded: '{rounded.lg}'
    padding: 24px
  input-default:
    backgroundColor: '{colors.background}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.md}'
    height: 40px
    padding: 12px
  badge-approved:
    backgroundColor: '{colors.success}'
    textColor: '{colors.success-foreground}'
    typography: '{typography.label-sm}'
    rounded: '{rounded.full}'
    padding: 8px
  badge-pending:
    backgroundColor: '{colors.warning}'
    textColor: '{colors.warning-foreground}'
    typography: '{typography.label-sm}'
    rounded: '{rounded.full}'
    padding: 8px
  badge-rejected:
    backgroundColor: '{colors.destructive}'
    textColor: '{colors.destructive-foreground}'
    typography: '{typography.label-sm}'
    rounded: '{rounded.full}'
    padding: 8px
---

## Brand & Style
SIMDP adalah aplikasi manajemen dokumen pegawai RSUD Bahteramas, sehingga desainnya harus terasa **profesional, bersih, tenang, dan mudah dipakai oleh pegawai non-IT**. Arah visual utama adalah **shadcn/ui-first**: minimal, rapi, banyak whitespace, border halus, radius konsisten, dan typography tajam.

Brand rumah sakit dipakai sebagai aksen melalui teal medis, bukan sebagai gaya custom yang menjauh dari shadcn/ui. Semua komponen umum harus memakai primitive shadcn/ui atau wrapper internal yang tetap dibangun di atas shadcn/ui dan Tailwind token.

## Colors
Palet ini mengikuti konvensi token shadcn/ui: pasangan semantic `background / foreground`, `card / card-foreground`, `primary / primary-foreground`, dan seterusnya. Implementasi di `app/globals.css` harus memakai CSS variables (`tailwind.cssVariables: true` di `components.json`) supaya utility seperti `bg-background`, `text-foreground`, `border-border`, dan `ring-ring` bekerja konsisten.

- **Primary Teal (`#0F766E`):** aksen utama SIMDP untuk CTA, selected state, sidebar active item, dan fokus form. Warna ini mewakili konteks medis tanpa membuat UI terlalu ramai.
- **Neutral Slate:** background `#F8FAFC`, text `#0F172A`, border `#E2E8F0`, dan muted `#64748B` menjaga tampilan mirip shadcn/ui default: clean, readable, dan cocok untuk dashboard data-heavy.
- **Status Colors:** success `#16A34A`, warning `#D97706`, destructive `#DC2626`, dan info `#0EA5E9` dipakai untuk status dokumen, alert, dan chart. Jangan hardcode warna status langsung di komponen; expose sebagai CSS variables/Tailwind token.
- **Dark Mode:** token `dark-*` disediakan sebagai mapping untuk selector `.dark`. Dark mode harus tetap memakai token yang sama (`--background`, `--foreground`, dll.) dengan value berbeda, bukan class warna manual di tiap komponen.

## Typography
Gunakan **Inter** sebagai default font karena sesuai estetika shadcn/ui dan mudah dibaca di form, tabel, serta dashboard. **Plus Jakarta Sans** boleh menjadi alternatif jika project belum memakai Inter, tetapi jangan mencampur terlalu banyak keluarga font.

- **Heading:** semi-bold/bold dengan ukuran 20, 24, dan 32px. Pakai heading besar hanya untuk page title dan dashboard hero, bukan untuk setiap card.
- **Body:** 14px adalah default untuk tabel, form, metadata, dan dashboard; 16px untuk paragraph panjang atau instruksi penting.
- **Small Text:** 12px hanya untuk helper text, badge, timestamp, dan metadata. Pastikan kontras tetap WCAG AA.
- **Mono:** JetBrains Mono hanya untuk token, ID teknis, payload, log, atau contoh konfigurasi; jangan dipakai untuk body text biasa.

## Layout & Spacing
Layout mengikuti pola shadcn/ui dan dashboard SaaS modern: container putih/neutral, border tipis, whitespace cukup, dan hierarchy jelas.

- **Grid:** gunakan grid responsif berbasis Tailwind. Dashboard desktop boleh memakai 12-column mental model, tetapi implementasi cukup dengan `grid`, `gap-4`, `gap-6`, dan breakpoint Tailwind.
- **Page Padding:** mobile 16px, desktop 32px. Admin/Staff desktop-first karena banyak tabel; Employee mobile-first karena fokus upload dokumen dari perangkat pribadi.
- **Density:** tabel dan form harus padat tapi tetap terbaca. Gunakan `space-y-4`, `gap-4`, dan `p-6` sebagai default shadcn Card rhythm.
- **State Layout:** setiap halaman data-heavy wajib punya loading (`Skeleton`), empty state, error (`Alert`), forbidden/unauthorized state, dan pagination/filter jika relevan.

## Elevation & Depth
Ikuti gaya shadcn/ui: depth tidak bergantung pada shadow berat, tetapi pada surface, border, dan state yang jelas.

- **Cards and Panels:** default `Card` memakai background `card`, text `card-foreground`, radius `lg`, dan border `border`.
- **Overlays:** `Dialog`, `Popover`, `DropdownMenu`, `Command`, dan `Sheet` memakai token `popover / popover-foreground` dengan border halus.
- **Focus:** semua elemen interaktif harus memiliki focus ring dari token `ring`. Jangan menghapus outline tanpa pengganti.
- **Hover:** hover row/menu memakai `accent / accent-foreground`, bukan warna arbitrary.

## Shapes
Base radius SIMDP adalah **0.5rem / 8px** (`rounded.lg`), mengikuti rasa shadcn/ui yang soft tapi tetap profesional. Gunakan radius turunan seperti pola shadcn: small control lebih kecil, card/popover mengikuti base, badge/status memakai `rounded-full`.

- Buttons, inputs, select, textarea: `rounded-md`.
- Cards, dialogs, popovers, sheets: `rounded-lg`.
- Status badges dan role badges: `rounded-full`.
- Hindari radius ekstrem pada layout utama karena bisa terasa tidak formal untuk sistem rumah sakit.

## Components
- **Button:** gunakan shadcn/ui `Button`. Variant `default` memakai `primary`, `secondary` memakai `secondary`, `destructive` memakai `destructive`, dan `ghost`/`outline` mengikuti token shadcn. Jangan membuat button custom dari nol.
- **Form Controls:** gunakan `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Label`, dan `Form`. Semua field wajib punya label jelas, helper/error text, dan focus ring.
- **Card & MetricCard:** dashboard statistic memakai `Card`, `CardHeader`, `CardContent`; angka utama jelas, label ringkas, icon line-style, dan optional trend indicator.
- **Data Table:** tabel dokumen/pegawai/verifikasi memakai shadcn table pattern dengan search, filter, pagination, empty state, skeleton, dan row hover `accent`.
- **StatusBadge:** `PENDING` memakai warning, `APPROVED` success, `REJECTED` destructive, `EXPIRED` destructive/neutral sesuai urgency, dan `REPLACED` neutral. Selalu pill-shaped.
- **Sidebar:** gunakan shadcn/ui `Sidebar`. Active item memakai `sidebar-primary` atau `sidebar-accent`; border internal memakai `sidebar-border`; focus memakai `sidebar-ring`.
- **Charts:** chart dashboard memakai Tremor Charts hanya untuk visualisasi, dibungkus shadcn `Card`/`Tabs`/`Select`/`Skeleton`. Warna chart harus memakai `chart-1` sampai `chart-5`.
- **Dialogs and Destructive Actions:** aksi approve/reject/delete/reset harus memakai `Dialog` atau `AlertDialog`; destructive action memakai token `destructive` dan copy yang jelas.

## Do's and Don'ts
**Do:** gunakan CSS variables shadcn/ui, semantic token pair, komponen shadcn/ui, Tailwind utility yang mengacu token, dan warna status dari design system.

**Don't:** jangan menghidupkan lagi tema serverless/terminal gelap lama, jangan hardcode hex di komponen React, jangan memakai library UI umum selain shadcn/ui tanpa keputusan baru, dan jangan membuat primitive custom jika equivalent shadcn/ui tersedia.
