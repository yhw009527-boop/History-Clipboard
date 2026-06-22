# History Clipboard

Windows desktop clipboard history app built with Electron and TypeScript.

## Features

- Records recent text clipboard entries.
- Records image clipboard entries up to 10 MB.
- Deduplicates repeated clipboard content and moves the latest copy to the top.
- Supports search, pinning, deleting, and retention settings.
- Provides a system tray entry and `Ctrl+Shift+V` global shortcut.
- Supports optional launch at login.

## Development

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

## Notes

- The first version targets Windows.
- Local clipboard history is stored in Electron's `userData` directory.
- This project does not include cloud sync, account login, encryption, OCR, or automatic paste.
