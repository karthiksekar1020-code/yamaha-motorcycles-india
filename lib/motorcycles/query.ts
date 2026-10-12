import type { Motorcycle } from "../../types/motorcycle";
import type { CatalogueQuery } from "../validation/catalogue";

export interface CatalogueResult {
  items: Motorcycle[];
  total: number;
  page: number;
  pageCount: number;
  /** Records dropped from a price sort because they have no verified price. */
  excludedForMissingValue: number;
}

export function filterMotorcycles(all: Motorcycle[], q: CatalogueQuery): CatalogueResult {
  const needle = q.q?.toLowerCase();
  let list = all.filter((m) => {
    if (q.category && m.category !== q.category) return false;
    if (q.market && m.market !== q.market) return false;
    if (q.minCc !== undefined && (m.engineCc ?? -1) < q.minCc) return false;
    if (q.maxCc !== undefined && (m.engineCc ?? Infinity) > q.maxCc) return false;
    if (q.transmission && !(m.transmission ?? "").toLowerCase().includes(q.transmission.toLowerCase())) return false;
    if (q.year !== undefined && m.modelYear !== q.year) return false;
    if (needle) {
      const hay = [m.name, m.category, m.description, m.engineCc ? `${m.engineCc}cc` : "", ...m.features].join(" ").toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });

  let excluded = 0;
  if (q.sort === "price-asc" || q.sort === "price-desc") {
    const before = list.length;
    list = list.filter((m) => m.priceInr !== null);
    excluded = before - list.length;
    list.sort((a, b) => (q.sort === "price-asc" ? a.priceInr! - b.priceInr! : b.priceInr! - a.priceInr!));
  } else if (q.sort === "name") {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else if (q.sort === "cc") {
    list.sort((a, b) => (b.engineCc ?? 0) - (a.engineCc ?? 0));
  } else {
    // recommended: India-market first, then by displacement
    list.sort((a, b) => Number(b.market === "India") - Number(a.market === "India") || (a.engineCc ?? 9999) - (b.engineCc ?? 9999));
  }

  const total = list.length;
  const pageCount = Math.max(1, Math.ceil(total / q.pageSize));
  const page = Math.min(q.page, pageCount);
  return { items: list.slice((page - 1) * q.pageSize, page * q.pageSize), total, page, pageCount, excludedForMissingValue: excluded };
}
