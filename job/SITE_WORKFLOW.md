# Droyd Web Experience Workflow

## Goal

Build a professional, award-caliber movie-themed website for Droyd: a robot with a buried origin story, a mad scientist creator, and a dark noir reveal-trailer tone.

## Creative Bar

- First screen feels like a teaser trailer, not a SaaS landing page.
- `droyd.mp4` anchors the hero unless a stronger production asset is added.
- Visual language: black lab, film grain, evidence files, signal red, brass titles, cyan machine glow, smoke, scanlines, and practical noir contrast.
- Effects should feel motivated by story. Avoid decorative clutter, empty spectacle, and generic gradients.
- Copy should be short, tense, and cinematic.

## Worker Rules

1. Read `client/AGENTS.md`, this file, and your assigned item in `job/site-work-items.json`.
2. Work only on the files assigned to your item unless the prompt explicitly allows an exception.
3. Check for `job/swarm/droyd-site-stop.json` before starting and before every major edit. If it exists, save the current coherent state, write your report, and exit.
4. Preserve working builds. Run at least `npm run typecheck` from `client`; run `npm run build` when your change affects rendering, imports, metadata, or dependencies.
5. Write a JSON report in `job/swarm/reports/{item-id}-batch-{batch}.json`.

Report shape:

```json
{
  "itemId": "hero-trailer",
  "batch": 1,
  "status": "complete",
  "qualityScore": 8,
  "changedFiles": ["client/app/components/HeroTrailer.tsx"],
  "checks": ["npm run typecheck"],
  "blockers": [],
  "notes": "What changed and what should be improved next."
}
```

## Review Rules

Reviewers do not rubber-stamp. They look for:

- visual defects, blank WebGL canvas, broken video playback, text overlap, and poor mobile layout;
- inaccessible contrast, missing labels, broken focus states, and ignored reduced-motion paths;
- performance problems from unbounded animation loops, missing cleanup, oversized assets, and layout thrash;
- narrative drift, generic copy, weak character stakes, or accidental starter-template language.

Reviewers may make small fixes, but their main job is to write a report with concrete blockers and next actions.

## Consensus

The workflow should not run forever. The default target is two completed batches per work item plus a review pass. A site can be considered ready for human review when:

- every work item has reached the requested batch target;
- every latest report has `status: "complete"`;
- no latest report lists blockers;
- `npm run verify` passes from `client`;
- the page is visually checked at desktop and mobile widths.
