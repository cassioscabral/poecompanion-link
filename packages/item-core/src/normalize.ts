// Adapted from Exiled Exchange 2 (MIT) — see NOTICE

/** `[Resistances|Fire Resistance]` -> `Fire Resistance`, `[Armour]` -> `Armour`. */
export function stripBracketLinks(text: string): string {
  return text.replace(/\[([^\]|]*)\|([^\]]*)\]/g, "$2").replace(/\[([^\]|]*)\]/g, "$1");
}

/**
 * Normalise a modifier line to the website's stat dictionary form:
 * bracket links resolved, `(min-max)` roll ranges dropped, numbers -> `#`.
 */
export function normalizeModText(text: string): string {
  return stripBracketLinks(text)
    .replace(/\(\s*[+-]?\d+(?:\.\d+)?\s*-\s*[+-]?\d+(?:\.\d+)?\s*\)/g, "")
    .replace(/\d+(?:\.\d+)?/g, "#")
    .replace(/\s+/g, " ")
    .trim();
}
