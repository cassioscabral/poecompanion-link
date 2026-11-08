# Architecture

| Package              | Role                                                                               |
| -------------------- | ---------------------------------------------------------------------------------- |
| `packages/log-core`  | Parses `Client.txt` lines into events, tails the file, redacts lines. No Electron. |
| `packages/item-core` | Parses the item text the game puts on the clipboard. Pure functions.               |
| `apps/desktop`       | Electron app: main process, preload, renderer.                                     |

## Data flow

```
Client.txt  ->  log-core watcher/parser  ->  main process (log-service)
                                                 |-> settings, events ring buffer
                                                 |-> IPC via preload (typed channels)
                                                 `-> renderer UI
```

- The main process owns all file access. The renderer never touches the filesystem.
- The raw tail (`apps/desktop/src/main/raw-tail.ts`) keeps recent raw lines in a ring buffer
  so the user can export a redacted sample for bug reports. Redaction happens before export.
- v0 has no network code. Anything that adds a network call is a new data flow: it needs a
  `docs/WHAT-WE-READ.md` update and maintainer sign-off.
- Keep parsing logic in the core packages so it stays testable without Electron.
