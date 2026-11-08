// Adapted from Exiled Exchange 2 (MIT) — see NOTICE
import type { LogEvent, TradeRequest } from "./types";

/** "<ts> <ms> <hex> [LEVEL Client pid] <text>" */
export const LINE_RE =
  /^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}) (\d+) ([a-f0-9]+) \[\S+ \S+ \S+\] (.*)$/;

const LEVEL_UP_RE = /^: (\S+) \(([^)]+)\) is now level (\d+)$/;
const SLAIN_RE = /^: (\S+) has been slain\.$/;
const ZONE_GEN_RE = /^Generating level (\d+) area "([^"]+)" with seed \d+/;
const SET_SOURCE_RE = /^\[SCENE\] Set Source \[(.+)\]$/;
const AFK_ON_RE = /^: AFK mode is now ON\.(?: Autoreply "(.*)")?$/;
const AFK_OFF_RE = /^: AFK mode is now OFF\.?$/;
/** "@From <GUILD> Name: msg" — guild tag optional, names contain no spaces or colons. */
export const WHISPER_RE = /^@(From|To) (?:(<[^>]*>) )?([^\s:]+): (.*)$/;

const TRADE_RE =
  /^Hi, I would like to buy your (.+?)(?: listed for ([\d.]+) (.+?))? in (.+?)(?: \(stash tab "(.*?)"; position: left (\d+), top (\d+)\))?\.?$/;
const BULK_RE =
  /^Hi, I(?:'d| would) like to buy your (\d+(?:\.\d+)?) (.+?) for my (\d+(?:\.\d+)?) (.+?) in (.+?)\.?$/;

export function parseTrade(message: string): TradeRequest | undefined {
  let m = message.match(BULK_RE);
  if (m) {
    return {
      item: `${m[1]} ${m[2]}`,
      price: { amount: Number(m[3]), currency: m[4] },
      league: m[5],
    };
  }
  m = message.match(TRADE_RE);
  if (!m) return undefined;
  const t: TradeRequest = { item: m[1], league: m[4] };
  if (m[2] !== undefined) t.price = { amount: Number(m[2]), currency: m[3] };
  if (m[5] !== undefined) t.stashTab = m[5];
  if (m[6] !== undefined) t.position = { left: Number(m[6]), top: Number(m[7]) };
  return t;
}

/** Parse one Client.txt line (CR/LF tolerated). Unknown or malformed lines return null. */
export function parseLine(line: string): LogEvent | null {
  const m = line.replace(/[\r\n]+$/, "").match(LINE_RE);
  if (!m) return null;
  const [, ts, , , text] = m;
  const raw = line.replace(/[\r\n]+$/, "");

  if (text === "[STARTUP] Game Start") return { type: "game_start", ts, raw };

  let r: RegExpMatchArray | null;
  if ((r = text.match(SET_SOURCE_RE))) {
    const zoneName = r[1];
    if (zoneName === "(null)" || zoneName === "(unknown)") return null;
    return { type: "zone_entered", ts, raw, zoneName };
  }
  if ((r = text.match(ZONE_GEN_RE))) {
    return { type: "zone_entered", ts, raw, zoneId: r[2], areaLevel: Number(r[1]) };
  }
  if ((r = text.match(LEVEL_UP_RE))) {
    return { type: "level_up", ts, raw, character: r[1], className: r[2], level: Number(r[3]) };
  }
  if ((r = text.match(SLAIN_RE))) return { type: "death", ts, raw, character: r[1] };
  if ((r = text.match(AFK_ON_RE))) {
    return r[1] === undefined
      ? { type: "afk", ts, raw, on: true }
      : { type: "afk", ts, raw, on: true, autoReply: r[1] };
  }
  if (AFK_OFF_RE.test(text)) return { type: "afk", ts, raw, on: false };
  if ((r = text.match(WHISPER_RE))) {
    const message = r[4];
    const trade = parseTrade(message);
    if (r[1] === "From") {
      return { type: "whisper_in", ts, raw, from: r[3], message, ...(trade && { trade }) };
    }
    return { type: "whisper_out", ts, raw, to: r[3], message, ...(trade && { trade }) };
  }
  return null;
}
