import { NextResponse } from "next/server";
import { listMotorcycles } from "@/lib/motorcycles/repository";
import { catalogueQuerySchema } from "@/lib/validation/catalogue";
import { apiError } from "@/lib/utils/api";

export async function GET(req: Request) {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = catalogueQuerySchema.safeParse(params);
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message]));
    return apiError(400, "INVALID_QUERY", "One or more query parameters are invalid.", fields);
  }
  try {
    // Catalogue data changes rarely: let CDNs and browsers reuse a response briefly.
    return NextResponse.json(await listMotorcycles(parsed.data), { headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" } });
  } catch {
    return apiError(503, "CATALOGUE_UNAVAILABLE", "The catalogue is temporarily unavailable.");
  }
}
