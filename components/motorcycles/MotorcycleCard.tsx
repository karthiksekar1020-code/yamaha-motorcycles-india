import Link from "next/link";
import { ModelPicture } from "@/components/ui/ModelPicture";
import { TiltCard } from "@/components/ui/TiltCard";
import { CompareToggle } from "@/components/compare/CompareToggle";
import { AVAILABILITY_LABEL, fmtMeasure, fmtNum, fmtPrice } from "@/lib/utils/format";
import type { Motorcycle } from "@/types/motorcycle";

export function MotorcycleCard({ m, index = 0 }: { m: Motorcycle; index?: number }) {
  return (
    <TiltCard index={index}>
    <article className="group flex h-full flex-col border border-line bg-surface transition-colors hover:border-blue-bright/60">
      <Link href={`/motorcycles/${m.slug}`} className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-[radial-gradient(70%_70%_at_50%_70%,rgba(22,119,255,.16),transparent)]" aria-label={`${m.name} details`}>
        <ModelPicture m={m} className="h-[88%] w-auto max-w-[92%] transition-transform duration-500 group-hover:scale-110 [transform:translate(calc(var(--mx,0)*22px),calc(var(--my,0)*14px))]" sizes="(min-width:1280px) 22vw, (min-width:640px) 35vw, 100vw" />
        <span className="micro absolute left-3 top-3 border border-line bg-bg/70 px-2 py-1">{m.market}</span>
      </Link>
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div>
          <p className="micro">{m.category}{m.engineCc ? ` · ${m.engineCc} cc` : ""}</p>
          <h3 className="display mt-1 text-xl"><Link href={`/motorcycles/${m.slug}`}>{m.name}</Link></h3>
        </div>
        <dl className="num grid grid-cols-2 gap-2 text-sm">
          <div><dt className="micro">{m.power ? "Power" : "Engine"}</dt><dd>{m.power ? fmtMeasure(m.power) : fmtNum(m.engineCc, "cc")}</dd></div>
          <div><dt className="micro">Price</dt><dd>{fmtPrice(m)}</dd></div>
        </dl>
        <p className="text-xs text-muted">{AVAILABILITY_LABEL[m.availability]}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <Link href={`/motorcycles/${m.slug}`} className="link-underline micro !text-fg">View details</Link>
          <CompareToggle slug={m.slug} name={m.name} />
        </div>
      </div>
    </article>
    </TiltCard>
  );
}
