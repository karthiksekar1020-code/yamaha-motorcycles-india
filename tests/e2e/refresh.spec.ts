import { expect, test } from "@playwright/test";

test("the server renders the saved language on first paint (no English flash on refresh)", async ({ request }) => {
  const res = await request.get("/", { headers: { cookie: "ymi.lang=hi" } });
  const html = await res.text();
  expect(html).toMatch(/<html[^>]*lang="hi-IN"/);
  expect(html).toContain("data-script=\"indic\"");
  expect(html).toContain("महसूस करें");
  expect(html).not.toContain(">Explore the lineup<");

  const en = await (await request.get("/")).text();
  expect(en).toMatch(/<html[^>]*lang="en-IN"/);
  expect(en).toContain("Explore the lineup");
});

test("an unknown language cookie falls back to English", async ({ request }) => {
  const html = await (await request.get("/", { headers: { cookie: "ymi.lang=xx" } })).text();
  expect(html).toMatch(/<html[^>]*lang="en-IN"/);
});

test("the chosen language is kept (cookie) when the site is opened again", async ({ page }) => {
  await page.goto("/gallery");
  await page.getByRole("button", { name: /Language: English/i }).click();
  await page.getByRole("menuitemradio", { name: "தமிழ்" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("கேலரி");
  const cookies = await page.context().cookies();
  expect(cookies.find((c) => c.name === "ymi.lang")?.value).toBe("ta");
  await page.goto("/gallery"); // a fresh navigation (not a reload)
  await expect(page.locator("html")).toHaveAttribute("lang", "ta-IN");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("கேலரி");
  // and it also survives a reload, which now lands on the home page in the same language
  await page.reload();
  await expect(page).toHaveURL(/localhost:\d+\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ta-IN");
});

test("refresh on any page goes to the home page", async ({ page }) => {
  for (const path of ["/motorcycles", "/motorcycles/r15-v4", "/compare?m=r15-v4,r15m", "/gallery", "/dealers", "/test-ride", "/about", "/experience?model=aerox-155"]) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(path.replace(/[?.]/g, "\\$&") + "$"));
    await page.reload();
    await expect(page, `after refresh on ${path}`).toHaveURL(/localhost:\d+\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/feel the/i);
  }
});

test("refresh on the home page stays on home and returns to the top", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, 1500));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
  await page.reload();
  await expect(page).toHaveURL(/localhost:\d+\/$/);
  await page.waitForLoadState("load");
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(5);
});

test("normal navigation is not affected: links and direct URLs open the page asked for", async ({ page }) => {
  await page.goto("/gallery");
  await expect(page).toHaveURL(/\/gallery$/);
  await page.getByRole("link", { name: "Compare", exact: true }).first().click();
  await expect(page).toHaveURL(/\/compare$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/gallery$/);
});

test("the hero scroll cue still scrolls to the featured section on click", async ({ page, isMobile }) => {
  test.skip(isMobile, "the cue is hidden on small screens");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.getByRole("link", { name: /scroll to featured/i }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 4000 }).toBeGreaterThan(300);
});
