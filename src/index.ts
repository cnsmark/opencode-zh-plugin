import type { Plugin as V2Plugin } from "@opencode/plugin"
import { resolveOptions } from "./config.js"
import { buildV2SystemHook } from "./server/system-transform.js"
import { server } from "./server.js"

/**
 * OpenCode v2 server-side plugin definition.
 *
 * Built by hand instead of calling `Plugin.define` so that the module has no
 * runtime import of `@opencode/plugin`: this same file is also the v1 `./server`
 * entrypoint, and importing the v2 SDK there would pull a heavy dependency tree
 * into v1 installs for no benefit (`define` is an identity function).
 *
 * `setup` registers a session hook for every request kind that carries a system
 * prompt (agent loop, compaction, transient generation and title generation),
 * so the Chinese language directive applies no matter which request the host
 * builds.
 */
const plugin: V2Plugin.Plugin = {
  id: "opencode-zh-plugin",
  async setup(ctx: V2Plugin.Context) {
    const opts = resolveOptions(ctx.options)
    if (!opts.enabled || !opts.systemPrompt) return

    const hook = buildV2SystemHook(opts.locale)
    await ctx.session.hook("context", hook)
    await ctx.session.hook("compaction", hook)
    await ctx.session.hook("generate", hook)
    await ctx.session.hook("title", hook)
  },
}

/**
 * Default export keeps both shapes alive: v2 reads `setup`, while OpenCode
 * 1.18.29+ object entrypoints (and any loader that resolves the package root)
 * read `server`. v1 <1.18.29 keeps loading `./server` directly — which now also
 * points at this module.
 */
export default { ...plugin, server }
export { plugin, server }
