import { expect, test } from "@playwright/test";

const EXPECT: { label: string; tag: string; home: string; h1: string }[] = [
  { label: "हिन्दी", tag: "hi-IN", home: "होम", h1: "महसूस करें" },
  { label: "বাংলা", tag: "bn-IN", home: "হোম", h1: "অনুভব করুন" },
  { label: "मराठी", tag: "mr-IN", home: "होम", h1: "अनुभवा" },
  { label: "తెలుగు", tag: "te-IN", home: "హోమ్", h1: "అనుభవించండి" },
  { label: "தமிழ்", tag: "ta-IN", home: "முகப்பு", h1: "உணருங்கள்" },
  { label: "ગુજરાતી", tag: "gu-IN", home: "હોમ", h1: "અનુભવો" },
  { label: "ಕನ್ನಡ", tag: "kn-IN", home: "ಮುಖಪುಟ", h1: "ಅನುಭವಿಸಿ" },
  { label: "മലയാളം", tag: "ml-IN", home: "ഹോം", h1: "അനുഭവിക്കൂ" },
  { label: "ਪੰਜਾਬੀ", tag: "pa-IN", home: "ਹੋਮ", h1: "ਮਹਿਸੂਸ ਕਰੋ" },
  { label: "ଓଡ଼ିଆ", tag: "or-IN", home: "ହୋମ୍", h1: "ଅନୁଭବ କରନ୍ତୁ" },
];

test("language menu lists all 11 languages", async ({ page }) => {
  await page.goto("/about");
  await page.getByRole("button", { name: /Language: English/i }).click();
  await expect(page.getByRole("menuitemradio")).toHaveCount(11);
});

test("every language switches the page, sets <html lang>, and has no horizontal overflow", async ({ page, isMobile }) => {
  await page.goto("/");
  for (const l of EXPECT) {
    await page.getByRole("button", { name: /Language:|भाषा|ভাষা|भाषा|భాష|மொழி|ભાષા|ಭಾಷೆ|ഭാഷ|ਭਾਸ਼ਾ|ଭାଷା/ }).first().click();
    await page.getByRole("menuitemradio", { name: l.label }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", l.tag);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(l.h1);
    if (!isMobile) await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: l.home, exact: true })).toBeVisible();
    const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    expect(noOverflow, `horizontal overflow in ${l.label}`).toBe(true);
  }
});
