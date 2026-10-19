# AGENTS.md

单一 npm 包（`opencode-zh-plugin`），将 OpenCode 的 AI 回复与 TUI 本地化为中文（zh-CN/zh-TW）。非 monorepo，无 workspace。

## 架构

单包同时兼容 OpenCode v1（`opencode-ai` 1.x，`exports["./server"]` 的 `experimental.chat.system.transform` 钩子）与 v2（`@opencode/cli` 2.x，`setup` + `session.hook`）。每个入口都导出**双形态对象**：v2 读 `setup`，v1 读它的旧字段。

- `src/index.ts` → `exports["."]` **和** `exports["./server"]` — v2 服务端插件定义 `{ id, setup, server }`。`setup` 对 `context` / `compaction` / `generate` / `title` 四种会话请求都注册同一个钩子，保证任何携带 system prompt 的请求都被注入 `<language_directive>`。`server` 字段来自 `src/server.ts`。
- `src/server.ts` — v1 服务端入口 `server(input, options)`：注册 `experimental.chat.system.transform`。要求 OpenCode >= 1.18.0（`engines.opencode`）；低版本会静默失效。
- `src/tui.tsx` → `exports["./tui"]` — TUI 双形态 `{ id, tui, setup }`：v1 读 `tui`（注册 `src/tui/slots.tsx` 插槽与 `src/tui/commands.ts` 命令），v2 读 `setup` → `src/tui/v2.tsx`。
- `src/tui/v2.tsx` — v2 TUI：`ctx.ui.slot({replace:"home.footer"})` + `ctx.ui.slot({append:"sidebar.footer"})`、`ctx.keymap.layer()`、`ctx.storage.store()`、`ctx.ui.toast.show()`。
- 所有入口在启动时都调用 `src/config.ts` 中的 `resolveOptions()`：所有布尔选项默认 `true`，locale 默认 `zh-CN`。
- `skills/chinese-locale/SKILL.md` 随 npm 包发布，但需用户手动安装到 `~/.config/opencode/skills/`；它与本仓库自身的指令文件无关。

## 命令

```bash
bun install        # 锁文件以 bun.lock 为准（CI 使用 bun）
npm run typecheck  # tsc --noEmit
npm run build      # tsc -p tsconfig.build.json → dist/
```

- 没有测试、linter 或格式化工具。完整的验证门槛是 `npm run typecheck && npm run build` — 与 `.github/workflows/ci.yml` 在 PR 到 `main` 时运行的完全一致。
- 避免使用 `npm install`（会生成未被 gitignore 的 `package-lock.json`）；请用 bun，或删除生成的文件。

## 约定与坑

- **导入路径始终以 `.js` 结尾，即使源文件是 `.tsx`**（如 `from "./tui/slots.js"`）。tsc 输出 `.js`；git 历史上有两次修复提交都是栽在这一点上（`.jsx` 导入、原样输出 `.jsx`）。不要使用 `.ts`/`.tsx` 扩展名 — 构建配置设置了 `allowImportingTsExtensions: false`。
- **v2 解析包名插件的顺序是 `<pkg>/server` → `<pkg>`**（在 2.0.30 宿主编译产物中实测：`resolve` 先用 `name + "/server"` 试 `require.resolve`，抛 `ERR_PACKAGE_PATH_NOT_EXPORTED` 才回退到包根）。因此 `exports["./server"]` **必须**指向一个 v2 合法定义（含 `id` + `setup`）。若把 `./server` 指向纯 v1 模块（只有 `server`），v2 会优先加载它并报 `PluginModule.LoadError ... Missing key at ["default"]["id"]` — 这正是 0.1.7 在 v2 下不可用的原因。改动 exports 后务必用真实宿主机验证。
- **本地目录形式的插件不读 `package.json` 的 exports**：宿主对目录 target 只用 `path.resolve(dir, "server")` / `path.resolve(dir, "index")` 定位入口，所以 `plugins: ["./some/dir"]` 要求入口文件在目录**顶层**。要按 exports 解析必须用包名（`plugins: ["opencode-zh-plugin"]`，宿主会从 npm 安装到 `~/.cache/opencode/npm/<name>@<version>/<ts>/node_modules/`）。
- **`@opencode/plugin` 只是 devDependency**：`src/index.ts` 用 `import type` 取类型，手写 `{ id, setup }` 而不调用 `Plugin.define`（它在 v2 里是恒等函数）。这样 `dist/index.js` 没有任何 `@opencode/plugin` 运行时导入，v1 用户不会被迫安装 v2 的整棵依赖树（`@opencode/ai`、`@opencode/schema`、`effect` 等）。唯一的运行时导入是 `@opentui/solid/jsx-runtime`（由 host 提供）。
- **两代配置键不同**：v1 用 `plugin`（数组，元素为 `[name, options]` 元组）；v2 用 `plugins`（数组，元素为字符串或 `{ package, options }`）。文档与示例必须分别给出。
- **插槽映射**：v1 的 `home_logo` / `home_footer` / `home_bottom` / `sidebar_title` 在 v2 收敛为 `home.footer`（`replace`）+ `sidebar.footer`（`append`）；`sidebar_title` 没有 v2 对应物。
- **v2 TUI 的 locale 是响应式的**：`src/tui/v2.tsx` 把 locale 放进 `ctx.storage.store()`，`/zh-*` 命令写入后插槽立即重渲染（v1 做不到，见下一条）。AI 回复语言的切换仍来自启动时捕获的配置，需重启。
- **所有用户可见的 UI 字符串**位于 `src/locale/strings.ts`。新增 key 必须同时加到 `zhCN` 和 `zhTW` 两张表（`t()` 的回退顺序为 zh-TW → zh-CN → key 本身）。`src/server/system-transform.ts` 中的两段 AI 语言指令是近乎重复的模板字符串 — 修改其中一段时，保持两者的规则部分同步。
- **v1 的 `/zh`、`/zh-cn` 等命令只写入 KV 状态**（`opencode-zh-plugin:enabled`、`opencode-zh-plugin:locale`），且仅被 `/zh-status` 读回。system prompt 指令与插槽/命令文本来自插件启动时捕获的 `opencode.json` 选项 — 为 AI 回复切换 `locale` 需要修改配置并重启 OpenCode。不要以为写 KV 会让插槽重新渲染。
- **命令注册保留了回退逻辑**：优先使用已弃用的 `api.command.register`，回退到 `api.keymap.registerLayer`。`api.command` 在 `@opencode-ai/plugin` 中标记为弃用、v2 移除 — 不要删掉该回退，也不要新增对 `api.command` 的使用。
- **本地插件测试**：`package.json` 的 exports 指向 `dist/`，而 `dist/` 被 gitignore — 先运行 `npm run build`，再在 `opencode.json` 中通过 `file://` 引用（v1，参见 `examples/opencode.json`）或用包名引用（v2）。注意上一段：v2 的目录形式不做 exports 解析。
- **TypeScript 配置**：`tsconfig.json` 是共享基础配置（类型检查：`noEmit`、`jsx: preserve`、`jsxImportSource: @opentui/solid`）；`tsconfig.build.json` 继承它并覆盖为 `jsx: react-jsx` + 声明文件。共享选项改基础配置，仅与产物相关的改构建配置。JSX 使用 `@opentui/solid` 内置元素（`<box>`、`<text>`），而非 HTML。

## 文档与发布

- 功能变更必须同时更新 `README.md`（中文，主文档）和 `README.en.md`。中文 README 包含权威的功能/架构表格。
- 提交信息使用英文 Conventional Commits（`fix:`、`docs:`、`chore:`）；发布版本是显式的 `chore: bump version to X` 提交。`prepublishOnly` 会执行构建；发布到 npm 的内容仅包含 `dist/`、`skills/` 和两个 README（`files` 字段）。
