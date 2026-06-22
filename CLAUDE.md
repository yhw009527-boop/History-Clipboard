# CLAUDE.md

## 项目工作原则

本项目是一个 Windows 历史剪贴板软件。开发必须分步推进，先确认范围，再执行实现。未经用户明确确认，不得擅自进入下一里程碑。

## 每次开始工作前必须阅读

- `docs/requirements.md`：产品需求与范围
- `docs/technical-plan.md`：技术方案与决策状态
- `docs/ui-design.md`：界面设计规范
- `docs/development-steps.md`：分步开发计划
- `docs/testing-acceptance.md`：测试与验收标准
- `dev-journal/README.md`：开发日志记录规则

## 每次结束工作前必须更新

- `dev-journal/YYYY-MM-DD.md`

日志必须记录：

- 本次完成事项
- 验证方式与结果
- 遗留问题
- 下一步待办

如果当天日志不存在，必须先基于 `dev-journal/_template.md` 创建。

## 里程碑推进规则

- 每次只推进一个小里程碑。
- 每个里程碑开始前，必须明确目标、范围和验收标准。
- 每个里程碑完成后，必须更新当天开发日志。
- 用户未确认前，不得进入下一里程碑。
- 不确定事项必须记录到对应文档，不能凭空决定。
- 项目文档优先使用中文。

## 当前阶段

- 当前阶段：M9 打包与验收
- 当前状态：已生成 Windows unpacked 可运行产物 `release/历史剪贴板-win32-x64/历史剪贴板.exe`，并通过构建、M3-M8 smoke 回归和产物启动验证
- 当前限制：当前产物为未安装版文件夹，不包含安装器、代码签名或自动更新
- 下一阶段：第一版核心里程碑已完成；后续新功能或安装器需用户另行确认

## 标准文件路径

- 产品需求：`docs/requirements.md`
- 技术方案：`docs/technical-plan.md`
- UI 设计规范：`docs/ui-design.md`
- 开发步骤：`docs/development-steps.md`
- 测试验收：`docs/testing-acceptance.md`
- 开发日志规则：`dev-journal/README.md`
- 开发日志模板：`dev-journal/_template.md`
