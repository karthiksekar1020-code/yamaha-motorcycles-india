import type { Motorcycle } from "../../types/motorcycle";

export type Row = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : null);
const n = (v: unknown) => (v == null ? null : Number(v));

/** Database row -> the Motorcycle shape the whole site uses. */
export function fromRow(r: Row): Motorcycle {
  return {
    id: typeof r.id === "string" ? r.id : undefined,
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
    colors: Array.isArray(r.colors) ? (r.colors as string[]) : [],
    isFeatured: r.is_featured === true,
    isPublished: r.is_published !== false,
    sortOrder: n(r.sort_order) ?? 0,
    sourceUrl: s(r.source_url), lastVerifiedAt: s(r.last_verified_at),
    dataStatus: r.source_url && r.last_verified_at ? "verified" : "demo",
    image: null,
  };
}

/** The editable fields of a motorcycle (everything except the database-managed id, image and verification status). */
export type MotorcycleInput = Omit<Motorcycle, "id" | "image" | "dataStatus">;

/** Motorcycle form data -> database columns (snake_case). */
export function toRow(m: MotorcycleInput, updatedBy: string): Row {
  return {
    slug: m.slug, name: m.name, market: m.market, model_year: m.modelYear, category: m.category, description: m.description,
    engine_cc: m.engineCc,
    power_value: m.power?.value ?? null, power_unit: m.power?.unit ?? null,
    torque_value: m.torque?.value ?? null, torque_unit: m.torque?.unit ?? null,
    transmission: m.transmission, cooling: m.cooling, kerb_weight_kg: m.kerbWeightKg, seat_height_mm: m.seatHeightMm,
    fuel_capacity_l: m.fuelCapacityL, front_suspension: m.frontSuspension, rear_suspension: m.rearSuspension,
    front_brake: m.frontBrake, rear_brake: m.rearBrake,
    price_amount: m.priceInr, price_currency: m.priceInr === null ? null : "INR",
    availability_status: m.availability, features: m.features, colors: m.colors,
    source_url: m.sourceUrl, last_verified_at: m.lastVerifiedAt,
    is_featured: m.isFeatured, is_published: m.isPublished, sort_order: m.sortOrder, updated_by: updatedBy,
  };
}
