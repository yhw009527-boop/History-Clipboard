# 技术方案文档

## 当前状态

M9 已完成：项目已实现核心功能，并生成 Windows unpacked 可运行产物 `release/历史剪贴板-win32-x64/历史剪贴板.exe`。

当前技术路线：第一版采用 Electron。

## 本机环境检查

- Node.js 已安装：`v24.14.1`。
- npm 可用：`npm.cmd 11.11.0`。
- PowerShell 直接执行 `npm` 会被执行策略拦截，后续命令应优先使用 `npm.cmd`。
- .NET 运行时存在：`Microsoft.NETCore.App 8.0.28`、`Microsoft.NETCore.App 9.0.17`、`Microsoft.WindowsDesktop.App 8.0.28`、`Microsoft.WindowsDesktop.App 9.0.17`。
- .NET SDK 未检测到：`dotnet --list-sdks` 无输出。
- Rust 未检测到。

## 官方资料依据

- Electron `clipboard` API 支持读写系统剪贴板文本和图片，符合文字、图片记录与再次写回剪贴板的核心需求：<https://www.electronjs.org/docs/latest/api/clipboard>
- Electron `Tray` API 支持系统通知区域图标和菜单，符合托盘常驻入口需求：<https://www.electronjs.org/docs/latest/api/tray>
- Electron `globalShortcut` API 支持应用未获得焦点时监听全局快捷键，符合 `Ctrl+Shift+V` 呼出需求：<https://www.electronjs.org/docs/latest/api/global-shortcut>
- Electron `app.setLoginItemSettings` 支持 macOS/Windows 登录项设置，符合开机自启需求：<https://www.electronjs.org/docs/latest/api/app>
- Electron Forge 可用于 Electron 应用脚手架、打包和分发，要求 Node.js 与包管理器，当前本机满足 Node/npm 条件：<https://www.electronforge.io/>
- Microsoft WPF 是 .NET 的 Windows 桌面 UI 框架，但当前本机未检测到 .NET SDK，若选择 .NET 路线需要先安装 SDK：<https://learn.microsoft.com/en-us/dotnet/desktop/wpf/overview/>

## 候选路线

### Electron

适合快速构建 Windows 桌面软件。可支持窗口、系统托盘、全局快捷键、剪贴板读写和前端 UI。

可能优势：

- 桌面能力较完整。
- UI 开发灵活。
- 剪贴板、托盘、快捷键支持成熟。
- 适合快速做可用原型。

可能风险：

- 应用体积通常较大。
- 需要管理 Node.js 生态依赖。
- 剪贴板监听通常需要轮询或结合系统事件方案，M3 阶段需要单独验证稳定性。

### .NET 桌面

适合 Windows 原生桌面开发，可选择 WPF、WinUI 或 MAUI 等路线。

可能优势：

- Windows 集成度高。
- 应用体验更接近原生桌面软件。
- 对长期 Windows 项目较稳。

可能风险：

- UI 开发和跨端扩展成本需要进一步评估。
- 剪贴板图片、托盘、快捷键等能力需要按具体框架确认实现方式。
- 当前本机没有 .NET SDK，直接进入项目骨架前需要先安装开发工具链。

### Tauri

Tauri 也可用于桌面软件开发，但需要 Rust 工具链。当前本机未检测到 Rust，因此不作为第一版推荐路线。

可能优势：

- 应用体积通常较小。
- 可使用前端技术构建界面。

可能风险：

- 当前环境缺少 Rust。
- 剪贴板、托盘、快捷键、开机自启等能力需要额外插件和验证。
- 对当前项目而言会增加 M2 前置准备成本。

## 决策标准

M1 阶段需要按以下标准选择第一版技术路线：

- 是否能稳定监听剪贴板文字和图片。
- 是否能写回系统剪贴板。
- 是否支持系统托盘常驻。
- 是否支持全局快捷键 `Ctrl+Shift+V`。
- 是否支持开机自启。
- 是否便于构建简洁直观的淡蓝色 UI。
- 是否适合小里程碑逐步开发。
- 是否适合打包为 Windows 可运行软件。

## 当前默认结论

- 第一版锁定 Electron。
- M2 已创建最小 Electron + TypeScript 桌面应用骨架。
- 建议优先使用 TypeScript，以减少后续剪贴板数据结构和进程通信中的类型错误。
- 后续涉及 npm 命令时，Windows PowerShell 下优先使用 `npm.cmd`。
- 当前未引入 Electron Forge，M2 先保持最小骨架；后续打包阶段再引入打包工具。
- 当前环境存在 `ELECTRON_RUN_AS_NODE=1`，启动 Electron GUI 前需要清理该环境变量。
- 在沙箱内直接启动 Electron GUI 可能失败；smoke 验证需要在允许 GUI 的环境中运行。

## M2 结果

M2 只做最小可运行桌面应用：

- 已创建项目骨架。
- 已验证能启动一个 Windows 桌面窗口。
- 未实现剪贴板监听。
- 未实现本地存储。
- 未实现托盘、快捷键、开机自启。

## M3 预备边界

M3 只实现文字剪贴板监听：

- 已记录文字复制内容。
- 已在当前窗口展示文字历史。
- 已支持点击文字历史后重新写入系统剪贴板。
- 不实现图片记录。
- 不实现本地持久化存储。
- 不实现置顶、删除、搜索。
- 不实现托盘、快捷键、开机自启。

## M4 预备边界

M4 只做本地历史存储：

- 已增加本地保存。
- 已实现重复内容合并。
- 已实现按时间倒序读取。
- 不实现图片记录。
- 不实现置顶、删除、搜索。
- 不实现保留时间清理。
- 不实现托盘、快捷键、开机自启。

## 本地存储

- 当前保存文字和图片历史。
- 存储位置使用 Electron `app.getPath("userData")` 目录。
- 存储文件名为 `text-history.json`。
- 设置文件名为 `settings.json`。
- 历史存储格式为 JSON 数组，图片以 PNG data URL 字符串保存。
- 当前最多保留 50 条历史记录。
- 本地存储暂不加密，符合已确认的第一版本地明文保存要求。

## M5 预备边界

M5 只做基础 UI：

- 已实现搜索框。
- 已实现历史卡片基础操作。
- 已实现删除。
- 已实现置顶。
- 已保持简洁直观的淡蓝色风格。
- 不实现图片记录。
- 不实现保留时间清理。
- 不实现托盘、快捷键、开机自启。

## M6 预备边界

M6 只做保留时间清理，已完成：

- 支持 `1 天`、`3 天`、`5 天` 设置。
- 未置顶内容超过保留时间后自动清理。
- 置顶内容不自动清理。
- 不实现图片记录。
- 不实现托盘、快捷键、开机自启。

## M7 预备边界

M7 只做图片记录，已完成：

- 支持图片复制记录。
- 支持图片缩略图展示。
- 支持点击图片记录后重新写入剪贴板。
- 单张图片限制 `10MB`。
- 不实现托盘、快捷键、开机自启。

## M8 预备边界

M8 只做托盘、快捷键、开机自启，已完成：

- 支持系统托盘常驻。
- 支持 `Ctrl+Shift+V` 呼出历史面板。
- 支持开机自启。
- 不处理打包分发。

## M9 预备边界

M9 只做打包与验收，已完成：

- 新增本地打包脚本 `scripts/package-win.js`。
- 新增 `npm.cmd run package:win` 打包命令。
- 复用已安装的 Electron runtime，生成 Windows unpacked 可运行文件夹。
- 产物路径：`release/历史剪贴板-win32-x64/历史剪贴板.exe`。
- 已按测试验收标准运行构建、M3-M8 smoke 回归和产物启动验证。

## 打包说明

- 当前产物为未安装版文件夹，可直接运行 `历史剪贴板.exe`。
- 当前未生成安装器。
- 当前未做代码签名。
- 当前未做自动更新。
- 若后续需要安装器，可在用户确认后引入 Electron Forge 或 electron-builder。
