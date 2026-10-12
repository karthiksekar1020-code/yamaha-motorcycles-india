import "server-only";
import { unstable_cache } from "next/cache";
import { createAnonClient } from "@/lib/supabase/server";
import { CONTENT_KEYS, CONTENT_SCHEMAS, type ContentKey, type ContentValue } from "./schema";

export type PublishedContent = Partial<Record<ContentKey, ContentValue>>;

/**
 * The published copy of each editable block, read with the anonymous key (so drafts are invisible by RLS).
 * Values are re-validated on the way out: anything that does not match the schema is ignored, so a bad row can
 * never break or inject into the public site. Cached for a minute and cleared whenever the admin publishes.
 */
export const getPublishedContent = unstable_cache(async (): Promise<PublishedContent> => {
  const db = createAnonClient();
  if (!db) return {};
  const { data, error } = await db.from("site_content").select("key, value").eq("status", "published");
  if (error || !data) return {};
  const out: PublishedContent = {};
  for (const row of data as { key: string; value: unknown }[]) {
    if (!(CONTENT_KEYS as readonly string[]).includes(row.key)) continue;
    const key = row.key as ContentKey;
    const parsed = CONTENT_SCHEMAS[key].safeParse(row.value);
    if (parsed.success) (out as Record<string, unknown>)[key] = parsed.data;
  }
  return out;
}, ["site-content"], { revalidate: 60, tags: ["content"] });
