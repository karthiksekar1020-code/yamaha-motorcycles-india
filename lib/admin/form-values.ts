import type { Motorcycle } from "../../types/motorcycle";
import type { MotorcycleFormValues } from "./schemas";

/** The form values for a model: used so the list can flip the published flag without losing any other field. */
export const toFormValues = (m: Motorcycle): MotorcycleFormValues => ({
  slug: m.slug, name: m.name, market: m.market, modelYear: m.modelYear, category: m.category, description: m.description, engineCc: m.engineCc,
  power: m.power, torque: m.torque, transmission: m.transmission, cooling: m.cooling, kerbWeightKg: m.kerbWeightKg, seatHeightMm: m.seatHeightMm,
  fuelCapacityL: m.fuelCapacityL, frontSuspension: m.frontSuspension, rearSuspension: m.rearSuspension, frontBrake: m.frontBrake, rearBrake: m.rearBrake,
  priceInr: m.priceInr, availability: m.availability, features: m.features, colors: m.colors, sourceUrl: m.sourceUrl, lastVerifiedAt: m.lastVerifiedAt?.slice(0, 10) ?? null,
  isFeatured: m.isFeatured, isPublished: m.isPublished, sortOrder: m.sortOrder,
});
