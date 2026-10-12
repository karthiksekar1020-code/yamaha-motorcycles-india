import { expect, test } from "@playwright/test";

for (const width of [360, 700, 1100, 1440]) {
  test(`header logo shows the full name "Yamaha Motorcycles India" at ${width}px`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 700 } });
    const page = await ctx.newPage();
    await page.goto("/");
    const logo = page.getByRole("banner").getByRole("link", { name: "Yamaha Motorcycles India, home" });
    await expect(logo.locator(".l1")).toHaveText("YAMAHA");
    await expect(logo.locator(".l2")).toHaveText("Motorcycles India");
    await expect(logo.locator(".l2")).toBeVisible();
    // both parts use the same display font family and the name is not clipped or overflowing
    const [f1, f2] = await Promise.all([logo.locator(".l1").evaluate((e) => getComputedStyle(e).fontFamily), logo.locator(".l2").evaluate((e) => getComputedStyle(e).fontFamily)]);
    expect(f1).toBe(f2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await ctx.close();
  });
}
