import { defineConfig, devices } from "@playwright/test";

// The site runs against a local stand-in for GoHighLevel (scripts/mock-ghl.mjs), so lead capture is tested end to
// end without touching the real CRM. PW_CHROMIUM may point at an installed Chromium when Playwright's own is absent.
const launchOptions = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } : {};

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: "line",
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    launchOptions,
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"], launchOptions } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"], launchOptions } },
  ],
  webServer: [
    { command: "node scripts/mock-ghl.mjs 3999", url: "http://127.0.0.1:3999/__calls", reuseExistingServer: false, timeout: 20_000 },
    {
      command: "npm run start -- --hostname 127.0.0.1 --port 4173",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: false,
      timeout: 120_000,
      env: { GHL_PRIVATE_TOKEN: "test-token", GHL_LOCATION_ID: "loc-test", GHL_API_BASE: "http://127.0.0.1:3999", LEAD_SIGNING_SECRET: "test-secret-0123456789abcdef0123456789", LEAD_RATE_LIMIT: "200" },
    },
  ],
});
