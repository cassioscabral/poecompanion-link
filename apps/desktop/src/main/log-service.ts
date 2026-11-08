import fs from "node:fs";
import os from "node:os";
import { createLogWatcher, defaultLogPaths, type LogEvent, type LogWatcher } from "@poecompanion/log-core";
import { createRawTail } from "./raw-tail";
import type { LogStatus, Settings } from "../shared/types";

export interface LogServiceHooks {
  onEvent(e: LogEvent): void;
  onStatus(s: LogStatus): void;
  onRawLine(line: string): void;
}

/** Wraps log-core so a failure becomes an error state in the UI, never a crash. */
export class LogService {
  private watcher: LogWatcher | null = null;
  private tail: { stop(): Promise<void> } | null = null;
  private offs: Array<() => void> = [];
  private _status: LogStatus = { path: null, found: false, watching: false, error: null };

  constructor(private hooks: LogServiceHooks) {}

  get status(): LogStatus {
    return this._status;
  }

  private set(s: Partial<LogStatus>) {
    this._status = { ...this._status, ...s };
    this.hooks.onStatus(this._status);
  }

  resolvePath(settings: Settings): { path: string | null; error: string | null } {
    if (settings.logPath) return { path: settings.logPath, error: null };
    try {
      const candidates = defaultLogPaths(process.platform, os.homedir());
      return { path: candidates.find((p) => fs.existsSync(p)) ?? candidates[0] ?? null, error: null };
    } catch (err) {
      return { path: null, error: `Could not detect the log location: ${msg(err)}` };
    }
  }

  /** Apply settings: start, restart or stop the watcher. */
  async apply(settings: Settings): Promise<void> {
    await this.stop();
    const { path, error } = this.resolvePath(settings);
    const found = !!path && fs.existsSync(path);
    this.set({ path, found, watching: false, error });
    if (!settings.readLog || !path || !found) return;
    try {
      const w = createLogWatcher({ path });
      this.offs.push(w.onEvent((e) => this.hooks.onEvent(e)));
      this.offs.push(w.onError((err) => this.set({ error: msg(err) })));
      await w.start();
      const t = createRawTail(path, (l) => this.hooks.onRawLine(l));
      await t.start();
      this.tail = t;
      this.watcher = w;
      this.set({ watching: true, error: null });
    } catch (err) {
      this.set({ watching: false, error: `Could not start reading the log: ${msg(err)}` });
    }
  }

  async stop(): Promise<void> {
    this.offs.forEach((f) => f());
    this.offs = [];
    const w = this.watcher;
    this.watcher = null;
    const t = this.tail;
    this.tail = null;
    try {
      await t?.stop();
      await w?.stop();
    } catch {
      // ignore: shutting down
    }
  }
}

function msg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
