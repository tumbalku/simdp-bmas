# AGENTS.md — SIMDP Agent Rules

This file is the project-level instruction file for Antigravity and other coding agents working in SIMDP.

SIMDP is a Next.js + TypeScript employee document management system for RSUD Bahteramas. Treat this repository as a company project: small scoped tasks, issue-first workflow, feature branches, verification before PR, and no unreviewed direct changes to `main`.

## 1. Operating roles

- **User / Arsi**: product owner, maintainer, and final GitHub approver/merger.
- **Hermes / mes**: orchestrator and senior reviewer. mes creates or confirms task scope, checks implementation, runs verification, and gives a verdict before commit/PR/merge.
- **Antigravity**: developer agent. Implement only the task assigned by mes/user.
- **Specialist reviewers**: use `code-reviewer`, `test-engineer`, `security-auditor`, and `web-performance-auditor` when the task needs those perspectives.

## 2. Non-negotiable workflow

Always follow this order unless the user explicitly says otherwise:

1. Start from clean, synced `main`.
2. Create or use a GitHub issue for the task.
3. Create a feature branch for one task only.
4. Read the required context before editing.
5. Implement only the requested scope.
6. Run the relevant verification commands.
7. Ask for review before commit/PR unless the user has already approved that action.
8. Open a PR linked to the issue.
9. User approves/merges on GitHub.
10. After merge, sync `main` and clean up the feature branch.

Do not push directly to `main`.
Do not merge PRs automatically.
Do not approve GitHub PRs on behalf of the user.

## 3. Mandatory context loading before work

Before editing code or docs, read context that matches the task. Do not rely only on memory or assumptions.

### Always read for any coding task

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

### Read for UI work

- `DESIGN.md`
- `context/ui/design-system.md`
- `context/ui/pages.md`

Use shadcn/ui as the canonical component/design-system pattern. For charts, use the local Tremor Raw-style Recharts components under `src/components/charts/` and helpers in `src/lib/chartUtils.ts`.

### Read for database work

- `context/technical/database.md`
- `context/technical/environment.md`
- `prisma/schema.prisma`
- `prisma.config.ts`
- `dms_pegawai_schema.sql` when schema parity matters

Use `src/lib/prisma.ts` for Prisma Client access and `src/lib/env.ts` for environment variables. Do not create additional Prisma Client instances.

### Read for auth/security work

- `context/security/auth-flow.md`
- `context/security/rbac.md`
- `context/security/audit.md`
- `context/domain/rbac.md`

Sensitive changes require `security-auditor` review before PR.

### Read for domain/module work

- `context/domain/entities.md`
- `context/domain/business-rules.md`
- Relevant module files under `src/modules/<module>/`

Respect module boundaries: other modules may import only a module's `service.ts` public boundary.

## 4. Scope control: do not do extra work

Only implement what the current issue/task asks for.

Forbidden without explicit instruction:

- drive-by refactors;
- renaming files, symbols, or modules unrelated to the task;
- changing formatting across unrelated files;
- changing dependencies unrelated to the task;
- changing architecture decisions without an ADR/context update;
- modifying `.env` or real secrets;
- adding tests/frameworks not requested by the task;
- replacing the UI/design system;
- changing GitHub branch protection or repository settings;
- pushing, merging, rebasing, or deleting branches unless explicitly instructed by mes/user.

If you find unrelated problems, document them as notes or propose a follow-up issue. Do not fix them in the current branch.

## 5. Coding rules

- Follow `context/coding-standards/golden-rules.md`.
- Keep `page.tsx` thin: auth/role guard and render module components only.
- Client components must not call `fetch()` directly.
- Hooks call only their module's `api.ts`.
- Server Actions / Route Handlers call `service.ts`, not repositories directly.
- Cross-module calls go through the target module's `service.ts`.
- Validate all external input with Zod.
- Important/sensitive actions must create audit logs.
- Do not expose server secrets to client code.
- Do not import `src/lib/env.ts` from Client Components.

## 6. Verification rules

Run the narrowest useful checks during development, then run full gates before reporting completion.

For most code changes, final verification should include:

```bash
npm run lint
npm run typecheck
npm run build
```

For Prisma/database changes, also run:

```bash
npm run prisma:validate
npm run prisma:generate
```

For UI changes, inspect the app in a browser when possible.

If a command fails, stop and report the failure clearly. Do not claim success without real output.

## 7. Antigravity agent-skills usage

The `agent-skills` plugin is installed for Antigravity. Prefer these commands:

- `/planning` for task breakdown;
- `/build` for one small implementation slice;
- `/test` for testing workflow;
- `/review` for code quality review;
- `/ship` only for larger production-bound changes that need parallel reviewer fan-out.

Avoid `/build auto` unless a clear spec exists and mes/user explicitly approves autonomous multi-task execution.

Do not run Antigravity with `--dangerously-skip-permissions` for SIMDP unless the user explicitly accepts the risk.

## 8. Reviewer/persona routing

Use reviewers based on risk:

- `code-reviewer`: any non-trivial code change before PR.
- `test-engineer`: logic-heavy changes, bug fixes, auth, database, or flows lacking tests.
- `security-auditor`: auth, RBAC, secrets, env, database access, file upload, audit log, dependency/security changes.
- `web-performance-auditor`: dashboard, chart-heavy UI, page performance, Core Web Vitals concerns.

Reviewer fan-out must be flat: personas do not invoke other personas. mes or the main agent merges the reports.

## 9. Reporting format

When finishing a task, report:

- issue/branch;
- files changed;
- verification commands and results;
- known risks/debt;
- whether the recommended verdict is `APPROVE`, `REQUEST CHANGES`, or `HOLD`;
- exact next action for the user.

## 10. Safety defaults

Ask before high-risk actions:

- destructive file commands such as `rm -rf`;
- `git reset --hard`, force push, branch deletion, or history rewrite;
- production database migration or destructive Prisma commands;
- touching real secret files;
- changing package manager lockfiles outside dependency tasks;
- changing CI/CD, deployment, or repository settings.

When uncertain, stop and ask mes/user instead of guessing.
