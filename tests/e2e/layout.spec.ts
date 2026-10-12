import { expect, test } from "@playwright/test";

test("the home page never scrolls sideways (animated panels start off to the side)", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(4000); // intro
  await page.locator("#cmp-a").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  // compare with the device width, not innerWidth: on phones an overflowing page makes the browser widen innerWidth too
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw).toBeLessThanOrEqual(page.viewportSize()!.width);
});
