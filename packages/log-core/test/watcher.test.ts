import { appendFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createLogWatcher, type LogEvent } from "../src";

const P = "2026/05/01 20:00:00 1 ab [INFO Client 1] ";
const death = (n: string) => `${P}: ${n} has been slain.\n`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function until(f: () => boolean, ms = 3000) {
  const end = Date.now() + ms;
  while (!f() && Date.now() < end) await sleep(10);
}

let dir: string, file: string;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "logcore-")); file = join(dir, "Client.txt"); });
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function setup(fromEnd?: boolean) {
  const w = createLogWatcher({ path: file, intervalMs: 20, fromEnd });
  const events: LogEvent[] = [];
  const errors: Error[] = [];
  w.onEvent((e) => events.push(e));
  w.onError((e) => errors.push(e));
  return { w, events, errors };
}
const chars = (ev: LogEvent[]) => ev.map((e) => (e.type === "death" ? e.character : "?"));

describe("watcher", () => {
  it("fromEnd skips existing content, then tails appends (CRLF ok)", async () => {
    writeFileSync(file, death("Old"));
    const { w, events } = setup();
    await w.start();
    appendFileSync(file, death("A").replace("\n", "\r\n") + death("B"));
    await until(() => events.length >= 2);
    await w.stop();
    expect(chars(events)).toEqual(["A", "B"]);
  });
  it("fromEnd=false replays whole file", async () => {
    writeFileSync(file, death("Old"));
    const { w, events } = setup(false);
    await w.start();
    await until(() => events.length >= 1);
    await w.stop();
    expect(chars(events)).toEqual(["Old"]);
  });
  it("buffers a partial last line", async () => {
    writeFileSync(file, "");
    const { w, events } = setup();
    await w.start();
    const line = death("Split");
    appendFileSync(file, line.slice(0, 30));
    await sleep(120);
    expect(events).toHaveLength(0);
    appendFileSync(file, line.slice(30));
    await until(() => events.length >= 1);
    await w.stop();
    expect(chars(events)).toEqual(["Split"]);
  });
  it("resets on truncation", async () => {
    writeFileSync(file, death("Before") + death("Padding"));
    const { w, events } = setup();
    await w.start();
    writeFileSync(file, death("After"));
    await until(() => events.length >= 1);
    await w.stop();
    expect(chars(events)).toEqual(["After"]);
  });
  it("missing file reports once, then picks the file up when created", async () => {
    const { w, events, errors } = setup();
    await w.start();
    await sleep(120);
    expect(errors).toHaveLength(1);
    writeFileSync(file, death("Late"));
    await until(() => events.length >= 1);
    await w.stop();
    expect(chars(events)).toEqual(["Late"]);
    expect(errors).toHaveLength(1);
  });
  it("throwing listeners go to onError, unsubscribe works", async () => {
    writeFileSync(file, "");
    const { w, errors } = setup();
    const off = w.onEvent(() => { throw new Error("boom"); });
    await w.start();
    appendFileSync(file, death("X"));
    await until(() => errors.length >= 1);
    off();
    await w.stop();
    expect(errors[0].message).toBe("boom");
  });
});
