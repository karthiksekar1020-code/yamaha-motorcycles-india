import { expect, test } from "@playwright/test";

test("search is a compact panel under the header, not a full-screen takeover", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("banner").getByRole("button", { name: "Search" }).click();
  const dlg = page.getByRole("dialog", { name: /search motorcycles/i });
  await expect(dlg).toBeVisible();
  const vp = page.viewportSize()!;
  const box = (await dlg.boundingBox())!;
  expect(box.height, "panel must be much shorter than the screen").toBeLessThan(vp.height * 0.5);
  expect(box.width).toBeLessThanOrEqual(700);
  expect(box.y).toBeGreaterThan(60); // sits below the header
  // the page behind stays visible: the hero headline is still in view
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.getByRole("searchbox").or(page.getByPlaceholder(/model, category/i)).fill("mt-15");
  await expect(dlg.getByRole("link", { name: /MT-15 V2/ })).toBeVisible();
  const withResults = (await dlg.boundingBox())!;
  expect(withResults.height).toBeLessThan(vp.height * 0.7);

  await page.keyboard.press("Escape");
  await expect(dlg).toBeHidden();
});

test("search results open the model page and clicking outside closes the panel", async ({ page }) => {
  await page.goto("/about");
  await page.getByRole("banner").getByRole("button", { name: "Search" }).click();
  const dlg = page.getByRole("dialog", { name: /search motorcycles/i });
  await page.getByPlaceholder(/model, category/i).fill("fascino");
  await dlg.getByRole("link", { name: /Fascino/ }).click();
  await expect(page).toHaveURL(/\/motorcycles\/fascino-125-fi-hybrid$/);

  await page.getByRole("banner").getByRole("button", { name: "Search" }).click();
  await expect(dlg).toBeVisible();
  await page.mouse.click(10, 400); // outside the panel
  await expect(dlg).toBeHidden();
});
