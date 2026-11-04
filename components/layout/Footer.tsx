"use client";
import Link from "next/link";
import { useI18n } from "@/components/i18n/I18nProvider";
import { SocialLinks } from "./SocialLinks";
import { Phone, MapPin } from "lucide-react";
import { SHOP, SHOP_ADDRESS_LINES, SHOP_MAP_URL } from "@/lib/config";

const EXPLORE: [string, string][] = [["/", "nav.home"], ["/motorcycles", "nav.motorcycles"], ["/experience", "nav.studio"], ["/compare", "nav.compare"], ["/gallery", "nav.gallery"], ["/test-ride", "nav.testRide"]];
const COMPANY: [string, string][] = [["/about", "footer.about"], ["/contact", "footer.contact"], ["/terms", "footer.terms"]];

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="container-x grid grid-cols-1 gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="display text-3xl tracking-[.14em]">VIGNESH BIKEZ</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">{t("footer.blurb")}</p>
          <address className="mt-5 space-y-3 text-sm not-italic leading-relaxed text-fg">
            <span className="micro block">Visit us</span>
            <a href={SHOP_MAP_URL} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 hover:text-blue-bright" aria-label={`Open ${SHOP.shortName} on Google Maps`}>
              <MapPin size={16} className="mt-1 shrink-0" aria-hidden />
              <span>{SHOP_ADDRESS_LINES.map((l) => <span key={l} className="block">{l}</span>)}</span>
            </a>
            <span className="flex flex-wrap gap-x-5 gap-y-1">
              {SHOP.phones.map((p) => <a key={p.tel} href={`tel:${p.tel}`} className="inline-flex items-center gap-2 hover:text-blue-bright"><Phone size={16} aria-hidden />{p.display}</a>)}
            </span>
          </address>
          <div className="mt-6"><SocialLinks /></div>
        </div>
        <div>
          <p className="micro mb-4">{t("footer.explore")}</p>
          <ul className="space-y-2 text-sm">
            {EXPLORE.map(([h, k]) => <li key={h}><Link href={h} className="text-muted hover:text-fg">{t(k)}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="micro mb-4">{t("footer.company")}</p>
          <ul className="space-y-2 text-sm">
            {COMPANY.map(([h, k]) => <li key={h}><Link href={h} className="text-muted hover:text-fg">{t(k)}</Link></li>)}
          </ul>
        </div>
      </div>
      <div className="container-x flex flex-wrap items-center justify-between gap-3 border-t border-line py-6 text-xs text-muted"><span>© {new Date().getFullYear()} {t("footer.copy")}</span></div>
    </footer>
  );
}
