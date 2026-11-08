import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseLine } from "../src";

const load = (f: string) =>
  readFileSync(new URL(`./fixtures/${f}`, import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"));
const real = load("real-ee2.log");
const syn = load("synthetic-whispers.log");

describe("real EE2 lines", () => {
  it("game_start", () => {
    expect(parseLine(real[0])).toMatchObject({ type: "game_start", ts: "2026/04/26 09:28:48" });
  });
  it("zone_entered via Set Source; (null)/(unknown) ignored", () => {
    expect(parseLine(real[1])).toMatchObject({
      type: "zone_entered",
      zoneName: "Clearfell Encampment",
    });
    expect(parseLine(real[2])).toBeNull();
    expect(parseLine(real[3])).toBeNull();
  });
  it("zone_entered via area generation", () => {
    expect(parseLine(real[4])).toMatchObject({
      type: "zone_entered",
      zoneId: "G2_1",
      areaLevel: 16,
    });
  });
  it("level_up", () => {
    expect(parseLine(real[5])).toMatchObject({
      type: "level_up",
      character: "Kvan_seven_abyss",
      className: "Mercenary",
      level: 16,
    });
  });
  it("death", () => {
    expect(parseLine(real[6])).toMatchObject({ type: "death", character: "Kvan_seven_abyss" });
  });
  it("unknown lines -> null", () => {
    for (const l of real.slice(7)) expect(parseLine(l)).toBeNull();
    expect(parseLine("")).toBeNull();
    expect(parseLine("garbage")).toBeNull();
    expect(parseLine("2026/04/26 09:28:47 ***** LOG FILE OPENING *****")).toBeNull();
  });
  it("keeps raw and tolerates CRLF", () => {
    const e = parseLine(real[6] + "\r\n");
    expect(e?.raw).toBe(real[6]);
    expect(e).toMatchObject({ type: "death" });
  });
});

describe("synthetic whispers", () => {
  it("full trade request", () => {
    expect(parseLine(syn[0])).toMatchObject({
      type: "whisper_in",
      from: "BuyerOne",
      trade: {
        item: "Sapphire Ring",
        price: { amount: 5, currency: "Exalted Orb" },
        league: "Standard",
        stashTab: "Trade",
        position: { left: 3, top: 7 },
      },
    });
  });
  it("guild tag stripped, decimals and league with spaces", () => {
    const e = parseLine(syn[1]);
    expect(e).toMatchObject({
      type: "whisper_in",
      from: "BuyerTwo",
      trade: {
        price: { amount: 0.5, currency: "Divine Orb" },
        league: "Dawn of the Hunt",
        stashTab: "~price 1 div",
      },
    });
  });
  it("bulk currency (outgoing)", () => {
    expect(parseLine(syn[2])).toMatchObject({
      type: "whisper_out",
      to: "SellerOne",
      trade: {
        item: "3 Divine Orb",
        price: { amount: 450, currency: "Exalted Orb" },
        league: "Standard",
      },
    });
  });
  it("plain whisper has no trade", () => {
    const e = parseLine(syn[3]);
    expect(e).toMatchObject({ type: "whisper_in", message: "hey, still selling?" });
    expect(e).not.toHaveProperty("trade");
  });
  it("afk on/off", () => {
    expect(parseLine(syn[4])).toMatchObject({
      type: "afk",
      on: true,
      autoReply: "Busy, back soon: thanks",
    });
    const off = parseLine(syn[5]);
    expect(off).toMatchObject({ type: "afk", on: false });
    expect(off).not.toHaveProperty("autoReply");
  });
});
