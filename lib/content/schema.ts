import { z } from "zod";

/**
 * Editable site content. Admins can change the wording, never the structure: links are limited to this site's own
 * pages (so content can never inject a script or an outside link), and every field has a length cap.
 */
export const CONTENT_KEYS = ["hero", "home", "navigation", "promo"] as const;
export type ContentKey = (typeof CONTENT_KEYS)[number];

export const NAV_LINKS = ["/", "/motorcycles", "/experience", "/compare", "/gallery", "/dealers", "/test-ride", "/about", "/contact"] as const;
export type NavLink = (typeof NAV_LINKS)[number];

const text = (max: number, min = 1) => z.string().trim().min(min, "Required").max(max, `Keep it under ${max} characters`);

export const heroSchema = z.object({
  eyebrow: text(80), line1: text(40), line2: text(60), lead: text(300), cta1: text(30), cta2: text(30), meta: text(80),
}).strict();

export const homeSchema = z.object({
  featured: text(40), chooseRide: text(60), categories: text(40), engineering: text(40), builtAround: text(80),
  compare: text(40), precision: text(80), gallery: text(40), inFocus: text(60), viewAll: text(30), nextMove: text(80),
}).strict();

export const navigationSchema = z.object({
  items: z.array(z.object({ href: z.enum(NAV_LINKS), label: text(24), visible: z.boolean() }).strict()).min(1, "Keep at least one link").max(9)
    .refine((items) => new Set(items.map((i) => i.href)).size === items.length, "Each page can appear once"),
}).strict();

export const promoSchema = z.object({
  enabled: z.boolean(),
  text: z.string().trim().max(160, "Keep it under 160 characters"),
  linkLabel: z.string().trim().max(30),
  linkHref: z.enum(NAV_LINKS).nullable(),
}).strict().refine((p) => !p.enabled || p.text.length > 0, { message: "Enter the banner text, or turn the banner off", path: ["text"] });

export const CONTENT_SCHEMAS = { hero: heroSchema, home: homeSchema, navigation: navigationSchema, promo: promoSchema } as const;
export type HeroContent = z.infer<typeof heroSchema>;
export type HomeContent = z.infer<typeof homeSchema>;
export type NavigationContent = z.infer<typeof navigationSchema>;
export type PromoContent = z.infer<typeof promoSchema>;
export type ContentValue = HeroContent | HomeContent | NavigationContent | PromoContent;

/** Which translation key each editable field replaces (English only; other languages keep their own wording). */
export const HERO_KEYS: Record<keyof HeroContent, string> = {
  eyebrow: "hero.eyebrow", line1: "hero.line1", line2: "hero.line2", lead: "hero.lead", cta1: "hero.cta1", cta2: "hero.cta2", meta: "hero.meta",
};
export const HOME_KEYS: Record<keyof HomeContent, string> = {
  featured: "home.featured", chooseRide: "home.chooseRide", categories: "home.categories", engineering: "home.engineering",
  builtAround: "home.builtAround", compare: "home.compare", precision: "home.precision", gallery: "home.gallery",
  inFocus: "home.inFocus", viewAll: "home.viewAll", nextMove: "home.nextMove",
};

/** Translation key used for a navigation link in other languages. */
export const NAV_LABEL_KEY: Record<NavLink, string> = {
  "/": "nav.home", "/motorcycles": "nav.motorcycles", "/experience": "nav.studio", "/compare": "nav.compare", "/gallery": "nav.gallery",
  "/dealers": "nav.dealers", "/test-ride": "nav.testRide", "/about": "footer.about", "/contact": "footer.contact",
};

export const DEFAULT_NAVIGATION: NavigationContent = {
  items: [
    { href: "/", label: "Home", visible: true }, { href: "/motorcycles", label: "Motorcycles", visible: true },
    { href: "/experience", label: "Studio", visible: true }, { href: "/compare", label: "Compare", visible: true },
    { href: "/gallery", label: "Gallery", visible: true }, { href: "/dealers", label: "Dealers", visible: false },
    { href: "/test-ride", label: "Test ride", visible: false }, { href: "/about", label: "About", visible: false },
    { href: "/contact", label: "Contact", visible: false },
  ],
};
export const DEFAULT_PROMO: PromoContent = { enabled: false, text: "", linkLabel: "", linkHref: null };

/** Flatten editable content into translation overrides for English. */
export function contentToEnglishOverrides(c: Partial<Record<ContentKey, ContentValue>>): Record<string, string> {
  const out: Record<string, string> = {};
  const hero = c.hero as HeroContent | undefined;
  if (hero) for (const [field, key] of Object.entries(HERO_KEYS)) out[key] = hero[field as keyof HeroContent];
  const home = c.home as HomeContent | undefined;
  if (home) for (const [field, key] of Object.entries(HOME_KEYS)) out[key] = home[field as keyof HomeContent];
  return out;
}
