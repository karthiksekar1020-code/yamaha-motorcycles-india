import { expect, test } from "@playwright/test";

test("language switcher: Hindi applies, persists, and Test ride stays right-most", async ({ page, isMobile }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/feel the/i);

  await page.getByRole("button", { name: /Language: English/i }).click();
  await page.getByRole("menuitemradio", { name: "हिन्दी" }).click();

  await expect(page.locator("html")).toHaveAttribute("lang", "hi-IN");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("महसूस करें");
  await expect(page.getByText("लाइनअप देखें")).toBeVisible();
  if (!isMobile) {
    await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "मोटरसाइकिलें" })).toBeVisible();
    // Test ride button is the right-most item in the header, after the language switcher
    const lang = await page.getByRole("button", { name: /भाषा/ }).boundingBox();
    const ride = await page.getByRole("banner").getByRole("link", { name: "टेस्ट राइड" }).boundingBox();
    expect(ride!.x).toBeGreaterThan(lang!.x + lang!.width - 1);
  }

  // other pages use the chosen language, and it survives a reload
  await page.goto("/gallery");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("गैलरी");
  await page.goto("/gallery"); // a fresh visit keeps the saved language
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("गैलरी");

  // switch back
  await page.getByRole("button", { name: /भाषा/ }).click();
  await page.getByRole("menuitemradio", { name: "English" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Gallery");
  await expect(page.locator("html")).toHaveAttribute("lang", "en-IN");
});

test("language menu closes with Escape", async ({ page }) => {
  await page.goto("/about");
  await page.getByRole("button", { name: /Language: English/i }).click();
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();
});
