import { testRideSchema } from "@/lib/validation/test-ride";
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

  // No database is connected, so requests are not stored. Say so plainly instead of pretending to save.
  const bike = await getMotorcycle(d.motorcycleSlug);
  if (!bike) return apiError(422, "VALIDATION_FAILED", "Please correct the highlighted fields.", { motorcycleSlug: "Choose a listed model" });
  if (d.dealerId && !(await dealerExists(d.dealerId))) return apiError(422, "VALIDATION_FAILED", "Please correct the highlighted fields.", { dealerId: "Choose a listed dealer" });
  return apiError(503, "STORAGE_NOT_AVAILABLE", "Test-ride requests can't be saved because no backend is connected. Nothing was submitted.");
}
