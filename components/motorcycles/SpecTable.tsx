import { NA, SPEC_ROWS } from "@/lib/utils/format";
import type { Motorcycle } from "@/types/motorcycle";

export function SpecTable({ m }: { m: Motorcycle }) {
  return (
    <table className="num w-full text-left text-sm">
      <caption className="sr-only">{m.name} technical specifications</caption>
      <tbody>
        {SPEC_ROWS.map((r) => {
          const v = r.get(m);
          return (
            <tr key={r.key} className="border-b border-line">
              <th scope="row" className="w-2/5 py-3 pr-4 text-xs font-semibold uppercase tracking-[.14em] text-muted">{r.label}</th>
              <td className={v === NA || v === "" ? "py-3 text-muted" : "py-3"}>{v || NA}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
