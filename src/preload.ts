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
  setFloatingButtonVisible: (visible: boolean) =>
    ipcRenderer.invoke("clipboard-history:set-floating-button-visible", visible),
  openFloatingPanel: () => ipcRenderer.invoke("clipboard-history:open-floating-panel"),
  closeFloatingPanel: () => ipcRenderer.invoke("clipboard-history:close-floating-panel"),
  beginFloatingWindowDrag: (screenX: number, screenY: number) =>
    ipcRenderer.send("clipboard-history:begin-floating-window-drag", screenX, screenY),
  endFloatingWindowDrag: () => ipcRenderer.send("clipboard-history:end-floating-window-drag"),
  onFloatingPanelChanged: (callback: (isOpen: boolean) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, isOpen: boolean) => {
      callback(isOpen);
    };

    ipcRenderer.on("clipboard-history:floating-panel", listener);

    return () => {
      ipcRenderer.removeListener("clipboard-history:floating-panel", listener);
    };
  },
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
