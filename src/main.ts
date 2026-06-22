import {
  app,
  BrowserWindow,
  Menu,
  Tray,
  clipboard,
  globalShortcut,
  ipcMain,
  nativeImage
} from "electron";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  loadClipboardHistorySettings,
  loadHistory,
  saveClipboardHistorySettings,
  saveHistory,
  sortHistory
} from "./history-store";
import type {
  ClipboardHistoryItem,
  ClipboardHistorySettings,
  ClipboardImageItem,
  ClipboardTextItem,
  RetentionDays
} from "./types";

const isSmokeTest = process.argv.includes("--smoke-test");
const isM3SmokeTest = process.argv.includes("--m3-smoke-test");
const isM4SmokeTest = process.argv.includes("--m4-smoke-test");
const isM5SmokeTest = process.argv.includes("--m5-smoke-test");
const isM6SmokeTest = process.argv.includes("--m6-smoke-test");
const isM7SmokeTest = process.argv.includes("--m7-smoke-test");
const isM8SmokeTest = process.argv.includes("--m8-smoke-test");
const isAnySmokeTest =
  isSmokeTest ||
  isM3SmokeTest ||
  isM4SmokeTest ||
  isM5SmokeTest ||
  isM6SmokeTest ||
  isM7SmokeTest ||
  isM8SmokeTest;
const maxHistoryItems = 50;
const maxImageBytes = 10 * 1024 * 1024;
const pollIntervalMs = 600;
const millisecondsPerDay = 24 * 60 * 60 * 1000;
const globalShortcutAccelerator = "CommandOrControl+Shift+V";

let mainWindow: BrowserWindow | null = null;
let lastClipboardText = "";
let lastClipboardImageDataUrl = "";
let pollTimer: NodeJS.Timeout | null = null;
let historyItems: ClipboardHistoryItem[] = [];
let clipboardHistorySettings: ClipboardHistorySettings = {
  retentionDays: 3,
  launchAtLogin: false
};
let tray: Tray | null = null;
let isQuitting = false;
let smokeUserDataPath: string | null = null;

function createTextItem(text: string): ClipboardTextItem {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: "text",
    text,
    copiedAt: new Date().toISOString(),
    pinned: false
  };
}

function createImageItem(imageDataUrl: string, byteSize: number): ClipboardImageItem {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: "image",
    imageDataUrl,
    byteSize,
    copiedAt: new Date().toISOString(),
    pinned: false
  };
}

function publishHistory(): void {
  mainWindow?.webContents.send("clipboard-history:items", historyItems);
}

function publishSettings(): void {
  mainWindow?.webContents.send("clipboard-history:settings", clipboardHistorySettings);
}

function persistHistory(): void {
  saveHistory(app.getPath("userData"), historyItems);
}

function persistSettings(): void {
  saveClipboardHistorySettings(app.getPath("userData"), clipboardHistorySettings);
}

function showMainWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createMainWindow();
  }

  mainWindow?.show();
  mainWindow?.focus();
}

function createTrayImage(): Electron.NativeImage {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <rect x="3" y="2" width="10" height="12" rx="2" fill="#2f8ac0"/>
      <rect x="5" y="5" width="6" height="1.4" rx="0.7" fill="#ffffff"/>
      <rect x="5" y="8" width="6" height="1.4" rx="0.7" fill="#ffffff"/>
    </svg>
  `;

  return nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`);
}

function createTray(): void {
  if (tray) {
    return;
  }

  tray = new Tray(createTrayImage());
  tray.setToolTip("历史剪贴板");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "打开历史剪贴板",
        click: showMainWindow
      },
      {
        label: "退出",
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ])
  );
  tray.on("click", showMainWindow);
}

function createApplicationMenu(): void {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "文件",
        submenu: [
          {
            label: "打开历史剪贴板",
            click: showMainWindow
          },
          { type: "separator" },
          {
            label: "退出",
            role: "quit"
          }
        ]
      },
      {
        label: "编辑",
        submenu: [
          {
            label: "撤销",
            role: "undo"
          },
          {
            label: "重做",
            role: "redo"
          },
          { type: "separator" },
          {
            label: "剪切",
            role: "cut"
          },
          {
            label: "复制",
            role: "copy"
          },
          {
            label: "粘贴",
            role: "paste"
          },
          {
            label: "全选",
            role: "selectAll"
          }
        ]
      },
      {
        label: "查看",
        submenu: [
          {
            label: "重新加载",
            role: "reload"
          },
          {
            label: "强制重新加载",
            role: "forceReload"
          },
          {
            label: "开发者工具",
            role: "toggleDevTools"
          },
          { type: "separator" },
          {
            label: "重置缩放",
            role: "resetZoom"
          },
          {
            label: "放大",
            role: "zoomIn"
          },
          {
            label: "缩小",
            role: "zoomOut"
          },
          { type: "separator" },
          {
            label: "全屏",
            role: "togglefullscreen"
          }
        ]
      },
      {
        label: "帮助",
        submenu: [
          {
            label: "关于历史剪贴板",
            role: "about"
          }
        ]
      }
    ])
  );
}

function applyLaunchAtLogin(): void {
  app.setLoginItemSettings({
    openAtLogin: clipboardHistorySettings.launchAtLogin
  });
}

function registerGlobalShortcut(): void {
  const isRegistered = globalShortcut.register(globalShortcutAccelerator, showMainWindow);

  if (!isRegistered) {
    console.warn(`Global shortcut ${globalShortcutAccelerator} registration failed.`);
  }
}

function cleanupSmokeUserData(): void {
  if (!smokeUserDataPath) {
    return;
  }

  const pathToRemove = smokeUserDataPath;
  smokeUserDataPath = null;

  try {
    fs.rmSync(pathToRemove, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Smoke userData cleanup skipped: ${(error as Error).message}`);
  }
}

function filterExpiredItems(items: ClipboardHistoryItem[]): ClipboardHistoryItem[] {
  const oldestAllowedTime =
    Date.now() - clipboardHistorySettings.retentionDays * millisecondsPerDay;

  return items.filter((item) => {
    if (item.pinned) {
      return true;
    }

    return new Date(item.copiedAt).getTime() >= oldestAllowedTime;
  });
}

function updateHistory(items: ClipboardHistoryItem[]): void {
  historyItems = sortHistory(filterExpiredItems(items)).slice(0, maxHistoryItems);
  persistHistory();
  publishHistory();
}

function rememberClipboardText(text: string): void {
  const normalizedText = text.trim();

  if (!normalizedText || normalizedText === lastClipboardText) {
    return;
  }

  lastClipboardText = normalizedText;

  const existingIndex = historyItems.findIndex(
    (item) => item.type === "text" && item.text === normalizedText
  );

  if (existingIndex >= 0) {
    const [existingItem] = historyItems.splice(existingIndex, 1);
    updateHistory([
      {
        ...existingItem,
        copiedAt: new Date().toISOString()
      },
      ...historyItems
    ]);
  } else {
    updateHistory([createTextItem(normalizedText), ...historyItems]);
  }
}

function getClipboardImageDataUrl(): string {
  const image = clipboard.readImage();

  if (image.isEmpty()) {
    return "";
  }

  return image.toDataURL();
}

function getImageByteSize(imageDataUrl: string): number {
  const base64Data = imageDataUrl.split(",")[1] ?? "";
  return Buffer.byteLength(base64Data, "base64");
}

function rememberClipboardImage(imageDataUrl: string): void {
  if (!imageDataUrl || imageDataUrl === lastClipboardImageDataUrl) {
    return;
  }

  const byteSize = getImageByteSize(imageDataUrl);

  if (byteSize > maxImageBytes) {
    lastClipboardImageDataUrl = imageDataUrl;
    return;
  }

  lastClipboardImageDataUrl = imageDataUrl;

  const existingIndex = historyItems.findIndex(
    (item) => item.type === "image" && item.imageDataUrl === imageDataUrl
  );

  if (existingIndex >= 0) {
    const [existingItem] = historyItems.splice(existingIndex, 1);
    updateHistory([
      {
        ...existingItem,
        copiedAt: new Date().toISOString()
      },
      ...historyItems
    ]);
  } else {
    updateHistory([createImageItem(imageDataUrl, byteSize), ...historyItems]);
  }
}

function readClipboard(): void {
  rememberClipboardText(clipboard.readText());
  rememberClipboardImage(getClipboardImageDataUrl());
}

function startClipboardPolling(): void {
  readClipboard();
  pollTimer = setInterval(readClipboard, pollIntervalMs);
}

function stopClipboardPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

ipcMain.handle("clipboard-history:get-items", () => historyItems);

ipcMain.handle("clipboard-history:get-settings", () => clipboardHistorySettings);

ipcMain.handle("clipboard-history:copy-item", (_event, id: string) => {
  const item = historyItems.find((historyItem) => historyItem.id === id);

  if (!item) {
    return false;
  }

  if (item.type === "image") {
    clipboard.writeImage(nativeImage.createFromDataURL(item.imageDataUrl));
    lastClipboardImageDataUrl = item.imageDataUrl;
  } else {
    clipboard.writeText(item.text);
    lastClipboardText = item.text;
  }

  return true;
});

ipcMain.handle("clipboard-history:set-retention-days", (_event, retentionDays: RetentionDays) => {
  if (retentionDays !== 1 && retentionDays !== 3 && retentionDays !== 5) {
    return clipboardHistorySettings;
  }

  clipboardHistorySettings = {
    ...clipboardHistorySettings,
    retentionDays
  };
  persistSettings();
  updateHistory(historyItems);
  publishSettings();
  return clipboardHistorySettings;
});

ipcMain.handle("clipboard-history:set-launch-at-login", (_event, launchAtLogin: boolean) => {
  clipboardHistorySettings = {
    ...clipboardHistorySettings,
    launchAtLogin
  };
  persistSettings();
  applyLaunchAtLogin();
  publishSettings();
  return clipboardHistorySettings;
});

ipcMain.handle("clipboard-history:delete-item", (_event, id: string) => {
  const nextHistory = historyItems.filter((item) => item.id !== id);

  if (nextHistory.length === historyItems.length) {
    return false;
  }

  updateHistory(nextHistory);
  return true;
});

ipcMain.handle("clipboard-history:toggle-item-pinned", (_event, id: string) => {
  const item = historyItems.find((historyItem) => historyItem.id === id);

  if (!item) {
    return false;
  }

  updateHistory(
    historyItems.map((historyItem) => {
      if (historyItem.id !== id) {
        return historyItem;
      }

      return {
        ...historyItem,
        pinned: !historyItem.pinned
      };
    })
  );
  return true;
});

async function runM3SmokeTest(): Promise<void> {
  const smokeText = `M3 smoke ${Date.now()}`;
  clipboard.writeText(smokeText);
  readClipboard();
  clipboard.writeText("M3 smoke before copy");

  await mainWindow?.webContents.executeJavaScript(
    `
      new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("M3 smoke timeout")), 3000);
        const check = () => {
          const card = document.querySelector("[data-history-item]");
          if (!card || !card.textContent.includes(${JSON.stringify(smokeText)})) {
            setTimeout(check, 100);
            return;
          }
          const copyButton = card.querySelector("[data-copy-action]");
          if (!copyButton) {
            reject(new Error("M3 smoke copy button missing"));
            return;
          }
          copyButton.click();
          setTimeout(() => {
            clearTimeout(timeout);
            resolve(document.querySelector("[data-status]")?.textContent || "");
          }, 100);
        };
        check();
      });
    `
  );

  const copiedBackText = clipboard.readText();

  if (copiedBackText !== smokeText) {
    throw new Error("M3 smoke copy-back failed");
  }

  console.log("M3_SMOKE_TEST_TEXT_HISTORY_OK");
}

async function runM4SmokeTest(): Promise<void> {
  const olderText = `M4 older ${Date.now()}`;
  const newerText = `M4 newer ${Date.now()}`;

  rememberClipboardText(olderText);
  rememberClipboardText(newerText);
  rememberClipboardText(olderText);

  const reloadedHistory = loadHistory(app.getPath("userData"));

  if (
    reloadedHistory[0]?.type !== "text" ||
    reloadedHistory[0].text !== olderText ||
    reloadedHistory[1]?.type !== "text" ||
    reloadedHistory[1].text !== newerText
  ) {
    throw new Error("M4 smoke persisted order failed");
  }

  const duplicateCount = reloadedHistory.filter(
    (item) => item.type === "text" && item.text === olderText
  ).length;

  if (duplicateCount !== 1) {
    throw new Error("M4 smoke duplicate merge failed");
  }

  publishHistory();

  await mainWindow?.webContents.executeJavaScript(
    `
      new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("M4 smoke UI timeout")), 3000);
        const check = () => {
          const cards = Array.from(document.querySelectorAll("[data-history-item]"));
          if (
            cards.length < 2 ||
            !cards[0].textContent.includes(${JSON.stringify(olderText)}) ||
            !cards[1].textContent.includes(${JSON.stringify(newerText)})
          ) {
            setTimeout(check, 100);
            return;
          }
          clearTimeout(timeout);
          resolve(true);
        };
        check();
      });
    `
  );

  console.log("M4_SMOKE_TEST_PERSISTENCE_OK");
}

async function runM5SmokeTest(): Promise<void> {
  const firstText = `M5 alpha ${Date.now()}`;
  const secondText = `M5 beta ${Date.now()}`;
  const thirdText = `M5 gamma ${Date.now()}`;

  rememberClipboardText(firstText);
  rememberClipboardText(secondText);
  rememberClipboardText(thirdText);

  publishHistory();

  await mainWindow?.webContents.executeJavaScript(
    `
      new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("M5 smoke initial UI timeout")), 3000);
        const check = () => {
          const cards = Array.from(document.querySelectorAll("[data-history-item]"));
          if (cards.length < 3 || !cards[0].textContent.includes(${JSON.stringify(thirdText)})) {
            setTimeout(check, 100);
            return;
          }
          clearTimeout(timeout);
          resolve(true);
        };
        check();
      });
    `
  );

  await mainWindow?.webContents.executeJavaScript(
    `
      new Promise((resolve, reject) => {
        const input = document.querySelector("[data-search]");
        if (!input) {
          reject(new Error("M5 smoke search input missing"));
          return;
        }
        input.value = ${JSON.stringify("beta")};
        input.dispatchEvent(new Event("input", { bubbles: true }));
        setTimeout(() => {
          const cards = Array.from(document.querySelectorAll("[data-history-item]"));
          if (cards.length !== 1 || !cards[0].textContent.includes(${JSON.stringify(secondText)})) {
            reject(new Error("M5 smoke search failed"));
            return;
          }
          input.value = "";
          input.dispatchEvent(new Event("input", { bubbles: true }));
          resolve(true);
        }, 100);
      });
    `
  );

  await mainWindow?.webContents.executeJavaScript(
    `
      new Promise((resolve, reject) => {
        setTimeout(() => {
          const betaCard = Array.from(document.querySelectorAll("[data-history-item]"))
            .find((card) => card.textContent.includes(${JSON.stringify(secondText)}));
          const pinButton = betaCard?.querySelector("[aria-label='置顶']");
          if (!pinButton) {
            reject(new Error("M5 smoke pin button missing"));
            return;
          }
          pinButton.click();
          setTimeout(() => {
            const firstCard = document.querySelector("[data-history-item]");
            if (!firstCard || !firstCard.textContent.includes(${JSON.stringify(secondText)})) {
              reject(new Error("M5 smoke pin failed"));
              return;
            }
            resolve(true);
          }, 150);
        }, 100);
      });
    `
  );

  await mainWindow?.webContents.executeJavaScript(
    `
      new Promise((resolve, reject) => {
        const gammaCard = Array.from(document.querySelectorAll("[data-history-item]"))
          .find((card) => card.textContent.includes(${JSON.stringify(thirdText)}));
        const deleteButton = gammaCard?.querySelector("[aria-label='删除']");
        if (!deleteButton) {
          reject(new Error("M5 smoke delete button missing"));
          return;
        }
        deleteButton.click();
        setTimeout(() => {
          const cards = Array.from(document.querySelectorAll("[data-history-item]"));
          if (cards.some((card) => card.textContent.includes(${JSON.stringify(thirdText)}))) {
            reject(new Error("M5 smoke delete failed"));
            return;
          }
          resolve(true);
        }, 150);
      });
    `
  );

  const reloadedHistory = loadHistory(app.getPath("userData"));

  if (reloadedHistory.some((item) => item.type === "text" && item.text === thirdText)) {
    throw new Error("M5 smoke persisted delete failed");
  }

  if (!reloadedHistory.find((item) => item.type === "text" && item.text === secondText)?.pinned) {
    throw new Error("M5 smoke persisted pin failed");
  }

  console.log("M5_SMOKE_TEST_UI_ACTIONS_OK");
}

async function runM6SmokeTest(): Promise<void> {
  const now = Date.now();
  const oldUnpinnedText = `M6 old unpinned ${now}`;
  const oldPinnedText = `M6 old pinned ${now}`;
  const freshText = `M6 fresh ${now}`;
  const twoDaysAgo = new Date(now - 2 * millisecondsPerDay).toISOString();

  updateHistory([
    {
      id: `m6-old-unpinned-${now}`,
      type: "text",
      text: oldUnpinnedText,
      copiedAt: twoDaysAgo,
      pinned: false
    },
    {
      id: `m6-old-pinned-${now}`,
      type: "text",
      text: oldPinnedText,
      copiedAt: twoDaysAgo,
      pinned: true
    },
    {
      id: `m6-fresh-${now}`,
      type: "text",
      text: freshText,
      copiedAt: new Date(now).toISOString(),
      pinned: false
    }
  ]);

  await mainWindow?.webContents.executeJavaScript(
    `
      new Promise((resolve, reject) => {
        const select = document.querySelector("[data-retention-days]");
        if (!select) {
          reject(new Error("M6 smoke retention selector missing"));
          return;
        }
        select.value = "1";
        select.dispatchEvent(new Event("change", { bubbles: true }));
        setTimeout(() => {
          const cards = Array.from(document.querySelectorAll("[data-history-item]"));
          if (cards.some((card) => card.textContent.includes(${JSON.stringify(oldUnpinnedText)}))) {
            reject(new Error("M6 smoke expired unpinned item was not cleaned"));
            return;
          }
          if (!cards.some((card) => card.textContent.includes(${JSON.stringify(oldPinnedText)}))) {
            reject(new Error("M6 smoke pinned expired item was cleaned"));
            return;
          }
          if (!cards.some((card) => card.textContent.includes(${JSON.stringify(freshText)}))) {
            reject(new Error("M6 smoke fresh item missing"));
            return;
          }
          resolve(true);
        }, 200);
      });
    `
  );

  const reloadedHistory = loadHistory(app.getPath("userData"));
  const reloadedSettings = loadClipboardHistorySettings(app.getPath("userData"));

  if (reloadedHistory.some((item) => item.type === "text" && item.text === oldUnpinnedText)) {
    throw new Error("M6 smoke persisted expired cleanup failed");
  }

  if (!reloadedHistory.some((item) => item.type === "text" && item.text === oldPinnedText)) {
    throw new Error("M6 smoke persisted pinned retention failed");
  }

  if (reloadedSettings.retentionDays !== 1) {
    throw new Error("M6 smoke persisted retention setting failed");
  }

  console.log("M6_SMOKE_TEST_RETENTION_OK");
}

async function runM7SmokeTest(): Promise<void> {
  const image = nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8Dwn4GBgYGJAQoAHxcCAr3abHAAAAAASUVORK5CYII="
  );

  const imageDataUrl = image.toDataURL();
  rememberClipboardImage(imageDataUrl);

  if (!historyItems.some((item) => item.type === "image" && item.imageDataUrl === imageDataUrl)) {
    throw new Error("M7 smoke image was not recorded");
  }

  publishHistory();

  await mainWindow?.webContents.executeJavaScript(
    `
      new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("M7 smoke image UI timeout")), 3000);
        const check = () => {
          const imageCard = Array.from(document.querySelectorAll("[data-history-item]"))
            .find((card) => card.querySelector(".history-card__image"));
          if (!imageCard) {
            setTimeout(check, 100);
            return;
          }
          const copyButton = imageCard.querySelector("[data-copy-action]");
          if (!copyButton) {
            reject(new Error("M7 smoke image copy button missing"));
            return;
          }
          copyButton.click();
          setTimeout(() => {
            clearTimeout(timeout);
            resolve(true);
          }, 150);
        };
        check();
      });
    `
  );

  if (clipboard.readImage().toDataURL() !== imageDataUrl) {
    throw new Error("M7 smoke image copy-back failed");
  }

  const savedHistory = loadHistory(app.getPath("userData"));

  if (!savedHistory.some((item) => item.type === "image" && item.imageDataUrl === imageDataUrl)) {
    throw new Error("M7 smoke persisted image missing");
  }

  const hugeBuffer = Buffer.alloc(maxImageBytes + 1);
  const originalCount = historyItems.length;

  rememberClipboardImage(`data:image/png;base64,${hugeBuffer.toString("base64")}`);

  if (historyItems.length !== originalCount) {
    throw new Error("M7 smoke oversized image was saved");
  }

  console.log("M7_SMOKE_TEST_IMAGE_HISTORY_OK");
}

async function runM8SmokeTest(): Promise<void> {
  if (!tray) {
    throw new Error("M8 smoke tray missing");
  }

  if (!globalShortcut.isRegistered(globalShortcutAccelerator)) {
    throw new Error("M8 smoke shortcut missing");
  }

  const settings = await mainWindow?.webContents.executeJavaScript(
    `
      new Promise((resolve, reject) => {
        const input = document.querySelector("[data-launch-at-login]");
        if (!input) {
          reject(new Error("M8 smoke launch-at-login input missing"));
          return;
        }
        input.checked = true;
        input.dispatchEvent(new Event("change", { bubbles: true }));
        setTimeout(() => {
          resolve(window.clipboardHistory.getSettings());
        }, 200);
      });
    `
  );

  if (!settings?.launchAtLogin) {
    throw new Error("M8 smoke launch-at-login setting failed");
  }

  const reloadedSettings = loadClipboardHistorySettings(app.getPath("userData"));

  if (!reloadedSettings.launchAtLogin) {
    throw new Error("M8 smoke persisted launch-at-login failed");
  }

  const loginItemSettings = app.getLoginItemSettings();

  if (!loginItemSettings.openAtLogin) {
    throw new Error("M8 smoke login item setting failed");
  }

  mainWindow?.close();

  if (mainWindow?.isVisible()) {
    throw new Error("M8 smoke close did not hide window");
  }

  showMainWindow();

  if (!mainWindow?.isVisible()) {
    throw new Error("M8 smoke show window failed");
  }

  console.log("M8_SMOKE_TEST_TRAY_SHORTCUT_LOGIN_OK");
}

function createMainWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 680,
    minWidth: 760,
    minHeight: 520,
    title: "历史剪贴板",
    backgroundColor: "#eef7ff",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "../src/index.html"));
  mainWindow.on("close", (event) => {
    if (isQuitting || (isAnySmokeTest && !isM8SmokeTest)) {
      return;
    }

    event.preventDefault();
    mainWindow?.hide();
  });

  if (isAnySmokeTest) {
    mainWindow.webContents.once("did-finish-load", () => {
      if (
        isM3SmokeTest ||
        isM4SmokeTest ||
        isM5SmokeTest ||
        isM6SmokeTest ||
        isM7SmokeTest ||
        isM8SmokeTest
      ) {
        const smokeTest = isM8SmokeTest
          ? runM8SmokeTest
          : isM7SmokeTest
          ? runM7SmokeTest
          : isM6SmokeTest
          ? runM6SmokeTest
          : isM5SmokeTest
          ? runM5SmokeTest
          : isM4SmokeTest
            ? runM4SmokeTest
            : runM3SmokeTest;

        smokeTest()
          .then(() => {
            isQuitting = true;
            stopClipboardPolling();
            globalShortcut.unregisterAll();
            tray?.destroy();
            tray = null;
            mainWindow?.close();
            app.quit();
          })
          .catch((error: Error) => {
            isQuitting = true;
            stopClipboardPolling();
            globalShortcut.unregisterAll();
            tray?.destroy();
            tray = null;
            cleanupSmokeUserData();
            console.error(error.message);
            app.exit(1);
          });
      } else {
        console.log("M2_SMOKE_TEST_WINDOW_LOADED");
        setTimeout(() => {
          mainWindow?.close();
          app.quit();
        }, 300);
      }
    });
  }

  return mainWindow;
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  isQuitting = true;
  app.quit();
} else {
  app.on("second-instance", showMainWindow);

  app.whenReady().then(() => {
    if (isM4SmokeTest || isM5SmokeTest || isM6SmokeTest || isM7SmokeTest || isM8SmokeTest) {
      smokeUserDataPath = fs.mkdtempSync(path.join(os.tmpdir(), "clipboard-history-smoke-"));
      app.setPath("userData", smokeUserDataPath);
    }

    clipboardHistorySettings = loadClipboardHistorySettings(app.getPath("userData"));
    historyItems = [];
    updateHistory(loadHistory(app.getPath("userData")).slice(0, maxHistoryItems));
    const latestTextItem = historyItems.find((item) => item.type === "text");
    const latestImageItem = historyItems.find((item) => item.type === "image");
    lastClipboardText = latestTextItem?.text ?? "";
    lastClipboardImageDataUrl = latestImageItem?.imageDataUrl ?? "";
    createApplicationMenu();
    createMainWindow();
    createTray();
    applyLaunchAtLogin();
    registerGlobalShortcut();
    startClipboardPolling();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      if (isAnySmokeTest || isQuitting) {
        app.quit();
      }
    }
  });

  app.on("before-quit", () => {
    isQuitting = true;
    stopClipboardPolling();
    globalShortcut.unregisterAll();
    tray?.destroy();
    tray = null;
    cleanupSmokeUserData();
  });
}
