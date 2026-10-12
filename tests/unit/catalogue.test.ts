import { describe, expect, it } from "vitest";
import { DEMO_MOTORCYCLES } from "@/lib/motorcycles/data";
import { filterMotorcycles } from "@/lib/motorcycles/query";
import { catalogueQuerySchema, parseCatalogueQuery } from "@/lib/validation/catalogue";

const q = (o: Record<string, unknown> = {}) => catalogueQuerySchema.parse(o);

describe("catalogue filtering", () => {
  it("filters by category", () => {
    const r = filterMotorcycles(DEMO_MOTORCYCLES, q({ category: "Supersport" }));
    expect(r.total).toBeGreaterThan(0);
    expect(r.items.every((m) => m.category === "Supersport")).toBe(true);
  });

  it("filters by displacement range", () => {
    const r = filterMotorcycles(DEMO_MOTORCYCLES, q({ minCc: "300", maxCc: "700" }));
    expect(r.items.every((m) => m.engineCc! >= 300 && m.engineCc! <= 700)).toBe(true);
  });

  it("searches name, category and features", () => {
    expect(filterMotorcycles(DEMO_MOTORCYCLES, q({ q: "mt-15" })).items.map((m) => m.slug)).toEqual(["mt-15-v2"]);
    expect(filterMotorcycles(DEMO_MOTORCYCLES, q({ q: "scooter" })).total).toBeGreaterThan(0);
    expect(filterMotorcycles(DEMO_MOTORCYCLES, q({ q: "zzzz-no-match" })).total).toBe(0);
  });

  it("sorts by price ascending and descending, and skips records with no price", () => {
    const asc = filterMotorcycles(DEMO_MOTORCYCLES, q({ sort: "price-asc", pageSize: 50 }));
    const p = asc.items.map((m) => m.priceInr!);
    expect(p.length).toBeGreaterThan(0);
    expect(p).toEqual([...p].sort((a, b) => a - b));
    const desc = filterMotorcycles(DEMO_MOTORCYCLES, q({ sort: "price-desc", pageSize: 50 })).items.map((m) => m.priceInr!);
    expect(desc).toEqual([...p].reverse());
    expect(asc.excludedForMissingValue).toBe(DEMO_MOTORCYCLES.filter((m) => m.priceInr === null).length);
  });

  it("sorts by displacement descending and by name", () => {
    const cc = filterMotorcycles(DEMO_MOTORCYCLES, q({ sort: "cc" })).items.map((m) => m.engineCc!);
    expect(cc).toEqual([...cc].sort((a, b) => b - a));
    const names = filterMotorcycles(DEMO_MOTORCYCLES, q({ sort: "name" })).items.map((m) => m.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("paginates and clamps the page", () => {
    const r = filterMotorcycles(DEMO_MOTORCYCLES, q({ pageSize: 4, page: 99 }));
    expect(r.pageCount).toBe(Math.ceil(DEMO_MOTORCYCLES.length / 4));
    expect(r.page).toBe(r.pageCount);
  });

  it("falls back to defaults on invalid params", () => {
    expect(parseCatalogueQuery({ category: "Nonsense", page: "-4" }).sort).toBe("recommended");
  });
});

describe("demo data integrity", () => {
  it("has unique slugs and never claims verification", () => {
    expect(new Set(DEMO_MOTORCYCLES.map((m) => m.slug)).size).toBe(DEMO_MOTORCYCLES.length);
    for (const m of DEMO_MOTORCYCLES) {
      expect(m.dataStatus).toBe("demo");
      expect(m.priceInr === null || m.priceInr > 0).toBe(true);
      expect(m.sourceUrl).toBeNull();
    }
  });
});
