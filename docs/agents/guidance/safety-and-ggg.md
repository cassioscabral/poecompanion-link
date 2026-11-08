# Safety and Grinding Gear Games rules

Players trust this app with accounts that can be banned. Source of truth for the rules:
https://www.pathofexile.com/developer/docs (re-read it when in doubt; it can change).

## What GGG's rules mean for this repo

- Executables must not interact with game files beyond reading logs the user knowingly
  provides. We read `Client.txt` only after the user enables it. We never write to game files.
- Macros must be a single action per user-invoked keypress. No timers, no file-change or
  log-event triggers that produce input, no loops, no "reply to every whisper".
- No memory reading, injection, hooks into the client, OCR, or screen capture.
- No POESESSID, passwords, or session cookies, ever. Not stored, not logged, not sent.
- Public APIs are called from the user's IP, respecting rate limits and `Retry-After`.
- The disclaimer "This product isn't affiliated with or endorsed by Grinding Gear Games in
  any way" stays in the README and the app.

## Why it matters

A feature that crosses these lines can get players' accounts banned, and the project
delisted. A convenient feature is never worth that. When unsure, do not add it; ask a
maintainer in an issue first.

## Enforcement in the repo

- `eslint.config.mjs` blocks importing input-automation libraries (robotjs, @nut-tree/*,
  node-key-sender, uiohook-napi, ...) outside an allowlisted file. An allowlist change needs
  explicit maintainer approval and a `docs/WHAT-WE-READ.md` update.
- The PR template carries a safety checklist. CODEOWNERS routes everything to a maintainer.
- Never commit real logs. `**/Client.txt` is gitignored; use `redactLine` for fixtures.
