#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const WORK_ITEMS_FILE = path.join(ROOT, "job", "site-work-items.json");
const SWARM_DIR = path.join(ROOT, "job", "swarm");
const STATE_FILE = path.join(SWARM_DIR, "droyd-site-state.json");
const STOP_FILE = path.join(SWARM_DIR, "droyd-site-stop.json");
const LOG_DIR = path.join(SWARM_DIR, "logs");
const REPORT_DIR = path.join(SWARM_DIR, "reports");
const DEFAULT_MAX_ACTIVE = 3;
const DEFAULT_TARGET_BATCHES = 1;

function nowIso() {
  return new Date().toISOString();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function parseArgs(argv) {
  const args = { _: [] };
  const booleanFlags = new Set(["force", "once", "no-build"]);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      args._.push(slug(arg));
      continue;
    }
    const [rawKey, inlineValue] = arg.slice(2).split(/=(.*)/s, 2);
    if (booleanFlags.has(rawKey)) {
      args[rawKey] = true;
      continue;
    }
    if (inlineValue !== undefined) {
      args[rawKey] = inlineValue;
    } else {
      args[rawKey] = argv[i + 1];
      i++;
    }
  }
  return args;
}

function pidAlive(pid) {
  try {
    process.kill(Number(pid), 0);
    return true;
  } catch {
    return false;
  }
}

function loadWorkItems() {
  return readJson(WORK_ITEMS_FILE).map((item) => ({
    ...item,
    id: slug(item.id),
    files: item.files || [],
    acceptance: item.acceptance || [],
  }));
}

function defaultState() {
  return {
    version: 1,
    startedAt: nowIso(),
    maxActive: DEFAULT_MAX_ACTIVE,
    targetBatches: DEFAULT_TARGET_BATCHES,
    batchesByItem: {},
    active: {},
    finished: [],
    selectedItems: null,
    mode: "build",
  };
}

function loadState() {
  if (!fs.existsSync(STATE_FILE)) return defaultState();
  return { ...defaultState(), ...readJson(STATE_FILE) };
}

function saveState(state) {
  writeJson(STATE_FILE, state);
}

function refreshState(state) {
  for (const [key, worker] of Object.entries({ ...(state.active || {}) })) {
    if (pidAlive(worker.pid)) continue;
    const endedAt = nowIso();
    const durationMs = Date.parse(endedAt) - Date.parse(worker.startedAt);
    state.finished = state.finished || [];
    state.finished.push({ ...worker, endedAt, durationMs });
    delete state.active[key];
  }
  saveState(state);
  return state;
}

function filesOverlap(left, right) {
  const rightSet = new Set(right);
  return left.some((file) => rightSet.has(file));
}

function activeFiles(state) {
  return Object.values(state.active || {}).flatMap((worker) => worker.files || []);
}

function itemComplete(item, state) {
  return Number(state.batchesByItem?.[item.id] || 0) >= Number(state.targetBatches || DEFAULT_TARGET_BATCHES);
}

function candidateItems(state) {
  const selected = state.selectedItems?.length ? new Set(state.selectedItems) : null;
  const occupied = activeFiles(state);
  return loadWorkItems()
    .filter((item) => !selected || selected.has(item.id))
    .filter((item) => state.mode === "review" || !itemComplete(item, state))
    .filter((item) => !state.active?.[item.id])
    .filter((item) => !filesOverlap(item.files, occupied));
}

function latestReports() {
  if (!fs.existsSync(REPORT_DIR)) return {};
  const reports = {};
  for (const file of fs.readdirSync(REPORT_DIR)) {
    if (!file.endsWith(".json")) continue;
    const report = readJson(path.join(REPORT_DIR, file));
    if (!report.itemId) continue;
    const key = slug(report.itemId);
    const current = reports[key];
    if (!current || Number(report.batch || 0) >= Number(current.batch || 0)) {
      reports[key] = report;
    }
  }
  return reports;
}

function buildWorkerPrompt(item, batch, state) {
  const assignedFiles = item.files.map((file) => `- ${file}`).join("\n");
  const acceptance = item.acceptance.map((rule) => `- ${rule}`).join("\n");
  const reportPath = `job/swarm/reports/${item.id}-batch-${batch}.json`;
  const verifyCommand = state.mode === "review" ? "npm run verify" : "npm run typecheck";

  return `You are a Droyd web experience worker.

Read these files first:
- client/AGENTS.md
- job/SITE_WORKFLOW.md
- job/site-work-items.json

Assigned item:
- id: ${item.id}
- title: ${item.title}
- phase: ${item.phase}
- mode: ${state.mode}
- batch: ${batch}

Creative brief:
${item.brief}

Work only in these files unless a build-breaking issue requires a tiny adjacent fix:
${assignedFiles}

Acceptance criteria:
${acceptance}

Required behavior:
- This is a Next.js 16 app. Read relevant docs in client/node_modules/next/dist/docs/ before changing Next APIs.
- Preserve the Droyd noir movie-trailer direction.
- Do not reintroduce create-next-app starter content or generic landing-page filler.
- If job/swarm/droyd-site-stop.json exists, finish the current coherent edit, write the report, and exit.
- Use GSAP and Three.js responsibly: cleanup resources, keep reduced-motion paths, avoid layout shift.
- Keep text readable at desktop and mobile widths.
- Save all changes before exiting.
- Run from client: ${verifyCommand}
- Write this JSON report before exiting: ${reportPath}

Report fields:
{
  "itemId": "${item.id}",
  "batch": ${batch},
  "mode": "${state.mode}",
  "status": "complete",
  "qualityScore": 1-10,
  "changedFiles": [],
  "checks": [],
  "blockers": [],
  "notes": ""
}

Stop after one focused batch.`;
}

function launchWorker(state, item) {
  const batch = Number(state.batchesByItem[item.id] || 0) + 1;
  state.batchesByItem[item.id] = batch;
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const logFile = path.join(LOG_DIR, `${item.id}-batch-${batch}-${Date.now()}.log`);
  const output = fs.openSync(logFile, "a");
  const prompt = buildWorkerPrompt(item, batch, state);
  const child = spawn("codex", ["--search", "-a", "never", "exec", "--json", "-s", "workspace-write", "-C", ROOT, prompt], {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", output, output],
  });
  child.unref();

  state.active[item.id] = {
    pid: child.pid,
    itemId: item.id,
    title: item.title,
    files: item.files,
    batch,
    mode: state.mode,
    log: path.relative(ROOT, logFile),
    startedAt: nowIso(),
  };
}

function launchAvailable(state) {
  if (fs.existsSync(STOP_FILE)) return 0;
  let launched = 0;
  const maxActive = Math.max(1, Number(state.maxActive || DEFAULT_MAX_ACTIVE));
  while (Object.keys(state.active || {}).length < maxActive) {
    const [next] = candidateItems(state);
    if (!next) break;
    launchWorker(state, next);
    launched++;
  }
  saveState(state);
  return launched;
}

function elapsedLabel(startedAt) {
  const ms = Math.max(0, Date.now() - Date.parse(startedAt));
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m${String(seconds).padStart(2, "0")}s`;
}

function printStatus(state) {
  state = refreshState(state);
  const items = loadWorkItems();
  const reports = latestReports();

  console.log("\n=== Droyd Site Swarm Status ===\n");
  console.log(`Mode: ${state.mode}`);
  console.log(`Target batches: ${state.targetBatches}`);
  console.log(`Stop requested: ${fs.existsSync(STOP_FILE) ? "yes" : "no"}\n`);

  const active = Object.values(state.active || {}).sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));
  if (active.length) {
    console.log(`Active workers (${active.length})`);
    for (const worker of active) {
      console.log(`- ${worker.itemId} batch:${worker.batch} pid:${worker.pid} running:${elapsedLabel(worker.startedAt)} log:${worker.log}`);
    }
    console.log("");
  }

  console.log("Work items");
  for (const item of items) {
    const batches = Number(state.batchesByItem?.[item.id] || 0);
    const report = reports[item.id];
    const blockers = report?.blockers?.length ? ` blockers:${report.blockers.length}` : "";
    const score = report?.qualityScore ? ` score:${report.qualityScore}` : "";
    console.log(`- ${item.id.padEnd(15)} batches:${String(batches).padStart(2)} / ${state.targetBatches}${score}${blockers}`);
  }

  const queue = candidateItems(state);
  console.log("");
  console.log(fs.existsSync(STOP_FILE) ? "Queue paused by stop marker" : "Next queue");
  if (!queue.length) console.log("- no queued work");
  for (const item of queue) console.log(`- ${item.id}: ${item.title}`);
}

async function monitor(state) {
  while (true) {
    state = refreshState(state);
    const launched = launchAvailable(state);
    const activeCount = Object.keys(state.active || {}).length;
    const remaining = candidateItems(state).length;

    printStatus(state);

    if (fs.existsSync(STOP_FILE)) break;
    if (!activeCount && !launched && !remaining) break;
    await sleep(15000);
  }
}

async function stop(state, force) {
  writeJson(STOP_FILE, { requestedAt: nowIso(), force: Boolean(force) });
  state = refreshState(state);

  if (force) {
    for (const worker of Object.values(state.active || {})) {
      try {
        process.kill(worker.pid, "SIGTERM");
      } catch {}
    }
    await sleep(1500);
    state = refreshState(state);
  }

  while (Object.keys(state.active || {}).length) {
    console.log(`Stop requested. Waiting for ${Object.keys(state.active).length} active worker(s) to finish...`);
    await sleep(10000);
    state = refreshState(state);
  }

  state.stoppedAt = nowIso();
  saveState(state);
  printStatus(state);
}

function printConsensus(state) {
  state = refreshState(state);
  const items = loadWorkItems();
  const reports = latestReports();
  const missing = [];
  const blockers = [];
  const incomplete = [];

  for (const item of items) {
    const batches = Number(state.batchesByItem?.[item.id] || 0);
    if (batches < Number(state.targetBatches || DEFAULT_TARGET_BATCHES)) incomplete.push(item.id);
    const report = reports[item.id];
    if (!report) missing.push(item.id);
    if (report?.blockers?.length) blockers.push(`${item.id}: ${report.blockers.join("; ")}`);
    if (report && report.status !== "complete") blockers.push(`${item.id}: latest report status is ${report.status}`);
  }

  console.log("\n=== Droyd Consensus ===\n");
  if (!incomplete.length && !missing.length && !blockers.length) {
    console.log("Consensus ready for human review. Run `npm run verify` from client and do a visual pass.");
    return;
  }
  if (incomplete.length) console.log(`Incomplete batches: ${incomplete.join(", ")}`);
  if (missing.length) console.log(`Missing reports: ${missing.join(", ")}`);
  if (blockers.length) {
    console.log("Blockers:");
    for (const blocker of blockers) console.log(`- ${blocker}`);
  }
}

async function main() {
  const [command = "status", ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  let state = loadState();

  if (args["max-active"]) state.maxActive = Math.max(1, Number(args["max-active"]));
  if (args["target-batches"]) state.targetBatches = Math.max(1, Number(args["target-batches"]));
  if (args._.length) state.selectedItems = args._;
  if (command === "start" && !args._.length) state.selectedItems = null;

  if (command === "init") {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.mkdirSync(REPORT_DIR, { recursive: true });
    saveState({ ...defaultState(), maxActive: state.maxActive, targetBatches: state.targetBatches });
    if (fs.existsSync(STOP_FILE)) fs.unlinkSync(STOP_FILE);
    printStatus(loadState());
    return;
  }

  if (command === "start") {
    if (fs.existsSync(STOP_FILE)) fs.unlinkSync(STOP_FILE);
    state.mode = "build";
    state.startedAt = nowIso();
    saveState(state);
    await monitor(state);
    return;
  }

  if (command === "review") {
    if (fs.existsSync(STOP_FILE)) fs.unlinkSync(STOP_FILE);
    state.mode = "review";
    state.startedAt = nowIso();
    saveState(state);
    await monitor(state);
    return;
  }

  if (command === "monitor") {
    await monitor(state);
    return;
  }

  if (command === "status") {
    printStatus(state);
    return;
  }

  if (command === "consensus") {
    printConsensus(state);
    return;
  }

  if (command === "stop") {
    await stop(state, Boolean(args.force));
    return;
  }

  console.log(`Unknown command: ${command}`);
  console.log("Use: init | start | monitor | status | review | consensus | stop");
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
