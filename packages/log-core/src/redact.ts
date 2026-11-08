import { LINE_RE } from "./parser";

export interface Redactor {
  redactLine(line: string): string;
}

const WHISPER_HEAD = /^(@(?:From|To) )(?:(<[^>]*>) )?([^\s:]+)(: .*)$/;
const LEVEL_HEAD = /^(: )(\S+)( \([^)]+\) is now level \d+)$/;
const SLAIN_HEAD = /^(: )(\S+)( has been slain\.)$/;
const GUILD_JOIN = /^(Joined guild named )(.+)( with \d+ members)$/;
const USER_PATH = /(Users[\\/]+)[^\\/\s]+/g;

/** Deterministic per instance: the same name always maps to the same placeholder. */
export function createRedactor(): Redactor {
  const players = new Map<string, string>();
  const guilds = new Map<string, string>();
  const ph = (map: Map<string, string>, key: string, prefix: string) => {
    let v = map.get(key);
    if (!v) {
      v = `${prefix}${map.size + 1}`;
      map.set(key, v);
    }
    return v;
  };
  const player = (n: string) => ph(players, n, "Player");
  const guild = (n: string) => ph(guilds, n, "Guild");

  return {
    redactLine(line) {
      const m = line.match(LINE_RE);
      if (!m) return line.replace(USER_PATH, "$1User");
      const text = m[4];
      const prefix = line.slice(0, line.length - text.length);
      let out = text;
      let r: RegExpMatchArray | null;
      if ((r = text.match(WHISPER_HEAD))) {
        const g = r[2] ? `<${guild(r[2].slice(1, -1))}> ` : "";
        out = `${r[1]}${g}${player(r[3])}${r[4]}`;
      } else if ((r = text.match(LEVEL_HEAD)) || (r = text.match(SLAIN_HEAD))) {
        out = `${r[1]}${player(r[2])}${r[3]}`;
      } else if ((r = text.match(GUILD_JOIN))) {
        out = `${r[1]}${guild(r[2])}${r[3]}`;
      } else {
        out = text.replace(USER_PATH, "$1User");
      }
      return prefix + out;
    },
  };
}

const defaultRedactor = createRedactor();

export function redactLine(line: string): string {
  return defaultRedactor.redactLine(line);
}
