import type { LogEvent } from "@poecompanion/log-core";

export interface Settings {
  /** Opt-in: the app reads Client.txt only when this is true. */
  readLog: boolean;
  /** User override for Client.txt; null = auto-detect. */
  logPath: string | null;
}

export const DEFAULT_SETTINGS: Settings = { readLog: false, logPath: null };

export interface LogStatus {
  path: string | null;
  found: boolean;
  watching: boolean;
  /** Human-readable problem (log-core missing, file unreadable...). */
  error: string | null;
}

export interface AppState {
  settings: Settings;
  status: LogStatus;
  events: LogEvent[];
  version: string;
}

export type ExportResult =
  { ok: true; file: string; lines: number } | { ok: false; reason: string };

/** The only surface the renderer can reach. */
export interface CompanionApi {
  getState(): Promise<AppState>;
  setReadLog(on: boolean): Promise<AppState>;
  setLogPath(path: string | null): Promise<AppState>;
  browseLogPath(): Promise<AppState>;
  exportSample(onlyChat: boolean): Promise<ExportResult>;
  onEvent(cb: (e: LogEvent) => void): () => void;
  onStatus(cb: (s: LogStatus) => void): () => void;
}

export const CH = {
  getState: "app:get-state",
  setReadLog: "app:set-read-log",
  setLogPath: "app:set-log-path",
  browseLogPath: "app:browse-log-path",
  exportSample: "app:export-sample",
  event: "app:event",
  status: "app:status",
} as const;
