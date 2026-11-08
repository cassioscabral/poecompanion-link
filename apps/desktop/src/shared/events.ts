import type { LogEvent } from "@poecompanion/log-core";

export const MAX_EVENTS = 200;

/** Newest first, capped. Pure: returns a new array. */
export function addEvent(list: readonly LogEvent[], e: LogEvent, max = MAX_EVENTS): LogEvent[] {
  return [e, ...list].slice(0, max);
}

export const BADGES: Record<LogEvent["type"], string> = {
  game_start: "Game start",
  zone_entered: "Zone",
  level_up: "Level up",
  death: "Death",
  whisper_in: "Whisper in",
  whisper_out: "Whisper out",
  afk: "AFK",
};

export function describeEvent(e: LogEvent): string {
  switch (e.type) {
    case "game_start":
      return "Game client started";
    case "zone_entered":
      return `${e.zoneName ?? e.zoneId ?? "Unknown zone"}${e.areaLevel ? ` (area level ${e.areaLevel})` : ""}`;
    case "level_up":
      return `${e.character}${e.className ? ` (${e.className})` : ""} reached level ${e.level}`;
    case "death":
      return `${e.character} died`;
    case "whisper_in":
      return `${e.from}: ${e.trade ? tradeText(e.trade.item, e.trade.price) : e.message}`;
    case "whisper_out":
      return `to ${e.to}: ${e.trade ? tradeText(e.trade.item, e.trade.price) : e.message}`;
    case "afk":
      return e.on ? "AFK on" : "AFK off";
  }
}

function tradeText(item: string, price?: { amount: number; currency: string }): string {
  return price ? `wants ${item} for ${price.amount} ${price.currency}` : `wants ${item}`;
}
