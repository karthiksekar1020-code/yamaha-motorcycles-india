"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MapPin, Phone, Search, X } from "lucide-react";
import dynamic from "next/dynamic";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { useCompare } from "@/components/compare/CompareProvider";
import { useI18n } from "@/components/i18n/I18nProvider";
import { SHOP, SHOP_ADDRESS_ONE_LINE, SHOP_MAP_URL } from "@/lib/config";

// Search is only needed once the visitor opens it, so its code (and the dialog markup) loads on first use.
const loadSearch = () => import("./SearchOverlay");
const SearchOverlay = dynamic(() => loadSearch().then((m) => m.SearchOverlay));
const preloadSearch = () => { void loadSearch(); }; // warm the chunk when the pointer nears the button

export interface NavItem { href: string; /** translation key used for every language other than English */ key: string; /** owner-edited English wording, if any */ label?: string }

export const DEFAULT_NAV: NavItem[] = [
  { href: "/", key: "nav.home" },
  { href: "/motorcycles", key: "nav.motorcycles" },
  { href: "/experience", key: "nav.studio" },
  { href: "/compare", key: "nav.compare" },
  { href: "/gallery", key: "nav.gallery" },
];

export function Header({ logoSrc = null, nav = DEFAULT_NAV }: { logoSrc?: string | null; nav?: NavItem[] }) {
  const path = usePathname();
  const { slugs } = useCompare();
  const { t, lang } = useI18n();
  const label = (n: NavItem) => (n.label && lang === "en" ? n.label : t(n.key));
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
        <div className="container-x flex h-[72px] items-center justify-between min-[1500px]:grid min-[1500px]:grid-cols-[minmax(max-content,1fr)_auto_minmax(max-content,1fr)] min-[1500px]:gap-x-5">
          <Link href="/" className="display flex shrink-0 items-center gap-3" aria-label="Yamaha Vignesh Bikez, home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logoSrc && <img src={logoSrc} alt="" width={48} height={48} className="brand-mark h-11 w-auto shrink-0 md:h-12" />}
            <span className="logo-lockup whitespace-nowrap">
              <span className="l1">YAMAHA</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/vignesh-logo-white.png" alt="" width={45} height={85} className="h-9 w-auto shrink-0 sm:h-10 md:h-12 min-[1200px]:hidden" />
              <span className="l2 min-[1200px]:hidden">{t("brand.tag")}</span>
            </span>
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-3 lg:flex min-[1200px]:gap-5 xl:gap-8">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className="link-underline micro whitespace-nowrap !text-fg">
                {label(n)}
                {n.href === "/compare" && slugs.length > 0 && <span className="ml-1.5 rounded-full bg-blue px-1.5 py-0.5 text-[10px] leading-none">{slugs.length}</span>}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-0 sm:gap-0.5 min-[1500px]:justify-self-end">
            <button onClick={() => { setSearched(true); setSearch(true); }} onPointerEnter={preloadSearch} onFocus={preloadSearch} aria-label={t("nav.search")} className="p-1.5 hover:text-blue-bright"><Search size={20} /></button>
            <a href={`tel:${SHOP.phones[0].tel}`} aria-label={`Call ${SHOP.shortName}: ${SHOP.phones[0].display}`} title={`Call ${SHOP.phones[0].display}`} className="p-1.5 hover:text-blue-bright max-sm:hidden lg:max-[1199px]:hidden"><Phone size={20} /></a>
            <LanguageSwitcher />
            <Link href="/test-ride" className="btn btn-sm ml-1.5 whitespace-nowrap max-sm:hidden!">{t("nav.testRide")}</Link>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/vignesh-logo-white.png" alt="" width={45} height={85} className="ml-3 hidden h-12 w-auto shrink-0 min-[1200px]:block" />
            <span style={{ letterSpacing: ".14em" }} className="display ml-2 hidden whitespace-nowrap text-lg text-fg min-[1200px]:block">{t("brand.tag")}</span>
            <button onClick={() => setMenu(true)} aria-label={t("nav.openMenu")} aria-haspopup="dialog" className="p-2.5 lg:hidden"><Menu size={22} /></button>
          </div>
        </div>
      </header>

      <ModalDialog open={menu} onClose={() => setMenu(false)} label="Navigation menu" className="fixed inset-y-0 right-0 left-auto h-full w-[min(88vw,380px)]">
        <div className="flex h-full flex-col border-l border-line bg-surface p-6">
          <button onClick={() => setMenu(false)} aria-label={t("nav.closeMenu")} className="mb-8 self-end p-2"><X size={24} /></button>
          <nav aria-label="Mobile" className="flex flex-col">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className="display border-b border-line py-4 text-3xl aria-[current=page]:text-blue-bright">{label(n)}</Link>
            ))}
          </nav>
          <div className="mt-6 space-y-3 text-sm">
            {SHOP.phones.map((p) => <a key={p.tel} href={`tel:${p.tel}`} className="flex items-center gap-2 text-fg"><Phone size={16} aria-hidden />{p.display}</a>)}
            <a href={SHOP_MAP_URL} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-muted"><MapPin size={16} className="mt-0.5 shrink-0" aria-hidden />{SHOP_ADDRESS_ONE_LINE}</a>
          </div>
          <Link href="/test-ride" className="btn mt-auto">{t("nav.requestTestRide")}</Link>
        </div>
      </ModalDialog>

      {searched && <SearchOverlay open={search} onClose={() => setSearch(false)} />}
    </>
  );
}
