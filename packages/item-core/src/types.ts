export type Rarity =
  | "Normal"
  | "Magic"
  | "Rare"
  | "Unique"
  | "Currency"
  | "Gem"
  | "Divination Card"
  | "Quest"
  | "Other";

export type ModifierKind =
  "implicit" | "explicit" | "enchant" | "rune" | "crafted" | "fractured" | "desecrated" | "unknown";

export interface ParsedModifier {
  /** Display text: bracket links resolved, roll ranges and trailing markers removed. */
  text: string;
  kind: ModifierKind;
  /** Advanced descriptions (Ctrl+Alt+C) only. */
  tier?: number;
  /** Advanced descriptions only. */
  affix?: "prefix" | "suffix";
  /** Advanced descriptions only: the affix name, e.g. "Crackling". */
  name?: string;
  /** Flat [min, max, min, max, ...] roll ranges, in text order, when shown. */
  ranges?: number[];
  /** Rolled values, in text order, when ranges are shown. */
  values?: number[];
}

export interface Requirements {
  level?: number;
  str?: number;
  dex?: number;
  int?: number;
}

export interface ParsedItem {
  itemClass?: string;
  rarity: Rarity;
  name: string;
  baseType?: string;
  itemLevel?: number;
  quality?: number;
  gemLevel?: number;
  mapTier?: number;
  stackSize?: { current: number; max: number };
  requirements?: Requirements;
  /** Socket / rune slot colours, e.g. ["S", "S"]. Length is the slot count. */
  sockets?: string[];
  grantsSkill?: string;
  note?: string;
  /** Raw "Key: value" property lines (damage, armour, waystone stats, ...). */
  properties: Record<string, string>;
  modifiers: ParsedModifier[];
  /** Help / description text lines that are not modifiers. */
  description: string[];
  flavourText?: string[];
  corrupted: boolean;
  unidentified: boolean;
  unidentifiedTier?: number;
  mirrored: boolean;
  fractured: boolean;
  sanctified: boolean;
}
