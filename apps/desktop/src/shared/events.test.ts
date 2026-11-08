import type { LogEvent } from "@poecompanion/log-core";
import { describe, expect, it } from "vitest";
import { addEvent, addRaw, describeEvent } from "./events";

const ev = (n: number): LogEvent => ({ type: "death", character: `c${n}`, ts: "2026/01/01 00:00:00", raw: `r${n}` });

describe("event list reducer", () => {
  it("puts newest first", () => {
    expect(addEvent([ev(1)], ev(2)).map((e) => e.raw)).toEqual(["r2", "r1"]);
  });
  it("caps the list", () => {
    let l: LogEvent[] = [];
    for (let i = 0; i < 250; i++) l = addEvent(l, ev(i));
    expect(l).toHaveLength(200);
    expect(l[0].raw).toBe("r249");
  });
  it("does not mutate", () => {
    const l = [ev(1)];
    addEvent(l, ev(2));
    expect(l).toHaveLength(1);
  });
  it("caps raw lines", () => {
    let r: string[] = [];
    for (let i = 0; i < 10; i++) r = addRaw(r, String(i), 3);
    expect(r).toEqual(["7", "8", "9"]);
  });
  it("describes a trade whisper", () => {
    const e: LogEvent = {
      type: "whisper_in", from: "Bob", message: "hi", ts: "t", raw: "r",
      trade: { item: "Sapphire Ring", price: { amount: 5, currency: "divine" } },
    };
    expect(describeEvent(e)).toBe("Bob: wants Sapphire Ring for 5 divine");
  });
});
