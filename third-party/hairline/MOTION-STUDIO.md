# Hairline motion adapter

Upstream: https://github.com/lucasmarkes/hairline at commit `37d2e78dcb333ab30c3338e28ed4a690364ea014`. Original TypeScript under `packages/hairline/src` is retained unchanged with its MIT license. `PROVENANCE.json` records GitHub blob hashes.

Rebuild from the project root with Node 24:

```sh
node third-party/hairline/build-motion.cjs
```

The build uses Node's built-in TypeScript stripping; no compiler package or remote runtime is needed. It adapts the shared Hairline stage to a manual clock and exports a self-contained `assets/lib/hairline-motion.js` script. All 33 upstream figures are available.

```js
const graphic = HairlineMotion.create(host, 'exploded', {
  theme: 'dark',
  intensity: 0.8,
  plate: '#08080b',
  highlight: '#bfa3ff',
  edge: '#c3c2ce',
  mid: '#777582',
  low: '#37343e',
  stroke: 1.3,
  seed: 2,
  pointer: t => [0.5 + 0.27 * Math.sin(t), 0.5 + 0.2 * Math.cos(t)]
});
graphic.seek(1.25); // seconds on this scene's local timeline
graphic.destroy();
```

The host's width and height define its display box; the SVG uses the original 400×320 viewBox with its aspect ratio preserved. Pointer coordinates are normalized 0–1, not −1–1. Omit `pointer` for the adapter's deterministic animated path. Color options are literal CSS colors written into Hairline's documented CSS variables.

The parent editor owns playback. The adapter runs no RAF, real-time tour, observer, or CSS transition. Each seek advances the original springs/tweens in fixed 1/60 second steps. A backward seek recreates that figure and replays its scene from time zero; keep only the active scene mounted. Repeating a seek to the same time does not advance it again. `options.pointer(t)` makes pointer-driven animation reproducible across forward playback, scrubbing, and export. Optional `seek(t,x,y)` supplies an immediate pose override; use the pointer function for a time-varying path whose history must replay exactly.

The adapter intentionally disables reduced-motion sampling during video export so browser system preferences cannot silently change rendered frames. The editor may still honor reduced-motion preferences in its own controls.
