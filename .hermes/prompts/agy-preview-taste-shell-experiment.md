/build

You are Antigravity acting as the developer agent for SIMDP. Hermes/mes is orchestrating only. The user explicitly requested: do NOT create a PR yet; this is an experiment in the local ignored `/preview` sandbox, and Antigravity must implement the code.

## Task

Experimentally redesign `src/app/preview/page.tsx` to apply the newly installed Taste Skill (`design-taste-frontend`) to the SIMDP component preview.

This is a local-only sandbox. It is intentionally ignored by git:

```txt
src/app/preview/
```

Do not commit, push, open PR, merge, rebase, reset, or delete branches.

## Mandatory skill usage

Before editing, read and apply the project-local Taste Skill:

```txt
.agents/skills/design-taste-frontend/SKILL.md
```

Also verify it is installed:

```bash
npx skills list --json
```

Important contextual interpretation: Taste Skill says it is not mainly for dashboards/data tables, so use it contextually. SIMDP is a public-sector hospital document management app. Apply anti-slop quality to layout, typography, spacing, hierarchy, and motion, but keep the interface trustworthy, accessible, restrained, and shadcn/ui-first.

Use this design read explicitly in your final report:

```txt
Reading this as: public-sector hospital dashboard preview for admin/staff/pegawai users, with a trust-first professional shadcn/ui language, leaning toward restrained teal-accented healthcare SaaS with low-motion dark-mode support.
DESIGN_VARIANCE: 4
MOTION_INTENSITY: 2
VISUAL_DENSITY: 5
```

## Must-read context

Read these before editing:

- AGENTS.md
- DESIGN.md
- context/ui/design-system.md
- context/ui/pages.md
- src/app/globals.css
- src/components/ui/sidebar.tsx
- src/components/ui/navigation-menu.tsx
- src/components/ui/sheet.tsx
- src/components/ui/dropdown-menu.tsx
- src/components/ui/sonner.tsx
- src/components/charts/AreaChart.tsx
- src/components/charts/DonutChart.tsx
- src/app/preview/page.tsx

## Scope

Only change local ignored preview code under:

```txt
src/app/preview/
```

Prefer editing only:

```txt
src/app/preview/page.tsx
```

You may create small preview-only helper components under `src/app/preview/` if the single file becomes too large. Because this folder is ignored, those files must not be part of a PR.

Do NOT modify production routes, app layout, global CSS, shadcn component primitives, package files, context docs, `.env`, or tracked project files unless absolutely necessary. If you believe a tracked change is necessary, stop and report instead of making it.

## Required UI outcome

Redesign `/preview` as a realistic SIMDP application shell showcase, not just a component grid.

Must include:

1. **Top navbar**
   - SIMDP/RSUD Bahteramas brand block.
   - Breadcrumb/current module indicator.
   - Search/Command-like affordance.
   - Notification button with badge.
   - User/profile dropdown with role info.
   - Dark mode toggle.

2. **Sidebar**
   - Persistent desktop sidebar.
   - Mobile sidebar via `Sheet`.
   - Role-aware menu groups, e.g. Dashboard, Dokumen, Verifikasi, Pegawai, Master Data, Pengaturan, Audit.
   - Active item styling.
   - Compact status panel at bottom, e.g. compliance/reminder summary.

3. **Dark mode**
   - Local preview-only dark mode toggle.
   - Implement by toggling `.dark` class on the preview root or document root safely.
   - Use semantic tokens (`bg-background`, `text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`, `bg-sidebar`, etc.), not hardcoded slate-only light colors.
   - Dark mode must visually work for cards, sidebar, navbar, tables, charts sections.

4. **Main content sections**
   Turn the preview into dashboard-like examples:
   - overview metrics using `Card`, `Badge`, progress indicators;
   - document verification queue table using `Table`;
   - upload/form panel using Input/Textarea/Select/Checkbox/Switch/Calendar/Popover;
   - dialogs/sheets/dropdowns demo inside realistic actions;
   - AreaChart + DonutChart examples using local Tremor Raw/Recharts components;
   - empty/loading/error states using Alert/Skeleton.

5. **Taste Skill quality bar**
   - Avoid generic centered hero + three equal cards.
   - Strong hierarchy and purposeful spacing.
   - No arbitrary AI-purple gradients.
   - Keep animation subtle and accessibility-friendly.
   - No em dash in user-facing copy if avoidable.
   - Professional Indonesian microcopy.

6. **Preview marker**
   - Keep a clear local-only warning banner/note that `/preview` is ignored and not production.

## Verification required

Run:

```bash
npx skills list --json
npm run lint
npm run typecheck
npm run build
git check-ignore -v src/app/preview/page.tsx
```

Also start the dev server if needed and check `/preview` visually if you can from your environment. If you cannot use browser tools, report that Hermes should smoke-test visually.

## Final report required

Report:
- confirmation that `design-taste-frontend` was read/used;
- design read + dials;
- what changed in `/preview`;
- whether any tracked files were changed accidentally;
- verification commands and results;
- remaining UI ideas/gaps.

Again: do not commit or open PR.
