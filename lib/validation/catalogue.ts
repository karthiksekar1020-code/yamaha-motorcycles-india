import { z } from "zod";
import { CATEGORIES } from "../../types/motorcycle";

const num = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v === undefined || v === null ? undefined : Number(v)), z.number().min(min).max(max).optional());

export const catalogueQuerySchema = z.object({
  q: z.string().trim().max(60).optional(),
  category: z.enum(CATEGORIES).optional(),
  market: z.enum(["India", "International"]).optional(),
  minCc: num(0, 3000),
  maxCc: num(0, 3000),
  transmission: z.string().trim().max(30).optional(),
  year: num(1990, 2100),
  sort: z.enum(["recommended", "name", "price-asc", "price-desc", "cc"]).default("recommended"),
  page: z.preprocess((v) => (v ? Number(v) : 1), z.number().int().min(1).max(500)).default(1),
  pageSize: z.preprocess((v) => (v ? Number(v) : 12), z.number().int().min(1).max(50)).default(12),
});

export type CatalogueQuery = z.infer<typeof catalogueQuerySchema>;

export function parseCatalogueQuery(raw: Record<string, string | string[] | undefined>): CatalogueQuery {
  const flat = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const parsed = catalogueQuerySchema.safeParse(flat);
  return parsed.success ? parsed.data : catalogueQuerySchema.parse({});
}
