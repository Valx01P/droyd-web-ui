#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const { chromium } = require("@playwright/test");

const url = process.env.CLOSET_VISUAL_URL || process.env.DROYD_VISUAL_URL || "http://127.0.0.1:3000/closet.html";
const outDir = process.env.CLOSET_VISUAL_DIR || "/private/tmp/droyd-closet-visual";
const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
];

function findBrowserExecutable() {
  const explicit = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (explicit && fs.existsSync(explicit)) return explicit;

  // The system browser provides the most reliable hardware WebGL path on the
  // managed macOS development image; fall back to Playwright's bundled shell.
  const systemChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (fs.existsSync(systemChrome)) return systemChrome;

  const cacheDir = path.join(os.homedir(), "Library", "Caches", "ms-playwright");
  if (fs.existsSync(cacheDir)) {
    const dirs = fs.readdirSync(cacheDir).sort().reverse();
    for (const dir of dirs) {
      const shell = path.join(cacheDir, dir, "chrome-headless-shell-mac-arm64", "chrome-headless-shell");
      if (dir.startsWith("chromium_headless_shell-") && fs.existsSync(shell)) return shell;

      const chromeForTesting = path.join(
        cacheDir,
        dir,
        "chrome-mac-arm64",
        "Google Chrome for Testing.app",
        "Contents",
        "MacOS",
        "Google Chrome for Testing",
      );
      if (dir.startsWith("chromium-") && fs.existsSync(chromeForTesting)) return chromeForTesting;
    }
  }

  return null;
}

async function inspectCanvas(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("[data-webgl-canvas]");
    if (!(canvas instanceof HTMLCanvasElement)) {
      return { present: false, nonZeroPixels: 0, width: 0, height: 0 };
    }

    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) {
      return { present: true, context: false, nonZeroPixels: 0, width: canvas.width, height: canvas.height };
    }

    const width = Math.max(1, Math.min(canvas.width, 80));
    const height = Math.max(1, Math.min(canvas.height, 80));
    const x = Math.max(0, Math.floor((canvas.width - width) / 2));
    const y = Math.max(0, Math.floor((canvas.height - height) / 2));
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    let nonZeroPixels = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index] || pixels[index + 1] || pixels[index + 2] || pixels[index + 3]) {
        nonZeroPixels += 1;
      }
    }

  return {
      present: true,
      context: true,
      nonZeroPixels,
      width: canvas.width,
      height: canvas.height,
    };
  });
}

async function inspectPage(page) {
  return page.evaluate(() => {
    const heading = document.querySelector("h1");
    const heroTitle =
      heading?.getAttribute("aria-label") ||
      heading?.textContent?.replace(/\s+/g, " ").trim() ||
      "";
    const bodyText = document.body.innerText;
    const debug = window.__CLOSET_DEBUG__;
    const loader = document.querySelector("#loading");
    return {
      heroTitle,
      hasStarterCopy: /Create Next App|Deploy Now|Documentation|Vercel/i.test(bodyText),
      bodyWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
      appReady: document.documentElement.dataset.appReady === "true" && Boolean(debug?.ready),
      interactables: debug?.interactables || 0,
      garments: debug?.garments || 0,
      actions: debug?.actionCount || 0,
      theme: debug?.theme || "",
      dimmer: debug?.dimmer || 0,
      loaderHidden: loader instanceof HTMLElement && getComputedStyle(loader).visibility === "hidden",
    };
  });
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const executablePath = findBrowserExecutable();
  const cdpUrl = process.env.CLOSET_CDP_URL;
  console.log(`[visual-check] ${cdpUrl ? `connecting to ${cdpUrl}` : `launching ${executablePath || "Playwright Chromium"}`}`);
  const browser = cdpUrl
    ? await chromium.connectOverCDP(cdpUrl)
    : await chromium.launch(executablePath ? { executablePath } : undefined);
  console.log("[visual-check] browser ready");
  const results = [];

  try {
    for (const viewport of viewports) {
      console.log(`[visual-check] rendering ${viewport.name}`);
      const page = await browser.newPage({ viewport });
      const pageErrors = [];
      const consoleErrors = [];
      const failedRequests = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("requestfailed", (request) => failedRequests.push(`${request.url()}: ${request.failure()?.errorText || "failed"}`));
      const visualUrl = new URL(url);
      visualUrl.searchParams.set("visual-check", "1");
      await page.goto(visualUrl.toString(), { waitUntil: "domcontentloaded", timeout: 120000 });
      await page.waitForSelector("html[data-app-ready='true']", { timeout: 120000 });
      console.log(`[visual-check] ${viewport.name} app ready`);
      await page.waitForSelector("[data-webgl-canvas]");
      await page.waitForTimeout(1200);

      // Exercise HTML controls and one 3D action before capturing the scene.
      await page.locator("[data-theme='oak']").click();
      await page.locator("#dimmer").evaluate((input) => {
        input.value = "64";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
      const drawerTriggered = await page.evaluate(() => window.__CLOSET_DEBUG__?.toggle("drawer") || false);
      await page.waitForTimeout(800);
      const drawerState = await page.evaluate(() => window.__CLOSET_DEBUG__?.action("drawer") || null);

      const pageInfo = await inspectPage(page);
      const canvasInfo = await inspectCanvas(page);
      const screenshotPath = path.join(outDir, `${viewport.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      results.push({
        viewport: viewport.name,
        screenshotPath,
        pageInfo,
        canvasInfo,
        drawerTriggered,
        drawerState,
        pageErrors,
        consoleErrors,
        failedRequests,
      });

      await page.close();
    }
  } finally {
    await browser.close();
  }

  const failures = [];
  for (const result of results) {
    if (!/Atelier Wardrobe/i.test(result.pageInfo.heroTitle)) {
      failures.push(`${result.viewport}: hero title is "${result.pageInfo.heroTitle}"`);
    }
    if (result.pageInfo.hasStarterCopy) {
      failures.push(`${result.viewport}: starter-template copy detected`);
    }
    if (result.pageInfo.bodyWidth > result.pageInfo.viewportWidth + 1) {
      failures.push(`${result.viewport}: horizontal overflow ${result.pageInfo.bodyWidth}px > ${result.pageInfo.viewportWidth}px`);
    }
    if (!result.canvasInfo.present || !result.canvasInfo.context || result.canvasInfo.nonZeroPixels < 8) {
      failures.push(`${result.viewport}: WebGL canvas appears blank or unavailable`);
    }
    if (!result.pageInfo.appReady || !result.pageInfo.loaderHidden) {
      failures.push(`${result.viewport}: application did not reach its ready state`);
    }
    if (result.pageInfo.interactables < 8 || result.pageInfo.actions < 8 || result.pageInfo.garments < 6) {
      failures.push(`${result.viewport}: scene inventory is incomplete (${result.pageInfo.interactables} hits, ${result.pageInfo.actions} actions, ${result.pageInfo.garments} cloth systems)`);
    }
    if (result.pageInfo.theme !== "oak" || Math.abs(result.pageInfo.dimmer - 0.64) > 0.001) {
      failures.push(`${result.viewport}: theme or dimmer controls did not update scene state`);
    }
    if (!result.drawerTriggered || !result.drawerState || result.drawerState.target !== 1 || result.drawerState.value <= 0.1) {
      failures.push(`${result.viewport}: drawer animation did not advance`);
    }
    if (result.pageErrors.length || result.consoleErrors.length || result.failedRequests.length) {
      failures.push(`${result.viewport}: runtime errors detected`);
    }
  }

  console.log(JSON.stringify({ url, outDir, executablePath, results, failures }, null, 2));
  if (failures.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
