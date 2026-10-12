import "server-only";
import { getDb } from "../db/supabase";
import type { Dealer } from "../../types/dealer";
import { LOCAL_DEALERS } from "./data";
import { cityMatches } from "./match";

const localVerified = () => LOCAL_DEALERS.filter((d) => d.isVerified);

export type DealerResult =
  | { status: "ok"; dealers: Dealer[] }
  | { status: "not-configured" }
  | { status: "error" };

/** Dealers come from the database, or from the local verified list (lib/dealers/data.ts) when no database is set up. No fabricated dealer data is ever returned. */
export async function searchDealers(query: string): Promise<DealerResult> {
  const db = getDb();
  const term = query.trim().replace(/[%,()]/g, "");
  if (!db) {
    // Local list: verified entries first, then unverified listings (isVerified: false), which the page labels as such.
    if (LOCAL_DEALERS.length === 0) return { status: "not-configured" };
    const hits = LOCAL_DEALERS.filter((d) => (/^\d{6}$/.test(term) ? d.postalCode === term : cityMatches(d.city, term)))
      .sort((a, b) => Number(b.isVerified) - Number(a.isVerified));
    return { status: "ok", dealers: hits.slice(0, 30) };
  }
  let req = db.from("dealers").select("*").eq("is_verified", true).limit(30);
  if (term) req = /^\d{6}$/.test(term) ? req.eq("postal_code", term) : req.ilike("city", `%${term}%`);
  const { data, error } = await req;
  if (error) {
    console.error("[dealers] database read failed:", error.code);
    return { status: "error" };
  }
  return {
    status: "ok",
    dealers: (data ?? []).map((r) => ({
      id: r.id, name: r.name, city: r.city, postalCode: r.postal_code, address: r.address, phone: r.phone ?? null,
      openingHours: r.opening_hours ?? null, isVerified: r.is_verified, sourceUrl: r.source_url ?? null,
    })),
  };
}

export async function dealerExists(id: string): Promise<boolean> {
  const db = getDb();
  if (!db) return localVerified().some((d) => d.id === id);
  const { data } = await db.from("dealers").select("id").eq("id", id).eq("is_verified", true).maybeSingle();
  return Boolean(data);
}
