import { NextResponse } from "next/server";
import { adminRoute, audit, readJson, revalidatePublic } from "@/lib/admin/api";
import { HttpError } from "@/lib/admin/errors";
import { PAGE_SIZE, cleanSearch, motorcycleSchema } from "@/lib/admin/schemas";
import { fromRow, toRow, type MotorcycleInput } from "@/lib/motorcycles/mapping";
import { CATEGORIES } from "@/types/motorcycle";

export const dynamic = "force-dynamic";

export const GET = adminRoute(async ({ supabase, req }) => {
  const url = new URL(req.url);
  const q = cleanSearch(url.searchParams.get("q"));
  const status = url.searchParams.get("status");
  const category = url.searchParams.get("category");
  const page = Math.max(1, Math.min(10_000, Number(url.searchParams.get("page")) || 1));

  let query = supabase.from("motorcycles").select("*", { count: "exact" }).order("sort_order", { ascending: true }).order("name", { ascending: true });
  if (q) query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
  if (status === "published") query = query.eq("is_published", true);
  if (status === "draft") query = query.eq("is_published", false);
  if (category && (CATEGORIES as readonly string[]).includes(category)) query = query.eq("category", category);
  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw new HttpError(500, "QUERY_FAILED", "Could not load motorcycles.");
  return { items: (data ?? []).map(fromRow), total: count ?? 0, page, pageSize: PAGE_SIZE };
});

export const POST = adminRoute(async (ctx) => {
  const input = (await readJson(ctx.req, motorcycleSchema)) as MotorcycleInput;
  const { data, error } = await ctx.supabase.from("motorcycles").insert(toRow(input, ctx.user.id)).select("id").single();
  if (error) {
    if (error.code === "23505") throw new HttpError(409, "SLUG_TAKEN", "That web address (slug) is already used by another model.", { slug: "Already in use" });
    throw new HttpError(500, "SAVE_FAILED", "Could not save the motorcycle.");
  }
  await audit(ctx, "motorcycle.create", "motorcycle", data.id as string, { slug: input.slug, published: input.isPublished });
  if (input.isPublished) revalidatePublic("catalogue");
  return NextResponse.json({ id: data.id }, { status: 201, headers: { "Cache-Control": "no-store" } });
});
