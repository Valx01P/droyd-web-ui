#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const { chromium } = require("@playwright/test");

const url = process.env.DROYD_VISUAL_URL || "http://127.0.0.1:3000";
const outDir = process.env.DROYD_VISUAL_DIR || "/private/tmp/droyd-web-ui-visual";
const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
];

function findBrowserExecutable() {
  const explicit = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (explicit && fs.existsSync(explicit)) return explicit;

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

  const systemChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (fs.existsSync(systemChrome)) return systemChrome;
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
    const video = document.querySelector("[data-hero-video]");
    const bodyText = document.body.innerText;
    return {
      heroTitle,
      hasStarterCopy: /Create Next App|Deploy Now|Documentation|Vercel/i.test(bodyText),
      videoReadyState: video instanceof HTMLVideoElement ? video.readyState : 0,
      bodyWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const executablePath = findBrowserExecutable();
  const browser = await chromium.launch(executablePath ? { executablePath } : undefined);
  const results = [];

  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      const visualUrl = new URL(url);
      visualUrl.searchParams.set("visual-check", "1");
      await page.goto(visualUrl.toString(), { waitUntil: "domcontentloaded" });
      await page.waitForSelector("[data-webgl-canvas]");
      await page.waitForTimeout(1000);

      const pageInfo = await inspectPage(page);
      const canvasInfo = await inspectCanvas(page);
      const screenshotPath = path.join(outDir, `${viewport.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      results.push({
        viewport: viewport.name,
        screenshotPath,
        pageInfo,
        canvasInfo,
      });

      await page.close();
    }
  } finally {
    await browser.close();
  }

  const failures = [];
  for (const result of results) {
    if (!/He's back\./i.test(result.pageInfo.heroTitle)) {
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
  }

  console.log(JSON.stringify({ url, outDir, executablePath, results, failures }, null, 2));
  if (failures.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
