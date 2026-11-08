export * from "./types";
import type { LogEvent, LogWatcher, LogWatcherOptions } from "./types";

// STUBS — replaced by the log-core implementation. Signatures are the contract.
export function parseLine(_line: string): LogEvent | null {
  throw new Error("not implemented");
}

export function createLogWatcher(_opts: LogWatcherOptions): LogWatcher {
  throw new Error("not implemented");
}

/** Default Client.txt locations per platform (GGG standalone + Steam). */
export function defaultLogPaths(_platform: NodeJS.Platform, _home: string): string[] {
  throw new Error("not implemented");
}

/** Replace character/account names in a line with stable placeholders, for shareable samples. */
export function redactLine(_line: string): string {
  throw new Error("not implemented");
}
