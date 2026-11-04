import type { Metadata } from "next";
import Link from "next/link";
import { Clock, MapPin, Phone } from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { SHOP, SHOP_ADDRESS_LINES, SHOP_MAP_URL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Contact",
  description: "Call or visit Vignesh Bikez, Yamaha showroom on 100 Feet Road, Mudaliarpet, Puducherry 605004.",
};

export default function ContactPage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <PageShell eyebrow="Get in touch" title="Contact">
      <p>Talk to the team at {SHOP.name} about models, prices, test rides, genuine accessories or service. Call us or visit the showroom.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="contact-card border border-line bg-elevated p-5 text-sm">
          <p className="micro flex items-center gap-2 !text-fg"><Phone size={14} className="icon-ring" aria-hidden /> Call us</p>
          <ul className="mt-3 space-y-2">
            {SHOP.phones.map((p) => (
              <li key={p.tel} className="!ml-0 !list-none"><a href={`tel:${p.tel}`} className="contact-link text-lg !text-fg">{p.display}</a></li>
            ))}
          </ul>
          {email && <p className="mt-3">Email: <a href={`mailto:${email}`}>{email}</a></p>}
        </div>
        <div className="contact-card border border-line bg-elevated p-5 text-sm">
          <p className="micro flex items-center gap-2 !text-fg"><MapPin size={14} className="icon-pin" aria-hidden /> Visit the showroom</p>
          <address className="mt-3 not-italic leading-relaxed">
            <strong className="text-fg">{SHOP.name}</strong>
            {SHOP_ADDRESS_LINES.map((l) => <span key={l} className="block">{l}</span>)}
          </address>
          <a className="contact-link mt-3 inline-block" target="_blank" rel="noopener noreferrer" href={SHOP_MAP_URL}>Open in Google Maps</a>
        </div>
      </div>
      <p className="flex items-start gap-2 text-sm"><Clock size={16} className="mt-0.5 shrink-0" aria-hidden /> Please call ahead to confirm showroom hours and the availability of a model for a test ride.</p>
      <p>You can also send a <Link href="/test-ride">test-ride request</Link> and a representative will contact you.</p>
    </PageShell>
  );
}
