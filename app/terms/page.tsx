import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";

export const metadata: Metadata = { title: "Terms of use", description: "Terms for using this independent motorcycle concept site." };

export default function TermsPage() {
  return (
    <PageShell eyebrow="Legal" title="Terms">
      <p>This is a template for an independent concept project and must be reviewed by qualified advisers before any live use.</p>
      <h2>No affiliation</h2>
      <p>This site is not official and is not affiliated with Yamaha Motor Co., Ltd. Trademarks belong to their owners.</p>
      <h2>Information accuracy</h2>
      <p>Specifications, prices and availability shown may be demonstration data and may differ from real products. Confirm all details with an authorised dealer before relying on them. Nothing here is an offer to sell.</p>
      <h2>Test-ride requests</h2>
      <p>A submitted request is an enquiry. A test ride is not booked until a representative confirms it with you.</p>
      <h2>Acceptable use</h2>
      <p>Do not attempt to disrupt the service, scrape it at abusive rates or submit false information.</p>
    </PageShell>
  );
}
