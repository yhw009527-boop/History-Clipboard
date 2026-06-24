# 测试与验收标准

## 总体要求

每个里程碑必须有可运行或可检查的结果。完成后必须记录验证方式和验证结果到当天开发日志。

## M0 验收

- `docs/` 存在。
- `dev-journal/` 存在。
- `CLAUDE.md` 存在。
- `docs/requirements.md` 存在。
- `docs/technical-plan.md` 存在。
- `docs/ui-design.md` 存在。
- `docs/development-steps.md` 存在。
- `docs/testing-acceptance.md` 存在。
- `dev-journal/README.md` 存在。
- `dev-journal/_template.md` 存在。
- `dev-journal/2026-06-20.md` 存在。

## M1 验收

- `docs/technical-plan.md` 包含 Electron、.NET 桌面和 Tauri 的路线对比。
- `docs/technical-plan.md` 包含本机工具链检查结果。
- `docs/technical-plan.md` 包含官方资料依据链接。
- `docs/technical-plan.md` 给出第一版推荐技术路线。
- 当天开发日志记录 M1 完成事项、验证方式、验证结果、遗留问题和下一步待办。
- 用户明确确认后，才能进入 M2 项目骨架。

## M2 验收

- `package.json` 存在，并包含 `build`、`start`、`smoke` 脚本。
- `tsconfig.json` 存在。
- `src/main.ts` 存在，并创建最小 Electron 主窗口。
- `src/preload.ts` 存在。
- `src/renderer.ts` 存在。
- `src/index.html` 存在。
- `src/styles.css` 存在。
- `npm.cmd run build` 能通过。
- smoke 测试能启动 Electron 窗口、加载页面并自动退出。
- M2 不实现剪贴板监听、本地存储、托盘、快捷键或开机自启。

## M3 验收

- 应用运行时能监听文字剪贴板变化。
- 复制文字后，窗口能显示该文字记录。
- 点击文字记录后，该文字能重新写回系统剪贴板。
- `npm.cmd run build` 能通过。
- M3 smoke 测试输出 `M3_SMOKE_TEST_TEXT_HISTORY_OK`。
- M3 不实现本地持久化、图片记录、置顶、删除、搜索、托盘、快捷键或开机自启。

## M4 验收

- 文字历史能保存到本地文件。
- 应用启动时能读取本地文字历史。
- 相同文字重复复制时只保留一条，并更新时间移动到顶部。
- 读取后的文字历史按 `copiedAt` 时间倒序展示。
- `npm.cmd run build` 能通过。
- M3 回归 smoke 测试输出 `M3_SMOKE_TEST_TEXT_HISTORY_OK`。
- M4 smoke 测试输出 `M4_SMOKE_TEST_PERSISTENCE_OK`。
- M4 不实现图片记录、置顶、删除、搜索、保留时间清理、托盘、快捷键或开机自启。

## M5 验收

- 窗口提供文字搜索框。
- 搜索关键词后，只展示匹配文字记录。
- 历史记录以卡片形式展示。
- 用户可以置顶文字记录。
- 置顶记录显示在普通记录之前。
- 用户可以删除文字记录。
- 删除和置顶状态会写入本地历史文件。
- `npm.cmd run build` 能通过。
- M3 回归 smoke 测试输出 `M3_SMOKE_TEST_TEXT_HISTORY_OK`。
- M4 回归 smoke 测试输出 `M4_SMOKE_TEST_PERSISTENCE_OK`。
- M5 smoke 测试输出 `M5_SMOKE_TEST_UI_ACTIONS_OK`。
- M5 不实现图片记录、保留时间清理、托盘、快捷键或开机自启。

## M6 验收

- 窗口提供 `1 天`、`3 天`、`5 天` 保留时长设置。
- 保留时长设置会写入本地设置文件。
- 未置顶文字记录超过保留时长后会被清理。
- 置顶文字记录不会因超过保留时长被自动清理。
- `npm.cmd run build` 能通过。
- M3 回归 smoke 测试输出 `M3_SMOKE_TEST_TEXT_HISTORY_OK`。
- M4 回归 smoke 测试输出 `M4_SMOKE_TEST_PERSISTENCE_OK`。
- M5 回归 smoke 测试输出 `M5_SMOKE_TEST_UI_ACTIONS_OK`。
- M6 smoke 测试输出 `M6_SMOKE_TEST_RETENTION_OK`。
- M6 不实现图片记录、托盘、快捷键或开机自启。

## M7 验收

- 应用运行时能记录图片剪贴板内容。
- 图片记录能在历史列表中显示缩略图。
- 点击图片记录后，图片能重新写回系统剪贴板。
- 图片记录会写入本地历史文件。
- 相同图片重复复制时只保留一条，并更新时间移动到顶部。
- 超过 `10MB` 的图片不保存。
- `npm.cmd run build` 能通过。
- M3 回归 smoke 测试输出 `M3_SMOKE_TEST_TEXT_HISTORY_OK`。
- M4 回归 smoke 测试输出 `M4_SMOKE_TEST_PERSISTENCE_OK`。
- M5 回归 smoke 测试输出 `M5_SMOKE_TEST_UI_ACTIONS_OK`。
- M6 回归 smoke 测试输出 `M6_SMOKE_TEST_RETENTION_OK`。
- M7 smoke 测试输出 `M7_SMOKE_TEST_IMAGE_HISTORY_OK`。
- M7 不实现托盘、快捷键或开机自启。

## M8 验收

- 应用启动后创建系统托盘图标。
- 关闭主窗口后，应用仍在后台运行并继续监听剪贴板。
- 托盘菜单可以打开主窗口。
- 托盘菜单可以退出应用。
- 全局快捷键 `Ctrl+Shift+V` 可以打开主窗口。
- 窗口提供开机自启设置。
- 开机自启设置会写入本地设置文件，并应用到 Electron 登录项设置。
- `npm.cmd run build` 能通过。
- M3 回归 smoke 测试输出 `M3_SMOKE_TEST_TEXT_HISTORY_OK`。
- M4 回归 smoke 测试输出 `M4_SMOKE_TEST_PERSISTENCE_OK`。
- M5 回归 smoke 测试输出 `M5_SMOKE_TEST_UI_ACTIONS_OK`。
- M6 回归 smoke 测试输出 `M6_SMOKE_TEST_RETENTION_OK`。
- M7 回归 smoke 测试输出 `M7_SMOKE_TEST_IMAGE_HISTORY_OK`。
- M8 smoke 测试输出 `M8_SMOKE_TEST_TRAY_SHORTCUT_LOGIN_OK`。
- M8 不处理打包分发。

## M9 验收

- `npm.cmd run package:win` 能通过。
- 生成 Windows 可运行产物目录 `release/历史剪贴板-win32-x64/`。
- 产物目录中存在 `历史剪贴板.exe`。
- 打包后的可执行文件能启动并自动完成基础 smoke 验证。
- `npm.cmd run build` 能通过。
- M3 回归 smoke 测试输出 `M3_SMOKE_TEST_TEXT_HISTORY_OK`。
- M4 回归 smoke 测试输出 `M4_SMOKE_TEST_PERSISTENCE_OK`。
- M5 回归 smoke 测试输出 `M5_SMOKE_TEST_UI_ACTIONS_OK`。
- M6 回归 smoke 测试输出 `M6_SMOKE_TEST_RETENTION_OK`。
- M7 回归 smoke 测试输出 `M7_SMOKE_TEST_IMAGE_HISTORY_OK`。
- M8 回归 smoke 测试输出 `M8_SMOKE_TEST_TRAY_SHORTCUT_LOGIN_OK`。
- 当前 M9 产物为未安装版文件夹，不验收安装器、代码签名或自动更新。

## 功能验收基线

后续功能开发至少覆盖以下场景：

- 复制文字后，历史面板能显示该文字记录。
- 点击文字历史记录后，内容能重新进入系统剪贴板。
- 复制图片后，历史面板能显示图片缩略图。
- 点击图片历史记录后，图片能重新进入系统剪贴板。
- 相同内容重复复制时，不新增重复卡片，而是更新时间并移动到顶部。
- 设置保留时间为 `1 天`、`3 天`、`5 天` 后，未置顶过期内容会被清理。
- 置顶内容即使超过保留时间，也不会被自动删除。
- 删除某条记录后，该记录不再显示。
- 搜索文字关键词时，列表只展示匹配记录。
- 关闭主窗口后，软件仍在后台记录剪贴板。
- 重启电脑后，软件能自动启动并继续记录。

## 日志验收

每次开发结束前，必须确认当天日志包含：

- 本次目标。
- 完成事项。
- 验证方式。
- 验证结果。
- 遗留问题。
- 下一步待办。

## M10 验收

- `npm.cmd run build` 能通过。
- M3-M8 smoke 回归保持通过。
- 新增 M10 smoke 输出 `M10_SMOKE_TEST_FLOATING_WINDOW_OK`。
- 应用启动后默认显示常驻悬浮按钮。
- 托盘菜单可以打开主窗口、打开悬浮面板、显示/隐藏悬浮按钮。
- `Ctrl+Shift+V` 可以打开悬浮面板。
- 悬浮面板显示最近剪贴板记录，点击文字或图片记录后能写回系统剪贴板并收起面板。
- 主窗口关闭隐藏后，应用仍在后台运行，悬浮按钮仍可用。
- 主窗口的空状态、状态反馈、操作按钮可读性和小屏布局有基础优化。
