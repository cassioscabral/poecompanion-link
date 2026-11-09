# PoE Companion Link

A small, open-source desktop app that connects **Path of Exile 2** on your PC to
[PoE Companion](https://www.poecompanion.com): trade alerts while you're AFK, a campaign
tracker, and item lookups, without touching the game client.

> **Status: early test build.** [v0.1.0](https://github.com/cassioscabral/poecompanion-link/releases/tag/v0.1.0)
> reads the game log (opt-in) and notifies you of trade whispers. Builds are not code-signed
> yet, so Windows SmartScreen will warn: "More info" → "Run anyway".

## What it reads, and what it never does

Read [docs/WHAT-WE-READ.md](docs/WHAT-WE-READ.md). The short version:

- **Reads** the game's `Client.txt` log file, **only if you turn it on**. GGG allows this when
  the user knows about it.
- **Reads** the clipboard after **you** press Ctrl+C on an item.
- **Never** reads game memory, injects into the client, reads your screen, asks for your
  POESESSID, or sends keys to the game on its own.

## Repository layout

| Path                 | What                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| `packages/log-core`  | Parses `Client.txt` lines into events (zone, level up, death, AFK, whispers, trade requests) and tails the file |
| `packages/item-core` | Parses the item text the game puts on the clipboard                                                             |
| `apps/desktop`       | The Electron app players install                                                                                |

## Develop

```bash
npm install
npm test          # all packages, no game needed
npm run typecheck
```

## Contributing

PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md). **Never commit a real `Client.txt`.**
Use the app's "export redacted sample" or the fixtures in `packages/log-core/test/fixtures`.

## Credits

Patterns and test fixtures are adapted from MIT-licensed projects:
[Exiled Exchange 2](https://github.com/Kvan7/Exiled-Exchange-2) and
[Awakened PoE Trade](https://github.com/SnosMe/awakened-poe-trade). See `NOTICE`.

This product isn't affiliated with or endorsed by Grinding Gear Games in any way.
