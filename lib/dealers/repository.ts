import "server-only";
import type { Dealer } from "../../types/dealer";
import { LOCAL_DEALERS } from "./data";
import { cityMatches } from "./match";

export type DealerResult =
  | { status: "ok"; dealers: Dealer[] }
  | { status: "not-configured" }
  | { status: "error" };

/** Dealers come from the local list in lib/dealers/data.ts. No fabricated dealer data is ever returned. */
export async function searchDealers(query: string): Promise<DealerResult> {
  const term = query.trim().replace(/[%,()]/g, "");
  if (LOCAL_DEALERS.length === 0) return { status: "not-configured" };
  const hits = LOCAL_DEALERS.filter((d) => (/^d{6}$/.test(term) ? d.postalCode === term : cityMatches(d.city, term)))
    .sort((a, b) => Number(b.isVerified) - Number(a.isVerified));
  return { status: "ok", dealers: hits.slice(0, 30) };
}

export async function dealerExists(id: string): Promise<boolean> {
  return LOCAL_DEALERS.some((d) => d.isVerified && d.id === id);
}
