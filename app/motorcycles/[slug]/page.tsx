import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllMotorcycles, getMotorcycle } from "@/lib/motorcycles/repository";
import { MotorcycleView } from "@/components/motorcycles/MotorcycleView";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  try {
    const m = await getMotorcycle(slug);
    if (!m) return { title: "Motorcycle not found" };
    return { title: m.name, description: `${m.name}: ${m.category}${m.engineCc ? `, ${m.engineCc} cc` : ""}. ${m.description}` };
  } catch {
    return { title: "Motorcycle" };
  }
}

export default async function MotorcyclePage({ params }: P) {
  const { slug } = await params;
  const m = await getMotorcycle(slug);
  if (!m) notFound();
  const related = (await getAllMotorcycles()).filter((x) => x.slug !== m.slug).sort((a, b) => Number(b.category === m.category) - Number(a.category === m.category)).slice(0, 3);

  return <MotorcycleView m={m} related={related} />;
}
