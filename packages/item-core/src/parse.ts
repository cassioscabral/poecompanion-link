// Adapted from Exiled Exchange 2 (MIT) — see NOTICE
// Compact PoE2 clipboard item parser. English only. Never throws on bad input.
import { stripBracketLinks } from "./normalize";
import type {
  ModifierKind,
  ParsedItem,
  ParsedModifier,
  Rarity,
  Requirements,
} from "./types";

const SEPARATOR = /^-{8,}$/;
const KNOWN_RARITIES: Rarity[] = [
  "Normal",
  "Magic",
  "Rare",
  "Unique",
  "Currency",
  "Gem",
  "Divination Card",
  "Quest",
];

function toLines(text: string): string[] {
  return text.replace(/^﻿/, "").split(/\r\n|\r|\n/);
}

/** Quick check that clipboard text looks like a PoE2 item (English client). */
export function isPoeItemText(text: string): boolean {
  if (typeof text !== "string") return false;
  const lines = toLines(text);
  const first = lines[0] ?? "";
  if (first.startsWith("Item Class: ")) {
    return lines.some((l) => l.startsWith("Rarity: "));
  }
  // Items without an Item Class line (e.g. meta gems) start at Rarity.
  return first.startsWith("Rarity: ") && lines.some((l) => SEPARATOR.test(l));
}

function splitSections(lines: string[]): string[][] {
  const sections: string[][] = [[]];
  for (const raw of lines) {
    const line = raw.trim();
    if (SEPARATOR.test(line)) sections.push([]);
    else if (line !== "") sections[sections.length - 1].push(line);
  }
  return sections.filter((s) => s.length > 0);
}

const MARKERS: Record<string, ModifierKind> = {
  implicit: "implicit",
  rune: "rune",
  enchant: "enchant",
  crafted: "crafted",
  fractured: "fractured",
  desecrated: "desecrated",
};
const MARKER_RE = /\s*\((implicit|rune|enchant|crafted|fractured|desecrated)\)\s*$/i;

function num(s: string): number {
  return Number(s.replace(/,/g, ""));
}

/** Pull `N(min-max)` rolls out of an advanced line; return clean text + numbers. */
function extractRolls(text: string): { text: string; ranges?: number[]; values?: number[] } {
  const ranges: number[] = [];
  const values: number[] = [];
  const clean = text.replace(
    /([+-]?\d+(?:\.\d+)?)\(([+-]?\d+(?:\.\d+)?)-([+-]?\d+(?:\.\d+)?)\)/g,
    (_m, v: string, lo: string, hi: string) => {
      values.push(num(v));
      ranges.push(num(lo), num(hi));
      return v;
    },
  );
  return values.length ? { text: clean, ranges, values } : { text: clean };
}

interface AdvancedHeader {
  kind: ModifierKind;
  affix?: "prefix" | "suffix";
  name?: string;
  tier?: number;
}

/** `{ Fractured Prefix Modifier "Name" (Tier: 2) — Tags }` */
function parseHeader(line: string): AdvancedHeader {
  const inner = line.replace(/^\{\s*/, "").replace(/\s*\}$/, "");
  const head = inner.split(" — ")[0];
  const name = /"([^"]*)"/.exec(head)?.[1];
  const tierM = /\(Tier:\s*(\d+)\)/.exec(head);
  const type = head.replace(/"[^"]*"/, "").replace(/\(.*?\)/g, "").trim().toLowerCase();
  let kind: ModifierKind = "unknown";
  if (type.includes("implicit")) kind = "implicit";
  else if (type.includes("corruption")) kind = "implicit";
  else if (type.includes("enhancement")) kind = "enchant";
  else if (type.includes("fractured")) kind = "fractured";
  else if (type.includes("desecrated")) kind = "desecrated";
  else if (type.includes("crafted")) kind = "crafted";
  else if (/prefix|suffix|unique/.test(type)) kind = "explicit";
  return {
    kind,
    affix: type.includes("prefix") ? "prefix" : type.includes("suffix") ? "suffix" : undefined,
    name,
    tier: tierM ? Number(tierM[1]) : undefined,
  };
}

function buildMod(raw: string, base: ModifierKind, header?: AdvancedHeader): ParsedModifier {
  let line = stripBracketLinks(raw).replace(/\s+—\s+Unscalable Value\s*$/, "");
  let kind = base;
  const mk = MARKER_RE.exec(line);
  if (mk) {
    kind = MARKERS[mk[1].toLowerCase()];
    line = line.replace(MARKER_RE, "");
  }
  const rolls = extractRolls(line);
  const mod: ParsedModifier = { text: rolls.text.trim(), kind };
  if (header?.tier !== undefined) mod.tier = header.tier;
  if (header?.affix) mod.affix = header.affix;
  if (header?.name) mod.name = header.name;
  if (rolls.ranges) {
    mod.ranges = rolls.ranges;
    mod.values = rolls.values;
  }
  return mod;
}

function parseRequirements(value: string, into: Requirements) {
  for (const part of value.split(",")) {
    const p = part.trim().replace(/\((?:augmented|unmet)\)/g, "").replace(/\s+/g, " ").trim();
    let m = /^Level (\d+)$/.exec(p);
    if (m) {
      into.level = Number(m[1]);
      continue;
    }
    m = /^(\d+) (Str|Strength|Dex|Dexterity|Int|Intelligence)$/.exec(p);
    if (m) {
      const key = m[2].slice(0, 3).toLowerCase() as "str" | "dex" | "int";
      into[key] = Number(m[1]);
    }
  }
}

const STATE_LINES = /^(Corrupted|Twice Corrupted|Mirrored|Fractured Item|Sanctified|Unidentified(?:\s*\(Tier\s*(\d+)\))?)$/;
const PROPERTY_LINE = /^([A-Za-z][A-Za-z '\-]{0,38}): (.+)$/;

export function parseItemText(text: string): ParsedItem | null {
  if (!isPoeItemText(text)) return null;
  try {
    return parse(text);
  } catch {
    return null;
  }
}

function parse(text: string): ParsedItem | null {
  const sections = splitSections(toLines(text));
  const head = sections.shift();
  if (!head) return null;

  let itemClass: string | undefined;
  let rarityText: string | undefined;
  const nameLines: string[] = [];
  for (const line of head) {
    if (line.startsWith("Item Class: ")) itemClass = line.slice(12).trim();
    else if (line.startsWith("Rarity: ")) rarityText = line.slice(8).trim();
    else nameLines.push(line);
  }
  if (rarityText === undefined) return null;
  const rarity: Rarity = (KNOWN_RARITIES as string[]).includes(rarityText)
    ? (rarityText as Rarity)
    : "Other";

  const item: ParsedItem = {
    itemClass,
    rarity,
    name: nameLines[0] ?? "",
    properties: {},
    modifiers: [],
    description: [],
    corrupted: false,
    unidentified: false,
    mirrored: false,
    fractured: false,
    sanctified: false,
  };

  if ((rarity === "Rare" || rarity === "Unique") && nameLines.length >= 2) {
    item.baseType = nameLines[1];
  } else if (rarity === "Normal") {
    item.baseType = item.name.replace(/^Superior /, "");
  } else if (rarity === "Currency" || rarity === "Gem" || nameLines.length === 1) {
    item.baseType = rarity === "Magic" ? undefined : item.name;
  }
  for (const key of ["name", "baseType"] as const) {
    const v = item[key];
    if (!v) continue;
    const m = /^(.*?)\s*\((Tier|Level) (\d+)\)$/.exec(v);
    if (!m) continue;
    if (m[2] === "Tier") item.mapTier = Number(m[3]);
    else item.gemLevel = Number(m[3]);
    if (key === "baseType" || rarity !== "Magic") item[key] = m[1];
  }

  let seenItemLevel = false;
  const socketable = itemClass === "Socketable";
  const requirements: Requirements = {};

  for (const section of sections) {
    // Advanced mod descriptions: { header } followed by its lines.
    if (section[0].startsWith("{")) {
      let header: AdvancedHeader | undefined;
      for (const line of section) {
        if (line.startsWith("{")) header = parseHeader(line);
        else item.modifiers.push(buildMod(line, header?.kind ?? "unknown", header));
      }
      continue;
    }

    // Unmarked free text is a modifier only on Magic/Rare/Unique items, after
    // the Item Level section; flavour text closes uniques; the rest is description.
    const modRarity = rarity === "Magic" || rarity === "Rare" || rarity === "Unique";
    const hasMarker = section.some((l) => MARKER_RE.test(l));
    const flavourSection =
      rarity === "Unique" && !hasMarker && isLast(section, sections) &&
      section.every((l) => !/\d/.test(l) && !PROPERTY_LINE.test(l) && !STATE_LINES.test(l));
    if (flavourSection) {
      item.flavourText = section;
      continue;
    }
    for (const line of section) {
      const state = STATE_LINES.exec(line);
      if (state) {
        if (line.startsWith("Corrupted") || line.startsWith("Twice")) item.corrupted = true;
        else if (line === "Mirrored") item.mirrored = true;
        else if (line === "Fractured Item") item.fractured = true;
        else if (line === "Sanctified") item.sanctified = true;
        else {
          item.unidentified = true;
          if (state[2]) item.unidentifiedTier = Number(state[2]);
        }
        continue;
      }
      if (MARKER_RE.test(line)) {
        item.modifiers.push(buildMod(line, "unknown"));
        continue;
      }
      if (socketable && !line.startsWith("Stack Size: ")) {
        const m = /^[A-Za-z ]+: (.+)$/.exec(line);
        if (m) {
          item.modifiers.push(buildMod(m[1], "rune"));
          continue;
        }
      }
      const prop = PROPERTY_LINE.exec(line);
      if (prop) {
        const [, key, value] = prop;
        if (key === "Item Level") {
          item.itemLevel = num(value);
          seenItemLevel = true;
        } else if (key === "Quality") item.quality = num(value.replace(/[^\d.]/g, "")) || 0;
        else if (key === "Level") item.gemLevel = num(value);
        else if (key === "Map Tier" || key === "Waystone Tier") item.mapTier = num(value);
        else if (key === "Stack Size") {
          const [current, max] = value.replace(/[^\d/]/g, "").split("/").map(Number);
          if (Number.isFinite(current) && Number.isFinite(max)) item.stackSize = { current, max };
        } else if (key === "Requires") parseRequirements(value, requirements);
        else if (key === "Sockets") item.sockets = value.split(/\s+/).filter(Boolean);
        else if (key === "Grants Skill") item.grantsSkill = value;
        else if (key === "Note") item.note = value;
        else item.properties[key] = value;
        continue;
      }
      if (modRarity && seenItemLevel && !(/\.$/.test(line) && !/\d/.test(line))) {
        item.modifiers.push(buildMod(line, "explicit"));
      } else {
        item.description.push(line);
      }
    }
  }

  if (Object.keys(requirements).length) item.requirements = requirements;
  return item;
}

function isLast(section: string[], sections: string[][]): boolean {
  // Flavour text is the final non-state section of a unique.
  for (let i = sections.length - 1; i >= 0; i--) {
    if (sections[i].every((l) => STATE_LINES.test(l) || /^Note: /.test(l))) continue;
    return sections[i] === section;
  }
  return false;
}
