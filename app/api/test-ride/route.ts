import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { testRideSchema, normalizeIndianMobile } from "@/lib/validation/test-ride";
import { getDb } from "@/lib/db/supabase";
import { getMotorcycle } from "@/lib/motorcycles/repository";
import { dealerExists } from "@/lib/dealers/repository";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { apiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8_000;

export async function POST(req: Request) {
  const rl = rateLimit(`test-ride:${clientIp(req)}`, 5, 10 * 60_000);
  if (!rl.ok) return apiError(429, "RATE_LIMITED", "Too many requests. Please try again later.", undefined, { "Retry-After": String(rl.retryAfterSec) });

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return apiError(413, "PAYLOAD_TOO_LARGE", "Request is too large.");
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return apiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsed = testRideSchema.safeParse(body);
  if (!parsed.success) {
    // A filled honeypot is treated as a generic validation failure, giving bots no signal.
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0] ?? "form")] ??= i.message;
    return apiError(422, "VALIDATION_FAILED", "Please correct the highlighted fields.", fields);
  }
  const d = parsed.data;

  const db = getDb();
  if (!db) return apiError(503, "DATABASE_NOT_CONFIGURED", "Test-ride requests can't be saved yet because the database is not configured. Nothing was submitted.");

  try {
    const bike = await getMotorcycle(d.motorcycleSlug);
    if (!bike) return apiError(422, "VALIDATION_FAILED", "Please correct the highlighted fields.", { motorcycleSlug: "Choose a listed model" });
    if (d.dealerId && !(await dealerExists(d.dealerId))) return apiError(422, "VALIDATION_FAILED", "Please correct the highlighted fields.", { dealerId: "Choose a listed dealer" });

    const { data: moto } = await db.from("motorcycles").select("id").eq("slug", bike.slug).maybeSingle();
    const referenceCode = `TR-${randomBytes(4).toString("hex").toUpperCase()}`;
    const { error } = await db.from("test_ride_requests").insert({
      reference_code: referenceCode,
      full_name: d.fullName,
      phone: normalizeIndianMobile(d.mobile),
      email: d.email,
      city: d.city,
      motorcycle_id: moto?.id ?? null,
      motorcycle_slug: bike.slug,
      dealer_id: d.dealerId || null,
      preferred_date: d.preferredDate,
      preferred_time_window: d.preferredTimeWindow,
      status: "pending",
      consent_timestamp: new Date().toISOString(),
    });
    if (error) throw error;
    return NextResponse.json({ referenceCode, status: "pending", message: "Your request has been recorded. This is not a confirmed booking; a representative will contact you." }, { status: 201 });
  } catch (e) {
    console.error("[test-ride] persistence failed:", e instanceof Error ? e.message : "unknown");
    return apiError(500, "SERVER_ERROR", "We couldn't save your request. Please try again.");
  }
}
