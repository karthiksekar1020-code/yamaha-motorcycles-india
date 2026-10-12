import { expect, test } from "@playwright/test";

/** Every gallery photo must actually be visible: loaded, non-zero size, and inside its card. */
test("gallery photos are visible (not just loaded)", async ({ page }) => {
  await page.goto("/gallery");
  await page.waitForLoadState("networkidle");
  const imgs = page.locator("main ul li button img"); // the photo cards (the "View all" tile has decorative thumbnails outside a card button)
  const count = await imgs.count();
  expect(count).toBeGreaterThanOrEqual(20);

  // scroll through so lazy images load, then measure each one
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } });
  await page.waitForTimeout(500);

  const bad = await imgs.evaluateAll((els) =>
    els.map((e) => {
      const im = e as HTMLImageElement;
      const r = im.getBoundingClientRect();
      const card = im.closest("button")!.getBoundingClientRect();
      return { src: im.getAttribute("src"), loaded: im.complete && im.naturalWidth > 0, w: Math.round(r.width), h: Math.round(r.height), cardH: Math.round(card.height) };
    }).filter((x) => !x.loaded || x.w < 60 || x.h < 40 || x.cardH < 100),
  );
  expect(bad, JSON.stringify(bad)).toEqual([]);
});

test("gallery lightbox shows the full-size photo", async ({ page }) => {
  await page.goto("/gallery");
  await page.getByRole("button", { name: /open image: R15 V4, Racing Blue/i }).click();
  const dlg = page.getByRole("dialog", { name: /image viewer/i });
  const img = dlg.getByRole("img");
  await expect(img).toBeVisible();
  const box = await img.boundingBox();
  expect(box!.width).toBeGreaterThan(300);
  expect(box!.height).toBeGreaterThan(150);
  // the first request for a size is encoded on demand by the image optimizer, so give it a moment to arrive
  await expect.poll(() => img.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0)).toBe(true);
});

test("the homepage gallery preview photos are visible too", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const heading = page.getByRole("heading", { name: /in focus/i });
  await heading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const imgs = page.locator("section ul li button img");
  expect(await imgs.count()).toBe(6);
  const sizes = await imgs.evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; }));
  for (const s of sizes) { expect(s.w).toBeGreaterThan(60); expect(s.h).toBeGreaterThan(40); }
});
