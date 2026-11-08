import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createSettingsStore, sanitize } from "./settings";

const tmp = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), "pcl-")), "sub", "settings.json");

describe("settings store", () => {
  it("defaults to log reading OFF with no file", () => {
    expect(createSettingsStore(tmp()).get()).toEqual({ readLog: false, logPath: null });
  });
  it("persists and reloads", () => {
    const f = tmp();
    createSettingsStore(f).update({ readLog: true, logPath: "/x/Client.txt" });
    expect(createSettingsStore(f).get()).toEqual({ readLog: true, logPath: "/x/Client.txt" });
  });
  it("falls back to defaults on a corrupt file", () => {
    const f = tmp();
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, "{not json");
    expect(createSettingsStore(f).get().readLog).toBe(false);
  });
  it("sanitize only accepts strict values", () => {
    expect(sanitize({ readLog: "true", logPath: "  " })).toEqual({ readLog: false, logPath: null });
    expect(sanitize(null)).toEqual({ readLog: false, logPath: null });
  });
});
