import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getDb } from "../db/supabase";
import { DEMO_MOTORCYCLES } from "./data";
import { filterMotorcycles } from "./query";
import { attachImages } from "./images";
import type { CatalogueQuery } from "../validation/catalogue";
import type { Motorcycle } from "../../types/motorcycle";

type Row = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : null);
const n = (v: unknown) => (v == null ? null : Number(v));

function fromRow(r: Row): Motorcycle {
  return {
    slug: String(r.slug), name: String(r.name), market: r.market === "India" ? "India" : "International",
    modelYear: n(r.model_year), category: r.category as Motorcycle["category"], description: s(r.description) ?? "",
    engineCc: n(r.engine_cc),
    power: r.power_value != null ? { value: Number(r.power_value), unit: s(r.power_unit) ?? "PS" } : null,
    torque: r.torque_value != null ? { value: Number(r.torque_value), unit: s(r.torque_unit) ?? "Nm" } : null,
    transmission: s(r.transmission), cooling: s(r.cooling), kerbWeightKg: n(r.kerb_weight_kg), seatHeightMm: n(r.seat_height_mm),
    fuelCapacityL: n(r.fuel_capacity_l), frontSuspension: s(r.front_suspension), rearSuspension: s(r.rear_suspension),
    frontBrake: s(r.front_brake), rearBrake: s(r.rear_brake), priceInr: r.price_currency === "INR" ? n(r.price_amount) : null,
    availability: (s(r.availability_status) as Motorcycle["availability"]) ?? "unverified",
    features: Array.isArray(r.features) ? (r.features as string[]) : [],
    sourceUrl: s(r.source_url), lastVerifiedAt: s(r.last_verified_at),
    dataStatus: r.source_url && r.last_verified_at ? "verified" : "demo",
    image: null,
  };
}

// The demo dataset never changes, so build it once per server process instead of on every request.
const DEMO_WITH_IMAGES = attachImages(DEMO_MOTORCYCLES);

// Catalogue rows change rarely: share one database read across requests for a minute instead of one per request.
const fetchRows = unstable_cache(async (): Promise<Row[]> => {
  const { data, error } = await getDb()!.from("motorcycles").select("*");
  if (error) {
    console.error("[motorcycles] database read failed:", error.code);
    throw new Error("CATALOGUE_UNAVAILABLE");
  }
  return data as Row[];
}, ["motorcycles"], { revalidate: 60 });

/**
 * Reads from Supabase when configured, otherwise from the labelled demo dataset.
 * Wrapped in React's `cache` so a page and its generateMetadata (or several components) share one result per request.
 */
export const getAllMotorcycles = cache(async (): Promise<Motorcycle[]> => {
  if (!getDb()) return DEMO_WITH_IMAGES;
  return attachImages((await fetchRows()).map(fromRow));
});

export async function listMotorcycles(q: CatalogueQuery) {
  return filterMotorcycles(await getAllMotorcycles(), q);
}

export async function getMotorcycle(slug: string): Promise<Motorcycle | null> {
  return (await getAllMotorcycles()).find((m) => m.slug === slug) ?? null;
}
