import { chromium } from "@playwright/test";

const browser = await chromium.launch({ headless: true });
const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:3000/";
const results = [];

for (const item of [
  { width: 1920, height: 1080, name: "engagement-hero-1920", target: "#top" },
  { width: 1440, height: 1000, name: "engagement-outcomes-1440", target: "#solutions", action: "knowledge" },
  { width: 2560, height: 1200, name: "engagement-outcomes-2560", target: "#solutions", action: "deployment" },
  { width: 1440, height: 1000, name: "engagement-builder-1440", target: "#live-agent", action: "starter" },
  { width: 393, height: 852, name: "engagement-mobile-outcomes", target: "#solutions", action: "knowledge" },
  { width: 393, height: 852, name: "engagement-mobile-builder", target: "#live-agent", action: "starter" },
]) {
  const page = await browser.newPage({ viewport: { width: item.width, height: item.height }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(`${baseURL}${item.target}`, { waitUntil: "networkidle" });
  if (item.action === "knowledge") await page.getByRole("tab", { name: /Captured intelligence/ }).click();
  if (item.action === "deployment") await page.getByRole("tab", { name: /Secure deployment/ }).click();
  if (item.action === "starter") await page.getByRole("button", { name: "Policy search" }).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${item.name}.png` });
  results.push({
    name: item.name,
    overflow: await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
    activeOutcome: await page.locator('.outcome-selector button[aria-selected="true"]').textContent().catch(() => null),
    railVisible: await page.getByRole("navigation", { name: "Page journey" }).isVisible().catch(() => false),
    errors,
  });
  await page.close();
}
console.log(JSON.stringify(results, null, 2));
await browser.close();
