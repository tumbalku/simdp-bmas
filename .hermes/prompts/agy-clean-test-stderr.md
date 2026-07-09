/build

You are Antigravity developer agent for SIMDP. Hermes/mes is orchestrator/reviewer.

## Task

Clean the remaining stderr noise in `npm run test` without changing production code. Current passing test suite still prints expected console.error output from the unauthenticated document stream route test:

```txt
stderr | tests/integration/api/documents.test.ts > Documents Stream Integration API > should return 401 if unauthenticated
Local file streaming error: Error: UNAUTHENTICATED
```

## Requirements

- Modify only tests/setup/test files if possible.
- Suppress or spy on expected `console.error` in the specific test where the error is intentionally triggered.
- Do not weaken the assertion; the test must still assert 401 and UNAUTHENTICATED.
- Do not change production source code.
- Do not commit/push/merge.
- Run `npm run test`, `npm run lint`, and `npm run typecheck`.

Report files changed and verification.
