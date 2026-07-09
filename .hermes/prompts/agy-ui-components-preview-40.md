/build

You are Antigravity acting as the developer agent for SIMDP. Hermes/mes is orchestrating and will review your diff before any commit/PR. The user explicitly wants Antigravity/other agents to do coding/setup work; Hermes edits only if you idle/error.

## Task

Implement GitHub issue #40: `SIMDP-UI-000: Prepare shadcn component library and local preview sandbox`.

Goal: Before SIMDP UI feature pages are built, install the shadcn/ui primitives likely needed later and create a local-only `/preview` route to inspect shadcn + local Tremor Raw/Recharts components.

## Must-read context first

- AGENTS.md
- README.md
- DESIGN.md
- components.json
- package.json
- src/app/globals.css
- src/lib/utils.ts
- context/progress/task-board.md
- context/memory/changelog.md
- context/ui/design-system.md
- context/ui/pages.md
- context/architecture/module-boundaries.md
- context/architecture/patterns.md
- context/coding-standards/golden-rules.md
- context/coding-standards/file-structure.md
- context/coding-standards/naming.md
- context/coding-standards/checklist.md
- src/components/ui/button.tsx
- src/components/ui/card.tsx
- src/components/charts/AreaChart.tsx
- src/components/charts/DonutChart.tsx
- src/components/charts/index.ts
- src/lib/chartUtils.ts

## Non-negotiable constraints

- Do not commit, push, merge, rebase, reset, delete branches, or change GitHub settings.
- Do not touch `.env` or print secrets.
- Keep Hermes as orchestrator only.
- Respect shadcn/ui as the canonical UI primitive layer.
- Keep Tremor Raw/Recharts pattern. Do NOT install `@tremor/react`.
- Do not replace the design system or hardcode arbitrary colors beyond preview sample data.
- Existing `src/components/ui/button.tsx` and `src/components/ui/card.tsx` must not be destructively overwritten unless the CLI requires an identical/safe update. Prefer preserving current style.
- `/preview` is a local-only sandbox. It may be ignored in git and should not be shipped as production code.

## Required shadcn/ui components

Install/add these shadcn/ui primitives if they are not already present:

```txt
accordion
alert
alert-dialog
avatar
badge
breadcrumb
calendar
checkbox
collapsible
command
dialog
dropdown-menu
form
input
input-otp
label
menubar
navigation-menu
pagination
popover
progress
radio-group
scroll-area
select
separator
sheet
sidebar
skeleton
sonner
switch
table
tabs
textarea
tooltip
```

Existing `button` and `card` already exist; keep them available.

Suggested command, but verify against current `shadcn` CLI syntax first:

```bash
npx shadcn@latest add accordion alert alert-dialog avatar badge breadcrumb calendar checkbox collapsible command dialog dropdown-menu form input input-otp label menubar navigation-menu pagination popover progress radio-group scroll-area select separator sheet sidebar skeleton sonner switch table tabs textarea tooltip --yes
```

If the CLI offers options that may overwrite existing files, choose the safe option that preserves existing files.

## `/preview` local route requirements

Create a local-only route at:

```txt
src/app/preview/page.tsx
```

Then update `.gitignore` so the route folder is ignored:

```txt
# Local-only UI preview sandbox
src/app/preview/
```

Because the folder is ignored, it should not appear in the committed PR. It only helps Sil run local previews. Still create it locally and make sure it builds locally.

The preview page should:

- Use shadcn/ui components from `src/components/ui/*`.
- Include grouped sections for:
  - buttons, badges, alerts;
  - form controls: input, textarea, select, checkbox, radio group, switch, calendar/popover;
  - data display: card, table, tabs, accordion, progress, skeleton, pagination;
  - overlays/navigation: dialog, alert-dialog, sheet, dropdown-menu, breadcrumb, navigation-menu, menubar, tooltip, popover;
  - feedback: sonner/toast if usable without app-level provider changes, otherwise show note;
  - local Tremor Raw/Recharts charts: at least AreaChart and DonutChart if existing API supports easy sample data.
- Use SIMDP design tone from DESIGN.md: hospital/professional, light-first, teal accents, semantic tokens (`bg-card`, `text-muted-foreground`, `border-border`, `text-primary`, etc.).
- Mark it clearly as local-only preview.

If some components require app-level provider setup (e.g. sonner Toaster), add the minimal safe setup only if it does not affect production pages negatively; otherwise document in preview comments.

## Project docs/progress updates

Update committed project context:

- `context/progress/task-board.md`: add issue #40; mark done only after verification passes.
- `context/memory/changelog.md`: add entry that shadcn/ui primitives were installed and local ignored `/preview` sandbox was prepared.

Do not commit `.hermes/tmp-simdp-ui-000-issue.md` if present.

## Verification required before stopping

Run:

```bash
npm run test
npm run lint
npm run typecheck
npm run build
```

Also verify ignore behavior:

```bash
git check-ignore -v src/app/preview/page.tsx
```

And report whether `/preview` is ignored.

## Final response required

Report:
- shadcn components added
- package changes/dependencies added
- whether `src/app/preview/page.tsx` exists locally and is ignored
- files changed that should be committed
- verification commands/results
- remaining risks/gaps

Again: do not commit/push/merge. Hermes will review and ship.
