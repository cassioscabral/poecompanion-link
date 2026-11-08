// Tail pattern adapted from Exiled Exchange 2 (MIT) — see NOTICE
import { promises as fsp } from "node:fs";

/**
 * Minimal second tail that surfaces EVERY raw line. log-core's watcher only emits parsed
 * events (and exposing raw lines would change its contract), so the desktop taps the file itself.
 */
export function createRawTail(path: string, onLine: (line: string) => void, intervalMs = 500) {
  let offset = 0;
  let pending = Buffer.alloc(0);
  let timer: NodeJS.Timeout | null = null;
  let running = false;
  let inFlight: Promise<void> = Promise.resolve();

  async function poll() {
    try {
      const st = await fsp.stat(path);
      if (st.size < offset) {
        offset = 0;
        pending = Buffer.alloc(0);
      }
      if (st.size === offset) return;
      const fh = await fsp.open(path, "r");
      try {
        const chunk = Buffer.alloc(st.size - offset);
        const { bytesRead } = await fh.read(chunk, 0, chunk.length, offset);
        offset += bytesRead;
        const all = Buffer.concat([pending, chunk.subarray(0, bytesRead)]);
        const last = all.lastIndexOf(0x0a);
        if (last === -1) {
          pending = all;
          return;
        }
        pending = all.subarray(last + 1);
        for (const l of all.subarray(0, last).toString("utf8").split(/\r?\n/)) {
          const clean = l.replace(/\r$/, "");
          if (clean) onLine(clean);
        }
      } finally {
        await fh.close();
      }
    } catch {
      // missing/unreadable: the main watcher already reports it
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
      running = true;
      try {
        offset = (await fsp.stat(path)).size;
      } catch {
        offset = 0;
      }
      schedule();
    },
    async stop() {
      running = false;
      if (timer) clearTimeout(timer);
      await inFlight;
    },
  };
}
