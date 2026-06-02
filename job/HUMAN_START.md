# Droyd Site Swarm

Run these commands from `client`:

```bash
npm run agent:init
npm run agent:start -- --max-active 3 --target-batches 2
npm run agent:status
npm run agent:review
npm run agent:consensus
npm run agent:stop
```

Use a smaller test run:

```bash
npm run agent:start -- --max-active 1 hero-trailer
```

Graceful stop:

```bash
npm run agent:stop
```

Emergency stop:

```bash
npm run agent:stop -- --force
```

The stop command writes `job/swarm/droyd-site-stop.json`. Active workers are instructed to finish a coherent batch, save their files, write a report, and exit. Forced stop sends `SIGTERM` to active workers.

## What Workers Do

Workers are bounded by `job/site-work-items.json`. Each item owns a small file set, a focused creative brief, and acceptance criteria. The orchestrator avoids launching workers with overlapping file ownership at the same time.

After feature passes, run:

```bash
npm run agent:review
npm run agent:consensus
```

Reviewers check visual quality, accessibility, performance, and story coherence. Consensus is reached when every work item has the requested number of completed batches and the latest reports do not list blockers.
