# PoE Companion Link: agent entrypoint

Open-source (MIT) Electron app that connects Path of Exile 2 on the player's PC to
PoE Companion. npm workspaces: `packages/log-core` (Client.txt parser + tailer),
`packages/item-core` (clipboard item parser), `apps/desktop` (Electron).

## Safety boundary (non-negotiable)

Read [docs/WHAT-WE-READ.md](docs/WHAT-WE-READ.md) before any change. Allowed sources only:

- `Client.txt`, and only after the user opts in
- the clipboard, only right after the user pressed Ctrl+C on an item
- public APIs, called from the user's own IP

NEVER: read game memory, inject into the client, OCR or screenshot the game, touch
POESESSID or passwords, or send automated input. One user keypress means one action.
Never commit a real `Client.txt` or any real player log; fixtures must be redacted.
ESLint blocks input-automation libraries. Do not work around it.

## Working here

- `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm test` must all pass.
  No game, network, or Electron binary is needed (`ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm ci`).
- Log format changed? Add redacted real lines to `packages/log-core/test/fixtures/` first.
- New data source or behavior change? Update `docs/WHAT-WE-READ.md` in the same PR.
- Keep runtime dependencies minimal; justify each new one in the PR.
- Do not push, tag, or publish releases. Maintainers do that.

## More

Index: [docs/agents/README.md](docs/agents/README.md) (safety and GGG rules, testing,
release, architecture, living docs). Human contributors: [CONTRIBUTING.md](CONTRIBUTING.md).
