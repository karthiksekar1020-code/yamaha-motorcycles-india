import { z } from "zod";

export const TIME_WINDOWS = ["morning", "afternoon", "evening"] as const;

/** Normalises an Indian mobile number to 10 digits, or returns null if invalid. */
export function normalizeIndianMobile(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "").replace(/^(\+91|0091|91|0)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date");

export const testRideSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  mobile: z.string().trim().refine((v) => normalizeIndianMobile(v) !== null, "Enter a valid 10-digit Indian mobile number"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(120),
  city: z.string().trim().min(2, "Enter your city").max(60),
  motorcycleSlug: z.string().trim().min(1, "Choose a model").max(60),
  preferredDate: isoDate.refine((d) => {
    const t = new Date(`${d}T00:00:00`).getTime();
    const today = new Date(new Date().toDateString()).getTime();
    return !Number.isNaN(t) && t >= today && t <= today + 120 * 86400000;
  }, "Choose a date within the next 120 days"),
  preferredTimeWindow: z.enum(TIME_WINDOWS, { message: "Choose a time window" }),
  dealerId: z.string().uuid().optional().or(z.literal("")),
  consent: z.boolean().refine((v) => v === true, "Please accept the privacy notice to continue"),
  /** Honeypot: real users never see or fill this field. */
  website: z.string().max(0).optional(),
});

export type TestRideInput = z.infer<typeof testRideSchema>;
