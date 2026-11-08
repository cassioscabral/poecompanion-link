import { describe, expect, it } from "vitest";
import { keepChatOrUnknown, pushRaw, selectForExport } from "./raw";

const parse = (l: string) => (l.includes("known") ? { ok: true } : null);

describe("raw buffer", () => {
  it("keeps only the last N lines", () => {
    let b: string[] = [];
    for (let i = 0; i < 12; i++) b = pushRaw(b, String(i), 5);
    expect(b).toEqual(["7", "8", "9", "10", "11"]);
  });
  it("defaults to 5000", () => {
    let b: string[] = [];
    for (let i = 0; i < 5100; i++) b = pushRaw(b, String(i));
    expect(b).toHaveLength(5000);
    expect(b[4999]).toBe("5099");
  });
});

describe("chat & unknown filter", () => {
  it("drops DEBUG noise even if unparsed", () => {
    expect(keepChatOrUnknown("2026/01/01 00:00:00 1 a [DEBUG Client 4] x", parse)).toBe(false);
  });
  it("keeps whispers and system messages", () => {
    expect(keepChatOrUnknown("... [INFO Client 4] @From Bob: known", parse)).toBe(true);
    expect(keepChatOrUnknown("... [INFO Client 4] @To Bob: known", parse)).toBe(true);
    expect(keepChatOrUnknown("... [INFO Client 4] : known thing", parse)).toBe(true);
  });
  it("keeps unparsed lines, drops parsed non-chat lines", () => {
    expect(keepChatOrUnknown("... [INFO Client 4] weird format", parse)).toBe(true);
    expect(keepChatOrUnknown("... [INFO Client 4] known", parse)).toBe(false);
  });
  it("selectForExport honours the flag", () => {
    const lines = ["[DEBUG] a", "@From x", "known"];
    expect(selectForExport(lines, false, parse)).toEqual(lines);
    expect(selectForExport(lines, true, parse)).toEqual(["@From x"]);
  });
});
