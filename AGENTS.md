# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

Product truth is recorded in `PRODUCT.md`. Treat metrics, establishment names, portraits, testimonials, plan limits, and unconfirmed commercial claims as illustrative until the user explicitly confirms real terms or evidence.

The monthly prices shown on the landing page are confirmed commercial terms: Starter R$ 29,90, Pro R$ 49,90, and Max R$ 99,90. Every new establishment receives a 14-day free trial. Plan limits, metrics, establishment names, portraits, and testimonials remain illustrative until explicitly confirmed.

The project uses Next.js as the permanent frontend foundation so the future authenticated platform, public scheduling routes, and Hub can grow in the same architecture. Do not migrate the landing page back to Vite.

The hero and final CTA use the provided animated WebGL gradient language. Keep future gradient surfaces within the Marc orange-and-neutral palette, provide a solid fallback, pause expensive animation when offscreen or hidden, and reduce — rather than completely freeze — the shader speed under `prefers-reduced-motion`.

The hero copy, proof badges, and product mockup must remain structurally separated at every breakpoint: no negative mockup margins, no oversized mobile crop, and no overlap between copy or badges and the visual. Keep the footer logo at the same compact optical width as the header logo.

Authenticated navigation should feel immediate: keep app-context data consolidated, preserve Next.js link prefetching, and show subtle progress feedback while a server-rendered route is resolving.
