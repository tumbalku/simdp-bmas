/build

You are Antigravity acting as the developer agent for SIMDP. Hermes/mes is orchestrating only. The user just provided DESIGN.md and a shadcn reference DESIGN.md and said they prefer that direction. Do NOT create a PR, commit, push, merge, rebase, reset, or delete branches.

## Task

Revise the local ignored `/preview` experiment so it is synchronized with the user's preferred design direction:

1. **Primary authority:** project `DESIGN.md` attached/provided by user and present in repo.
2. **Secondary inspiration:** shadcn/ui reference design attached by user.
3. **Taste Skill still required:** use `.agents/skills/design-taste-frontend/SKILL.md`, but contextualize it for a public-sector hospital dashboard. Taste Skill improves craft, but must not override SIMDP's clean shadcn-first design system.

## Must-read files before editing

- `.agents/skills/design-taste-frontend/SKILL.md`
- `DESIGN.md`
- `context/ui/design-system.md`
- `src/app/globals.css`
- `src/app/preview/page.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/sidebar.tsx`
- `src/components/charts/AreaChart.tsx`
- `src/components/charts/DonutChart.tsx`

## Scope rules

Only edit ignored preview files under:

```txt
src/app/preview/
```

Prefer editing only:

```txt
src/app/preview/page.tsx
```

Do not edit tracked production files, docs, package files, shadcn primitives, globals.css, or `.env`.

The prompt file itself may remain untracked. Do not stage anything.

## Design alignment requirements

Update `/preview` to better match the user's preferred design:

### A. SIMDP DESIGN.md must win

- Light-first hospital/professional/admin dashboard feel.
- Clean, minimal, calm, easy for non-IT staff.
- shadcn/ui-first, not a heavily custom or overly stylized shell.
- Teal is only an accent, not a loud theme everywhere.
- Use semantic Tailwind tokens wherever possible:
  - `bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`
  - `text-muted-foreground`, `border-border`, `bg-muted`, `bg-accent`
  - `text-primary`, `bg-primary`, `ring-ring`
  - `bg-sidebar`, `text-sidebar-foreground`, `border-sidebar-border`, `bg-sidebar-accent`
  - chart tokens for charts.
- Reduce arbitrary color classes where equivalent tokens exist.
- Status colors may use semantic status tokens (`success`, `warning`, `destructive`, `info`, `neutral`) if configured, or carefully controlled Tailwind status colors if token classes are not available. Prefer token classes first.

### B. shadcn reference taste

Apply the shadcn reference taste in a restrained way:

- More breathing room and clearer hierarchy.
- Cards should feel like shadcn surfaces: soft border, subtle elevation if needed, not flashy.
- Controls should be compact and predictable.
- Labels clear and persistent.
- Tables should be readable, with row hover using token-ish `hover:bg-accent/50`.
- Radius consistent with SIMDP: `rounded-md` for controls, `rounded-lg` for cards/dialogs, `rounded-full` for badges. Do not make everything extra round.
- Avoid overusing animated effects.

### C. Dark mode

- Keep dark mode toggle.
- Dark mode should rely on `.dark` + semantic variables in `globals.css`.
- Avoid manual hardcoded dark colors where token classes are available.
- Ensure navbar/sidebar/cards/tables/forms are legible in dark mode.

### D. Layout preference

Keep the app-shell concept, but simplify it so it feels closer to a real production SIMDP admin/staff shell:

- Top navbar: brand, breadcrumb/module, search affordance, notification, dark toggle, user dropdown.
- Sidebar: use `bg-sidebar`, `text-sidebar-foreground`, `border-sidebar-border`; group labels; active state via sidebar tokens.
- Main: dashboard overview, verification table, upload form, audit log, settings.
- Avoid huge decorative sections, excessive visual noise, and excessive icon/color usage.
- Keep local-only warning but make it quieter, like a small system notice.

### E. Copy and language

- Indonesian microcopy.
- Avoid em dash (`—`) in user-facing copy.
- Keep copy concise and professional.

## Required verification

Run:

```bash
npx skills list --json
npm run lint
npm run typecheck
npm run build
npm run test
git check-ignore -v src/app/preview/page.tsx
git status --short --branch --untracked-files=all
```

Expected: only untracked `.hermes/prompts/...` may show; `src/app/preview/page.tsx` should remain ignored.

## Final report

Report:
- confirmed Taste Skill read/used;
- what was changed to sync with DESIGN.md and shadcn reference;
- whether tracked files were untouched;
- verification results;
- remaining design ideas.
