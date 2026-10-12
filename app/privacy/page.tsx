import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";

export const metadata: Metadata = { title: "Privacy notice", description: "What personal data the test-ride form collects and how it is handled." };

export default function PrivacyPage() {
  return (
    <PageShell eyebrow="Legal" title="Privacy">
      <p>This notice describes the data handled by this concept project. It is a template: the operator of a live deployment must review it with qualified advisers and applicable Indian law (including the Digital Personal Data Protection Act, 2023) before launch.</p>
      <h2>What we collect</h2>
      <ul>
        <li><strong className="text-fg">Test-ride form:</strong> full name, mobile number, email, city, preferred model, date and time window, optional dealer, and the time you gave consent.</li>
        <li><strong className="text-fg">Browser storage:</strong> a list of motorcycle names you chose to compare is kept in session storage on your device only.</li>
        <li>We do not request your device location, and we do not collect payment details.</li>
      </ul>
      <h2>Why</h2>
      <p>Solely to follow up your test-ride enquiry. Enquiries are not confirmed bookings.</p>
      <h2>Retention and access</h2>
      <p>Requests should be retained only as long as needed to handle the enquiry; the operator should define and document a retention period (for example, deletion after a fixed number of months). Request records are not publicly readable; access is limited to server-side administrative use.</p>
      <h2>Your choices</h2>
      <p>You may ask the operator to access, correct or delete your enquiry. Contact details for the operator must be configured in the deployment.</p>
    </PageShell>
  );
}
