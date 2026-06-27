# Atelier Wardrobe

A self-contained Three.js experience that renders a detailed, interactive modern walk-in wardrobe. The complete application—markup, styling, procedural geometry, PBR texture generation, cloth simulation, lighting, post-processing, and UI—lives in [`public/closet.html`](public/closet.html).

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects to the standalone document.

The HTML file can also be opened directly in a modern browser. Three.js r184 and its addons are loaded from a version-pinned jsDelivr import map, so internet access is required unless those modules are vendored locally.

## Interactions

- Drag or swipe to orbit; scroll or pinch to zoom.
- Hover over drawers, the glass cabinet, the safe, or the physical dimmer to highlight them.
- Select highlighted furniture to animate it open or closed.
- Switch between dark walnut, light oak, and gallery-white finishes.
- Adjust warm/cool integrated lighting with the dimmer.
- Press `Escape` to close all cabinetry or `L` to toggle the lighting level.

## Verification

```bash
npm run verify
npm run visual:check
```

`verify` runs TypeScript and a production build. `visual:check` performs desktop and mobile WebGL smoke tests with Playwright; on managed macOS environments, browser launch may require permission.
