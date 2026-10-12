import type { Metadata } from "next";
import { ContentEditor, type BlockState } from "@/components/admin/ContentEditor";
import { PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { CONTENT_KEYS, CONTENT_SCHEMAS, DEFAULT_NAVIGATION, DEFAULT_PROMO, HERO_KEYS, HOME_KEYS, type ContentKey } from "@/lib/content/schema";
import { MESSAGES } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "Page content" };
export const dynamic = "force-dynamic";

/** The wording the website uses when nothing has been published: the editor starts from this. */
const fromDict = (keys: Record<string, string>) => Object.fromEntries(Object.entries(keys).map(([field, key]) => [field, MESSAGES.en[key] ?? ""]));
const DEFAULTS: Record<ContentKey, unknown> = { hero: fromDict(HERO_KEYS), home: fromDict(HOME_KEYS), navigation: DEFAULT_NAVIGATION, promo: DEFAULT_PROMO };

export default async function ContentPage() {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase.from("site_content").select("key, status, value");
  if (error) return (<><PageHeader eyebrow="Content" title="Page content" /><p role="alert" className="border border-danger/60 bg-danger/10 p-4 text-sm">Couldn’t load page content. Please refresh and try again.</p></>);

  const blocks = {} as Record<ContentKey, BlockState>;
  for (const key of CONTENT_KEYS) {
    const pick = (status: string) => {
      const row = data?.find((r) => r.key === key && r.status === status);
      const parsed = row ? CONTENT_SCHEMAS[key].safeParse(row.value) : null;
      return parsed?.success ? parsed.data : null;
    };
    blocks[key] = { draft: pick("draft"), published: pick("published"), defaults: DEFAULTS[key] };
  }

  return (
    <>
      <PageHeader eyebrow="Content" title="Page content" />
      <ContentEditor blocks={blocks} />
    </>
  );
}
