import type { LogEvent } from "@poecompanion/log-core";
import { addEvent, BADGES, describeEvent } from "../shared/events";
import type { AppState, CompanionApi, LogStatus } from "../shared/types";

declare global {
  interface Window {
    companion: CompanionApi;
  }
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const api = window.companion;
let events: LogEvent[] = [];
let readLog = false;

function renderStatus(s: LogStatus) {
  const where = s.path ?? "not detected";
  const found = s.path ? (s.found ? "found" : "not found") : "";
  $("logStatus").textContent =
    `Log: ${where}${found ? ` (${found})` : ""} — watching: ${s.watching ? "on" : "off"}`;
  const err = $("error");
  err.hidden = !s.error;
  err.textContent = s.error ?? "";
  renderEmpty(s);
}

function renderEmpty(s?: LogStatus) {
  const p = $("empty");
  if (events.length > 0) return void (p.textContent = "");
  p.textContent = !readLog
    ? "Log reading is off. Turn it on above to see events."
    : s && !s.found
      ? "Waiting for Client.txt. Use Browse… if the game is installed somewhere unusual."
      : "Listening. Events appear here as you play.";
}

function row(e: LogEvent): HTMLLIElement {
  const li = document.createElement("li");
  const ts = Object.assign(document.createElement("span"), { className: "ts", textContent: e.ts });
  const badge = Object.assign(document.createElement("span"), {
    className: `badge ${e.type}`,
    textContent: BADGES[e.type],
  });
  const text = Object.assign(document.createElement("span"), { textContent: describeEvent(e) });
  li.append(ts, badge, text);
  return li;
}

function renderFeed() {
  $("feed").replaceChildren(...events.map(row));
}

function applyState(s: AppState) {
  readLog = s.settings.readLog;
  events = s.events;
  $<HTMLInputElement>("readLog").checked = readLog;
  $("version").textContent = `v${s.version}`;
  renderStatus(s.status);
  renderFeed();
}

async function run(p: Promise<AppState>) {
  applyState(await p);
}

$<HTMLInputElement>("readLog").addEventListener("change", (e) =>
  run(api.setReadLog((e.target as HTMLInputElement).checked)),
);
$("browse").addEventListener("click", () => run(api.browseLogPath()));
$("auto").addEventListener("click", () => run(api.setLogPath(null)));
$("export").addEventListener("click", async () => {
  const r = await api.exportSample($<HTMLInputElement>("onlyChat").checked);
  $("exportMsg").textContent = r.ok ? `Saved ${r.lines} redacted lines to ${r.file}` : r.reason;
});

api.onEvent((e) => {
  events = addEvent(events, e);
  renderFeed();
  renderEmpty();
});
api.onStatus(renderStatus);
void api
  .getState()
  .then(applyState)
  .catch((err) => {
    $("error").hidden = false;
    $("error").textContent = `Could not load state: ${err}`;
  });
