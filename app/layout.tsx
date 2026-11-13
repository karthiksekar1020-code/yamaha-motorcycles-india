import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { isLang, LANGS, MESSAGES } from "@/lib/i18n/messages";
import { REFRESH_GOES_HOME, INTRO_ONCE_PER_SESSION } from "@/lib/config";
import "./globals.css";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { CompareProvider } from "@/components/compare/CompareProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CompareTray } from "@/components/compare/CompareTray";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { getBrandLogo } from "@/lib/brand";
import { IntroLoader } from "@/components/layout/IntroLoader";
import { MotionProvider } from "@/components/ui/MotionProvider";
import type { PublishedContent } from "@/lib/content/schema";
import { contentToEnglishOverrides, DEFAULT_NAVIGATION, NAV_LABEL_KEY, type NavigationContent } from "@/lib/content/schema";
import type { NavItem } from "@/components/layout/Header";

// Fonts load in the visitor's browser from Google Fonts (not at build time), so the build needs no internet access.
// Script fonts cover the Indian languages, which the Latin display/body fonts have no glyphs for. The browser only
// downloads the font files for scripts actually used on the page.
const FONT_FAMILIES = ["Barlow+Condensed:wght@500;600;700", "Inter:wght@400;500;600;700", ...["Devanagari", "Bengali", "Telugu", "Tamil", "Gujarati", "Kannada", "Malayalam", "Gurmukhi", "Oriya"].map((n) => `Noto+Sans+${n}:wght@400;600;700`)];
const FONTS_HREF = `https://fonts.googleapis.com/css2?${FONT_FAMILIES.map((f) => `family=${f}`).join("&")}&display=swap`;
const FONT_VARS = `:root{--font-barlow:"Barlow Condensed";--font-inter:"Inter";--font-deva:"Noto Sans Devanagari";--font-bn:"Noto Sans Bengali";--font-te:"Noto Sans Telugu";--font-ta:"Noto Sans Tamil";--font-gu:"Noto Sans Gujarati";--font-kn:"Noto Sans Kannada";--font-ml:"Noto Sans Malayalam";--font-pa:"Noto Sans Gurmukhi";--font-or:"Noto Sans Oriya"}`;


// Static string, no user input: sends a browser *reload* to the home page, at the top.
const REFRESH_SCRIPT = `(function(){try{var n=performance.getEntriesByType("navigation")[0];if(!n||n.type!=="reload")return;if(location.pathname.indexOf("/admin")===0)return;if(location.pathname!=="/"||location.search||location.hash){location.replace("/");return}history.scrollRestoration="manual";var top=function(){scrollTo(0,0)};addEventListener("load",function(){top();setTimeout(top,120);setTimeout(top,500);setTimeout(function(){history.scrollRestoration="auto"},1500)})}catch(e){}})();`;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Yamaha Vignesh Bikez: explore the lineup", template: "%s · Yamaha Vignesh Bikez" },
  description: "Vignesh Bikez, Yamaha showroom in Pondicherry: explore the latest Yamaha motorcycles and scooters, compare models, and request a test ride. Genuine accessories and reliable service.",
  openGraph: { type: "website", siteName: "Yamaha Vignesh Bikez", locale: "en_IN" },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#050C24", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const logoSrc = getBrandLogo();
  const saved = (await cookies()).get("ymi.lang")?.value;
  const lang = isLang(saved) ? saved : "en";
  const tag = LANGS.find((l) => l.code === lang)!.tag;
  // Optional English wording overrides (currently none); other languages keep their own translations.
  const content: PublishedContent = {};
  const dict = lang === "en" ? { ...MESSAGES.en, ...contentToEnglishOverrides(content) } : MESSAGES[lang];
  const navConfig = (content.navigation as NavigationContent | undefined) ?? DEFAULT_NAVIGATION;
  const nav: NavItem[] = navConfig.items.filter((i) => i.visible).map((i) => ({ href: i.href, key: NAV_LABEL_KEY[i.href], label: i.label }));
  return (
    <html suppressHydrationWarning lang={tag} data-script={lang === "en" ? "latin" : "indic"}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS_HREF} />
        <style dangerouslySetInnerHTML={{ __html: FONT_VARS }} />
        {REFRESH_GOES_HOME && <script dangerouslySetInnerHTML={{ __html: REFRESH_SCRIPT }} />}
      </head>
      <body>
        <MotionProvider>
        <IntroLoader oncePerSession={INTRO_ONCE_PER_SESSION} logoSrc={logoSrc} />
        <I18nProvider initialLang={lang} initialDict={dict}>
          <CompareProvider>
            <Header logoSrc={logoSrc} nav={nav} />
            <main id="main">{children}</main>
            <Footer />
            <CompareTray />
            <WhatsAppButton />
          </CompareProvider>
        </I18nProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
