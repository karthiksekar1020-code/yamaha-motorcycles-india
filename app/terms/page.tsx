import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";

export const metadata: Metadata = { title: "Terms of use", description: "Terms for using the Vignesh Bikez website." };

export default function TermsPage() {
  return (
    <PageShell eyebrow="Legal" title="Terms">
      <p>These terms apply to your use of the Vignesh Bikez website. They should be reviewed by a qualified adviser before being relied on.</p>
      <h2>Trademarks</h2>
      <p>Yamaha, model names and related marks belong to Yamaha Motor Co., Ltd. and are used here to identify the motorcycles sold at the showroom.</p>
      <h2>Information accuracy</h2>
      <p>Specifications, prices and availability shown are for guidance and may differ from the current position. Please confirm all details with the showroom before relying on them. Nothing here is an offer to sell.</p>
      <h2>Test-ride requests</h2>
      <p>A submitted request is an enquiry. A test ride is not booked until a representative confirms it with you.</p>
      <h2>Acceptable use</h2>
      <p>Do not attempt to disrupt the service, scrape it at abusive rates or submit false information.</p>
    </PageShell>
  );
}
