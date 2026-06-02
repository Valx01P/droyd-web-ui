<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Droyd Site Rules

- Keep the app cinematic, noir, and story-first. Do not reintroduce starter-template content.
- Use Client Components only where browser APIs, GSAP, or Three.js are required.
- Preserve reduced-motion behavior for every animation pass.
- Run `npm run typecheck` from `client` before handing off substantial edits.
- If a headless workflow is active, check `../job/swarm/droyd-site-state.json` before touching files owned by an active worker.
