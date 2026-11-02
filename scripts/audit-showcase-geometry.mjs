import { chromium } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:3000/";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));
await page.goto(`${baseURL}#platform`, { waitUntil: "networkidle" });
await page.getByRole("tab", { name: /Revenue agent/ }).click();
await page.waitForTimeout(300);

const geometry = await page.evaluate(() => {
  const rect = (selector) => {
    const element = document.querySelector(selector);
    if (!element) return null;
    const value = element.getBoundingClientRect();
    return {
      top: Math.round(value.top),
      bottom: Math.round(value.bottom),
      left: Math.round(value.left),
      right: Math.round(value.right),
      width: Math.round(value.width),
      height: Math.round(value.height),
      fullyVisible: value.top >= 0 && value.bottom <= window.innerHeight,
    };
  };

  return {
    viewport: { width: window.innerWidth, height: window.innerHeight },
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    section: rect("#platform"),
    heading: rect(".showcase-heading"),
    tabs: rect(".showcase-tabs"),
    stage: rect(".showcase-stage"),
    legend: rect(".showcase-flow-legend"),
    input: rect(".showcase-input"),
    core: rect(".showcase-core"),
    output: rect(".showcase-output"),
    humanGate: rect(".showcase-human-gate"),
    stageFooter: rect(".showcase-stage-footer"),
  };
});

console.log(JSON.stringify({ geometry, errors }, null, 2));
await page.screenshot({ path: "showcase-revenue-1600.png", fullPage: false });
await browser.close();
