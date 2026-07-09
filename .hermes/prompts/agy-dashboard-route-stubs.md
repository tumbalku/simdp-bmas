# SIMDP dashboard route stub task

You are Antigravity implementing a very small Next.js App Router scaffolding task in the SIMDP repo.

## Goal
Create the dashboard route group folders and `page.tsx` stubs requested by Sil.

## Context already reviewed by Hermes
- `AGENTS.md`
- `README.md`
- `context/progress/task-board.md`
- `context/memory/changelog.md`
- `context/memory/decisions-log.md`
- `context/architecture/module-boundaries.md`
- `context/architecture/patterns.md`
- `context/coding-standards/golden-rules.md`
- `context/coding-standards/file-structure.md`
- `context/coding-standards/naming.md`
- `context/coding-standards/checklist.md`
- `DESIGN.md`
- `context/ui/design-system.md`
- `context/ui/pages.md`

## Hard constraints
- Do NOT commit, push, merge, rebase, reset, delete branches, or touch `.env`/secrets.
- Do NOT modify existing unrelated files.
- Do NOT edit existing untracked `src/app/simple/page.tsx`.
- Do NOT add dependencies.
- Keep the implementation intentionally minimal.
- For every requested `page.tsx`, the content must exactly follow this pattern, with the route's readable page name:

```tsx
function Page() {
  return (
    <div>Page Dashboard</div>
  );
}

export default Page;
```

## Files to create
Create these files under `src/app/(dashboard)/`:

- `layout.tsx` — minimal route-group layout that accepts `children: React.ReactNode` and returns `{children}`. Do not implement real sidebar/auth guard yet.
- `dashboard/page.tsx` with text `Page Dashboard`
- `documents/page.tsx` with text `Page Documents`
- `documents/[id]/page.tsx` with text `Page Document Detail`
- `verification/page.tsx` with text `Page Verification`
- `verification/[id]/page.tsx` with text `Page Verification Detail`
- `employees/page.tsx` with text `Page Employees`
- `employees/[id]/page.tsx` with text `Page Employee Detail`
- `master-data/page.tsx` with text `Page Master Data`
- `statistics/page.tsx` with text `Page Statistics`
- `security-log/page.tsx` with text `Page Security Log`
- `notifications/page.tsx` with text `Page Notifications`
- `settings/page.tsx` with text `Page Settings`

## Verification
After writing files, run:

```bash
npm run typecheck
```

Report exactly what files you created and whether typecheck passed.
