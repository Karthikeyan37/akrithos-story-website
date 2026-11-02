import { chromium } from "@playwright/test";
import { createHash } from "node:crypto";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:3000/";
const browser = await chromium.launch({ headless: true });
const results = [];

async function capture(name, options) {
  const page = await browser.newPage({
    viewport: { width: options.width, height: options.height },
    deviceScaleFactor: 1,
    hasTouch: options.hasTouch ?? false,
  });
  if (options.reduced) await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(`${baseURL}${options.hash ?? ""}`, { waitUntil: "networkidle" });
  if (options.pointer) await page.mouse.move(options.pointer[0], options.pointer[1]);
  await page.waitForTimeout(options.wait ?? 800);

  const before = await page.evaluate(() =>
    document.getAnimations().map((animation) => ({
      name: animation.animationName,
      state: animation.playState,
      time: Math.round(Number(animation.currentTime) || 0),
    })).filter((item) => item.name),
  );
  const first = await page.screenshot({ path: `${name}-a.png`, fullPage: false });
  await page.waitForTimeout(1800);
  const after = await page.evaluate(() =>
    document.getAnimations().map((animation) => ({
      name: animation.animationName,
      state: animation.playState,
      time: Math.round(Number(animation.currentTime) || 0),
    })).filter((item) => item.name),
  );
  const second = await page.screenshot({ path: `${name}-b.png`, fullPage: false });

  results.push({
    name,
    viewport: options,
    overflow: await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    motionMode: await page.locator("html").getAttribute("data-motion-mode"),
    visibleSections: await page.locator("main > section[data-motion-visible='true']").count(),
    animationNames: [...new Set(after.map((item) => item.name))],
    movingAnimations: after.filter((item) => {
      const earlier = before.find((entry) => entry.name === item.name);
      return item.state === "running" && earlier && item.time > earlier.time;
    }).map((item) => item.name),
    firstSha256: createHash("sha256").update(first).digest("hex"),
    secondSha256: createHash("sha256").update(second).digest("hex"),
    frameChanged: !first.equals(second),
    errors,
  });
  await page.close();
}

await capture("motion-hero-1920", { width: 1920, height: 1080, pointer: [1320, 420] });
await capture("motion-platform-1440", { width: 1440, height: 1000, hash: "#platform", wait: 1200 });
await capture("motion-security-1440", { width: 1440, height: 1000, hash: "#security" });
await capture("motion-mobile-393", { width: 393, height: 852, hasTouch: true });
await capture("motion-reduced-1440", { width: 1440, height: 1000, reduced: true });

console.log(JSON.stringify(results, null, 2));
await browser.close();
