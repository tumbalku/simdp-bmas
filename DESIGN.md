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
  section: 48px
  page-mobile: 16px
  page-tablet: 24px
  page-desktop: 32px
  marketing-desktop: 80px
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
SIMDP adalah aplikasi manajemen dokumen pegawai RSUD Bahteramas, sehingga desainnya harus terasa **profesional, bersih, tenang, dan mudah dipakai oleh pegawai non-IT**. Arah visual utama adalah **shadcn/ui-first**: minimal, rapi, banyak whitespace, border halus, radius konsisten, typography tajam, dan pola interaksi yang mudah diprediksi.

Dokumen ini menggabungkan standar lokal SIMDP dengan referensi `ui.shadcn.com-DESIGN.md`. Bagian yang diambil dari referensi shadcn/ui adalah prinsip visualnya: contrast yang jelas, komponen sebagai building block, layout lapang, state yang konsisten, dan aksesibilitas. Nilai warna biru/black-white dari referensi tidak disalin mentah; semuanya dipetakan ke token SIMDP berbasis teal medis dan neutral slate.

Brand rumah sakit dipakai sebagai aksen melalui teal medis, bukan sebagai gaya custom yang menjauh dari shadcn/ui. Semua komponen umum harus memakai primitive shadcn/ui atau wrapper internal yang tetap dibangun di atas shadcn/ui dan Tailwind token.

**Karakter utama UI SIMDP:**
- high-contrast light-first interface dengan dark mode token-ready;
- whitespace cukup agar tabel, form, dan dashboard tidak terasa sesak;
- border tipis dan shadow halus untuk depth, bukan shadow berat;
- radius konsisten yang soft tetapi tetap formal untuk sistem rumah sakit;
- component-first: page menyusun primitive/wrapper, bukan styling custom dari nol;
- interaction state jelas: hover, focus-visible, disabled, loading, empty, error, dan success.

## Colors
Palet ini mengikuti konvensi token shadcn/ui: pasangan semantic `background / foreground`, `card / card-foreground`, `primary / primary-foreground`, dan seterusnya. Implementasi di `app/globals.css` harus memakai CSS variables (`tailwind.cssVariables: true` di `components.json`) supaya utility seperti `bg-background`, `text-foreground`, `border-border`, dan `ring-ring` bekerja konsisten.

- **Primary Teal (`#0F766E`):** aksen utama SIMDP untuk CTA, selected state, sidebar active item, dan fokus form. Warna ini mewakili konteks medis tanpa membuat UI terlalu ramai.
- **Neutral Slate:** background `#F8FAFC`, text `#0F172A`, border `#E2E8F0`, dan muted `#64748B` menjaga tampilan mirip shadcn/ui default: clean, readable, dan cocok untuk dashboard data-heavy.
- **Status Colors:** success `#16A34A`, warning `#D97706`, destructive `#DC2626`, dan info `#0EA5E9` dipakai untuk status dokumen, alert, dan chart. Jangan hardcode warna status langsung di komponen; expose sebagai CSS variables/Tailwind token.
- **Dark Mode:** token `dark-*` disediakan sebagai mapping untuk selector `.dark`. Dark mode harus tetap memakai token yang sama (`--background`, `--foreground`, dll.) dengan value berbeda, bukan class warna manual di tiap komponen.

**Mapping dari referensi shadcn/ui:**
- shadcn black/white foundation diterjemahkan menjadi neutral slate SIMDP: `foreground`, `muted-foreground`, `border`, `card`, dan `background`.
- shadcn primary blue diterjemahkan menjadi `primary` teal. Jangan memakai `#3E43F0`, `#155DFC`, atau blue reference lain kecuali ada keputusan desain baru.
- shadcn error red diterjemahkan menjadi `destructive`; warning/success/info tetap memakai token status SIMDP.
- semua state warna harus berupa semantic utility (`bg-primary`, `text-muted-foreground`, `border-border`, `ring-ring`, `bg-accent`) agar theme light/dark tetap konsisten.

## Typography
Gunakan **Inter** sebagai default font karena sesuai estetika shadcn/ui dan mudah dibaca di form, tabel, serta dashboard. **Plus Jakarta Sans** boleh menjadi alternatif jika project belum memakai Inter, tetapi jangan mencampur terlalu banyak keluarga font. Referensi shadcn/ui memakai Geist; untuk SIMDP, rasa visual Geist diterapkan melalui Inter: geometris, tajam, dan compact.

- **Heading:** semi-bold/bold dengan ukuran 20, 24, dan 32px. Pakai heading besar hanya untuk page title dan dashboard hero, bukan untuk setiap card.
- **Body:** 14px adalah default untuk tabel, form, metadata, dan dashboard; 16px untuk paragraph panjang atau instruksi penting.
- **Small Text:** 12px hanya untuk helper text, badge, timestamp, dan metadata. Pastikan kontras tetap WCAG AA.
- **Mono:** JetBrains Mono hanya untuk token, ID teknis, payload, log, atau contoh konfigurasi; jangan dipakai untuk body text biasa.

**Prinsip hierarchy:** gunakan weight dan spacing sebelum menaikkan ukuran font. Body default 14px menjaga interface tetap padat untuk admin/staff, sedangkan 16px dipakai untuk instruksi penting dan halaman employee yang lebih mobile-first. Line-height tidak boleh terlalu rapat; pertahankan kisaran 1.2-1.55x ukuran font.

## Layout & Spacing
Layout mengikuti pola shadcn/ui dan dashboard SaaS modern: container putih/neutral, border tipis, whitespace cukup, dan hierarchy jelas.

- **Grid:** gunakan grid responsif berbasis Tailwind. Dashboard desktop boleh memakai 12-column mental model, tetapi implementasi cukup dengan `grid`, `gap-4`, `gap-6`, dan breakpoint Tailwind.
- **Page Padding:** mobile 16px, desktop 32px. Admin/Staff desktop-first karena banyak tabel; Employee mobile-first karena fokus upload dokumen dari perangkat pribadi.
- **Density:** tabel dan form harus padat tapi tetap terbaca. Gunakan `space-y-4`, `gap-4`, dan `p-6` sebagai default shadcn Card rhythm.
- **State Layout:** setiap halaman data-heavy wajib punya loading (`Skeleton`), empty state, error (`Alert`), forbidden/unauthorized state, dan pagination/filter jika relevan.

**Spacing scale:** semua gap/margin/padding harus mengikuti kelipatan 4px. Gunakan `4px` untuk spacing sangat rapat, `8px` untuk gap kecil, `12px` untuk inner control spacing, `16px` untuk default group gap, `20px-24px` untuk padding card/form section, `32px` untuk page rhythm desktop, `48px` untuk section besar, dan `80px` hanya untuk layout marketing/hero bila nanti dibutuhkan.

**Responsive behavior:**
- mobile `320-640px`: single column, padding 16px, target sentuh minimal 44px;
- tablet `640-1024px`: dua kolom bila konten cukup, padding 24px;
- desktop `1024px+`: grid dashboard/table penuh dengan padding 32px;
- sidebar dashboard boleh collapse/hide di layar kecil; konten utama harus tetap full-width dan readable;
- form multi-kolom wajib stack vertikal di mobile.

## Elevation & Depth
Ikuti gaya shadcn/ui: depth tidak bergantung pada shadow berat, tetapi pada surface, border, dan state yang jelas.

- **Cards and Panels:** default `Card` memakai background `card`, text `card-foreground`, radius `lg`, dan border `border`.
- **Overlays:** `Dialog`, `Popover`, `DropdownMenu`, `Command`, dan `Sheet` memakai token `popover / popover-foreground` dengan border halus.
- **Focus:** semua elemen interaktif harus memiliki focus ring dari token `ring`. Jangan menghapus outline tanpa pengganti.
- **Hover:** hover row/menu memakai `accent / accent-foreground`, bukan warna arbitrary.

Gunakan shadow halus hanya untuk permukaan yang perlu dipisahkan dari background: dropdown, popover, dialog, sticky header, dan card yang interactive. Untuk card biasa, border `border` + background `card` sudah cukup. Hindari shadow gelap/tebal karena membuat dashboard medis terasa berat dan kurang shadcn/ui.

## Shapes
Base radius SIMDP adalah **0.5rem / 8px** (`rounded.lg`), mengikuti rasa shadcn/ui yang soft tapi tetap profesional. Gunakan radius turunan seperti pola shadcn: small control lebih kecil, card/popover mengikuti base, badge/status memakai `rounded-full`.

- Buttons, inputs, select, textarea: `rounded-md`.
- Cards, dialogs, popovers, sheets: `rounded-lg`.
- Status badges dan role badges: `rounded-full`.
- Hindari radius ekstrem pada layout utama karena bisa terasa tidak formal untuk sistem rumah sakit.

Referensi shadcn/ui memakai radius yang bisa lebih besar pada card/marketing. Untuk SIMDP, jangan memakai card 24px secara default di dashboard; radius besar hanya boleh untuk empty state, hero, atau halaman onboarding jika memang membuat konten lebih ramah.

## Components
- **Button:** gunakan shadcn/ui `Button`. Variant `default` memakai `primary`, `secondary` memakai `secondary`, `destructive` memakai `destructive`, dan `ghost`/`outline` mengikuti token shadcn. Jangan membuat button custom dari nol.
- **Form Controls:** gunakan `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Label`, dan `Form`. Semua field wajib punya label jelas, helper/error text, dan focus ring.
- **Card & MetricCard:** dashboard statistic memakai `Card`, `CardHeader`, `CardContent`; angka utama jelas, label ringkas, icon line-style, dan optional trend indicator.
- **Data Table:** tabel dokumen/pegawai/verifikasi memakai shadcn table pattern dengan search, filter, pagination, empty state, skeleton, dan row hover `accent`.
- **StatusBadge:** `PENDING` memakai warning, `APPROVED` success, `REJECTED` destructive, `EXPIRED` destructive/neutral sesuai urgency, dan `REPLACED` neutral. Selalu pill-shaped.
- **Sidebar:** gunakan shadcn/ui `Sidebar`. Active item memakai `sidebar-primary` atau `sidebar-accent`; border internal memakai `sidebar-border`; focus memakai `sidebar-ring`.
- **Charts:** chart dashboard memakai Tremor Raw-style Recharts hanya untuk visualisasi, dibungkus shadcn `Card`/`Tabs`/`Select`/`Skeleton`. Warna chart harus memakai `chart-1` sampai `chart-5`.
- **Dialogs and Destructive Actions:** aksi approve/reject/delete/reset harus memakai `Dialog` atau `AlertDialog`; destructive action memakai token `destructive` dan copy yang jelas.

**Component styling guidance dari shadcn/ui yang sudah dipetakan ke SIMDP:**
- Button default: tinggi 40px untuk form/action utama; compact 32px boleh untuk toolbar/table filter yang padat. Text 14px/500, radius `rounded-md`, focus ring wajib.
- Button ghost/icon: area sentuh tetap minimal 40px desktop dan 44px mobile walau ikon visual kecil.
- Card: padding default 20-24px; header dan content harus punya jarak jelas; gunakan border tipis lebih sering daripada shadow.
- Input/Textarea: tinggi 40px minimum untuk input biasa, textarea sesuai konten; placeholder muted; error state memakai `destructive`; focus memakai `ring`.
- Navigation item: hover memakai `accent`, active memakai font weight lebih tegas dan/atau token sidebar active; jangan hanya mengandalkan warna tipis tanpa kontras.
- Table row: tinggi cukup untuk dibaca, hover halus, selected state jelas, action menu via `DropdownMenu`.
- Empty state: jangan hanya `No data`; harus punya judul, deskripsi, dan CTA jika ada aksi berikutnya.

## Accessibility & Responsive Behavior
SIMDP dipakai pegawai non-IT, jadi aksesibilitas adalah bagian dari standar desain, bukan tambahan opsional.

- Kontras minimal WCAG AA untuk text normal; hindari teks muted yang terlalu tipis di atas background tinted.
- Semua field form wajib punya visible label; placeholder bukan pengganti label.
- Semua elemen keyboard-navigable wajib punya `focus-visible` ring yang terlihat.
- Touch target mobile minimal 44x44px untuk button, link, checkbox, radio, switch, dan row action.
- Disabled state harus jelas melalui opacity/cursor/copy, tetapi tetap readable.
- Loading, error, empty, unauthorized, dan forbidden state harus didesain sebagai state nyata.
- Jangan menyembunyikan informasi penting hanya lewat warna; gunakan icon/text/status label.

## Agent Prompt Guide
Jika agent membangun UI SIMDP, gunakan ringkasan ini sebagai prompt singkat:

1. Bangun UI dengan shadcn/ui primitives dan Tailwind semantic tokens, bukan hardcoded hex.
2. Pakai teal `primary` untuk aksi utama/focus/active, neutral slate untuk surface/text/border, dan status token untuk dokumen.
3. Gunakan Inter 14px sebagai default dense UI, heading 20/24/32px, label 14px/500, metadata 12px.
4. Gunakan spacing kelipatan 4px: gap-4 default, p-6 untuk Card, page padding 16px mobile dan 32px desktop.
5. Gunakan border halus dan surface contrast; shadow hanya subtle untuk overlays/interaktif.
6. Pastikan state lengkap: loading Skeleton, empty state ramah, error Alert, forbidden/unauthorized, disabled, hover, focus-visible.
7. Admin/Staff boleh desktop-first untuk tabel; Employee harus mobile-first untuk upload dokumen.
8. Chart hanya memakai reusable Tremor Raw/Recharts components di `src/components/charts/`, bukan library UI pengganti shadcn.

## Do's and Don'ts
**Do:** gunakan CSS variables shadcn/ui, semantic token pair, komponen shadcn/ui, Tailwind utility yang mengacu token, dan warna status dari design system.

**Do:** pertahankan whitespace, kontras, radius, dan interaction state yang konsisten; cek UI dengan standar `DESIGN.md` sebelum menganggap tampilan selesai.

**Don't:** jangan menghidupkan lagi tema serverless/terminal gelap lama, jangan hardcode hex di komponen React, jangan memakai library UI umum selain shadcn/ui tanpa keputusan baru, jangan membuat primitive custom jika equivalent shadcn/ui tersedia, dan jangan menyalin warna biru/black-white dari referensi shadcn/ui secara mentah ketika token SIMDP sudah tersedia.
