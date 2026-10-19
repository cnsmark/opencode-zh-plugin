import type { TuiPlugin, TuiPluginModule } from "@opencode-ai/plugin/tui"
import type { Plugin as V2Plugin } from "@opencode/plugin/tui"
import { resolveOptions } from "./config.js"
import { buildSlotPlugin } from "./tui/slots.js"
import { buildCommands } from "./tui/commands.js"
import { setupV2Tui } from "./tui/v2.js"

const tui: TuiPlugin = async (api, options) => {
  const opts = resolveOptions(options)
  if (!opts.enabled) return

  if (opts.tuiSlots) {
    api.slots.register(buildSlotPlugin(opts.locale))
  }

  let unregisterCommands: (() => void) | undefined
  if (opts.commands) {
    const cmds = buildCommands(api, opts.locale)
    if (api.command) {
      unregisterCommands = api.command.register(() => cmds)
    } else if (api.keymap && typeof api.keymap === "object" && "registerLayer" in api.keymap) {
      unregisterCommands = (api.keymap as { registerLayer: (opts: { commands: typeof cmds }) => () => void }).registerLayer({ commands: cmds })
    }
  }

  api.lifecycle.onDispose(() => {
    unregisterCommands?.()
  })
}

const setup: V2Plugin.Definition["setup"] = (context) => {
  setupV2Tui(context)
}

/**
 * Dual TUI entrypoint: v1 loaders read `tui` (`./tui` subpath), the v2 loader
 * reads `setup`. Each runtime ignores the property it does not use.
 */
const mod: TuiPluginModule & { setup: V2Plugin.Definition["setup"] } = {
  id: "opencode-zh-plugin",
  tui,
  setup,
}

export default mod
export { tui, setup }
