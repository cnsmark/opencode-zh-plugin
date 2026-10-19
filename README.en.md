# opencode-zh-plugin

[![npm version](https://img.shields.io/npm/v/opencode-zh-plugin?color=green&label=npm)](https://www.npmjs.com/package/opencode-zh-plugin)
[![npm downloads](https://img.shields.io/npm/dt/opencode-zh-plugin?color=blue)](https://www.npmjs.com/package/opencode-zh-plugin)
[![GitHub stars](https://img.shields.io/github/stars/mike652638/opencode-zh-plugin?style=flat)](https://github.com/mike652638/opencode-zh-plugin/stargazers)
[![license](https://img.shields.io/npm/l/opencode-zh-plugin)](./LICENSE)
[![GitHub Actions](https://img.shields.io/github/actions/workflow/status/mike652638/opencode-zh-plugin/ci.yml?branch=main)](https://github.com/mike652638/opencode-zh-plugin/actions)

OpenCode 中文增强插件 — 通过官方 Plugin + Skill 机制实现 AI 回复中文化与 TUI 界面汉化。

**Supports both OpenCode v1 (1.x) and v2 (2.x)** — a single npm package that adapts to both generations of the Plugin API.

**Companion tool**: [opencode-zh-desktop](https://www.npmjs.com/package/opencode-zh-desktop) — CDP-based Desktop UI Chinese injection.

[中文文档](./README.md)

## 工作原理

```
┌───────────────────────────────────────────────────────┐
│               opencode-zh-plugin 架构                  │
├───────────────────────────────────────────────────────┤
│                                                        │
│  Server Plugin                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ v1  ./server  experimental.chat.system.transform │  │
│  │ v2  .         session.hook("context" /           │  │
│  │               "compaction"/"generate"/"title")   │  │
│  │   → 注入 <language_directive> 到 system prompt    │  │
│  │   → AI 全部输出（think/response）切换为中文        │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  TUI Plugin (./tui)                                    │
│  ┌─────────────────────────────────────────────────┐  │
│  │ v1  api.slots.register()                         │  │
│  │   → home_logo / home_footer / home_bottom /      │  │
│  │     sidebar_title                                │  │
│  │ v2  ctx.ui.slot() + ctx.keymap.layer()           │  │
│  │   → home.footer(replace) / sidebar.footer(append)│  │
│  ├─────────────────────────────────────────────────┤  │
│  │ 命令（两代一致）                                  │  │
│  │   → /zh        启用中文模式                       │  │
│  │   → /zh-off    关闭中文模式                       │  │
│  │   → /zh-cn     切换简体中文                       │  │
│  │   → /zh-tw     切换繁體中文                       │  │
│  │   → /zh-status 查看语言设置                       │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  Skill (skills/chinese-locale/SKILL.md)                │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 中文交互规范（标点、术语、注释语言等）            │  │
│  │ 安装到 ~/.config/opencode/skills/ 后              │  │
│  │ agent 可按需加载作为行为参考                      │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
└───────────────────────────────────────────────────────┘
```

## Screenshots

### TUI Home

![TUI Home](https://raw.githubusercontent.com/mike652638/opencode-zh-plugin/main/assets/opencode-tui-zh.png)

### TUI Chinese Mode

![TUI Chinese Mode](https://raw.githubusercontent.com/mike652638/opencode-zh-plugin/main/assets/opencode-tui-zh-mode.png)

### AI Chinese Thinking

![AI Chinese Thinking](https://raw.githubusercontent.com/mike652638/opencode-zh-plugin/main/assets/opencode-thinking-zh.png)

## 覆盖范围

| 表面 | 覆盖 | 说明 |
|---|---|---|
| AI 回复语言（含推理过程） | ✅ | v1 `system.transform` / v2 `session.hook` 注入中文指令 |
| TUI 插槽区域 | ✅ | v1：home_logo / home_footer / home_bottom / sidebar_title；v2：home.footer / sidebar.footer |
| TUI slash 命令 | ✅ | /zh 系列命令 |
| TUI 硬编码字符串 | ❌ | 需上游 PR（#37434 被标 Not planned） |
| Desktop (Electron) UI | ❌ | 需 CDP 注入方案（路线 B2） |
| 文档站点 | ❌ | 需 fork 或上游 PR |

## Requirements

| Item | Requirement |
|---|---|
| OpenCode v1 | `>= 1.18.0` (`engines.opencode`) |
| OpenCode v2 | `>= 2.0.30` (verified) |
| Node.js | `>= 18.0.0` (recommended `>= 20.0.0`) |

> **Note**: v1 relies on the `experimental.chat.system.transform` hook introduced in OpenCode 1.18.0 — older versions are not supported. v2 uses `setup` + `session.hook` and needs no experimental hook.

## 安装

### OpenCode v2 (2.x)

在 `~/.config/opencode/opencode.json`（全局）或项目目录 `opencode.json` 中添加：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    { "package": "opencode-zh-plugin", "options": { "locale": "zh-CN" } }
  ]
}
```

只要默认选项时可以简写为包名：

```json
{
  "plugins": ["opencode-zh-plugin"]
}
```

OpenCode 会从 npm 自动安装并加载，修改配置后重启生效。

### OpenCode v1 (1.x)

```bash
opencode plugin add opencode-zh-plugin
```

或手动配置：

```json
{
  "plugin": [
    ["opencode-zh-plugin", { "locale": "zh-CN" }]
  ]
}
```

> 两代配置键不同：v1 是 `plugin`（`[名称, 选项]` 元组数组），v2 是 `plugins`（字符串或 `{ package, options }` 数组）。v0.1.7 → v0.2.0 对 v1 用户完全向后兼容，无需改动配置。

### 从源码安装（本地开发）

```bash
git clone https://github.com/mike652638/opencode-zh-plugin.git
cd opencode-zh-plugin
bun install
npm run build
```

v2 用 `file:` 指到包根的**绝对路径**（宿主会按 `package.json` 的 exports 解析入口，因此必须指向包含 `package.json` 的目录，而不是单个文件）：

```json
{
  "plugins": ["file:/absolute/path/to/opencode-zh-plugin"]
}
```

v1 用 `file://` 相对路径：

```json
{
  "plugin": [
    ["file://./opencode-zh-plugin", { "locale": "zh-CN" }]
  ]
}
```

### 安装 Skill（可选）

将 `skills/chinese-locale/` 目录复制到 `~/.config/opencode/skills/`：

```bash
cp -r skills/chinese-locale ~/.config/opencode/skills/
```

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `enabled` | boolean | `true` | 总开关 |
| `locale` | `"zh-CN"` \| `"zh-TW"` | `"zh-CN"` | 中文变体（简体/繁体） |
| `systemPrompt` | boolean | `true` | 注入中文回复指令到 system prompt |
| `tuiSlots` | boolean | `true` | 替换 TUI 界面插槽为中文 |
| `commands` | boolean | `true` | 注册 /zh 系列 slash 命令 |

## TUI 命令

| 命令 | 别名 | 说明 |
|---|---|---|
| `/zh` | `/chinese` | 启用中文模式 |
| `/zh-off` | `/chinese-off` | 关闭中文模式 |
| `/zh-cn` | `/chinese-cn` | 切换到简体中文 |
| `/zh-tw` | `/chinese-tw` | 切换到繁體中文 |
| `/zh-status` | `/chinese-status` | 查看当前语言设置 |

## 繁體中文

将 `locale` 设为 `"zh-TW"` 即可启用繁體中文模式：

```json
// v2
{ "plugins": [{ "package": "opencode-zh-plugin", "options": { "locale": "zh-TW" } }] }
```

```json
// v1
{ "plugin": [["opencode-zh-plugin", { "locale": "zh-TW" }]] }
```

## 局限性

1. **TUI 硬编码字符串无法覆盖**：OpenCode TUI 的原生错误提示、帮助文本等硬编码英文字符串没有字符串级 override 机制，只能通过上游 PR 修复
2. **Desktop UI 不在覆盖范围**：Electron 桌面应用的界面翻译需要 CDP 注入方案（路线 B2）或上游 i18n 支持
3. **locale 切换与 AI 回复语言**：v2 下 `/zh-cn` / `/zh-tw` 会立即重渲染 TUI 插槽；AI 回复语言来自插件启动时读取的配置，两代都需修改 `opencode.json` 并重启 OpenCode
4. **v2 插槽收敛**：v2 只有 `home.footer` 与 `sidebar.footer`，v1 的 `home_logo` / `home_footer` / `home_bottom` 合并为首页一块，`sidebar_title` 在 v2 没有对应插槽
5. **不修改 OpenCode 源码**：本插件完全通过官方 Plugin API 工作，零侵入

## 项目结构

```
opencode-zh-plugin/
├── package.json              # npm 包配置（exports["."] + ["./server"] + ["./tui"]）
├── tsconfig.json             # TypeScript 配置（SolidJS JSX）
├── src/
│   ├── index.ts              # v2 server plugin 入口（双形态 { id, setup, server }）
│   ├── server.ts             # v1 server plugin 入口（server 函数）
│   ├── tui.tsx               # TUI plugin 入口（双形态 { id, tui, setup }）
│   ├── config.ts             # 插件选项 schema 与默认值
│   ├── locale/
│   │   └── strings.ts        # 中文字符串（简体 + 繁体）
│   ├── server/
│   │   └── system-transform.ts  # v1 system.transform + v2 session hook 实现
│   └── tui/
│       ├── slots.tsx         # v1 TUI slot 替换组件
│       ├── commands.ts       # v1 中文 slash 命令
│       └── v2.tsx            # v2 TUI：slot / keymap layer / storage / toast
├── skills/
│   └── chinese-locale/
│       └── SKILL.md          # Skill 定义
├── examples/
│   ├── opencode.json         # 示例配置（v1）
│   └── opencode.v2.json      # 示例配置（v2）
└── README.md
```

## 技术栈

- **Server Plugin（v1）**：`experimental.chat.system.transform` hook — 每次对话时向 system prompt 注入中文指令
- **Server Plugin（v2）**：`setup` + `ctx.session.hook("context"|"compaction"|"generate"|"title")` — 覆盖所有携带 system prompt 的请求
- **TUI Plugin（v1）**：`api.slots.register()` + `api.command.register()` — 替换 TUI 插槽 + 注册命令
- **TUI Plugin（v2）**：`ctx.ui.slot()` + `ctx.keymap.layer()` + `ctx.storage.store()` + `ctx.ui.toast.show()`
- **TUI 渲染**：`@opentui/solid` JSX（`<box>`, `<text>` 内禀元素）
- **Skill**：Markdown 指令文件，agent 按需加载

## 开发

```bash
# 安装依赖
bun install

# 类型检查
bun run typecheck

# 从本地路径测试
# 在 opencode.json 中配置 file:// 路径指向项目目录
```

## 许可证

MIT
