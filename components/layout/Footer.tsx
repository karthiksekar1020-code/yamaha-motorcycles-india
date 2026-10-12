"use client";
import Link from "next/link";
import { useI18n } from "@/components/i18n/I18nProvider";

const EXPLORE: [string, string][] = [["/", "nav.home"], ["/motorcycles", "nav.motorcycles"], ["/experience", "nav.studio"], ["/compare", "nav.compare"], ["/gallery", "nav.gallery"], ["/test-ride", "nav.testRide"]];
const COMPANY: [string, string][] = [["/about", "footer.about"], ["/contact", "footer.contact"], ["/privacy", "footer.privacy"], ["/terms", "footer.terms"]];

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="container-x grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="display text-3xl tracking-[.14em]">YAMAHA MOTORCYCLES INDIA</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">{t("footer.blurb")}</p>
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
      <div className="container-x border-t border-line py-6 text-xs text-muted">© {new Date().getFullYear()} {t("footer.copy")}</div>
    </footer>
  );
}
