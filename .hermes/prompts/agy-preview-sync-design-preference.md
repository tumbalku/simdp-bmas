/build

You are Antigravity acting as the developer agent for SIMDP. Hermes/mes is orchestrating only. The user just provided explicit design preference context and asked to synchronize the `/preview` experiment with it. Do NOT commit, push, open PR, merge, rebase, reset, or delete branches.

## Active user request

Synchronize the local `/preview` UI with the user's preferred design direction from:

- `DESIGN.md` — authoritative SIMDP design system.
- user-attached `ui.shadcn.com-DESIGN.md` reference — use as inspiration for shadcn-style clarity, whitespace, radius, card rhythm, and component polish.

Keep Antigravity as implementer. Hermes will review.

## Mandatory skill usage

Read and apply:

```txt
.agents/skills/design-taste-frontend/SKILL.md
```

Also verify:

```bash
npx skills list --json
```

Use Taste Skill contextually, not wildly: SIMDP is public-sector hospital document management, so the design must remain professional, clean, calm, and usable by non-IT users.

## Must-read files before editing

- DESIGN.md
- context/ui/design-system.md
- src/app/globals.css
- src/components/ui/sidebar.tsx
- src/components/ui/card.tsx
- src/components/ui/button.tsx
- src/components/ui/table.tsx
- src/components/ui/dialog.tsx
- src/components/ui/sheet.tsx
- src/app/preview/page.tsx

## Scope restrictions

Only edit ignored local preview files under:

```txt
src/app/preview/
```

Prefer editing only:

```txt
src/app/preview/page.tsx
```

Do not modify tracked production files, shadcn primitives, package files, DESIGN.md, context docs, globals.css, `.env`, or prompts. This is still a local experiment. If you think a tracked change is necessary, stop and report instead.

## Design synchronization target

The current preview is functional but must be closer to the user's preferred design direction:

1. **SIMDP DESIGN.md first**
   - Light-first hospital document-management system.
   - Professional, clean, calm, easy for non-IT staff.
   - shadcn/ui-first.
   - Teal medical accent, not a custom theme that drifts away from shadcn.
   - Use semantic tokens: `bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`, `border-border`, `bg-primary`, `text-primary`, `bg-muted`, `text-muted-foreground`, `bg-sidebar`, `text-sidebar-foreground`, `bg-accent`, etc.
   - Dark mode must use `.dark` token remapping, not separate hardcoded dark-only palettes everywhere.
   - Avoid hardcoded hex and reduce arbitrary color utilities. Status colors can use token utilities like `bg-success`, `text-success`, `bg-warning`, `text-warning`, `bg-destructive`, `text-destructive`, `bg-info`, `text-info`, `bg-neutral` where possible.

2. **shadcn reference second**
   - Generous but practical whitespace.
   - Card rhythm around `p-5`/`p-6`, subtle border/elevation, clear hierarchy.
   - Consistent 4px spacing scale.
   - Clear form labels, focus rings, readable table spacing.
   - Radius consistent with SIMDP: controls `rounded-md`, cards/dialogs `rounded-lg`, status pills `rounded-full`. Do not over-round main layout into playful SaaS.

3. **Sidebar requirement**
   - DESIGN.md says Sidebar should use shadcn/ui Sidebar.
   - If feasible inside preview only, refactor the desktop sidebar to use the installed `src/components/ui/sidebar.tsx` primitives (`SidebarProvider`, `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarGroup`, `SidebarMenu`, etc.).
   - If using the Sidebar primitive causes type/behavior issues, keep a composed shadcn Button/Card/Sheet sidebar but document why in final report.
   - Mobile sidebar via `Sheet` should remain.

4. **Navbar requirement**
   - Keep brand, breadcrumb/current module, search affordance, notification dropdown, user dropdown, dark mode toggle.
   - Polish it toward shadcn reference: less noisy, simpler surfaces, tighter typography, more intentional spacing.

5. **Dark mode requirement**
   - Dark toggle must visibly work.
   - Prefer toggling `.dark` on preview root safely, but avoid duplicating many `dark:*` color overrides if semantic tokens already work.
   - Verify navbar, sidebar, cards, table, dialog, form, and charts are readable in dark mode.

6. **Interactive bug check**
   - Hermes browser smoke test observed that clicking `Tinjau` did not visibly open the document detail dialog. Verify and fix if needed.
   - Ensure `Tinjau` opens dialog, approve/reject/dropdowns work, dark toggle works, sidebar module buttons change content.

7. **Content and language**
   - Indonesian professional microcopy.
   - No em dash / en dash in user-facing copy where avoidable.
   - Keep clear local-only preview warning.

## Verification required

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

Remember: because `src/app/preview/` is ignored, preview file changes should not appear in git status. The only untracked prompt files may be from Hermes orchestration and should not be touched.

## Final report required

Report:
- confirmed Taste Skill was read/used;
- design read and dials after syncing to DESIGN.md;
- what changed to align with DESIGN.md and shadcn reference;
- whether shadcn Sidebar primitives were used or why not;
- interactive checks, especially Tinjau dialog and dark mode;
- verification commands/results;
- confirm no PR/commit was created.
