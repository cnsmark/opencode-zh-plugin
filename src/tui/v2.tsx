import type { Context } from "@opencode/plugin/tui/context"
import type { ZhLocale } from "../config.js"
import { resolveOptions } from "../config.js"
import { t } from "../locale/strings.js"

interface ZhSettings {
  enabled: boolean
  locale: ZhLocale
}

type UpdateSettings = (mutation: (draft: ZhSettings) => void) => Promise<void>

type SettingsView = Readonly<ZhSettings>

/**
 * OpenCode v2 TUI-side plugin.
 *
 * Unlike v1 (where the slot text was frozen at startup and `/zh-*` only wrote
 * KV state), the v2 implementation keeps the active locale in a durable
 * `storage.store`. Slot render functions read it reactively, so switching
 * locale via the slash commands re-renders the localized TUI strings
 * immediately. The AI language directive is still resolved once on the server
 * side at startup, so changing the AI reply language still requires a restart.
 */
export function setupV2Tui(context: Context): void {
  const opts = resolveOptions(context.options)
  if (!opts.enabled) return

  const [settings, updateSettings] = context.storage.store<ZhSettings>("settings", {
    initial: { enabled: opts.enabled, locale: opts.locale },
  })

  const locale = (): ZhLocale => settings.locale

  if (opts.tuiSlots) registerSlots(context, locale)
  if (opts.commands) registerCommands(context, settings, updateSettings)
}

function registerSlots(context: Context, locale: () => ZhLocale): void {
  const theme = context.theme

  // v2 exposes a single home-screen boundary (`home.footer`) instead of the
  // v1 `home_logo` / `home_footer` / `home_bottom` trio, so the localized
  // branding, help hint and tip are rendered as one block here.
  context.ui.slot({
    replace: "home.footer",
    render: () => (
      <box flexDirection="column" alignItems="center" padding={1}>
        <text fg={theme.text.action.primary.base} content={t(locale(), "welcome")} />
        <text fg={theme.text.muted} content={t(locale(), "subtitle")} />
        <text fg={theme.text.muted} content={t(locale(), "help_hint")} />
        <text fg={theme.text.muted} content={t(locale(), "tip_welcome")} />
        <text fg={theme.text.muted} content={t(locale(), "powered_by")} />
      </box>
    ),
  })

  // Sidebar branding; v1's `sidebar_title` had no direct v2 equivalent.
  context.ui.slot({
    append: "sidebar.footer",
    render: () => <text fg={theme.text.muted} content={t(locale(), "sidebar_footer")} />,
  })
}

function registerCommands(
  context: Context,
  settings: SettingsView,
  updateSettings: UpdateSettings,
): void {
  const locale = (): ZhLocale => settings.locale

  context.keymap.layer(() => ({
    mode: "global",
    commands: [
      {
        id: "zh.on",
        title: t(locale(), "cmd_zh_on"),
        description: "启用中文模式（AI 回复 + TUI 界面）",
        group: "Language",
        slash: { name: "zh", aliases: ["chinese"] },
        run: async () => {
          await updateSettings((draft) => {
            draft.enabled = true
          })
          context.ui.toast.show({ variant: "success", message: t(locale(), "toast_zh_on") })
        },
      },
      {
        id: "zh.off",
        title: t(locale(), "cmd_zh_off"),
        description: "关闭中文模式",
        group: "Language",
        slash: { name: "zh-off", aliases: ["chinese-off"] },
        run: async () => {
          await updateSettings((draft) => {
            draft.enabled = false
          })
          context.ui.toast.show({ variant: "info", message: t(locale(), "toast_zh_off") })
        },
      },
      {
        id: "zh.cn",
        title: t(locale(), "cmd_zh_cn"),
        description: "切换到简体中文",
        group: "Language",
        slash: { name: "zh-cn", aliases: ["chinese-cn"] },
        run: async () => {
          await updateSettings((draft) => {
            draft.locale = "zh-CN"
          })
          context.ui.toast.show({ variant: "success", message: t(locale(), "toast_zh_cn") })
        },
      },
      {
        id: "zh.tw",
        title: t(locale(), "cmd_zh_tw"),
        description: "切换到繁體中文",
        group: "Language",
        slash: { name: "zh-tw", aliases: ["chinese-tw"] },
        run: async () => {
          await updateSettings((draft) => {
            draft.locale = "zh-TW"
          })
          context.ui.toast.show({ variant: "success", message: t(locale(), "toast_zh_tw") })
        },
      },
      {
        id: "zh.status",
        title: t(locale(), "cmd_zh_status"),
        description: "查看当前语言设置",
        group: "Language",
        slash: { name: "zh-status", aliases: ["chinese-status"] },
        run: () => {
          const status = settings.enabled ? "已启用" : "已关闭"
          const label = settings.locale === "zh-TW" ? "繁體中文" : "简体中文"
          context.ui.toast.show({
            variant: "info",
            title: "语言设置",
            message: `中文模式：${status} · 当前语言：${label}`,
          })
        },
      },
    ],
  }))
}
