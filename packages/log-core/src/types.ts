// Shared contract between log-core and the desktop app. Change only with both sides updated.

export interface TradeRequest {
  /** Item name as written in the whisper, e.g. "Sapphire Ring" or "3 Divine Orb". */
  item: string;
  price?: { amount: number; currency: string };
  league?: string;
  stashTab?: string;
  position?: { left: number; top: number };
}

interface Base {
  /** Timestamp exactly as written in the log, "YYYY/MM/DD HH:MM:SS". */
  ts: string;
  /** The original log line, for debugging and redacted exports. */
  raw: string;
}

export type LogEvent =
  | (Base & { type: "game_start" })
  | (Base & { type: "zone_entered"; zoneName?: string; zoneId?: string; areaLevel?: number })
  | (Base & { type: "level_up"; character: string; className?: string; level: number })
  | (Base & { type: "death"; character: string })
  | (Base & { type: "whisper_in"; from: string; message: string; trade?: TradeRequest })
  | (Base & { type: "whisper_out"; to: string; message: string; trade?: TradeRequest })
  | (Base & { type: "afk"; on: boolean; autoReply?: string });

export interface LogWatcherOptions {
  /** Absolute path to Client.txt. */
  path: string;
  /** Start reading at the current end of file (default true). False = replay the whole file. */
  fromEnd?: boolean;
  /** Poll interval in ms (default 500). */
  intervalMs?: number;
}

export interface LogWatcher {
  start(): Promise<void>;
  stop(): Promise<void>;
  onEvent(cb: (e: LogEvent) => void): () => void;
  onError(cb: (err: Error) => void): () => void;
}
