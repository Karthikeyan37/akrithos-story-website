import { chromium } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:3000/";
const browser = await chromium.launch({ headless: true });
const results = [];

async function capture({ name, viewport, hash = "", tab, reduced = false }) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: reduced ? "reduce" : "no-preference", hasTouch: viewport.width < 600, isMobile: viewport.width < 600 });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${baseURL}${hash}`, { waitUntil: "networkidle" });
  if (tab) {
    await page.locator("#platform").getByRole("tab", { name: new RegExp(tab, "i") }).click();
  }
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${name}.png`, fullPage: false });
  const metrics = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    sections: document.querySelectorAll("main > section").length,
    mainWords: (document.querySelector("main")?.textContent ?? "").trim().split(/\s+/).length,
    selectedShowcase: document.querySelector("#platform [role='tab'][aria-selected='true']")?.textContent?.trim() ?? null,
    runningAnimations: document.getAnimations().filter((animation) => animation.playState === "running").length,
    motionMode: document.documentElement.dataset.motionMode,
  }));
  results.push({ name, viewport, hash, tab: tab ?? null, reduced, errors, ...metrics });
  await context.close();
}

await capture({ name: "showcase-hero-1920", viewport: { width: 1920, height: 1080 } });
await capture({ name: "showcase-revenue-1600", viewport: { width: 1600, height: 1000 }, hash: "#platform", tab: "Revenue" });
await capture({ name: "showcase-knowledge-1600", viewport: { width: 1600, height: 1000 }, hash: "#platform", tab: "Knowledge" });
await capture({ name: "showcase-operations-1600", viewport: { width: 1600, height: 1000 }, hash: "#platform", tab: "Operations" });
await capture({ name: "showcase-service-1600", viewport: { width: 1600, height: 1000 }, hash: "#platform", tab: "Service" });
await capture({ name: "showcase-maturity-1440", viewport: { width: 1440, height: 1000 }, hash: "#gauntlet" });
await capture({ name: "showcase-ultrawide-2560", viewport: { width: 2560, height: 1200 }, hash: "#platform", tab: "Knowledge" });
await capture({ name: "showcase-mobile-hero-393", viewport: { width: 393, height: 852 } });
await capture({ name: "showcase-mobile-system-393", viewport: { width: 393, height: 852 }, hash: "#platform", tab: "Operations" });
await capture({ name: "showcase-reduced-1440", viewport: { width: 1440, height: 1000 }, hash: "#platform", reduced: true });

console.log(JSON.stringify(results, null, 2));
await browser.close();
