# History Clipboard / 历史剪贴板

## 简体中文

历史剪贴板是一个基于 Electron 和 TypeScript 构建的 Windows 桌面剪贴板历史工具。

### 功能

- 记录最近复制过的文字内容。
- 记录不超过 10 MB 的图片剪贴板内容。
- 自动合并重复内容，并把最近复制的记录移动到顶部。
- 支持搜索、置顶、删除和保留时长设置。
- 提供系统托盘入口和 `Ctrl+Shift+V` 全局快捷键。
- 支持可选的开机自启。

### 开发

安装依赖：

```powershell
npm install
```

编译 TypeScript：

```powershell
npm run build
```

从源码启动应用：

```powershell
npm start
```

运行基础 smoke 测试：

```powershell
npm run smoke
```

打包 Windows 文件夹版本：

```powershell
npm run package:win
```

打包产物会生成到 `release/`，该目录已被 Git 忽略，因为它可以在本地重新生成。

### 说明

- 当前版本优先支持 Windows。
- 本地剪贴板历史存储在 Electron 的 `userData` 目录中。
- 本项目暂不包含云同步、账号系统、本地加密、OCR 或自动粘贴功能。

## English

History Clipboard is a Windows desktop clipboard history app built with Electron and TypeScript.

### Features

- Records recent text clipboard entries.
- Records image clipboard entries up to 10 MB.
- Deduplicates repeated clipboard content and moves the latest copy to the top.
- Supports search, pinning, deleting, and retention settings.
- Provides a system tray entry and `Ctrl+Shift+V` global shortcut.
- Supports optional launch at login.

### Development

Install dependencies:

```powershell
npm install
```

Build TypeScript:

```powershell
npm run build
```

Start the app from source:

```powershell
npm start
```

Run the main smoke test:

```powershell
npm run smoke
```

Package a Windows folder build:

```powershell
npm run package:win
```

The packaged app is generated under `release/`, which is ignored by Git because it can be rebuilt locally.

### Notes

- The current version primarily targets Windows.
- Local clipboard history is stored in Electron's `userData` directory.
- This project does not include cloud sync, account login, local encryption, OCR, or automatic paste.
