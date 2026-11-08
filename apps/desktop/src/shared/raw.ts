/** Raw-line buffer and export filter. Pure, so it is unit-tested. */
export const MAX_RAW = 5000;

export function pushRaw(lines: readonly string[], raw: string, max = MAX_RAW): string[] {
  const next = [...lines, raw];
  return next.length > max ? next.slice(next.length - max) : next;
}

const CHAT = /@(?:From|To)\b/;
const SYSTEM = /\] : /;

/**
 * "Only chat & unknown lines": keep whispers (@From/@To), system messages
 * (the `] : ` form) and any line the parser does not understand; drop [DEBUG] noise.
 */
export function keepChatOrUnknown(line: string, parse: (l: string) => unknown): boolean {
  if (line.includes("[DEBUG")) return false;
  if (CHAT.test(line) || SYSTEM.test(line)) return true;
  try {
    return parse(line) == null;
  } catch {
    return true;
  }
}

export function selectForExport(lines: readonly string[], onlyChat: boolean, parse: (l: string) => unknown): string[] {
  return onlyChat ? lines.filter((l) => keepChatOrUnknown(l, parse)) : [...lines];
}
