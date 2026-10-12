import { expect, test } from "@playwright/test";

const future = () => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

test("home renders the hero and CTAs navigate", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/feel the/i);
  await page.getByRole("link", { name: /explore the lineup/i }).click();
  await expect(page).toHaveURL(/\/motorcycles$/);
  await page.goto("/");
  await page.getByRole("link", { name: /open the studio/i }).click();
  await expect(page).toHaveURL(/\/experience$/);
});

test("featured stage switches model data", async ({ page }) => {
  await page.goto("/");
  const stage = page.getByRole("region", { name: /featured motorcycles/i });
  const first = await stage.getByRole("heading", { level: 2 }).textContent();
  await stage.getByRole("button", { name: /next motorcycle/i }).click();
  await expect(stage.getByRole("heading", { level: 2 })).not.toHaveText(first ?? "");
});

test("studio shows two official images per model and switches between them", async ({ page }) => {
  await page.goto("/experience?model=r15-v4");
  const main = page.getByRole("figure").getByRole("img");
  await expect(main).toHaveAttribute("src", /r15-v4-1\.webp/);
  await expect(page.getByText("Racing Blue", { exact: true })).toBeVisible();
  const thumbs = page.getByRole("group", { name: /R15 V4 images/i }).getByRole("button");
  await expect(thumbs).toHaveCount(2);
  await thumbs.nth(1).click();
  await expect(main).toHaveAttribute("src", /r15-v4-2\.webp/);
  await expect(page.getByText("Metallic Red", { exact: true })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("3D tilt view: controls tilt, zoom and reset the real photo", async ({ page }) => {
  await page.goto("/experience?model=mt-15-v2");
  const photo = page.getByRole("figure").getByRole("img");
  const tf = () => photo.evaluate((el) => (el.parentElement as HTMLElement).style.transform);
  await expect(page.getByText(/3D tilt view/i).first()).toBeVisible();
  await page.getByRole("button", { name: "Pause auto sway" }).click();
  const start = await tf();
  await page.getByRole("button", { name: "Tilt right" }).click();
  await expect.poll(tf).not.toBe(start);
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect.poll(tf).toContain("scale(1.3)");
  await page.getByRole("button", { name: "Reset view" }).click();
  await expect.poll(tf).toContain("scale(1)");
  await expect.poll(tf).toContain("rotateY(-14deg)");
  // keyboard
  await page.getByRole("group", { name: /3D tilt view of/i }).focus();
  await page.keyboard.press("+");
  await expect.poll(tf).toContain("scale(1.25)");
  await page.keyboard.press("0");
  await expect.poll(tf).toContain("scale(1)");
});

test("studio switches model and updates the image", async ({ page }) => {
  await page.goto("/experience");
  await page.waitForLoadState("networkidle"); // let the page hydrate before interacting
  await page.locator("#studio-model").selectOption("fz-x");
  await expect(page.getByRole("figure").getByRole("img")).toHaveAttribute("src", /fz-x-1\.webp/);
  await expect(page.getByRole("heading", { level: 2, name: "FZ-X" })).toBeVisible();
});

test("every model with an official image shows a loaded photo on its page", async ({ page }) => {
  for (const slug of ["mt-15-v2", "aerox-155", "fascino-125-fi-hybrid"]) {
    await page.goto(`/motorcycles/${slug}`);
    const img = page.getByRole("figure").getByRole("img");
    await expect(img).toBeVisible();
    expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    await expect(page.getByRole("group", { name: /images$/i }).getByRole("button")).toHaveCount(2);
  }
});

test("catalogue filters, search, compare flow", async ({ page }) => {
  await page.goto("/motorcycles?category=Supersport");
  const cards = page.locator("article");
  const n = await cards.count();
  expect(n).toBeGreaterThan(0);
  for (const h of await cards.getByRole("heading", { level: 3 }).allTextContents()) expect(h).toMatch(/R/);
  await page.goto("/motorcycles?q=zzznomatch");
  await expect(page.getByText("No matches")).toBeVisible();
  await page.goto("/motorcycles?sort=price-asc");
  await expect(page.getByText(/indicative ex-showroom/i).first()).toBeVisible();

  await page.goto("/motorcycles?category=Supersport");
  await page.getByRole("button", { name: /add r15 v4 to comparison/i }).click();
  await page.getByRole("button", { name: /add r15m to comparison/i }).click();
  const tray = page.getByRole("region", { name: /comparison selection/i });
  await expect(tray).toContainText("R15 V4");
  await tray.getByRole("link", { name: "Compare" }).click();
  await expect(page).toHaveURL(/\/compare\?m=r15-v4,r15m/);
  await expect(page.getByRole("link", { name: "R15 V4" }).first()).toBeVisible();
  expect(await page.getByText("Not available").count()).toBeGreaterThan(0);
});

test("model detail is data-driven; unknown slug is 404", async ({ page }) => {
  await page.goto("/motorcycles/mt-15-v2");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("MT-15 V2");
  await expect(page.getByRole("main").getByText(/demonstration data/i)).toBeVisible();
  const res = await page.goto("/motorcycles/not-a-bike");
  expect(res?.status()).toBe(404);
  await expect(page.getByText(/off the map/i)).toBeVisible();
});

test("test-ride form validates and never fakes success without a database", async ({ page }) => {
  await page.goto("/test-ride?model=r15-v4");
  await page.getByRole("button", { name: /request test ride/i }).click();
  await expect(page.getByText("Enter your full name")).toBeVisible();
  await expect(page.getByText(/valid 10-digit Indian mobile/)).toBeVisible();
  await expect(page.getByText(/accept the privacy notice/)).toBeVisible();

  await page.getByLabel(/full name/i).fill("Asha Rao");
  await page.getByLabel(/mobile number/i).fill("9876543210");
  await page.getByLabel(/email address/i).fill("asha@example.com");
  await page.getByLabel(/^city/i).fill("Pune");
  await page.getByLabel(/preferred date/i).fill(future());
  await page.getByLabel(/time window/i).selectOption("morning");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /request test ride/i }).click();
  await expect(page.getByRole("alert").filter({ hasText: /database is not configured/i })).toBeVisible();
  await expect(page.getByText(/request received/i)).toHaveCount(0);
});

test("dealers search labels unverified listings and never invents dealers", async ({ page }) => {
  await page.goto("/dealers");
  await page.getByRole("main").getByRole("button", { name: "Search" }).click();
  await expect(page.getByText(/enter a city or 6-digit pin/i)).toBeVisible();
  await page.getByLabel(/city or pin/i).fill("Pune");
  await page.getByRole("main").getByRole("button", { name: "Search" }).click();
  await expect(page.getByText(/no verified dealers found/i)).toBeVisible();
  await page.getByLabel(/city or pin/i).fill("pondicerry"); // typo on purpose
  await page.getByRole("main").getByRole("button", { name: "Search" }).click();
  await expect(page.getByText("Unverified listing").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /Sedarapet Yamaha Motors/ })).toBeVisible();
});

test("gallery lightbox opens, navigates and closes with Escape", async ({ page }) => {
  await page.goto("/gallery");
  await page.getByRole("button", { name: /open image: R15 V4, Racing Blue/i }).click();
  const dlg = page.getByRole("dialog", { name: /image viewer/i });
  await expect(dlg).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(dlg.getByRole("heading", { level: 3 })).toHaveText("R15 V4, Metallic Red");
  await page.keyboard.press("Escape");
  await expect(dlg).toBeHidden();
});

test("search overlay finds a model and Escape closes it", async ({ page }) => {
  await page.goto("/about");
  await page.getByRole("banner").getByRole("button", { name: "Search" }).click();
  await page.getByRole("searchbox").or(page.getByPlaceholder(/model, category/i)).fill("mt-15");
  await expect(page.getByRole("link", { name: /MT-15 V2/ }).first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByPlaceholder(/model, category/i)).toBeHidden();
});

test("mobile navigation drawer works", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/");
  await page.getByRole("button", { name: /open menu/i }).click();
  const nav = page.getByRole("navigation", { name: "Mobile" });
  await expect(nav).toBeVisible();
  await nav.getByRole("link", { name: "Gallery" }).click();
  await expect(page).toHaveURL(/\/gallery/);
  const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  expect(noHScroll).toBe(true);
});

test("API surfaces", async ({ request }) => {
  expect((await request.get("/api/health")).ok()).toBe(true);
  const list = await request.get("/api/motorcycles?category=Street");
  expect((await list.json()).items.length).toBeGreaterThan(0);
  expect((await request.get("/api/motorcycles?minCc=abc")).status()).toBe(400);
  expect((await request.get("/api/motorcycles/nope")).status()).toBe(404);
  expect((await request.get("/api/dealers?q=a")).status()).toBe(400);
});
