import { NextResponse } from "next/server";
import { z } from "zod";
import { searchDealers } from "@/lib/dealers/repository";
import { apiError } from "@/lib/utils/api";

const schema = z.object({ q: z.string().trim().min(2, "Enter a city or 6-digit PIN code").max(40) });

export async function GET(req: Request) {
  const parsed = schema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) return apiError(400, "INVALID_QUERY", parsed.error.issues[0]?.message ?? "Invalid query", { q: parsed.error.issues[0]?.message ?? "Invalid" });
  const result = await searchDealers(parsed.data.q);
  if (result.status === "not-configured") return apiError(503, "DEALER_DATA_NOT_CONFIGURED", "Dealer data source is not configured.");
  if (result.status === "error") return apiError(503, "DEALER_LOOKUP_FAILED", "Dealer lookup failed. Please try again.");
  return NextResponse.json({ dealers: result.dealers });
}
