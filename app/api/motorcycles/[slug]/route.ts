import { NextResponse } from "next/server";
import { getMotorcycle } from "@/lib/motorcycles/repository";
import { apiError } from "@/lib/utils/api";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const m = await getMotorcycle(slug);
    return m ? NextResponse.json(m) : apiError(404, "NOT_FOUND", "Motorcycle not found.");
  } catch {
    return apiError(503, "CATALOGUE_UNAVAILABLE", "The catalogue is temporarily unavailable.");
  }
}
