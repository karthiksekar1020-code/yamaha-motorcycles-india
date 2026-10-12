import { expect, test } from "@playwright/test";

test("/admin is private: signed-out visitors are sent to the login page", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Admin login" })).toBeVisible();
});

test("login page rejects bad credentials without saying which field was wrong", async ({ page }) => {
  await page.goto("/login");
  const configured = (await page.getByRole("button", { name: "Sign in" }).count()) > 0;
  if (!configured) { // no ADMIN_* variables on this server: the page must say so instead of offering a fake form
    await expect(page.getByText(/admin sign-in not set up/i)).toBeVisible();
    return;
  }
  await page.getByLabel("Email").fill("nobody@example.com");
  await page.getByLabel("Password", { exact: true }).fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("form [role=alert]")).toContainText("Incorrect email or password");
  await expect(page).toHaveURL(/\/login$/);
});

test("the login link is reachable from the header (menu on phones)", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) await page.getByRole("button", { name: /open menu/i }).click({ timeout: 15_000 });
  await page.getByRole("link", { name: "Login", exact: true }).first().click();
  await expect(page).toHaveURL(/\/login$/);
});

test("the home page never scrolls sideways (animated panels start off to the side)", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(4000); // intro
  await page.locator("#cmp-a").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  // compare with the device width, not innerWidth: on phones an overflowing page makes the browser widen innerWidth too
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw).toBeLessThanOrEqual(page.viewportSize()!.width);
});
