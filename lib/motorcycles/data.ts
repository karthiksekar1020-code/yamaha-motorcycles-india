import type { Motorcycle } from "../../types/motorcycle";

/**
 * DEMO DATASET: illustrative figures compiled for UI development.
 * None of these records are verified against official Yamaha sources:
 * prices are intentionally null, availability is "unverified", and sourceUrl/lastVerifiedAt are empty.
 * India lineup names, engine sizes and categories were cross-checked on 2026-10-09 against a third-party aggregator (bikedekho.com/yamaha-bikes), NOT an official source.
 * Replace with verified records (see README, "Data verification") before production use.
 */
const base = {
  modelYear: null,
  priceInr: null,
  availability: "unverified" as const,
  sourceUrl: null,
  lastVerifiedAt: null,
  dataStatus: "demo" as const,
  image: null,
  colors: [] as string[],
  isFeatured: false,
  isPublished: true,
  sortOrder: 0,
  frontSuspension: null,
  rearSuspension: null,
  frontBrake: null,
  rearBrake: null,
};

const REFERENCE_MODELS: Motorcycle[] = [
  {
    ...base, slug: "r15-v4", name: "R15 V4", market: "India", category: "Supersport",
    description: "Compact liquid-cooled supersport with Variable Valve Actuation, aimed at riders stepping into track-inspired design.",
    engineCc: 155, power: { value: 18.1, unit: "PS" }, torque: { value: 14.2, unit: "Nm" },
    transmission: "6-speed", cooling: "Liquid-cooled", kerbWeightKg: 142, seatHeightMm: 815, fuelCapacityL: 11,
    features: ["Variable Valve Actuation", "Assist & slipper clutch", "Aerodynamic fairing"],
  },
  {
    ...base, slug: "r3", name: "R3", market: "India", category: "Supersport",
    description: "Lightweight twin-cylinder supersport with full-fairing aerodynamics.",
    engineCc: 321, power: { value: 42, unit: "PS" }, torque: { value: 29.5, unit: "Nm" },
    transmission: "6-speed", cooling: "Liquid-cooled", kerbWeightKg: 169, seatHeightMm: 780, fuelCapacityL: 14,
    features: ["Parallel-twin engine", "Full fairing", "Slim chassis"],
  },
  {
    ...base, slug: "r7", name: "R7", market: "India", availability: "upcoming", category: "Supersport",
    description: "Middleweight sportbike built around a torque-rich twin and a sharp, compact chassis.",
    engineCc: 689, power: { value: 73.4, unit: "PS" }, torque: { value: 67, unit: "Nm" },
    transmission: "6-speed", cooling: "Liquid-cooled", kerbWeightKg: 188, seatHeightMm: 835, fuelCapacityL: 13,
    features: ["CP2 twin engine", "Assist & slipper clutch", "Fully adjustable inverted fork"],
  },
  {
    ...base, slug: "r1", name: "R1", market: "International", category: "Supersport",
    description: "Flagship litre-class superbike with a crossplane inline-four and an IMU-based electronics suite.",
    engineCc: 998, power: { value: 200, unit: "PS" }, torque: { value: 113.3, unit: "Nm" },
    transmission: "6-speed", cooling: "Liquid-cooled", kerbWeightKg: 201, seatHeightMm: 855, fuelCapacityL: 17,
    features: ["Crossplane inline-four", "6-axis IMU", "Launch control"],
  },
  {
    ...base, slug: "mt-15-v2", name: "MT-15 V2", market: "India", category: "Street",
    description: "Naked street bike with an upright stance, sharp styling and a rev-happy 155cc engine.",
    engineCc: 155, power: { value: 18.4, unit: "PS" }, torque: { value: 14.1, unit: "Nm" },
    transmission: "6-speed", cooling: "Liquid-cooled", kerbWeightKg: 141, seatHeightMm: 810, fuelCapacityL: 10,
    features: ["Variable Valve Actuation", "LED lighting", "Upside-down fork"],
  },
  {
    ...base, slug: "mt-03", name: "MT-03", market: "India", category: "Street",
    description: "Approachable 321cc naked with aggressive MT styling.",
    engineCc: 321, power: { value: 42, unit: "PS" }, torque: { value: 29.5, unit: "Nm" },
    transmission: "6-speed", cooling: "Liquid-cooled", kerbWeightKg: 168, seatHeightMm: 780, fuelCapacityL: 14,
    features: ["Parallel-twin engine", "LED headlight", "Slim chassis"],
  },
  {
    ...base, slug: "mt-07", name: "MT-07", market: "India", availability: "upcoming", category: "Hyper Naked",
    description: "Torque-rich twin in a light, playful naked chassis.",
    engineCc: 689, power: { value: 73.4, unit: "PS" }, torque: { value: 67, unit: "Nm" },
    transmission: "6-speed", cooling: "Liquid-cooled", kerbWeightKg: 184, seatHeightMm: 805, fuelCapacityL: 14,
    features: ["CP2 twin engine", "Assist & slipper clutch", "Lightweight chassis"],
  },
  {
    ...base, slug: "mt-09", name: "MT-09", market: "India", availability: "upcoming", category: "Hyper Naked",
    description: "Triple-cylinder hyper naked with a powerful, linear delivery and rider-aid electronics.",
    engineCc: 890, power: { value: 119, unit: "PS" }, torque: { value: 93, unit: "Nm" },
    transmission: "6-speed", cooling: "Liquid-cooled", kerbWeightKg: 193, seatHeightMm: 825, fuelCapacityL: 14,
    features: ["CP3 triple engine", "6-axis IMU", "Ride modes"],
  },
  {
    ...base, slug: "tracer-9-gt", name: "Tracer 9 GT", market: "International", category: "Sport Touring",
    description: "Sport-touring machine pairing a triple engine with long-distance comfort features.",
    engineCc: 890, power: { value: 119, unit: "PS" }, torque: { value: 93, unit: "Nm" },
    transmission: "6-speed", cooling: "Liquid-cooled", kerbWeightKg: 220, seatHeightMm: 810, fuelCapacityL: 18,
    features: ["CP3 triple engine", "Cruise control", "Touring ergonomics"],
  },
  {
    ...base, slug: "xsr-155", name: "XSR 155", market: "India", category: "Heritage",
    description: "Retro-roadster styling on a 155cc platform. Detailed specifications are not yet recorded.",
    engineCc: 155, power: null, torque: null,
    transmission: null, cooling: null, kerbWeightKg: null, seatHeightMm: null, fuelCapacityL: null,
    features: [],
  },
  {
    ...base, slug: "fz-s-fi", name: "FZ-S Fi", market: "India", category: "Street",
    description: "Everyday naked street bike with a 149cc engine. Detailed specifications are not yet recorded.",
    engineCc: 149, power: null, torque: null,
    transmission: null, cooling: null, kerbWeightKg: null, seatHeightMm: null, fuelCapacityL: null,
    features: [],
  },
  {
    ...base, slug: "fz-x", name: "FZ-X", market: "India", category: "Street",
    description: "Neo-retro styled 149cc street bike. Detailed specifications are not yet recorded.",
    engineCc: 149, power: null, torque: null,
    transmission: null, cooling: null, kerbWeightKg: null, seatHeightMm: null, fuelCapacityL: null,
    features: [],
  },
  {
    ...base, slug: "aerox-155", name: "Aerox 155", market: "India", category: "Scooter",
    description: "Sporty maxi-scooter with a 155cc engine. Detailed specifications are not yet recorded.",
    engineCc: 155, power: null, torque: null,
    transmission: null, cooling: null, kerbWeightKg: null, seatHeightMm: null, fuelCapacityL: null,
    features: [],
  },
  {
    ...base, slug: "rayzr-125-fi-hybrid", name: "RayZR 125 Fi Hybrid", market: "India", category: "Scooter",
    description: "Youthful 125cc hybrid scooter. Detailed specifications are not yet recorded.",
    engineCc: 125, power: null, torque: null,
    transmission: null, cooling: null, kerbWeightKg: null, seatHeightMm: null, fuelCapacityL: null,
    features: [],
  },
  {
    ...base, slug: "fascino-125-fi-hybrid", name: "Fascino 125 Fi Hybrid", market: "India", category: "Scooter",
    description: "Stylish 125cc hybrid scooter. Detailed specifications are not yet recorded.",
    engineCc: 125, power: null, torque: null,
    transmission: null, cooling: null, kerbWeightKg: null, seatHeightMm: null, fuelCapacityL: null,
    features: [],
  },
  {
    ...base, slug: "r15m", name: "R15M", market: "India", category: "Supersport",
    description: "R-series supersport with a 155cc engine. Detailed specifications are not yet recorded.",
    engineCc: 155, power: null, torque: null,
    transmission: null, cooling: null, kerbWeightKg: null, seatHeightMm: null, fuelCapacityL: null,
    features: [],
  },
  {
    ...base, slug: "r15s", name: "R15S", market: "India", category: "Supersport",
    description: "R-series supersport with a 155cc engine. Detailed specifications are not yet recorded.",
    engineCc: 155, power: null, torque: null,
    transmission: null, cooling: null, kerbWeightKg: null, seatHeightMm: null, fuelCapacityL: null,
    features: [],
  },
  {
    ...base, slug: "yzf-r2", name: "YZF-R2", market: "India", category: "Supersport",
    description: "Listed on the official Yamaha India site as part of the R-series. Detailed specifications are not yet recorded.",
    engineCc: null, power: null, torque: null,
    transmission: null, cooling: null, kerbWeightKg: null, seatHeightMm: null, fuelCapacityL: null,
    features: [],
  },
  {
    ...base, slug: "yzf-r2m", name: "YZF-R2M", market: "India", category: "Supersport",
    description: "Listed on the official Yamaha India site as part of the R-series. Detailed specifications are not yet recorded.",
    engineCc: null, power: null, torque: null,
    transmission: null, cooling: null, kerbWeightKg: null, seatHeightMm: null, fuelCapacityL: null,
    features: [],
  },
  {
    ...base, slug: "fz-fi", name: "FZ-FI", market: "India", category: "Street",
    description: "Everyday naked street bike with a 149cc engine. Detailed specifications are not yet recorded.",
    engineCc: 149, power: null, torque: null,
    transmission: null, cooling: null, kerbWeightKg: null, seatHeightMm: null, fuelCapacityL: null,
    features: [],
  },
  {
    ...base, slug: "fzs-fi-hybrid", name: "FZS-FI Hybrid", market: "India", category: "Street",
    description: "FZ-series street bike with a 149cc engine and hybrid assist. Detailed specifications are not yet recorded.",
    engineCc: 149, power: null, torque: null,
    transmission: null, cooling: null, kerbWeightKg: null, seatHeightMm: null, fuelCapacityL: null,
    features: [],
  },
  {
    ...base, slug: "fzs-fi-v4-dlx", name: "FZS-FI V4 DLX", market: "India", category: "Street",
    description: "FZ-series street bike with a 149cc engine. Detailed specifications are not yet recorded.",
    engineCc: 149, power: null, torque: null,
    transmission: null, cooling: null, kerbWeightKg: null, seatHeightMm: null, fuelCapacityL: null,
    features: [],
  },
  {
    ...base, slug: "fzs-fi-v4", name: "FZS-FI V4", market: "India", category: "Street",
    description: "FZ-series street bike with a 149cc engine. Detailed specifications are not yet recorded.",
    engineCc: 149, power: null, torque: null,
    transmission: null, cooling: null, kerbWeightKg: null, seatHeightMm: null, fuelCapacityL: null,
    features: [],
  },
  {
    ...base, slug: "fz-rave", name: "FZ-RAVE", market: "India", category: "Street",
    description: "FZ-series street bike with a 149cc engine. Detailed specifications are not yet recorded.",
    engineCc: 149, power: null, torque: null,
    transmission: null, cooling: null, kerbWeightKg: null, seatHeightMm: null, fuelCapacityL: null,
    features: [],
  },
  {
    ...base, slug: "fz-flex", name: "FZ Blue Flex", market: "India", category: "Street",
    description: "FZ-series street bike with a 149cc engine. Detailed specifications are not yet recorded.",
    engineCc: 149, power: null, torque: null,
    transmission: null, cooling: null, kerbWeightKg: null, seatHeightMm: null, fuelCapacityL: null,
    features: [],
  },
  {
    ...base, slug: "fzx-hybrid", name: "FZ-X Hybrid", market: "India", category: "Street",
    description: "Neo-retro styled 149cc street bike with hybrid assist. Detailed specifications are not yet recorded.",
    engineCc: 149, power: null, torque: null,
    transmission: null, cooling: null, kerbWeightKg: null, seatHeightMm: null, fuelCapacityL: null,
    features: [],
  },
  {
    ...base, slug: "rayzr-street-rally", name: "RayZR 125 Fi Hybrid Street Rally", market: "India", category: "Scooter",
    description: "Street Rally version of the 125cc hybrid scooter. Detailed specifications are not yet recorded.",
    engineCc: 125, power: null, torque: null,
    transmission: null, cooling: null, kerbWeightKg: null, seatHeightMm: null, fuelCapacityL: null,
    features: [],
  },
  {
    ...base, slug: "aerox-e", name: "Aerox-E", market: "India", category: "Electric",
    description: "Electric maxi-scooter. Detailed specifications are not yet recorded.",
    engineCc: null, power: null, torque: null,
    transmission: null, cooling: null, kerbWeightKg: null, seatHeightMm: null, fuelCapacityL: null,
    features: [],
  },
  {
    ...base, slug: "ec-06", name: "EC-06", market: "India", category: "Electric",
    description: "Electric scooter. Detailed specifications are not yet recorded.",
    engineCc: null, power: null, torque: null,
    transmission: null, cooling: null, kerbWeightKg: null, seatHeightMm: null, fuelCapacityL: null,
    features: [],
  },
];

/**
 * These models are NOT on the official Yamaha India lineup page (yamaha-motor-india.com/yamaha-bikes.html),
 * so they have no official image and are hidden from the site. Remove a slug here to show it again.
 */
const NOT_IN_OFFICIAL_INDIA_LINEUP = new Set(["r3", "r7", "r1", "mt-03", "mt-07", "mt-09", "tracer-9-gt"]);

/**
 * Indicative ex-showroom prices in INR (Delhi), checked 2026-10-09 against THIRD-PARTY listings
 * (bikedekho.com/yamaha-bikes; autocarindia.com for R15M, FZS-FI V4 DLX, RayZR Street Rally; iamabiker.com for
 * FZS-FI Hybrid; bikeadvice.in for YZF-R2M). They are NOT from Yamaha India and change often (city, variant,
 * price revisions), so the site labels them as approximate. R15M and FZS-FI V4 DLX are rounded lakh figures.
 * Replace with official figures before production use.
 */
export const PRICE_CHECKED_ON = "2026-10-09";
const PRICES_INR: Record<string, number> = {
  "fascino-125-fi-hybrid": 78980, "rayzr-125-fi-hybrid": 79880, "rayzr-street-rally": 93930,
  "fz-fi": 116760, "fzs-fi-v4": 119846, "fzs-fi-v4-dlx": 120000, "fz-rave": 125080, "fz-flex": 125480, "fz-x": 125670,
  "fz-s-fi": 130880, "fzs-fi-hybrid": 139200, "fzx-hybrid": 145110, "aerox-155": 145530, "xsr-155": 149990,
  "r15s": 159170, "mt-15-v2": 165610, "ec-06": 171200, "r15-v4": 174850, "r15m": 186000,
  "yzf-r2": 230500, "yzf-r2m": 253000, "aerox-e": 281600,
};

export const DEMO_MOTORCYCLES: Motorcycle[] = REFERENCE_MODELS
  .filter((m) => !NOT_IN_OFFICIAL_INDIA_LINEUP.has(m.slug))
  .map((m) => ({ ...m, priceInr: PRICES_INR[m.slug] ?? m.priceInr }));
