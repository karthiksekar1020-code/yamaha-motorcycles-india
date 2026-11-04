import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/ui/PageShell";
import { ShowroomGallery } from "@/components/gallery/ShowroomGallery";
import { SHOP, SHOP_ADDRESS_ONE_LINE, SHOP_MAP_URL } from "@/lib/config";

export const metadata: Metadata = {
  title: "About",
  description: "Vignesh Bikez is a Yamaha bike showroom in Pondicherry: the latest Yamaha motorcycles and scooters, genuine accessories and reliable customer service.",
};

export default function AboutPage() {
  return (
    <PageShell eyebrow="About us" title="Vignesh Bikez">
      <p>Vignesh Bikez is a Yamaha showroom in Puducherry (Pondicherry), on 100 Feet Road, Mudaliarpet. We help riders find the right Yamaha, from a first scooter for the city to a performance motorcycle for the weekend, and we look after it long after the day you ride it home.</p>

      <h2>What we offer</h2>
      <ul>
        <li><strong className="text-fg">The latest Yamaha models.</strong> Sporty machines such as the R15 and MT-15, the FZ street range, and scooters including the Fascino, RayZR and Aerox 155. Browse the <Link href="/motorcycles">full lineup</Link> and <Link href="/compare">compare models</Link> side by side.</li>
        <li><strong className="text-fg">Genuine accessories.</strong> Original Yamaha accessories and parts, so what goes on your bike fits properly and keeps its quality.</li>
        <li><strong className="text-fg">Reliable customer service.</strong> Honest advice before you buy and friendly, dependable support after it.</li>
        <li><strong className="text-fg">Test rides.</strong> Feel the bike before you decide. <Link href="/test-ride">Request a test ride</Link> or call the showroom.</li>
      </ul>

      <ShowroomGallery inArticle />

      <h2>Why riders choose us</h2>
      <p>We keep things simple: clear answers on models and prices, no pressure, and a team that picks up the phone. Whether you are comparing the R15 with the MT-15 or choosing a scooter for the family, we will help you decide.</p>

      <h2>Visit or call</h2>
      <p>
        <strong className="text-fg">{SHOP.name}</strong><br />
        <a href={SHOP_MAP_URL} target="_blank" rel="noopener noreferrer">{SHOP_ADDRESS_ONE_LINE}</a><br />
        {SHOP.phones.map((p, i) => <span key={p.tel}>{i > 0 && " · "}<a href={`tel:${p.tel}`}>{p.display}</a></span>)}
      </p>
      <p><Link href="/contact">Contact details and directions</Link></p>

      <h2>Good to know</h2>
      <p>Specifications, colours and prices shown on this site are for guidance and may change. Please confirm the current price and availability with the showroom. Yamaha, model names and related marks belong to Yamaha Motor Co., Ltd. and are used here to identify the motorcycles we sell. Product images are © Yamaha Motor India Pvt. Ltd.</p>
    </PageShell>
  );
}
