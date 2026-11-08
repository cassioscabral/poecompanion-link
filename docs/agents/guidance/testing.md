# Testing

Everything runs without the game, a network, or an Electron binary:

```bash
ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm ci
npm run lint && npm run format:check && npm run typecheck && npm test
```

Tests use vitest and live next to each package (`test/`) or beside the source in
`apps/desktop`.

## Fixtures first

When GGG changes the `Client.txt` format:

1. Add real lines, redacted with `redactLine`, to `packages/log-core/test/fixtures/`.
   Check by eye that no character, account, guild, or path names remain.
2. Add a failing parser test that reads the fixture.
3. Fix the parser until it passes.

Real logs never enter the repo, not even briefly in a commit history.

## Watcher tests with a temp file

Create a temp dir, write a fake `Client.txt`, point `createLogWatcher` at it, append lines,
and wait for events. See `packages/log-core/test/watcher.test.ts`:

```ts
let dir: string, file: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "logcore-"));
  file = join(dir, "Client.txt");
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const w = createLogWatcher({ path: file, intervalMs: 20, fromEnd: true });
w.onEvent((e) => events.push(e));
await w.start();
appendFileSync(file, line);
await until(() => events.length >= 1); // poll with a deadline, never a fixed sleep
await w.stop();
```

Cover CRLF, truncation or rotation, and a missing file.
