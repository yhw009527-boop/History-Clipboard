export type RetentionDays = 1 | 3 | 5;

export type ClipboardHistoryItem = ClipboardTextItem | ClipboardImageItem;

export interface ClipboardBaseItem {
  id: string;
  type: "text" | "image";
  copiedAt: string;
  pinned: boolean;
}

export interface ClipboardTextItem extends ClipboardBaseItem {
  type: "text";
  text: string;
}

export interface ClipboardImageItem extends ClipboardBaseItem {
  type: "image";
  imageDataUrl: string;
  byteSize: number;
}

export interface ClipboardHistorySettings {
  retentionDays: RetentionDays;
  launchAtLogin: boolean;
}

export interface ClipboardHistoryApi {
  getHistory(): Promise<ClipboardHistoryItem[]>;
  getSettings(): Promise<ClipboardHistorySettings>;
  copyItem(id: string): Promise<boolean>;
  deleteItem(id: string): Promise<boolean>;
  toggleItemPinned(id: string): Promise<boolean>;
  setRetentionDays(retentionDays: RetentionDays): Promise<ClipboardHistorySettings>;
  setLaunchAtLogin(launchAtLogin: boolean): Promise<ClipboardHistorySettings>;
  onHistoryChanged(callback: (items: ClipboardHistoryItem[]) => void): () => void;
  onSettingsChanged(callback: (settings: ClipboardHistorySettings) => void): () => void;
}

declare global {
  interface Window {
    clipboardHistory: ClipboardHistoryApi;
  }
}

export {};
