import "server-only";
import { cache } from "react";
import { DEMO_MOTORCYCLES } from "./data";
import { filterMotorcycles } from "./query";
import { attachImages } from "./images";
import type { CatalogueQuery } from "../validation/catalogue";
import type { Motorcycle } from "../../types/motorcycle";

// The catalogue is the built-in dataset, so build it once per server process.
const CATALOGUE = attachImages(DEMO_MOTORCYCLES);

export const getAllMotorcycles = cache(async (): Promise<Motorcycle[]> => CATALOGUE);

export async function listMotorcycles(q: CatalogueQuery) {
  return filterMotorcycles(await getAllMotorcycles(), q);
}

export async function getMotorcycle(slug: string): Promise<Motorcycle | null> {
  return (await getAllMotorcycles()).find((m) => m.slug === slug) ?? null;
}
