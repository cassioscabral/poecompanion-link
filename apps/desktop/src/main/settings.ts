import fs from "node:fs";
import path from "node:path";
import { DEFAULT_SETTINGS, type Settings } from "../shared/types";

/** Coerce unknown JSON into valid Settings; anything wrong falls back to the default (opt-out). */
export function sanitize(raw: unknown): Settings {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    readLog: o.readLog === true,
    logPath: typeof o.logPath === "string" && o.logPath.trim() !== "" ? o.logPath : null,
  };
}

export interface SettingsStore {
  get(): Settings;
  update(patch: Partial<Settings>): Settings;
}

export function createSettingsStore(file: string): SettingsStore {
  let current: Settings = { ...DEFAULT_SETTINGS };
  try {
    current = sanitize(JSON.parse(fs.readFileSync(file, "utf8")));
  } catch {
    // missing or corrupt file: defaults (log reading OFF)
  }
  return {
    get: () => ({ ...current }),
    update(patch) {
      current = sanitize({ ...current, ...patch });
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(current, null, 2));
      return { ...current };
    },
  };
}
