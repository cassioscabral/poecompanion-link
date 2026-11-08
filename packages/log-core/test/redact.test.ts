import { describe, expect, it } from "vitest";
import { createRedactor, parseLine, redactLine } from "../src";

const P = "2026/05/01 20:00:00 1000000 abcd1234 [INFO Client 1234] ";

describe("redaction", () => {
  it("stable placeholders per instance and still parseable", () => {
    const r = createRedactor();
    const a = r.redactLine(`${P}@From <MyGuild> Bob: hi`);
    const b = r.redactLine(`${P}@To Bob: hello`);
    const c = r.redactLine(`${P}@From Alice: hey`);
    expect(a).toBe(`${P}@From <Guild1> Player1: hi`);
    expect(b).toBe(`${P}@To Player1: hello`);
    expect(c).toContain("Player2");
    expect(parseLine(a)).toMatchObject({ type: "whisper_in", from: "Player1" });
  });
  it("level up, death, guild join", () => {
    const r = createRedactor();
    const lv = r.redactLine(`${P}: Secret_Name (Mercenary) is now level 5`);
    expect(lv).not.toContain("Secret_Name");
    expect(parseLine(lv)).toMatchObject({ type: "level_up", character: "Player1", className: "Mercenary", level: 5 });
    expect(parseLine(r.redactLine(`${P}: Secret_Name has been slain.`))).toMatchObject({ type: "death", character: "Player1" });
    expect(r.redactLine(`${P}Joined guild named Some guild'e with 107 members`)).toContain("Guild1 with 107 members");
  });
  it("trade request keeps its parsed trade", () => {
    const l = `${P}@From Zed: Hi, I would like to buy your Ring listed for 1 Chaos Orb in Standard (stash tab "T"; position: left 1, top 2)`;
    expect(parseLine(redactLine(l))).toMatchObject({ trade: { item: "Ring" } });
  });
  it("scrubs Windows user names in paths and leaves other lines alone", () => {
    const r = createRedactor();
    expect(r.redactLine(`${P}[ENGINE] Cache directory: C:\\\\Users\\\\kvan\\\\AppData`)).not.toContain("kvan");
    expect(r.redactLine("not a log line")).toBe("not a log line");
  });
});
