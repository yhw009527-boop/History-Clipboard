import fs from "node:fs";
import path from "node:path";
import type { ClipboardHistoryItem, ClipboardHistorySettings, RetentionDays } from "./types";

const historyFileName = "text-history.json";
const settingsFileName = "settings.json";
export const defaultClipboardHistorySettings: ClipboardHistorySettings = {
  retentionDays: 3,
  launchAtLogin: false,
  floatingButtonVisible: true,
  floatingWindowPosition: null
};

function isClipboardHistoryItem(value: unknown): value is ClipboardHistoryItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;
  const hasBaseShape =
    typeof item.id === "string" &&
    typeof item.copiedAt === "string" &&
    (typeof item.pinned === "boolean" || typeof item.pinned === "undefined");

  if (!hasBaseShape) {
    return false;
  }

  if (item.type === "image") {
    return typeof item.imageDataUrl === "string" && typeof item.byteSize === "number";
  }

  return (item.type === "text" || typeof item.type === "undefined") && typeof item.text === "string";
}

function normalizeClipboardHistoryItem(item: ClipboardHistoryItem): ClipboardHistoryItem {
  if (item.type === "image") {
    return {
      ...item,
      type: "image",
      pinned: item.pinned === true
    };
  }

  return {
    ...item,
    type: "text",
    pinned: item.pinned === true
  };
}

function isRetentionDays(value: unknown): value is RetentionDays {
  return value === 1 || value === 3 || value === 5;
}

function normalizeFloatingWindowPosition(value: unknown): ClipboardHistorySettings["floatingWindowPosition"] {
  if (!value || typeof value !== "object") {
    return defaultClipboardHistorySettings.floatingWindowPosition;
  }

  const position = value as Record<string, unknown>;

  if (typeof position.x !== "number" || typeof position.y !== "number") {
    return defaultClipboardHistorySettings.floatingWindowPosition;
  }

  return {
    x: position.x,
    y: position.y
  };
}

function normalizeClipboardHistorySettings(value: unknown): ClipboardHistorySettings {
  if (!value || typeof value !== "object") {
    return defaultClipboardHistorySettings;
  }

  const settings = value as Record<string, unknown>;

  return {
    retentionDays: isRetentionDays(settings.retentionDays)
      ? settings.retentionDays
      : defaultClipboardHistorySettings.retentionDays,
    launchAtLogin:
      typeof settings.launchAtLogin === "boolean"
        ? settings.launchAtLogin
        : defaultClipboardHistorySettings.launchAtLogin,
    floatingButtonVisible:
      typeof settings.floatingButtonVisible === "boolean"
        ? settings.floatingButtonVisible
        : defaultClipboardHistorySettings.floatingButtonVisible,
    floatingWindowPosition: normalizeFloatingWindowPosition(settings.floatingWindowPosition)
  };
}

export function sortHistory(items: ClipboardHistoryItem[]): ClipboardHistoryItem[] {
  return [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }

    return new Date(b.copiedAt).getTime() - new Date(a.copiedAt).getTime();
  });
}

export function getHistoryFilePath(userDataPath: string): string {
  return path.join(userDataPath, historyFileName);
}

export function getSettingsFilePath(userDataPath: string): string {
  return path.join(userDataPath, settingsFileName);
}

export function loadHistory(userDataPath: string): ClipboardHistoryItem[] {
  const historyFilePath = getHistoryFilePath(userDataPath);

  if (!fs.existsSync(historyFilePath)) {
    return [];
  }

  try {
    const rawHistory = fs.readFileSync(historyFilePath, "utf8");
    const parsedHistory: unknown = JSON.parse(rawHistory);

    if (!Array.isArray(parsedHistory)) {
      return [];
    }

    return sortHistory(parsedHistory.filter(isClipboardHistoryItem).map(normalizeClipboardHistoryItem));
  } catch {
    return [];
  }
}

export function saveHistory(userDataPath: string, items: ClipboardHistoryItem[]): void {
  fs.mkdirSync(userDataPath, { recursive: true });
  fs.writeFileSync(getHistoryFilePath(userDataPath), JSON.stringify(items, null, 2), "utf8");
}

export function loadClipboardHistorySettings(userDataPath: string): ClipboardHistorySettings {
  const settingsFilePath = getSettingsFilePath(userDataPath);

  if (!fs.existsSync(settingsFilePath)) {
    return defaultClipboardHistorySettings;
  }

  try {
    const rawSettings = fs.readFileSync(settingsFilePath, "utf8");
    return normalizeClipboardHistorySettings(JSON.parse(rawSettings));
  } catch {
    return defaultClipboardHistorySettings;
  }
}

export function saveClipboardHistorySettings(
  userDataPath: string,
  settings: ClipboardHistorySettings
): void {
  fs.mkdirSync(userDataPath, { recursive: true });
  fs.writeFileSync(getSettingsFilePath(userDataPath), JSON.stringify(settings, null, 2), "utf8");
}
