import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { isLang, LANGS, MESSAGES } from "@/lib/i18n/messages";
import { REFRESH_GOES_HOME, INTRO_ONCE_PER_SESSION } from "@/lib/config";
import {
  Barlow_Condensed, Inter, Noto_Sans_Devanagari, Noto_Sans_Bengali, Noto_Sans_Telugu, Noto_Sans_Tamil,
  Noto_Sans_Gujarati, Noto_Sans_Kannada, Noto_Sans_Malayalam, Noto_Sans_Gurmukhi, Noto_Sans_Oriya,
} from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { CompareProvider } from "@/components/compare/CompareProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CompareTray } from "@/components/compare/CompareTray";
import { getBrandLogo } from "@/lib/brand";
import { IntroLoader } from "@/components/layout/IntroLoader";
import { MotionProvider } from "@/components/ui/MotionProvider";

const barlow = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-barlow", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
// Script fonts for the Indian languages. The Latin display/body fonts have no glyphs for them.
// preload is off so a page only downloads the font for the language actually in use.
const deva = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-deva", weight: ["400", "600", "700"], display: "swap", preload: false });
const bengali = Noto_Sans_Bengali({ subsets: ["bengali"], variable: "--font-bn", weight: ["400", "600", "700"], display: "swap", preload: false });
const telugu = Noto_Sans_Telugu({ subsets: ["telugu"], variable: "--font-te", weight: ["400", "600", "700"], display: "swap", preload: false });
const tamil = Noto_Sans_Tamil({ subsets: ["tamil"], variable: "--font-ta", weight: ["400", "600", "700"], display: "swap", preload: false });
const gujarati = Noto_Sans_Gujarati({ subsets: ["gujarati"], variable: "--font-gu", weight: ["400", "600", "700"], display: "swap", preload: false });
const kannada = Noto_Sans_Kannada({ subsets: ["kannada"], variable: "--font-kn", weight: ["400", "600", "700"], display: "swap", preload: false });
const malayalam = Noto_Sans_Malayalam({ subsets: ["malayalam"], variable: "--font-ml", weight: ["400", "600", "700"], display: "swap", preload: false });
const gurmukhi = Noto_Sans_Gurmukhi({ subsets: ["gurmukhi"], variable: "--font-pa", weight: ["400", "600", "700"], display: "swap", preload: false });
const oriya = Noto_Sans_Oriya({ subsets: ["oriya"], variable: "--font-or", weight: ["400", "600", "700"], display: "swap", preload: false });
const scriptFonts = [deva, bengali, telugu, tamil, gujarati, kannada, malayalam, gurmukhi, oriya].map((x) => x.variable).join(" ");


// Static string, no user input: sends a browser *reload* to the home page, at the top.
const REFRESH_SCRIPT = `(function(){try{var n=performance.getEntriesByType("navigation")[0];if(!n||n.type!=="reload")return;if(location.pathname!=="/"||location.search||location.hash){location.replace("/");return}history.scrollRestoration="manual";var top=function(){scrollTo(0,0)};addEventListener("load",function(){top();setTimeout(top,120);setTimeout(top,500);setTimeout(function(){history.scrollRestoration="auto"},1500)})}catch(e){}})();`;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Yamaha Motorcycles India: explore the lineup", template: "%s · Yamaha Motorcycles India" },
  description: "An independent, unofficial concept website: explore Yamaha motorcycles and scooters, compare specifications and request a test ride in India.",
  openGraph: { type: "website", siteName: "Yamaha Motorcycles India", locale: "en_IN" },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#050C24", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const logoSrc = getBrandLogo();
  const saved = (await cookies()).get("ymi.lang")?.value;
  const lang = isLang(saved) ? saved : "en";
  const tag = LANGS.find((l) => l.code === lang)!.tag;
  return (
    <html suppressHydrationWarning lang={tag} data-script={lang === "en" ? "latin" : "indic"} className={`${barlow.variable} ${inter.variable} ${scriptFonts}`}>
      {REFRESH_GOES_HOME && <head><script dangerouslySetInnerHTML={{ __html: REFRESH_SCRIPT }} /></head>}
      <body>
        <MotionProvider>
        <IntroLoader oncePerSession={INTRO_ONCE_PER_SESSION} logoSrc={logoSrc} />
        <I18nProvider initialLang={lang} initialDict={MESSAGES[lang]}>
          <CompareProvider>
            <Header logoSrc={logoSrc} />
            <main id="main">{children}</main>
            <Footer />
            <CompareTray />
          </CompareProvider>
        </I18nProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
