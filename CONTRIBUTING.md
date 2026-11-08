# Contributing

Thanks for helping! A few rules keep this app safe for players' accounts:

1. **Stay inside [WHAT-WE-READ.md](docs/WHAT-WE-READ.md).** PRs that add memory reading, OCR,
   POESESSID use, or automated in-game input will be closed.
2. **One user keypress → one game action.** No timers, no file-change triggers that type in game.
3. **No real player logs in the repo.** Fixtures must be redacted (`redactLine` in log-core).
4. Add or update tests. `npm test` must pass, and it needs no game or network.
5. Keep dependencies few. Every new runtime dependency needs a reason in the PR.

## Log format changes

When GGG changes the `Client.txt` format, add the new real (redacted) lines to
`packages/log-core/test/fixtures/` first, then fix the parser.
