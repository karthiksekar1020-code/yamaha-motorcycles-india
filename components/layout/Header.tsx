"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import dynamic from "next/dynamic";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { useCompare } from "@/components/compare/CompareProvider";
import { useI18n } from "@/components/i18n/I18nProvider";

// Search is only needed once the visitor opens it, so its code (and the dialog markup) loads on first use.
const loadSearch = () => import("./SearchOverlay");
const SearchOverlay = dynamic(() => loadSearch().then((m) => m.SearchOverlay));
const preloadSearch = () => { void loadSearch(); }; // warm the chunk when the pointer nears the button

export const NAV = [
  { href: "/", key: "nav.home" },
  { href: "/motorcycles", key: "nav.motorcycles" },
  { href: "/experience", key: "nav.studio" },
  { href: "/compare", key: "nav.compare" },
  { href: "/gallery", key: "nav.gallery" },
];

export function Header({ logoSrc = null }: { logoSrc?: string | null }) {
  const path = usePathname();
  const { slugs } = useCompare();
  const { t } = useI18n();
  const [solid, setSolid] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [searched, setSearched] = useState(false); // mount the overlay only after the first open

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setMenu(false), [path]);

  const active = (href: string) => path === href || path.startsWith(href + "/");

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-black">Skip to content</a>
      <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${solid ? "border-b border-line bg-bg/95 backdrop-blur" : "bg-gradient-to-b from-[#050c24]/85 to-transparent"}`}>
        <div className="container-x flex h-[72px] items-center justify-between">
          <Link href="/" className="display flex shrink-0 items-center gap-3" aria-label="Yamaha Motorcycles India, home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logoSrc && <img src={logoSrc} alt="" width={48} height={48} className="brand-mark h-11 w-auto shrink-0 md:h-12" />}
            <span className="logo-lockup">
              <span className="l1">YAMAHA</span>
              <span className="l2">{t("brand.tag")}</span>
            </span>
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-5 lg:flex xl:gap-8">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className="link-underline micro whitespace-nowrap !text-fg">
                {t(n.key)}
                {n.href === "/compare" && slugs.length > 0 && <span className="ml-1.5 rounded-full bg-blue px-1.5 py-0.5 text-[10px] leading-none">{slugs.length}</span>}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => { setSearched(true); setSearch(true); }} onPointerEnter={preloadSearch} onFocus={preloadSearch} aria-label={t("nav.search")} className="p-2.5 hover:text-blue-bright"><Search size={20} /></button>
            <LanguageSwitcher />
            <Link href="/login" className="micro px-2.5 py-2 !text-fg hover:!text-blue-bright max-sm:hidden!">Login</Link>
            <Link href="/test-ride" className="btn btn-sm ml-1 whitespace-nowrap max-sm:hidden!">{t("nav.testRide")}</Link>
            <button onClick={() => setMenu(true)} aria-label={t("nav.openMenu")} aria-haspopup="dialog" className="p-2.5 lg:hidden"><Menu size={22} /></button>
          </div>
        </div>
      </header>

      <ModalDialog open={menu} onClose={() => setMenu(false)} label="Navigation menu" className="fixed inset-y-0 right-0 left-auto h-full w-[min(88vw,380px)]">
        <div className="flex h-full flex-col border-l border-line bg-surface p-6">
          <button onClick={() => setMenu(false)} aria-label={t("nav.closeMenu")} className="mb-8 self-end p-2"><X size={24} /></button>
          <nav aria-label="Mobile" className="flex flex-col">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className="display border-b border-line py-4 text-3xl aria-[current=page]:text-blue-bright">{t(n.key)}</Link>
            ))}
          </nav>
          <Link href="/login" className="display border-b border-line py-4 text-3xl aria-[current=page]:text-blue-bright" aria-current={path === "/login" ? "page" : undefined}>Login</Link>
          <Link href="/test-ride" className="btn mt-auto">{t("nav.requestTestRide")}</Link>
        </div>
      </ModalDialog>

      {searched && <SearchOverlay open={search} onClose={() => setSearch(false)} />}
    </>
  );
}
