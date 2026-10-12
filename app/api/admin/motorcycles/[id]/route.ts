import { z } from "zod";
import { adminRoute, audit, readJson, revalidatePublic } from "@/lib/admin/api";
import { HttpError, notFound } from "@/lib/admin/errors";
import { motorcycleSchema, uuidSchema } from "@/lib/admin/schemas";
import { fromRow, toRow, type MotorcycleInput } from "@/lib/motorcycles/mapping";

export const dynamic = "force-dynamic";
type P = { id: string };

const idOf = (p: P) => {
  const parsed = uuidSchema.safeParse(p.id);
  if (!parsed.success) throw notFound("Motorcycle");
  return parsed.data;
};

export const GET = adminRoute<P>(async ({ supabase, params }) => {
  const { data, error } = await supabase.from("motorcycles").select("*").eq("id", idOf(params)).maybeSingle();
  if (error) throw new HttpError(500, "QUERY_FAILED", "Could not load the motorcycle.");
  if (!data) throw notFound("Motorcycle");
  return fromRow(data);
});

async function update(ctx: Parameters<Parameters<typeof adminRoute<P>>[0]>[0]) {
  const id = idOf(ctx.params);
  const input = (await readJson(ctx.req, motorcycleSchema)) as MotorcycleInput;
  const { data: before } = await ctx.supabase.from("motorcycles").select("is_published").eq("id", id).maybeSingle();
  if (!before) throw notFound("Motorcycle");

  const { data, error } = await ctx.supabase.from("motorcycles").update(toRow(input, ctx.user.id)).eq("id", id).select("id");
  if (error) {
    if (error.code === "23505") throw new HttpError(409, "SLUG_TAKEN", "That web address (slug) is already used by another model.", { slug: "Already in use" });
    throw new HttpError(500, "SAVE_FAILED", "Could not save the motorcycle.");
  }
  if (!data?.length) throw new HttpError(403, "FORBIDDEN", "You do not have permission to do this."); // RLS filtered the row out

  const wasPublished = before.is_published === true;
  await audit(ctx, wasPublished === input.isPublished ? "motorcycle.update" : input.isPublished ? "motorcycle.publish" : "motorcycle.unpublish", "motorcycle", id, { slug: input.slug });
  revalidatePublic("catalogue");
  return { ok: true };
}
export const PUT = adminRoute<P>(update);
export const PATCH = adminRoute<P>(update);

/** Deleting needs the model's slug typed back in the request body, so a stray call cannot remove anything. */
export const DELETE = adminRoute<P>(async (ctx) => {
  const id = idOf(ctx.params);
  const { confirm } = await readJson(ctx.req, z.object({ confirm: z.string().max(80) }).strict(), 1_000);
  const { data: row } = await ctx.supabase.from("motorcycles").select("slug").eq("id", id).maybeSingle();
  if (!row) throw notFound("Motorcycle");
  if (confirm !== row.slug) throw new HttpError(422, "CONFIRMATION_REQUIRED", "Type the model's slug to confirm deletion.", { confirm: "Does not match" });

  const { data, error } = await ctx.supabase.from("motorcycles").delete().eq("id", id).select("id");
  if (error) throw new HttpError(500, "DELETE_FAILED", "Could not delete the motorcycle.");
  if (!data?.length) throw new HttpError(403, "FORBIDDEN", "You do not have permission to do this.");
  await audit(ctx, "motorcycle.delete", "motorcycle", id, { slug: row.slug as string });
  revalidatePublic("catalogue", "gallery");
  return { ok: true };
});
