import { NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok", database: isDbConfigured() ? "configured" : "not-configured" });
}
