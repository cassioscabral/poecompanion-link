## What and why

## Safety checklist

- [ ] No new data source. If there is one, `docs/WHAT-WE-READ.md` is updated in this PR
- [ ] No automated input: one user keypress triggers at most one action
- [ ] No memory reading, injection, OCR, or POESESSID handling
- [ ] No real logs or player names committed (fixtures are redacted)
- [ ] Tests added or updated; `npm run lint`, `format:check`, `typecheck`, `test` pass
- [ ] Any new runtime dependency is justified above
