/build

You are Antigravity acting as the developer agent for SIMDP. Hermes/mes is only orchestrating/reviewing.

## Task

Fix the current Vitest warning without changing production code:

```txt
The plugin "vite-tsconfig-paths" is detected. Vite now supports tsconfig paths resolution natively via the resolve.tsconfigPaths option. You can remove the plugin and set resolve.tsconfigPaths: true in your Vite config instead.
```

## Requirements

- Update `vitest.config.ts` to use Vite native `resolve.tsconfigPaths: true` if supported by the installed versions.
- Remove `vite-tsconfig-paths` dependency from `package.json` / `package-lock.json` if no longer needed.
- Do not touch production source code.
- Do not modify `.env` or print secrets.
- Do not commit/push/merge.
- Run `npm run test`, `npm run lint`, and `npm run typecheck`.

## Final output
Report files changed and verification result.
