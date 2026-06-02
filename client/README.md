# Droyd Web UI

A cinematic Next.js site for Droyd, a noir robot-origin story about a machine, a mad scientist, and a buried case file coming back online.

## Getting Started

Install dependencies and run the app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Verification

```bash
npm run verify
```

This runs TypeScript checking and a production build.

## Agentic Workflow

The project includes a headless Codex workflow under `../job`.

```bash
npm run agent:init
npm run agent:start -- --max-active 3 --target-batches 2
npm run agent:status
npm run agent:review
npm run agent:consensus
npm run agent:stop
```

Read `../job/HUMAN_START.md` and `../job/SITE_WORKFLOW.md` before launching a long run.

## Creative Direction

- Movie trailer reveal, not a landing page.
- Dark noir palette with brass, signal red, cyan electronics, smoke, film grain, and practical evidence surfaces.
- Motion should feel cinematic and useful. Every heavy effect needs a reduced-motion path and a performance check.
- Visual work should preserve the supplied `droyd.mp4` as the hero anchor unless a stronger production asset is added.
