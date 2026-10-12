import type { Motorcycle } from "../../types/motorcycle";

export const NA = "Not available";

export const fmtMeasure = (m: { value: number; unit: string } | null) => (m ? `${m.value} ${m.unit}` : NA);
export const fmtNum = (v: number | null, unit: string) => (v === null ? NA : `${v} ${unit}`);
export const fmtPrice = (m: Motorcycle) =>
  m.priceInr === null ? "Price not verified" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(m.priceInr);

export const AVAILABILITY_LABEL: Record<Motorcycle["availability"], string> = {
  unverified: "Availability unverified",
  current: "Currently available",
  upcoming: "Upcoming in India (unconfirmed)",
  discontinued: "Discontinued",
  "international-only": "International market only",
};

export interface SpecRow {
  key: string;
  label: string;
  /** Raw comparable string for diffing. */
  get: (m: Motorcycle) => string;
}

/** Single source of truth for specification rows (detail page + comparison). */
export const SPEC_ROWS: SpecRow[] = [
  { key: "market", label: "Market", get: (m) => m.market },
  { key: "year", label: "Model year", get: (m) => fmtNum(m.modelYear, "").trim() },
  { key: "price", label: "Price (ex-showroom)", get: (m) => fmtPrice(m) },
  { key: "availability", label: "Availability", get: (m) => AVAILABILITY_LABEL[m.availability] },
  { key: "cc", label: "Engine displacement", get: (m) => fmtNum(m.engineCc, "cc") },
  { key: "power", label: "Maximum power", get: (m) => fmtMeasure(m.power) },
  { key: "torque", label: "Maximum torque", get: (m) => fmtMeasure(m.torque) },
  { key: "transmission", label: "Transmission", get: (m) => m.transmission ?? NA },
  { key: "cooling", label: "Cooling system", get: (m) => m.cooling ?? NA },
  { key: "weight", label: "Kerb weight", get: (m) => fmtNum(m.kerbWeightKg, "kg") },
  { key: "seat", label: "Seat height", get: (m) => fmtNum(m.seatHeightMm, "mm") },
  { key: "fuel", label: "Fuel capacity", get: (m) => fmtNum(m.fuelCapacityL, "L") },
  { key: "fsus", label: "Front suspension", get: (m) => m.frontSuspension ?? NA },
  { key: "rsus", label: "Rear suspension", get: (m) => m.rearSuspension ?? NA },
  { key: "fbrake", label: "Front brake", get: (m) => m.frontBrake ?? NA },
  { key: "rbrake", label: "Rear brake", get: (m) => m.rearBrake ?? NA },
];

export const MAX_COMPARE = 3;
