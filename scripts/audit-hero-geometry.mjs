import { chromium } from "@playwright/test";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(process.env.BASE_URL ?? "http://127.0.0.1:3000/", { waitUntil: "networkidle" });
const result = await page.evaluate(() => {
  const rect = (selector) => {
    const element = document.querySelector(selector);
    if (!element) return null;
    const r = element.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), fullyVisible: r.top >= 0 && r.bottom <= innerHeight };
  };
  return {
    hero: rect("main > section:first-of-type"),
    kicker: rect(".hero-kicker"),
    heading: rect("main > section:first-of-type h1"),
    copy: rect("main > section:first-of-type h1 + p"),
    cta: rect("main > section:first-of-type button"),
    canvas: rect(".hero-canvas"),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
