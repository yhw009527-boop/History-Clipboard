# 历史剪贴板

一个基于 Electron + TypeScript 开发的 Windows 桌面剪贴板历史工具，用于记录近期复制过的文字和图片，方便后续查找、复制回剪贴板并再次使用。


## 主要功能

- 自动记录最近复制过的文字内容。
- 自动记录不超过 10 MB 的图片剪贴板内容。
- 自动合并重复内容，并把最新复制的记录移动到顶部。
- 支持搜索历史记录。
- 支持置顶重要记录。
- 支持删除单条记录。
- 支持设置历史记录保留时长。
- 支持开机自启。
- 支持系统托盘常驻。
- 支持 `Ctrl+Shift+V` 全局快捷键打开悬浮历史面板。
- 支持常驻悬浮球，方便快速查看最近记录。
- 支持点击悬浮面板里的文字或图片记录，将内容复制回系统剪贴板。

## 悬浮球与悬浮面板

应用启动后会默认显示一个圆形悬浮球。悬浮球始终置顶，可以拖动到屏幕边缘或常用位置。

点击悬浮球会打开轻量悬浮历史面板。面板会显示最近的剪贴板记录，点击其中一条记录后，应用会把该记录重新写回系统剪贴板，并自动收起面板。

系统托盘菜单也提供悬浮功能入口：

- 打开历史剪贴板
- 打开悬浮面板
- 显示或隐藏悬浮按钮
- 退出应用

## 主窗口

主窗口用于管理完整的剪贴板历史记录，包含搜索、置顶、删除、保留时长、开机自启和悬浮按钮开关等常用操作。

关闭主窗口不会退出应用。应用会继续在后台运行并记录剪贴板，托盘和悬浮球仍然可用。如需完全退出，请通过托盘菜单选择“退出”。

## 关于信息

应用菜单中的“帮助 -> 关于历史剪贴板”会显示版本信息和制作署名：

```text
历史剪贴板
版本 0.1.0
氧化物制作
```

## 本地运行

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

## 测试

运行基础 smoke 测试：

```powershell
npm run smoke
```

项目中还包含多个阶段 smoke 测试，可直接通过 Electron 参数运行，例如：

```powershell
$env:ELECTRON_RUN_AS_NODE=$null; .\node_modules\.bin\electron.cmd . --m10-smoke-test
```

常用验证包括：

- M3：文字历史记录。
- M8：托盘、快捷键和开机自启。
- M10：悬浮球、悬浮面板、点击复制回剪贴板、显示隐藏悬浮按钮。

## 打包

打包 Windows 文件夹版本：

```powershell
npm run package:win
```

打包产物会生成到：

```text
release/历史剪贴板-win32-x64/历史剪贴板.exe
```

`release/` 已被 Git 忽略，因为它是本地可重新生成的打包产物。

如果打包时提示 `EPERM` 或无法删除 `release` 目录，通常是旧版 `历史剪贴板.exe` 仍在运行。请先从托盘退出应用，或结束旧进程后再重新打包。

## 项目结构

```text
src/main.ts              Electron 主进程、窗口、托盘、快捷键和 IPC
src/index.html           主窗口页面
src/renderer.js          主窗口交互逻辑
src/styles.css           主窗口样式
src/floating-button.*    悬浮球页面、样式和交互
src/floating.*           悬浮历史面板页面、样式和交互
src/history-store.ts     历史记录和设置的本地存储
src/preload.ts           渲染进程安全 API 暴露
src/types.ts             共享类型定义
docs/                    需求、技术方案、开发步骤和验收说明
dev-journal/             开发日志
scripts/package-win.js   Windows 文件夹打包脚本
```

## 数据说明

剪贴板历史和设置保存在 Electron 的 `userData` 目录中。历史记录数据结构保持本地存储，不依赖云端服务。

当前版本暂不包含以下功能：

- 云同步
- 账号系统
- 本地加密
- OCR 识别
- 自动粘贴
- 悬浮面板内搜索、置顶或删除

## 环境说明

- 当前版本优先支持 Windows。
- 桌面端基于 Electron。
- 主要代码使用 TypeScript、HTML、CSS 和 JavaScript。
