import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isPoeItemText, normalizeModText, parseItemText } from "../src/index";

const fx = (name: string) =>
  readFileSync(new URL(`./fixtures/${name}.txt`, import.meta.url), "utf8");
const parse = (name: string) => {
  const item = parseItemText(fx(name));
  if (!item) throw new Error(`fixture ${name} did not parse`);
  return item;
};

describe("isPoeItemText", () => {
  it("accepts item texts", () => {
    expect(isPoeItemText(fx("normal-helmet"))).toBe(true);
    expect(isPoeItemText(fx("meta-skill-gem"))).toBe(true); // starts at Rarity
    expect(isPoeItemText(fx("plain-unique-mirrored-crlf"))).toBe(true);
  });
  it("rejects other text", () => {
    for (const t of ["", "hello", "Item Class: Rings", "Rarity: Rare", "@From x: hi", "\n\n"]) {
      expect(isPoeItemText(t)).toBe(false);
    }
  });
});

describe("normalizeModText", () => {
  it("replaces digits and strips links", () => {
    expect(normalizeModText("+26% to [Resistances|Fire Resistance]")).toBe(
      "+#% to Fire Resistance",
    );
    expect(normalizeModText("Adds 1(1-4) to 50(46-66) Lightning Damage")).toBe(
      "Adds # to # Lightning Damage",
    );
    expect(normalizeModText("Leeches 7.59% of [Physical] Damage")).toBe(
      "Leeches #% of Physical Damage",
    );
  });
});

describe("fixtures", () => {
  it("normal armour", () => {
    const i = parse("normal-helmet");
    expect(i).toMatchObject({
      itemClass: "Helmets",
      rarity: "Normal",
      name: "Superior Divine Crown",
      baseType: "Divine Crown",
      itemLevel: 81,
      quality: 9,
    });
    expect(i.requirements).toEqual({ level: 75, str: 67, int: 67 });
    expect(i.properties["Armour"]).toContain("174");
    expect(i.modifiers).toEqual([]);
  });

  it("normal shield with note and granted skill", () => {
    const i = parse("normal-shield");
    expect(i.grantsSkill).toBe("Raise Shield");
    expect(i.note).toBe("~b/o 1 aug");
  });

  it("magic with advanced tiers and ranges", () => {
    const i = parse("magic-two-hand-mace-advanced");
    expect(i.rarity).toBe("Magic");
    expect(i.name).toBe("Crackling Temple Maul of the Brute");
    expect(i.modifiers).toEqual([
      {
        text: "Adds 1 to 50 Lightning Damage",
        kind: "explicit",
        tier: 7,
        affix: "prefix",
        name: "Crackling",
        ranges: [1, 4, 46, 66],
        values: [1, 50],
      },
      {
        text: "+8 to Strength",
        kind: "explicit",
        tier: 8,
        affix: "suffix",
        name: "of the Brute",
        ranges: [5, 8],
        values: [8],
      },
    ]);
  });

  it("rare with advanced mods", () => {
    const i = parse("rare-bow-advanced");
    expect(i).toMatchObject({
      rarity: "Rare",
      name: "Oblivion Strike",
      baseType: "Rider Bow",
      itemLevel: 80,
    });
    expect(i.modifiers.map((m) => m.tier)).toEqual([4, 5, 8, 1, 1]);
    expect(i.modifiers.at(-1)).toMatchObject({
      text: "15% increased Light Radius",
      kind: "explicit",
      tier: 1,
    });
  });

  it("rare with implicit", () => {
    const i = parse("rare-ring-implicit");
    expect(i.modifiers[0]).toMatchObject({
      kind: "implicit",
      text: "+8% to all Elemental Resistances",
      ranges: [7, 10],
    });
    expect(i.modifiers.filter((m) => m.kind === "explicit")).toHaveLength(5);
  });

  it("advanced unique with flavour text", () => {
    const i = parse("unique-focus-advanced");
    expect(i).toMatchObject({
      rarity: "Unique",
      name: "The Eternal Spark",
      baseType: "Crystal Focus",
    });
    expect(i.modifiers).toHaveLength(5);
    expect(i.modifiers[0]).toMatchObject({
      kind: "explicit",
      text: "56% increased Energy Shield",
      values: [56],
    });
    expect(i.flavourText).toHaveLength(2);
  });

  it("plain unique with CRLF, flavour and mirrored", () => {
    const raw = fx("plain-unique-mirrored-crlf");
    expect(raw).toContain("\r\n");
    const i = parse("plain-unique-mirrored-crlf");
    expect(i.mirrored).toBe(true);
    expect(i.modifiers.map((m) => m.text)).toEqual([
      "56% increased Energy Shield",
      "+26% to Lightning Resistance",
      "40% increased Mana Regeneration Rate",
    ]);
    expect(i.flavourText?.[0]).toMatch(/^A flash of blue/);
    // Same result when the text uses LF only.
    expect(parseItemText(raw.replace(/\r\n/g, "\n"))).toEqual(i);
  });

  it("plain rare with trailing markers and bracket links", () => {
    const i = parse("plain-rare-markers");
    expect(i.modifiers).toEqual([
      { text: "+8% to all Elemental Resistances", kind: "implicit" },
      { text: "+143 to Evasion Rating", kind: "explicit" },
      { text: "+12 to Strength", kind: "explicit" },
      { text: "+15% to Cold Resistance", kind: "explicit" },
      { text: "+20% to Fire Resistance", kind: "crafted" },
      { text: "+3 to Level of all Spell Skills", kind: "desecrated" },
    ]);
  });

  it("runes, sockets and plain markers mixed with advanced headers", () => {
    const i = parse("rare-crossbow-runes-plain");
    expect(i.sockets).toEqual(["S", "S"]);
    expect(i.quality).toBe(29);
    expect(i.requirements).toEqual({ level: 79, str: 89, dex: 89 });
    expect(i.modifiers.find((m) => m.kind === "rune")?.text).toBe("36% increased Physical Damage");
    expect(i.modifiers.find((m) => m.kind === "desecrated")?.text).toBe(
      "Adds 54 to 94 Physical Damage",
    );
    expect(i.modifiers.find((m) => m.kind === "fractured")?.text).toBe(
      "25% increased Attack Speed",
    );
    expect(i.fractured).toBe(true);
  });

  it("every modifier kind, corrupted and fractured", () => {
    const i = parse("rare-crossbow-all-mod-types-corrupted");
    expect(new Set(i.modifiers.map((m) => m.kind))).toEqual(
      new Set(["enchant", "rune", "implicit", "fractured", "explicit", "desecrated"]),
    );
    expect(i).toMatchObject({
      corrupted: true,
      fractured: true,
      grantsSkill: "Level 18 Cackling Companions",
    });
    expect(i.modifiers.filter((m) => m.kind === "rune")).toHaveLength(2);
  });

  it("fractured and desecrated headers", () => {
    const i = parse("rare-amulet-fractured-desecrated");
    const byKind = (k: string) => i.modifiers.filter((m) => m.kind === k);
    expect(byKind("enchant")[0].text).toBe("Allocates Cooked");
    expect(byKind("fractured")[0]).toMatchObject({
      tier: 2,
      text: "+37% to Cold Resistance",
      name: "of the Ice",
    });
    expect(byKind("desecrated")[0]).toMatchObject({ tier: 1, affix: "suffix" });
    expect(byKind("implicit")).toHaveLength(1);
  });

  it("magic charm", () => {
    const i = parse("magic-charm");
    expect(i).toMatchObject({ rarity: "Magic", quality: 14, itemLevel: 80 });
    expect(i.modifiers.map((m) => m.kind)).toEqual(["implicit", "explicit", "explicit"]);
    expect(i.modifiers[0].text).toBe("Used when you are affected by a Slow");
  });

  it("currency stack", () => {
    const i = parse("currency-stack");
    expect(i).toMatchObject({
      rarity: "Currency",
      name: "Exalted Orb",
      stackSize: { current: 3, max: 20 },
    });
    expect(i.modifiers).toEqual([]);
    expect(i.description.length).toBeGreaterThan(0);
  });

  it("stack size with thousands separators", () => {
    const i = parseItemText(
      "Item Class: Stackable Currency\nRarity: Currency\nTransmutation Shard\n--------\nStack Size: 1,448/40\n",
    );
    expect(i?.stackSize).toEqual({ current: 1448, max: 40 });
  });

  it("runes and soul cores", () => {
    const rune = parse("rune-socketable");
    expect(rune.stackSize).toEqual({ current: 1, max: 10 });
    expect(rune.modifiers).toEqual([
      { text: "18% increased Physical Damage", kind: "rune" },
      { text: "18% increased Armour", kind: "rune" },
    ]);
    const core = parse("soul-core");
    expect(core.name).toBe("Soul Core of Tacati");
    expect(core.modifiers).toHaveLength(2);
  });

  it("gems", () => {
    const uncut = parse("uncut-skill-gem");
    expect(uncut).toMatchObject({ rarity: "Currency", name: "Uncut Skill Gem", gemLevel: 19 });
    const meta = parse("meta-skill-gem");
    expect(meta).toMatchObject({
      rarity: "Gem",
      name: "Mirage Archer",
      gemLevel: 14,
      sockets: ["G", "G", "G", "G"],
    });
    expect(meta.itemClass).toBeUndefined();
    expect(meta.modifiers).toEqual([]);
  });

  it("waystone", () => {
    const i = parse("rare-waystone");
    expect(i).toMatchObject({
      rarity: "Rare",
      name: "Desolate Route",
      baseType: "Waystone",
      mapTier: 14,
      itemLevel: 80,
    });
    expect(i.properties["Pack Size"]).toContain("34%");
    expect(i.modifiers).toHaveLength(5);
    expect(i.modifiers[0]).toMatchObject({ text: "Area has patches of Shocked Ground", tier: 1 });
    expect(i.description[0]).toMatch(/^Can be used in a Map Device/);
  });

  it("corrupted tablet with price note", () => {
    const i = parse("rare-tablet-corrupted-note");
    expect(i.corrupted).toBe(true);
    expect(i.note).toBe("~b/o 1 exalted");
    expect(i.modifiers.filter((m) => m.kind === "implicit")).toHaveLength(2);
  });

  it("unidentified items", () => {
    const wand = parse("unidentified-wand");
    expect(wand).toMatchObject({
      unidentified: true,
      name: "Volatile Wand",
      baseType: "Volatile Wand",
      requirements: { int: 113 },
    });
    const ring = parse("unidentified-tier-ring");
    expect(ring).toMatchObject({ unidentified: true, unidentifiedTier: 4, rarity: "Magic" });
    expect(ring.modifiers[0].kind).toBe("implicit");
  });
});

describe("robustness", () => {
  it("returns null for garbage", () => {
    for (const t of ["", "   ", "lorem ipsum", "--------", "Item Class: x", "{}", "\u0000\u0001"]) {
      expect(parseItemText(t)).toBeNull();
    }
    expect(parseItemText(undefined as unknown as string)).toBeNull();
    expect(parseItemText(null as unknown as string)).toBeNull();
  });

  it("does not throw on unknown sections and truncated input", () => {
    const text =
      'Item Class: Weird Things\nRarity: Mystery\nThing\n--------\nSomething: strange (hm)\n--------\n{ Odd Header "x" (Tier: abc) }\n????\n--------\n{';
    const i = parseItemText(text);
    expect(i).not.toBeNull();
    expect(i?.rarity).toBe("Other");
    for (const f of [
      "rare-bow-advanced",
      "rare-waystone",
      "rare-crossbow-all-mod-types-corrupted",
    ]) {
      const raw = fx(f);
      for (let n = 0; n < raw.length; n += 17)
        expect(() => parseItemText(raw.slice(0, n))).not.toThrow();
    }
  });

  it("handles CRLF and surrounding whitespace on every fixture", () => {
    for (const name of ["normal-helmet", "rare-bow-advanced", "rare-waystone", "currency-stack"]) {
      const lf = fx(name).replace(/\r\n/g, "\n");
      expect(parseItemText(lf.replace(/\n/g, "\r\n"))).toEqual(parseItemText(lf));
    }
  });
});
