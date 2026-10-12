import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/ui/PageShell";

export const metadata: Metadata = { title: "About", description: "About this independent motorcycle concept experience." };

export default function AboutPage() {
  return (
    <PageShell eyebrow="The project" title="About">
      <p>Yamaha Motorcycles India is an independent concept experience exploring how a motorcycle discovery site can feel: a dark studio, a rotatable machine, honest specifications and a clear path to a test ride.</p>
      <p><strong className="text-fg">It is not an official Yamaha website.</strong> It is not affiliated with, endorsed by or operated by Yamaha Motor Co., Ltd. or any authorised Yamaha dealer. Yamaha, model names and related marks belong to their owners and appear here only to identify the motorcycles being discussed.</p>
      <h2>How the data is handled</h2>
      <ul>
        <li>Specifications in this build are demonstration data. They are labelled as unverified. Prices are indicative ex-showroom (Delhi) figures from third-party listings, last checked on 9 October 2026; they are not from Yamaha and change often.</li>
        <li>Missing values are shown as “Not available”, never filled with guesses.</li>
        <li>Dealer listings come only from a verified data source. None is bundled.</li>
        <li>The 3D model is an original placeholder; real assets need an appropriate licence.</li>
      </ul>
      <h2>Design and engineering</h2>
      <p>The interface favours precision: condensed display type, tabular numerals for specifications, restrained motion that respects reduced-motion settings, and a complete 2D fallback when WebGL is unavailable.</p>
      <p><Link href="/motorcycles">Browse the lineup</Link> or <Link href="/test-ride">request a test ride</Link>.</p>
    </PageShell>
  );
}
