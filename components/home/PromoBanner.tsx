import Link from "next/link";
import type { PromoContent } from "@/lib/content/schema";

/** Owner-managed announcement strip. Text is rendered as plain text (React escapes it) and the link is limited to this site's pages. */
export function PromoBanner({ promo }: { promo?: PromoContent }) {
  if (!promo?.enabled || !promo.text) return null;
  return (
    <section aria-label="Announcement" className="border-y border-blue/50 bg-blue/15">
      <div className="container-x flex flex-wrap items-center justify-center gap-x-5 gap-y-1 py-3 text-center text-sm">
        <p>{promo.text}</p>
        {promo.linkHref && promo.linkLabel && <Link href={promo.linkHref} className="link-underline micro !text-fg">{promo.linkLabel}</Link>}
      </div>
    </section>
  );
}
