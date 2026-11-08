// Tray/window/updater patterns adapted from Exiled Exchange 2 (MIT) — see NOTICE
import { app, BrowserWindow, dialog, ipcMain, Menu, Notification, Tray, nativeImage, shell } from "electron";
import { autoUpdater } from "electron-updater";
import fs from "node:fs";
import path from "node:path";
import { redactLine, type LogEvent } from "@poecompanion/log-core";
import { addEvent, addRaw } from "../shared/events";
import { CH, type AppState, type ExportResult } from "../shared/types";
import { LogService } from "./log-service";
import { createSettingsStore } from "./settings";

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  void start();
}

async function start() {
  let win: BrowserWindow | null = null;
  let tray: Tray | null = null;
  let quitting = false;
  let events: LogEvent[] = [];
  let rawLines: string[] = [];

  await app.whenReady();
  const store = createSettingsStore(path.join(app.getPath("userData"), "settings.json"));

  const send = (channel: string, payload: unknown) => {
    if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
  };

  const logs = new LogService({
    onStatus: (s) => send(CH.status, s),
    onEvent: (e) => {
      events = addEvent(events, e);
      rawLines = addRaw(rawLines, e.raw);
      send(CH.event, e);
      if (e.type === "whisper_in" && e.trade && Notification.isSupported()) {
        const price = e.trade.price ? ` for ${e.trade.price.amount} ${e.trade.price.currency}` : "";
        new Notification({ title: `Trade request from ${e.from}`, body: `${e.trade.item}${price}` }).show();
      }
    },
  });

  const state = (): AppState => ({
    settings: store.get(),
    status: logs.status,
    events,
    version: app.getVersion(),
  });

  ipcMain.handle(CH.getState, () => state());
  ipcMain.handle(CH.setReadLog, async (_e, on: unknown) => {
    store.update({ readLog: on === true });
    await logs.apply(store.get());
    return state();
  });
  ipcMain.handle(CH.setLogPath, async (_e, p: unknown) => {
    store.update({ logPath: typeof p === "string" ? p : null });
    await logs.apply(store.get());
    return state();
  });
  ipcMain.handle(CH.browseLogPath, async () => {
    const r = await dialog.showOpenDialog(win!, {
      title: "Select Client.txt",
      properties: ["openFile"],
      filters: [{ name: "Log file", extensions: ["txt"] }],
    });
    if (!r.canceled && r.filePaths[0]) {
      store.update({ logPath: r.filePaths[0] });
      await logs.apply(store.get());
    }
    return state();
  });
  ipcMain.handle(CH.exportSample, async (): Promise<ExportResult> => {
    if (rawLines.length === 0) return { ok: false, reason: "No lines captured yet. Turn on log reading and play a bit." };
    const r = await dialog.showSaveDialog(win!, {
      title: "Save redacted sample",
      defaultPath: "poe-companion-sample.txt",
      filters: [{ name: "Text", extensions: ["txt"] }],
    });
    if (r.canceled || !r.filePath) return { ok: false, reason: "Cancelled" };
    try {
      const out = rawLines.map((l) => redactLine(l));
      fs.writeFileSync(r.filePath, out.join("\n") + "\n");
      return { ok: true, file: r.filePath, lines: out.length };
    } catch (err) {
      return { ok: false, reason: err instanceof Error ? err.message : String(err) };
    }
  });

  const showWindow = () => {
    if (!win || win.isDestroyed()) createWindow();
    else {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  };

  function createWindow() {
    win = new BrowserWindow({
      width: 760,
      height: 640,
      minWidth: 560,
      minHeight: 420,
      title: "PoE Companion Link",
      backgroundColor: "#14120f",
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https:\/\//.test(url)) void shell.openExternal(url);
      return { action: "deny" };
    });
    win.webContents.on("will-navigate", (e) => e.preventDefault());
    win.on("close", (e) => {
      if (!quitting) {
        e.preventDefault();
        win?.hide();
      }
    });
    void win.loadFile(path.join(__dirname, "renderer", "index.html"));
  }

  app.on("second-instance", showWindow);
  app.on("before-quit", () => {
    quitting = true;
  });
  app.on("window-all-closed", () => {
    // stay in the tray
  });

  // Tray (a 1x1 transparent fallback keeps the tray alive if the icon asset is absent)
  const iconFile = path.join(__dirname, "tray.png");
  const icon = fs.existsSync(iconFile) ? nativeImage.createFromPath(iconFile) : nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip("PoE Companion Link");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Open", click: showWindow },
      { type: "separator" },
      { label: "Quit", click: () => app.quit() },
    ]),
  );
  tray.on("click", showWindow);

  createWindow();
  await logs.apply(store.get());

  // Updates: only when packaged, nothing else talks to the network.
  if (app.isPackaged && !process.env.PORTABLE_EXECUTABLE_DIR) {
    autoUpdater.on("error", () => {});
    void autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  }
}
