/build

You are Antigravity developer agent for SIMDP. Hermes/mes is orchestrator/reviewer.

## Task

Clean expected stderr noise introduced by the new document API integration tests. The full suite passes, but `npm run test` prints expected `console.error` output from these negative tests:

- POST /api/v1/documents/upload unauthenticated
- GET /api/v1/documents/download/[id] unauthenticated
- GET /api/v1/documents/download/[id] ownership error
- GET /api/v1/documents/download/[id] not found

## Requirements

- Modify only test files if possible, likely `tests/integration/api/documents.test.ts`.
- Suppress or spy on expected `console.error` in the specific tests where route errors are intentionally triggered.
- Keep assertions strong: still verify status codes and error codes/messages.
- Do not change production source code.
- Do not modify `.env` or print secrets.
- Do not commit/push/merge.
- Run `npm run test`, `npm run lint`, and `npm run typecheck`.

## Final output
Report files changed and verification result.
