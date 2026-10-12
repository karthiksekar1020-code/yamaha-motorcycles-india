// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Runs the real migrations on a real Postgres engine (PGlite) with Supabase-style roles, then tries to read and
 * write every table as an anonymous visitor, an ordinary signed-in user and the owner.
 * Supabase's own pieces (auth.users, auth.uid(), the storage schema, the three API roles) are stubbed minimally.
 */
const MIGRATIONS = join(process.cwd(), "supabase", "migrations");
const sql = (f: string) => readFileSync(join(MIGRATIONS, f), "utf8");

const OWNER = "11111111-1111-4111-8111-111111111111";
const VISITOR = "22222222-2222-4222-8222-222222222222";
const OTHER = "33333333-3333-4333-8333-333333333333";
const PUB_PATH = "gallery/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp";
const DRAFT_PATH = "gallery/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.webp";

const SUPABASE_STUBS = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
  alter table storage.objects enable row level security;
  grant usage on schema public, auth, storage to anon, authenticated, service_role;
  -- Supabase grants API roles full table privileges and relies on RLS: mimic that for everything created after this line.
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  grant all on all tables in schema storage to anon, authenticated, service_role;
  grant all on all tables in schema auth to service_role;
`;

let db: PGlite;

type Role = "anon" | "authenticated";
/** Runs one statement as an API role, the way PostgREST would (role switch + JWT subject). */
async function as(role: Role, uid: string | null, query: string, params: unknown[] = []) {
  await db.exec("begin");
  try {
    await db.exec(`set local role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub', $1, true)", [uid ?? ""]);
    const r = await db.query<Record<string, unknown>>(query, params);
    await db.exec("commit");
    return r;
  } catch (e) {
    await db.exec("rollback");
    throw e;
  }
}
const asAnon = (q: string, p?: unknown[]) => as("anon", null, q, p);
const asVisitor = (q: string, p?: unknown[]) => as("authenticated", VISITOR, q, p);
const asOwner = (q: string, p?: unknown[]) => as("authenticated", OWNER, q, p);
/** Superuser read (bypasses RLS) to confirm what really is in the table. */
const truth = async (q: string, p: unknown[] = []) => (await db.query<Record<string, unknown>>(q, p)).rows;

// No RETURNING on purpose: RETURNING needs SELECT access to the new row, which would hide a missing INSERT check.
const newBike = (slug: string, published = false) =>
  `insert into public.motorcycles (slug, name, market, category, is_published) values ('${slug}', '${slug}', 'India', 'Street', ${published})`;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUBS);
  // pgcrypto is only needed for gen_random_uuid(), which Postgres 13+ ships built in.
  await db.exec(sql("0001_init.sql").replace(/create extension if not exists "pgcrypto";/, ""));
  // A row that existed before the admin migration must stay public afterwards.
  await db.exec(`insert into public.motorcycles (slug, name, market, category) values ('legacy-bike', 'Legacy', 'India', 'Street')`);
  await db.exec(sql("0002_admin_cms.sql"));
  await db.exec(sql("0003_gallery_hidden.sql"));

  await db.exec(`
    insert into auth.users (id, email) values ('${OWNER}', 'owner@example.com'), ('${VISITOR}', 'visitor@example.com'), ('${OTHER}', 'other@example.com');
    insert into public.admin_users (user_id) values ('${OWNER}');
    insert into public.motorcycles (slug, name, market, category, is_published) values ('pub-bike', 'Published', 'India', 'Street', true), ('draft-bike', 'Draft', 'India', 'Street', false);
    insert into public.motorcycle_images (motorcycle_id, image_url, alt_text, license_attribution)
      select id, '/x.webp', 'alt', 'credit' from public.motorcycles where slug in ('pub-bike', 'draft-bike');
    insert into public.gallery_images (storage_path, is_published, width, height, mime_type, size_bytes)
      values ('${PUB_PATH}', true, 800, 600, 'image/webp', 1000), ('${DRAFT_PATH}', false, 800, 600, 'image/webp', 1000);
    insert into public.site_content (key, status, value) values ('hero', 'published', '{"line1":"live"}'), ('hero', 'draft', '{"line1":"secret draft"}');
    insert into storage.objects (bucket_id, name) values ('gallery', '${PUB_PATH}'), ('gallery', '${DRAFT_PATH}');
  `);
}, 60_000);

afterAll(async () => { await db.close(); });

describe("migration", () => {
  it("keeps pre-existing motorcycles published and makes new ones drafts", async () => {
    expect((await truth("select is_published from public.motorcycles where slug = 'legacy-bike'"))[0]!.is_published).toBe(true);
    await db.exec(newBike("fresh-default"));
    expect((await truth("select is_published from public.motorcycles where slug = 'fresh-default'"))[0]!.is_published).toBe(false);
    await db.exec("delete from public.motorcycles where slug = 'fresh-default'");
  });

  it("can be run again without errors or data loss", async () => {
    const before = (await truth("select count(*)::int as n from public.motorcycles"))[0]!.n;
    await db.exec(sql("0002_admin_cms.sql"));
    await db.exec(sql("0002_admin_cms.sql"));
    expect((await truth("select count(*)::int as n from public.motorcycles"))[0]!.n).toBe(before);
    expect((await truth("select count(*)::int as n from public.admin_users"))[0]!.n).toBe(1);
  });

  it("creates the private gallery bucket when Supabase storage exists", async () => {
    const [b] = await truth("select public, allowed_mime_types from storage.buckets where id = 'gallery'");
    expect(b!.public).toBe(false);
    expect(b!.allowed_mime_types).toEqual(["image/webp"]);
  });
});

describe("demo seed", () => {
  it("loads into the new schema and the demo lineup is visible to the public", async () => {
    const before = (await truth("select count(*)::int as n from public.motorcycles"))[0]!.n as number;
    await db.exec(sql("../seed.sql"));
    const after = (await truth("select count(*)::int as n from public.motorcycles"))[0]!.n as number;
    expect(after).toBeGreaterThan(before + 15);
    const hidden = (await truth("select count(*)::int as n from public.motorcycles where slug = 'r15-v4' and is_published = false"))[0]!.n;
    expect(hidden).toBe(0);
    expect((await asAnon("select slug from public.motorcycles where slug = 'r15-v4'")).rows).toHaveLength(1);
  });
});

describe("public visitors (anon)", () => {
  it("see only published motorcycles, never drafts", async () => {
    const slugs = (await asAnon("select slug from public.motorcycles order by slug")).rows.map((r) => r.slug);
    expect(slugs).toContain("pub-bike");
    expect(slugs).toContain("legacy-bike");
    expect(slugs).not.toContain("draft-bike");
  });

  it("cannot insert, update or delete a motorcycle", async () => {
    await expect(asAnon(newBike("anon-made"))).rejects.toThrow();
    await expect(asAnon("update public.motorcycles set name = 'hacked' where slug = 'pub-bike'")).rejects.toThrow();
    await expect(asAnon("delete from public.motorcycles where slug = 'pub-bike'")).rejects.toThrow();
    expect(await truth("select name from public.motorcycles where slug = 'pub-bike'")).toEqual([{ name: "Published" }]);
    expect(await truth("select 1 from public.motorcycles where slug = 'anon-made'")).toEqual([]);
  });

  it("see only published gallery images and cannot change the gallery", async () => {
    const paths = (await asAnon("select storage_path from public.gallery_images")).rows.map((r) => r.storage_path);
    expect(paths).toEqual([PUB_PATH]);
    await expect(asAnon(`insert into public.gallery_images (storage_path, width, height, mime_type, size_bytes) values ('gallery/cccccccc-cccc-4ccc-8ccc-cccccccccccc.webp', 1, 1, 'image/webp', 1)`)).rejects.toThrow();
    await expect(asAnon("update public.gallery_images set is_published = true")).rejects.toThrow();
    await expect(asAnon("delete from public.gallery_images")).rejects.toThrow();
    expect((await truth("select count(*)::int as n from public.gallery_images"))[0]!.n).toBe(2);
  });

  it("see only the published copy of site content and cannot edit it", async () => {
    const rows = (await asAnon("select status, value from public.site_content")).rows;
    expect(rows).toHaveLength(1);
    expect(rows[0]!.status).toBe("published");
    await expect(asAnon(`insert into public.site_content (key, status, value) values ('home', 'published', '{}')`)).rejects.toThrow();
    await expect(asAnon(`update public.site_content set value = '{"line1":"defaced"}'`)).rejects.toThrow();
    await expect(asAnon("delete from public.site_content")).rejects.toThrow();
    expect((await truth("select value from public.site_content where status = 'published'"))[0]!.value).toEqual({ line1: "live" });
  });

  it("cannot read the audit log, the admin list or write to either", async () => {
    await expect(asAnon("select * from public.audit_logs")).rejects.toThrow();
    await expect(asAnon(`insert into public.audit_logs (action) values ('forged')`)).rejects.toThrow();
    await expect(asAnon("select * from public.admin_users")).rejects.toThrow();
    await expect(asAnon(`insert into public.admin_users (user_id) values ('${VISITOR}')`)).rejects.toThrow();
  });

  it("cannot see images of unpublished motorcycles", async () => {
    const rows = (await asAnon("select m.slug from public.motorcycle_images i join public.motorcycles m on m.id = i.motorcycle_id")).rows;
    expect(rows.map((r) => r.slug)).toEqual(["pub-bike"]);
  });

  it("can fetch only published gallery files from storage and cannot upload or delete", async () => {
    const names = (await asAnon("select name from storage.objects where bucket_id = 'gallery'")).rows.map((r) => r.name);
    expect(names).toEqual([PUB_PATH]);
    await expect(asAnon(`insert into storage.objects (bucket_id, name) values ('gallery', 'gallery/dddddddd-dddd-4ddd-8ddd-dddddddddddd.webp')`)).rejects.toThrow();
    await asAnon("delete from storage.objects where bucket_id = 'gallery'");
    expect((await truth("select count(*)::int as n from storage.objects"))[0]!.n).toBe(2);
  });

  it("get false from is_admin()", async () => {
    expect((await asAnon("select public.is_admin() as a")).rows[0]!.a).toBe(false);
  });
});

describe("signed-in users who are not the owner", () => {
  it("have no admin rights and the same read-only view as visitors", async () => {
    expect((await asVisitor("select public.is_admin() as a")).rows[0]!.a).toBe(false);
    const slugs = (await asVisitor("select slug from public.motorcycles")).rows.map((r) => r.slug);
    expect(slugs).not.toContain("draft-bike");
    expect((await asVisitor("select * from public.gallery_images")).rows).toHaveLength(1);
    expect((await asVisitor("select * from public.site_content")).rows).toHaveLength(1);
  });

  it("cannot write motorcycles, gallery, content or storage", async () => {
    await expect(asVisitor(newBike("visitor-made"))).rejects.toThrow();
    await expect(asVisitor("update public.motorcycles set name = 'x'")).resolves.toMatchObject({ affectedRows: 0 });
    await expect(asVisitor("delete from public.motorcycles")).resolves.toMatchObject({ affectedRows: 0 });
    await expect(asVisitor(`insert into public.gallery_images (storage_path, width, height, mime_type, size_bytes) values ('gallery/cccccccc-cccc-4ccc-8ccc-cccccccccccc.webp', 1, 1, 'image/webp', 1)`)).rejects.toThrow();
    await expect(asVisitor(`insert into public.site_content (key, status, value) values ('home', 'published', '{}')`)).rejects.toThrow();
    await expect(asVisitor(`insert into storage.objects (bucket_id, name) values ('gallery', 'gallery/dddddddd-dddd-4ddd-8ddd-dddddddddddd.webp')`)).rejects.toThrow();
    await expect(asVisitor("delete from storage.objects")).resolves.toMatchObject({ affectedRows: 0 });
    expect((await truth("select count(*)::int as n from public.motorcycles where name = 'x'"))[0]!.n).toBe(0);
  });

  it("cannot read the audit log or forge an entry", async () => {
    await expect(asVisitor("select * from public.audit_logs")).resolves.toMatchObject({ rows: [] });
    await expect(asVisitor(`insert into public.audit_logs (actor_id, action) values ('${VISITOR}', 'forged')`)).rejects.toThrow();
  });

  it("cannot make themselves an administrator (no self-assignment, no escalation)", async () => {
    await expect(asVisitor(`insert into public.admin_users (user_id) values ('${VISITOR}')`)).rejects.toThrow();
    await expect(asVisitor(`update public.admin_users set user_id = '${VISITOR}'`)).rejects.toThrow();
    await expect(asVisitor("delete from public.admin_users")).rejects.toThrow();
    expect((await asVisitor("select * from public.admin_users")).rows).toEqual([]); // cannot even see who the owner is
    expect((await truth("select user_id from public.admin_users")).map((r) => r.user_id)).toEqual([OWNER]);
  });
});

describe("the owner", () => {
  it("sees drafts and everything unpublished", async () => {
    expect((await asOwner("select public.is_admin() as a")).rows[0]!.a).toBe(true);
    expect((await asOwner("select slug from public.motorcycles")).rows.map((r) => r.slug)).toContain("draft-bike");
    expect((await asOwner("select * from public.gallery_images")).rows).toHaveLength(2);
    expect((await asOwner("select * from public.site_content")).rows).toHaveLength(2);
    expect((await asOwner("select name from storage.objects")).rows).toHaveLength(2);
  });

  it("can create, edit, publish and delete a motorcycle", async () => {
    await asOwner(newBike("owner-made"));
    await asOwner("update public.motorcycles set name = 'Renamed', is_published = true, is_featured = true where slug = 'owner-made'");
    expect(await truth("select name, is_published, is_featured from public.motorcycles where slug = 'owner-made'")).toEqual([{ name: "Renamed", is_published: true, is_featured: true }]);
    // once published, a visitor sees it
    expect((await asAnon("select slug from public.motorcycles where slug = 'owner-made'")).rows).toHaveLength(1);
    await asOwner("delete from public.motorcycles where slug = 'owner-made'");
    expect(await truth("select 1 from public.motorcycles where slug = 'owner-made'")).toEqual([]);
  });

  it("can manage gallery rows, site content and storage objects", async () => {
    const path = "gallery/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee.webp";
    await asOwner(`insert into storage.objects (bucket_id, name) values ('gallery', '${path}')`);
    await asOwner(`insert into public.gallery_images (storage_path, width, height, mime_type, size_bytes, created_by) values ('${path}', 10, 10, 'image/webp', 10, '${OWNER}')`);
    await asOwner(`update public.gallery_images set is_published = true, caption = 'ok' where storage_path = '${path}'`);
    expect((await asAnon(`select name from storage.objects where name = '${path}'`)).rows).toHaveLength(1);
    await asOwner(`update public.gallery_images set is_published = false where storage_path = '${path}'`);
    expect((await asAnon(`select name from storage.objects where name = '${path}'`)).rows).toHaveLength(0); // unpublishing hides the file too
    await asOwner(`delete from public.gallery_images where storage_path = '${path}'`);
    await asOwner(`delete from storage.objects where name = '${path}'`);
    await asOwner(`insert into public.site_content (key, status, value) values ('home', 'draft', '{"a":1}')`);
    await asOwner(`update public.site_content set value = '{"a":2}' where key = 'home'`);
    await asOwner(`delete from public.site_content where key = 'home'`);
  });

  it("enforces data constraints even for the owner", async () => {
    await expect(asOwner(`insert into public.gallery_images (storage_path, width, height, mime_type, size_bytes) values ('../../etc/passwd', 1, 1, 'image/webp', 1)`)).rejects.toThrow();
    await expect(asOwner(`insert into public.gallery_images (storage_path, width, height, mime_type, size_bytes) values ('gallery/cccccccc-cccc-4ccc-8ccc-cccccccccccc.exe', 1, 1, 'image/webp', 1)`)).rejects.toThrow();
    await expect(asOwner(`insert into public.gallery_images (storage_path, width, height, mime_type, size_bytes) values ('gallery/cccccccc-cccc-4ccc-8ccc-cccccccccccc.webp', 1, 1, 'application/x-msdownload', 1)`)).rejects.toThrow();
    await expect(asOwner(`insert into public.site_content (key, status, value) values ('evil', 'published', '{}')`)).rejects.toThrow();
  });

  it("cannot grant admin rights through the API either (only the service role bootstrap can)", async () => {
    await expect(asOwner(`insert into public.admin_users (user_id) values ('${OTHER}')`)).rejects.toThrow();
    expect((await truth("select count(*)::int as n from public.admin_users"))[0]!.n).toBe(1);
  });
});

describe("hidden built-in photos", () => {
  it("lets everyone read the list but only the owner change it", async () => {
    await asOwner(`insert into public.gallery_hidden (item_id, hidden_by) values ('r15-v4-1', '${OWNER}')`);
    expect((await asAnon("select item_id from public.gallery_hidden")).rows).toEqual([{ item_id: "r15-v4-1" }]);
    expect((await asVisitor("select item_id from public.gallery_hidden")).rows).toHaveLength(1);
    await expect(asAnon(`insert into public.gallery_hidden (item_id) values ('fz-fi-1')`)).rejects.toThrow();
    await expect(asVisitor(`insert into public.gallery_hidden (item_id) values ('fz-fi-1')`)).rejects.toThrow();
    await expect(asAnon("delete from public.gallery_hidden")).rejects.toThrow();
    await expect(asVisitor("delete from public.gallery_hidden")).resolves.toMatchObject({ affectedRows: 0 });
    await expect(asOwner("update public.gallery_hidden set item_id = 'x'")).rejects.toThrow(); // entries cannot be edited
    expect((await truth("select item_id from public.gallery_hidden")).map((r) => r.item_id)).toEqual(["r15-v4-1"]);
  });

  it("rejects ids that are not plain photo ids, and the owner can restore (delete) an entry", async () => {
    for (const bad of ["../etc/passwd", "UPPER", "has space", "", "a".repeat(81)]) {
      await expect(asOwner(`insert into public.gallery_hidden (item_id) values ('${bad}')`)).rejects.toThrow();
    }
    await asOwner("delete from public.gallery_hidden where item_id = 'r15-v4-1'");
    expect(await truth("select 1 from public.gallery_hidden")).toEqual([]);
  });

  it("is attributed to the owner and survives re-running the migration", async () => {
    await asOwner(`insert into public.gallery_hidden (item_id, hidden_by) values ('mt-15-v2-1', '${OWNER}')`);
    await db.exec(sql("0003_gallery_hidden.sql"));
    await db.exec(sql("0003_gallery_hidden.sql"));
    expect((await truth("select hidden_by from public.gallery_hidden where item_id = 'mt-15-v2-1'"))[0]!.hidden_by).toBe(OWNER);
    await db.exec("delete from public.gallery_hidden");
  });
});

describe("audit log", () => {
  it("lets the owner append entries as themselves, and read them", async () => {
    await asOwner(`insert into public.audit_logs (actor_id, action, entity, entity_id, details) values ('${OWNER}', 'motorcycle.create', 'motorcycle', 'x', '{"slug":"x"}')`);
    const rows = (await asOwner("select action, actor_id from public.audit_logs")).rows;
    expect(rows).toEqual([{ action: "motorcycle.create", actor_id: OWNER }]);
  });

  it("rejects entries attributed to someone else", async () => {
    await expect(asOwner(`insert into public.audit_logs (actor_id, action) values ('${OTHER}', 'framed')`)).rejects.toThrow();
    await expect(asOwner(`insert into public.audit_logs (action) values ('no-actor')`)).rejects.toThrow();
  });

  it("is append-only: not even the owner can edit or delete entries", async () => {
    await expect(asOwner("update public.audit_logs set action = 'tampered'")).rejects.toThrow();
    await expect(asOwner("delete from public.audit_logs")).rejects.toThrow();
    await expect(asOwner("truncate public.audit_logs")).rejects.toThrow();
    expect((await truth("select action from public.audit_logs"))[0]!.action).toBe("motorcycle.create");
  });
});
