import { expect, test } from "@playwright/test";

const links = {
  portal: "https://learn.akrithos.com/",
  training: "https://akrithos.com/training",
  founding: "https://link.fastpaydirect.com/payment-link/6a74dc5a50f272ef3a73c519",
  single: "https://link.fastpaydirect.com/payment-link/6a7a014ac8cc9a2ce7267306",
  monthly: "https://link.fastpaydirect.com/payment-link/6a830bf573c7ff66b05e890a",
  form: "https://api.leadconnectorhq.com/widget/form/NF6k2MmqcnTNqAfG3Fxd",
} as const;
const MOCK = "http://127.0.0.1:3999/__calls";
const sectionIds = ["top", "platform", "quest", "live-agent", "security", "diagnostic", "team", "live-program", "faq"];

test("the story, the sections and the people are all there", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Akrithos/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your best people are buried in work a machine should do.");
  expect(await page.locator("main > section").evaluateAll((s) => s.map((x) => x.id))).toEqual(sectionIds);
  await expect(page.locator("#top [data-chapter]")).toHaveCount(5);
  await expect(page.locator("#team img")).toHaveCount(3);
  // The 3D world either draws or leaves the poster; it never leaves the page broken.
  await expect.poll(() => page.locator(".world").getAttribute("data-state"), { timeout: 30_000 }).toMatch(/ready|failed/);
});

test("checkout, account and training destinations are unchanged", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Join the Founding Cohort/ })).toHaveAttribute("href", links.founding);
  await expect(page.getByRole("link", { name: /Join a Single Session/ })).toHaveAttribute("href", links.single);
  await expect(page.getByRole("link", { name: /Join Monthly/ })).toHaveAttribute("href", links.monthly);
  await expect(page.locator(`a[href="${links.portal}"]`).first()).toHaveText("Member Login");
  await expect(page.getByRole("link", { name: "View the training page" })).toHaveAttribute("href", links.training);
});

test("four systems show the business effect and where people decide", async ({ page }) => {
  await page.goto("/#platform");
  const showcase = page.locator("#platform");
  await expect(showcase.getByRole("tab")).toHaveCount(4);
  for (const [tab, output, gate] of [
    [/Revenue agent/, "Opportunity brief", "Sales confirms qualification"],
    [/Knowledge copilot/, "Grounded answer", "Expert reviews low confidence"],
    [/Operations control/, "Decision packet", "Named owner approves action"],
    [/Service agent/, "Resolved or routed", "Your team owns sensitive moments"],
  ] as const) {
    await showcase.getByRole("tab", { name: tab }).click();
    await expect(showcase.getByText(output, { exact: true })).toBeVisible();
    await expect(showcase.getByText(gate, { exact: true })).toBeVisible();
  }
});

test("Agent Quest: seven rounds, a level, and the report reaches the CRM with consent only", async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#quest");
  const quest = page.locator("#quest");
  const next = quest.getByRole("button", { name: /Next round|Reveal my result/ });
  await expect(next).toBeDisabled();
  for (const choice of ["Healthcare or home care", "Chasing and qualifying leads", null, /Inside a CRM/, /Regulated data/, /named expert/, "This quarter"]) {
    if (choice === null) await quest.locator('input[type="range"]').fill("60");
    else await quest.getByRole("button", { name: choice }).click();
    await next.click();
  }
  await expect(quest.getByText("Your first agent", { exact: true })).toBeVisible();
  await expect(quest.getByRole("heading", { name: "Revenue agent" })).toBeVisible();
  await expect(quest.getByText(/2,880 hours a year/)).toBeVisible();

  const email = `quest-${test.info().project.name}-${Date.now()}@example.com`;
  await quest.getByLabel("First name").fill("Avery");
  await quest.getByLabel("Work email").fill(email);
  await quest.getByRole("button", { name: "Send my report" }).click();
  await expect(quest.getByRole("alert")).toHaveText(/tick the box/);
  await quest.locator('input[name="consent"]').check();
  await quest.getByRole("button", { name: "Send my report" }).click();
  await expect(quest.getByText(/On its way, Avery/)).toBeVisible();

  const calls = (await (await request.get(MOCK)).json()) as Array<{ url: string; body: Record<string, unknown>; auth: string; version: string }>;
  const upsert = calls.find((c) => c.url === "/contacts/upsert" && c.body.email === email)!;
  expect(upsert.auth).toBe("Bearer test-token");
  expect(upsert.version).toBe("2021-07-28");
  expect(upsert.body).not.toHaveProperty("tags");
  const tags = calls.filter((c) => c.url.endsWith("/tags")).flatMap((c) => c.body.tags as string[]);
  expect(tags).toEqual(expect.arrayContaining(["ak-quest-done", "ak-bottleneck-leads", "ak-path-diagnostic", "ak-consent-email"]));
});

test("lead and event endpoints refuse what they should", async ({ request }) => {
  const post = (path: string, data: unknown) => request.post(path, { data, headers: { origin: "http://127.0.0.1:4173" } });
  expect((await post("/api/lead", { kind: "quest", firstName: "A", email: "nope", consent: true })).status()).toBe(400);
  expect((await post("/api/lead", { kind: "assistant", firstName: "A", email: "a@example.com", consent: false })).status()).toBe(400);
  expect((await post("/api/lead", { kind: "quest", firstName: "A", email: "a@example.com", consent: true, answers: { bottleneck: "made-up" } })).status()).toBe(400);
  const bot = await post("/api/lead", { kind: "assistant", firstName: "A", email: "bot@example.com", consent: true, website: "http://spam" });
  expect(await bot.json()).toMatchObject({ ok: true });
  expect((await post("/api/event", { token: "forged.token", event: "opened-booking" })).status()).toBe(400);
  expect((await request.post("/api/lead", { data: { kind: "assistant" }, headers: { origin: "https://evil.example" } })).status()).toBe(403);
});

test("the guide opens from the orb, starts the conversation and returns focus", async ({ page }) => {
  await page.goto("/#platform");
  const orb = page.getByRole("button", { name: "Ask Akrithos", exact: true });
  await orb.focus();
  await orb.click();
  const dialog = page.getByRole("dialog", { name: "Akrithos guide" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/What is taking up most of your team's week/)).toBeVisible();
  await dialog.locator(".guide-starters button").first().click();
  await expect(dialog.locator(".guide-msg-me")).toHaveCount(1);
  await expect(dialog.locator(".guide-msg-ai")).toHaveCount(2);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(orb).toBeFocused();
});

test("Diagnostic dialog keeps the GHL form and returns focus", async ({ page }) => {
  await page.goto("/#diagnostic");
  const trigger = page.locator("#diagnostic").getByRole("button", { name: "Book your Diagnostic" });
  await trigger.focus();
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Book your Diagnostic" });
  await expect(dialog.locator("iframe")).toHaveAttribute("src", links.form);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("navigation and FAQ work at every width without sideways scroll", async ({ page }, testInfo) => {
  await page.goto("/");
  const primary = page.getByRole("navigation", { name: "Primary navigation" });
  if (!(await primary.isVisible())) {
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Security" }).click();
  }
  await expect(page.locator("#faq details")).toHaveCount(6);
  await page.locator("#faq details").first().locator("summary").click();
  await expect(page.locator("#faq details").first()).toHaveAttribute("open", "");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `${testInfo.project.name} horizontal overflow`).toBeLessThanOrEqual(1);
});

test("the workflow blueprint is still one click away", async ({ page }) => {
  await page.goto("/#live-agent");
  await page.getByRole("button", { name: "Invoice approval" }).click();
  await expect(page.getByLabel("Describe a business workflow")).toHaveValue("Invoices over an agreed threshold need the correct approval before their due date.");
  await page.getByRole("button", { name: "Generate the preview" }).click();
  await expect(page.getByText(/Illustrative example|AI-generated draft/)).toBeVisible();
  await expect(page.getByText("Human review point")).toBeVisible();
});

test("reduced motion keeps the showcase complete and still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#platform");
  const showcase = page.locator("#platform");
  expect(await showcase.locator(".showcase-route-live").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  await expect(showcase.getByText("Opportunity brief", { exact: true })).toBeVisible();
});

test("on a large screen, scrolling walks the pinned showcase through all four systems", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "the pinned scroll story is for large screens");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const showcase = page.locator("#platform");
  await expect(showcase).toHaveAttribute("data-mode", "scroll");
  const scrollStory = (fraction: number) => page.evaluate((f) => {
    const track = document.querySelector<HTMLElement>("#platform .showcase-track")!;
    const pin = document.querySelector<HTMLElement>("#platform .showcase-pin")!;
    const top = parseFloat(getComputedStyle(pin).top) || 0;
    const travel = track.offsetHeight - pin.offsetHeight;
    window.scrollTo({ top: window.scrollY + track.getBoundingClientRect().top - top + travel * f, behavior: "instant" });
  }, fraction);
  for (const [i, name] of ["Revenue agent", "Knowledge copilot", "Operations control", "Service agent"].entries()) {
    await scrollStory((i + 0.9) / 4);
    await expect(showcase.getByRole("tab", { name })).toHaveAttribute("aria-selected", "true");
    await expect(showcase.locator(".showcase-stage")).toHaveAttribute("data-step", "3");
  }
  await scrollStory(0.02);
  await expect(showcase.locator(".showcase-stage")).toHaveAttribute("data-step", "0");
  // A tab still jumps straight to its system, with the work finished and in view.
  await showcase.getByRole("tab", { name: "Operations control" }).click();
  await expect(showcase.getByText("Named owner approves action", { exact: true })).toBeInViewport();
  await expect(showcase.locator(".showcase-stage")).toHaveAttribute("data-step", "3");
});
