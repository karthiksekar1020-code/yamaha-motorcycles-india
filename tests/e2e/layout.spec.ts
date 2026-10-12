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

/**
 * Nothing may be cut off or hang outside the screen on narrow devices. The page itself is set to clip sideways overflow
 * (so it can never scroll sideways), which means a plain scrollWidth check would hide a real problem: instead every
 * element's position is checked, ignoring decorative parts and anything inside a clipping container that fits.
 */
const NARROW_PAGES = ["/", "/motorcycles", "/motorcycles/r15-v4", "/compare?m=r15-v4,mt-15-v2", "/experience", "/gallery", "/test-ride", "/about"];
for (const width of [280, 320, 412]) {
  test(`no content hangs off the screen at ${width}px wide`, async ({ page, isMobile }) => {
    test.skip(isMobile, "this test sets its own viewport widths");
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 760 });
    const problems: string[] = [];
    for (const path of NARROW_PAGES) {
      await page.goto(path);
      await page.waitForTimeout(path === "/" ? 4300 : 700);
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); } window.scrollTo(0, 0); });
      if (path === "/") { // the carousels slide their content in from the side: exercise them
        for (let k = 0; k < 3; k++) {
          await page.locator('[aria-label="Next bike in engineering view"]').click({ force: true, timeout: 3000 }).catch(() => {});
          await page.locator('[aria-label="Next motorcycle"]').click({ force: true, timeout: 3000 }).catch(() => {});
          await page.waitForTimeout(450);
        }
      }
      const bad = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth, out: string[] = [];
        document.querySelectorAll("body *").forEach((el) => {
          const b = el.getBoundingClientRect();
          if (b.width <= 0 || (b.right <= vw + 1 && b.left >= -1)) return;
          if (getComputedStyle(el).position === "fixed" || el.closest("[aria-hidden='true']")) return;
          let p: HTMLElement | null = el.parentElement;
          while (p && p !== document.documentElement) {
            if (p !== document.body && /(hidden|clip|auto|scroll)/.test(getComputedStyle(p).overflowX)) { const pb = p.getBoundingClientRect(); if (pb.right <= vw + 1 && pb.left >= -1) return; }
            p = p.parentElement;
          }
          out.push(`${el.tagName}.${String((el as HTMLElement).className).replace(/\s+/g, " ").slice(0, 50)} (${Math.round(b.left)}..${Math.round(b.right)})`);
        });
        return out.slice(0, 3);
      });
      if (bad.length) problems.push(`${path}: ${bad.join(" | ")}`);
    }
    expect(problems, problems.join("\n")).toEqual([]);
  });
}
