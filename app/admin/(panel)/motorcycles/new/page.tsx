import type { Metadata } from "next";
import { MotorcycleForm } from "@/components/admin/MotorcycleForm";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Add motorcycle" };

export default function NewMotorcyclePage() {
  return (
    <>
      <PageHeader eyebrow="Motorcycles" title="Add a motorcycle" />
      <p className="mb-6 max-w-2xl text-sm text-muted">New models start as private drafts. Preview the page, then tick “Published” when you are happy with it.</p>
      <MotorcycleForm />
    </>
  );
}
