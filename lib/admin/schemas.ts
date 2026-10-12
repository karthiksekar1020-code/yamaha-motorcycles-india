import { z } from "zod";
import { CATEGORIES } from "../../types/motorcycle";

const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
const optText = (max: number) => z.preprocess(blankToNull, z.string().trim().max(max, `Keep it under ${max} characters`).nullable());
const optNumber = (min: number, max: number) => z.preprocess(blankToNull, z.number({ message: "Enter a number" }).finite().min(min, `Minimum ${min}`).max(max, `Maximum ${max}`).nullable());
const optInt = (min: number, max: number) => z.preprocess(blankToNull, z.number({ message: "Enter a whole number" }).int("Enter a whole number").min(min, `Minimum ${min}`).max(max, `Maximum ${max}`).nullable());
const measure = (maxValue: number) => z.preprocess(blankToNull, z.object({ value: z.number().finite().positive().max(maxValue), unit: z.string().trim().min(1).max(10) }).strict().nullable());
const list = (itemMax: number, maxItems: number) => z.array(z.string().trim().min(1).max(itemMax)).max(maxItems);

/** Public URLs in content must be http(s): never javascript:, data: or other schemes. */
const httpUrl = z.preprocess(blankToNull, z.string().trim().max(300).url("Enter a full web address").refine((u) => /^https?:\/\//i.test(u), "Use an http or https address").nullable());

export const motorcycleSchema = z.object({
  slug: z.string().trim().min(2, "At least 2 characters").max(60).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and single hyphens only"),
  name: z.string().trim().min(1, "Enter the model name").max(80),
  market: z.enum(["India", "International"]),
  modelYear: optInt(1990, 2100),
  category: z.enum(CATEGORIES),
  description: z.string().trim().max(2000, "Keep it under 2000 characters"),
  engineCc: optInt(1, 5000),
  power: measure(1000),
  torque: measure(2000),
  transmission: optText(60), cooling: optText(60),
  kerbWeightKg: optNumber(1, 2000), seatHeightMm: optInt(300, 1500), fuelCapacityL: optNumber(0.1, 100),
  frontSuspension: optText(120), rearSuspension: optText(120), frontBrake: optText(120), rearBrake: optText(120),
  priceInr: optNumber(0, 100_000_000),
  availability: z.enum(["unverified", "current", "upcoming", "discontinued", "international-only"]),
  features: list(120, 30),
  colors: list(40, 20),
  sourceUrl: httpUrl,
  lastVerifiedAt: z.preprocess(blankToNull, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").nullable()),
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
  sortOrder: z.number().int().min(-1000).max(1000),
}).strict(); // unknown fields (e.g. "role", "id", "is_admin") are rejected, never ignored silently

export type MotorcycleFormValues = z.infer<typeof motorcycleSchema>;

export const galleryPatchSchema = z.object({
  caption: z.string().trim().max(200).optional(),
  altText: z.string().trim().max(300).optional(),
  isPublished: z.boolean().optional(),
  motorcycleId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().min(-100000).max(100000).optional(),
}).strict().refine((v) => Object.keys(v).length > 0, "Nothing to change");

export const galleryReorderSchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(500) }).strict();

export const loginSchema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254), password: z.string().min(1, "Enter your password").max(200) }).strict();
export const forgotSchema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254) }).strict();
export const resetSchema = z.object({
  password: z.string().min(12, "Use at least 12 characters").max(128, "Use at most 128 characters")
    .refine((p) => /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p), "Include upper-case, lower-case and a number"),
}).strict();
export const changePasswordSchema = resetSchema;
export const mfaCodeSchema = z.object({ code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code") }).strict();
export const mfaEnrollVerifySchema = z.object({ factorId: z.string().uuid(), code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code") }).strict();
export const mfaRemoveSchema = z.object({ factorId: z.string().uuid() }).strict();

export const uuidSchema = z.string().uuid();
export const pageParams = z.object({ page: z.coerce.number().int().min(1).max(10_000).default(1) });
export const PAGE_SIZE = 15;

/** Keeps a search term to harmless characters before it is used in a database filter. */
export const cleanSearch = (q: string | null) => (q ?? "").replace(/[^\p{L}\p{N} -]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 60);
