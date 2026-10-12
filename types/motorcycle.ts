export const CATEGORIES = ["Supersport", "Street", "Hyper Naked", "Sport Touring", "Heritage", "Scooter", "Electric"] as const;
export type Category = (typeof CATEGORIES)[number];
export type Market = "India" | "International";
export type Availability = "unverified" | "current" | "upcoming" | "discontinued" | "international-only";

export interface Measure {
  value: number;
  unit: string;
}

export interface ModelImage {
  /** Small image (~320px), always present. */
  thumb: string;
  /** Larger official photos (up to two: colour variants / views). May be empty. */
  photos: { src: string; width: number; height: number; label: string; alt: string }[];
  alt: string;
  credit: string;
  /** Page on the official site the image was taken from. */
  sourceUrl: string;
}

export interface Motorcycle {
  /** Database id. Absent for the built-in demo dataset. */
  id?: string;
  slug: string;
  name: string;
  market: Market;
  modelYear: number | null;
  category: Category;
  description: string;
  engineCc: number | null;
  power: Measure | null;
  torque: Measure | null;
  transmission: string | null;
  cooling: string | null;
  kerbWeightKg: number | null;
  seatHeightMm: number | null;
  fuelCapacityL: number | null;
  frontSuspension: string | null;
  rearSuspension: string | null;
  frontBrake: string | null;
  rearBrake: string | null;
  priceInr: number | null;
  availability: Availability;
  features: string[];
  /** Colour options shown on the model page. */
  colors: string[];
  /** Highlighted on the homepage. */
  isFeatured: boolean;
  /** Draft models are visible only to the admin. */
  isPublished: boolean;
  sortOrder: number;
  sourceUrl: string | null;
  lastVerifiedAt: string | null;
  /** "demo" records are illustrative and MUST be verified before production use. */
  dataStatus: "demo" | "verified";
  image: ModelImage | null;
}
