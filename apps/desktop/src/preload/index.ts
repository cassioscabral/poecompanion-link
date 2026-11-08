import { contextBridge, ipcRenderer } from "electron";
import { CH, type CompanionApi } from "../shared/types";

const api: CompanionApi = {
  getState: () => ipcRenderer.invoke(CH.getState),
  setReadLog: (on) => ipcRenderer.invoke(CH.setReadLog, on),
  setLogPath: (p) => ipcRenderer.invoke(CH.setLogPath, p),
  browseLogPath: () => ipcRenderer.invoke(CH.browseLogPath),
  exportSample: () => ipcRenderer.invoke(CH.exportSample),
  onEvent(cb) {
    const h = (_: unknown, e: Parameters<typeof cb>[0]) => cb(e);
    ipcRenderer.on(CH.event, h);
    return () => ipcRenderer.removeListener(CH.event, h);
  },
  onStatus(cb) {
    const h = (_: unknown, s: Parameters<typeof cb>[0]) => cb(s);
    ipcRenderer.on(CH.status, h);
    return () => ipcRenderer.removeListener(CH.status, h);
  },
};

contextBridge.exposeInMainWorld("companion", api);
