import { expect, test } from "@playwright/test";

test("studio keeps the chosen model in the URL, so the link opens on the same bike", async ({ page }) => {
  await page.goto("/experience");
  await page.locator("#studio-model").selectOption("fz-x");
  await expect(page).toHaveURL(/\/experience\?model=fz-x$/);
  await page.goto("/experience?model=fz-x"); // a shared / bookmarked link
  await expect(page.locator("#studio-model")).toHaveValue("fz-x");
  await expect(page.getByRole("heading", { level: 2, name: "FZ-X" })).toBeVisible();
});
