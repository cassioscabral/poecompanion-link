// Adapted from Exiled Exchange 2 (MIT) — see NOTICE
import { promises as fsp } from "node:fs";
import { parseLine } from "./parser";
import type { LogEvent, LogWatcher, LogWatcherOptions } from "./types";

export function createLogWatcher(opts: LogWatcherOptions): LogWatcher {
  const fromEnd = opts.fromEnd ?? true;
  const intervalMs = opts.intervalMs ?? 500;
  const eventCbs = new Set<(e: LogEvent) => void>();
  const errorCbs = new Set<(e: Error) => void>();

  let offset = 0;
  let ino: number | undefined;
  let pending: Buffer = Buffer.alloc(0);
  let timer: NodeJS.Timeout | null = null;
  let running = false;
  let inFlight: Promise<void> = Promise.resolve();
  let missingReported = false;

  const emitError = (err: unknown) => {
    const e = err instanceof Error ? err : new Error(String(err));
    for (const cb of [...errorCbs]) {
      try {
        cb(e);
      } catch {
        /* listener bugs must not kill the loop */
      }
    }
  };

  const handleLines = (buf: Buffer) => {
    const text = buf.toString("utf8");
    for (const line of text.split("\n")) {
      const clean = line.replace(/\r$/, "");
      if (!clean) continue;
      let ev: LogEvent | null = null;
      try {
        ev = parseLine(clean);
      } catch (err) {
        emitError(err);
      }
      if (!ev) continue;
      for (const cb of [...eventCbs]) {
        try {
          cb(ev);
        } catch (err) {
          emitError(err);
        }
      }
    }
  };

  async function poll(): Promise<void> {
    try {
      const st = await fsp.stat(opts.path);
      missingReported = false;
      if ((ino !== undefined && st.ino !== 0 && st.ino !== ino) || st.size < offset) {
        offset = 0; // rotated or truncated
        pending = Buffer.alloc(0);
      }
      ino = st.ino;
      if (st.size === offset) return;
      const fh = await fsp.open(opts.path, "r");
      try {
        const len = st.size - offset;
        const chunk = Buffer.alloc(len);
        const { bytesRead } = await fh.read(chunk, 0, len, offset);
        offset += bytesRead;
        const all = Buffer.concat([pending, chunk.subarray(0, bytesRead)]);
        const last = all.lastIndexOf(0x0a);
        if (last === -1) {
          pending = all;
        } else {
          pending = all.subarray(last + 1);
          handleLines(all.subarray(0, last));
        }
      } finally {
        await fh.close();
      }
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        offset = 0;
        pending = Buffer.alloc(0);
        ino = undefined;
        if (missingReported) return;
        missingReported = true;
      }
      emitError(err);
    }
  }

  const schedule = () => {
    if (!running) return;
    timer = setTimeout(() => {
      inFlight = poll().finally(schedule);
    }, intervalMs);
  };

  return {
    async start() {
      if (running) return;
      running = true;
      offset = 0;
      pending = Buffer.alloc(0);
      ino = undefined;
      if (fromEnd) {
        try {
          const st = await fsp.stat(opts.path);
          offset = st.size;
          ino = st.ino;
        } catch (err) {
          if ((err as NodeJS.ErrnoException).code === "ENOENT") missingReported = true;
          emitError(err);
        }
      }
      schedule();
    },
    async stop() {
      running = false;
      if (timer) clearTimeout(timer);
      timer = null;
      await inFlight;
    },
    onEvent(cb) {
      eventCbs.add(cb);
      return () => void eventCbs.delete(cb);
    },
    onError(cb) {
      errorCbs.add(cb);
      return () => void errorCbs.delete(cb);
    },
  };
}
