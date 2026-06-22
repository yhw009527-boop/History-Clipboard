import { contextBridge, ipcRenderer } from "electron";
import type {
  ClipboardHistoryApi,
  ClipboardHistoryItem,
  ClipboardHistorySettings,
  RetentionDays
} from "./types";

const clipboardHistoryApi: ClipboardHistoryApi = {
  getHistory: () => ipcRenderer.invoke("clipboard-history:get-items"),
  getSettings: () => ipcRenderer.invoke("clipboard-history:get-settings"),
  copyItem: (id: string) => ipcRenderer.invoke("clipboard-history:copy-item", id),
  deleteItem: (id: string) => ipcRenderer.invoke("clipboard-history:delete-item", id),
  toggleItemPinned: (id: string) => ipcRenderer.invoke("clipboard-history:toggle-item-pinned", id),
  setRetentionDays: (retentionDays: RetentionDays) =>
    ipcRenderer.invoke("clipboard-history:set-retention-days", retentionDays),
  setLaunchAtLogin: (launchAtLogin: boolean) =>
    ipcRenderer.invoke("clipboard-history:set-launch-at-login", launchAtLogin),
  onHistoryChanged: (callback: (items: ClipboardHistoryItem[]) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, items: ClipboardHistoryItem[]) => {
      callback(items);
    };

    ipcRenderer.on("clipboard-history:items", listener);

    return () => {
      ipcRenderer.removeListener("clipboard-history:items", listener);
    };
  },
  onSettingsChanged: (callback: (settings: ClipboardHistorySettings) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, settings: ClipboardHistorySettings) => {
      callback(settings);
    };

    ipcRenderer.on("clipboard-history:settings", listener);

    return () => {
      ipcRenderer.removeListener("clipboard-history:settings", listener);
    };
  }
};

contextBridge.exposeInMainWorld("clipboardHistory", clipboardHistoryApi);

window.addEventListener("DOMContentLoaded", () => {
  document.documentElement.dataset.appReady = "true";
});
