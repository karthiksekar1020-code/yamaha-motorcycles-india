import { describe, expect, it } from "vitest";
import { LANGS, MESSAGES, isLang, translate } from "@/lib/i18n/messages";

describe("translations", () => {
  const enKeys = Object.keys(MESSAGES.en);

  it("offers English plus ten Indian languages", () => {
    expect(LANGS.map((l) => l.code)).toEqual(["en", "ta", "hi", "bn", "mr", "te", "gu", "kn", "ml", "pa", "or"]);
    expect(new Set(LANGS.map((l) => l.tag)).size).toBe(LANGS.length);
  });

  it.each(LANGS.map((l) => l.code))("%s has every key, with no empty values", (code) => {
    const d = MESSAGES[code];
    expect(Object.keys(d).sort()).toEqual([...enKeys].sort());
    for (const k of enKeys) expect(d[k]!.trim().length, `${code}:${k}`).toBeGreaterThan(0);
  });

  it.each(LANGS.filter((l) => l.code !== "en").map((l) => l.code))("%s is actually translated (not copied English) and keeps URL/brand tokens", (code) => {
    const d = MESSAGES[code], e = MESSAGES.en;
    for (const k of ["nav.home", "hero.line1", "hero.lead", "footer.blurb", "page.dealers.intro"]) expect(d[k], `${code}:${k}`).not.toBe(e[k]);
    // text written in the target script, not Latin
    expect(d["hero.lead"]).not.toMatch(/[A-Za-z]{4,}/);
    expect(d["page.compare.intro"]).toContain("URL");
  });

  it("falls back to English, then to the key", () => {
    expect(translate("hi", "nope.missing")).toBe("nope.missing");
    expect(translate("en", "nav.home")).toBe("Home");
  });

  it("validates language codes", () => {
    expect(isLang("ta")).toBe(true);
    expect(isLang("xx")).toBe(false);
    expect(isLang(null)).toBe(false);
  });
});
