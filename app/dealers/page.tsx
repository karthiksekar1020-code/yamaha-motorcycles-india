import { T } from "@/components/i18n/I18nProvider";
import type { Metadata } from "next";
import { DealerSearch } from "@/components/dealers/DealerSearch";

export const metadata: Metadata = { title: "Find a dealer", description: "Search verified dealerships by city or PIN code in India." };

export default function DealersPage() {
  return (
    <section className="container-x pb-8 pt-32">
      <p className="micro"><T k="page.dealers.eyebrow" /></p>
      <h1 className="display mt-2 text-4xl md:text-6xl"><T k="page.dealers.title" /></h1>
      <p className="mb-10 mt-4 max-w-2xl text-muted"><T k="page.dealers.intro" /></p>
      <DealerSearch />
    </section>
  );
}
