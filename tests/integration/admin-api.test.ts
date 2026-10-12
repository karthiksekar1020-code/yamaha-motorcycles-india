// @vitest-environment node
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FakeBackend, Session } from "../helpers/fake-supabase";

const state = vi.hoisted(() => ({ be: null as unknown as FakeBackend, session: null as unknown as Session }));

vi.mock("@/lib/supabase/server", async () => {
  const { makeClient } = await import("../helpers/fake-supabase");
  return {
    createUserClient: async () => makeClient(state.be, state.session),
    createAnonClient: () => makeClient(state.be, { userId: null, aal: "aal1" }),
  };
});
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), unstable_cache: (fn: unknown) => fn }));
vi.mock("next/navigation", () => ({ redirect: (to: string) => { throw new Error(`REDIRECT:${to}`); } }));

import { newBackend, seedUsers } from "../helpers/fake-supabase";
import { __resetRateLimit } from "@/lib/security/rate-limit";
import * as motos from "@/app/api/admin/motorcycles/route";
import * as moto from "@/app/api/admin/motorcycles/[id]/route";
import * as gallery from "@/app/api/admin/gallery/route";
import * as photo from "@/app/api/admin/gallery/[id]/route";
import * as photoFile from "@/app/api/admin/gallery/[id]/file/route";
import * as reorder from "@/app/api/admin/gallery/reorder/route";
import * as hide from "@/app/api/admin/gallery/hide/route";
import { getGalleryItems } from "@/lib/gallery-server";
import { GALLERY } from "@/lib/gallery";
import * as content from "@/app/api/admin/content/[key]/route";
import * as publish from "@/app/api/admin/content/[key]/publish/route";
import * as mfaManage from "@/app/api/admin/mfa/route";
import * as login from "@/app/api/admin/auth/login/route";
import * as logout from "@/app/api/admin/auth/logout/route";
import * as forgot from "@/app/api/admin/auth/forgot/route";
import * as reset from "@/app/api/admin/auth/reset/route";
import * as mfaLogin from "@/app/api/admin/auth/mfa/route";
import * as media from "@/app/media/[id]/route";
import { requireAdmin } from "@/lib/admin/auth";

const ORIGIN = "http://localhost:3000";
const ID = "00000000-0000-4000-8000-0000000000aa";
const BIKE = {
  slug: "test-bike", name: "Test Bike", market: "India", modelYear: 2026, category: "Street", description: "A test model.", engineCc: 155,
  power: { value: 18, unit: "PS" }, torque: null, transmission: "6-speed", cooling: null, kerbWeightKg: 140, seatHeightMm: 800, fuelCapacityL: 10,
  frontSuspension: null, rearSuspension: null, frontBrake: null, rearBrake: null, priceInr: 150000, availability: "current",
  features: ["ABS"], colors: ["Blue"], sourceUrl: null, lastVerifiedAt: null, isFeatured: true, isPublished: false, sortOrder: 0,
};

type Init = { json?: unknown; form?: FormData; origin?: string | null };
const call = (handler: (req: Request, ctx: never) => Promise<Response>, method: string, path: string, init: Init = {}, params?: Record<string, string>) => {
  const headers: Record<string, string> = { host: "localhost:3000" };
  if (init.origin !== null) headers.origin = init.origin ?? ORIGIN;
  if (init.json !== undefined) headers["content-type"] = "application/json";
  const req = new Request(`${ORIGIN}${path}`, { method, headers, body: init.form ?? (init.json !== undefined ? JSON.stringify(init.json) : undefined) });
  return handler(req, (params ? { params: Promise.resolve(params) } : undefined) as never);
};
const body = async (r: Response) => (await r.json()) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const png = (w = 640, h = 480) => sharp({ create: { width: w, height: h, channels: 3, background: { r: 10, g: 80, b: 200 } } }).png().toBuffer();
const upload = async (...files: Array<[string, Uint8Array | Buffer, string?]>) => {
  const f = new FormData();
  for (const [name, data, type] of files) f.append("files", new File([data as BlobPart], name, { type: type ?? "image/png" }));
  return f;
};

const as = (who: "anonymous" | "visitor" | "owner", extra: Partial<Session> = {}) => {
  state.session = { userId: who === "anonymous" ? null : state.be.users[who]!.id, aal: "aal2", ...extra };
};

beforeEach(() => {
  process.env.SUPABASE_URL = "http://localhost:54321";
  process.env.SUPABASE_ANON_KEY = "anon-test-key";
  state.be = seedUsers(newBackend());
  as("anonymous");
  __resetRateLimit();
});

/** Every protected endpoint, with a plausible request, so the same attacks can be run against all of them. */
const PROTECTED: Array<[string, () => Promise<Response>]> = [
  ["GET /api/admin/motorcycles", () => call(motos.GET, "GET", "/api/admin/motorcycles")],
  ["POST /api/admin/motorcycles", () => call(motos.POST, "POST", "/api/admin/motorcycles", { json: BIKE })],
  ["GET /api/admin/motorcycles/:id", () => call(moto.GET, "GET", `/api/admin/motorcycles/${ID}`, {}, { id: ID })],
  ["PUT /api/admin/motorcycles/:id", () => call(moto.PUT, "PUT", `/api/admin/motorcycles/${ID}`, { json: BIKE }, { id: ID })],
  ["PATCH /api/admin/motorcycles/:id", () => call(moto.PATCH, "PATCH", `/api/admin/motorcycles/${ID}`, { json: BIKE }, { id: ID })],
  ["DELETE /api/admin/motorcycles/:id", () => call(moto.DELETE, "DELETE", `/api/admin/motorcycles/${ID}`, { json: { confirm: "x" } }, { id: ID })],
  ["GET /api/admin/gallery", () => call(gallery.GET, "GET", "/api/admin/gallery")],
  ["POST /api/admin/gallery", async () => call(gallery.POST, "POST", "/api/admin/gallery", { form: await upload(["a.png", await png()]) })],
  ["PATCH /api/admin/gallery/:id", () => call(photo.PATCH, "PATCH", `/api/admin/gallery/${ID}`, { json: { isPublished: true } }, { id: ID })],
  ["PUT /api/admin/gallery/:id", async () => call(photo.PUT, "PUT", `/api/admin/gallery/${ID}`, { form: await upload(["a.png", await png()]) }, { id: ID })],
  ["DELETE /api/admin/gallery/:id", () => call(photo.DELETE, "DELETE", `/api/admin/gallery/${ID}`, {}, { id: ID })],
  ["GET /api/admin/gallery/:id/file", () => call(photoFile.GET, "GET", `/api/admin/gallery/${ID}/file`, {}, { id: ID })],
  ["POST /api/admin/gallery/reorder", () => call(reorder.POST, "POST", "/api/admin/gallery/reorder", { json: { ids: [ID] } })],
  ["POST /api/admin/gallery/hide", () => call(hide.POST, "POST", "/api/admin/gallery/hide", { json: { itemId: "r15-v4-1" } })],
  ["DELETE /api/admin/gallery/hide", () => call(hide.DELETE, "DELETE", "/api/admin/gallery/hide", { json: { itemId: "r15-v4-1" } })],
  ["GET /api/admin/content/:key", () => call(content.GET, "GET", "/api/admin/content/hero", {}, { key: "hero" })],
  ["PUT /api/admin/content/:key", () => call(content.PUT, "PUT", "/api/admin/content/promo", { json: { enabled: false, text: "", linkLabel: "", linkHref: null } }, { key: "promo" })],
  ["DELETE /api/admin/content/:key", () => call(content.DELETE, "DELETE", "/api/admin/content/hero", {}, { key: "hero" })],
  ["POST /api/admin/content/:key/publish", () => call(publish.POST, "POST", "/api/admin/content/hero/publish", {}, { key: "hero" })],
  ["DELETE /api/admin/content/:key/publish", () => call(publish.DELETE, "DELETE", "/api/admin/content/hero/publish", {}, { key: "hero" })],
  ["POST /api/admin/mfa", () => call(mfaManage.POST, "POST", "/api/admin/mfa", {})],
  ["PUT /api/admin/mfa", () => call(mfaManage.PUT, "PUT", "/api/admin/mfa", { json: { factorId: ID, code: "123456" } })],
  ["DELETE /api/admin/mfa", () => call(mfaManage.DELETE, "DELETE", "/api/admin/mfa", { json: { factorId: ID } })],
];

const untouched = () => {
  expect(state.be.tables.motorcycles).toEqual([]);
  expect(state.be.tables.gallery_images).toEqual([]);
  expect(state.be.tables.site_content).toEqual([]);
  expect(state.be.tables.gallery_hidden).toEqual([]);
  expect(state.be.tables.audit_logs).toEqual([]);
  expect(state.be.storage.size).toBe(0);
};

describe("every protected endpoint (direct API calls, no frontend involved)", () => {
  it.each(PROTECTED)("%s answers 401 to an anonymous caller and changes nothing", async (_n, run) => {
    as("anonymous");
    const res = await run();
    expect(res.status).toBe(401);
    expect((await body(res)).error.code).toBe("UNAUTHENTICATED");
    untouched();
  });

  it.each(PROTECTED)("%s answers 403 to a signed-in user who is not the owner and changes nothing", async (_n, run) => {
    as("visitor");
    const res = await run();
    expect(res.status).toBe(403);
    expect((await body(res)).error.code).toBe("FORBIDDEN");
    untouched();
  });

  it.each(PROTECTED)("%s answers 401 when the session has expired", async (_n, run) => {
    as("owner", { expired: true });
    expect((await run()).status).toBe(401);
    untouched();
  });

  it("covers every admin API route file (a new route cannot be forgotten)", () => {
    const root = join(process.cwd(), "app", "api", "admin");
    const routes: string[] = [];
    const walk = (dir: string) => { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p); else if (f === "route.ts") routes.push(p.slice(root.length + 1).replace(/\\/g, "/")); } };
    walk(root);
    const gated = new Set(PROTECTED.map(([n]) => n.split(" ")[1]));
    const publicAuth = new Set(["auth/login/route.ts", "auth/logout/route.ts", "auth/forgot/route.ts", "auth/reset/route.ts", "auth/mfa/route.ts"]); // tested separately below
    const unexpected = routes.filter((r) => !publicAuth.has(r)).filter((r) => {
      const url = "/api/admin/" + r.replace(/\/route\.ts$/, "").replace(/\[id\]/g, ":id").replace(/\[key\]/g, ":key");
      return ![...gated].includes(url);
    });
    expect(unexpected).toEqual([]);
  });
});

describe("a session that needs the second sign-in step", () => {
  it("is refused (401 MFA_REQUIRED) until the authenticator code is verified", async () => {
    state.be.users.owner!.mfa = true;
    as("owner", { aal: "aal1" });
    const res = await call(motos.GET, "GET", "/api/admin/motorcycles");
    expect(res.status).toBe(401);
    expect((await body(res)).error.code).toBe("MFA_REQUIRED");

    const bad = await call(mfaLogin.POST, "POST", "/api/admin/auth/mfa", { json: { code: "000000" } });
    expect(bad.status).toBe(401);
    expect((await call(motos.GET, "GET", "/api/admin/motorcycles")).status).toBe(401);

    const ok = await call(mfaLogin.POST, "POST", "/api/admin/auth/mfa", { json: { code: "123456" } });
    expect(ok.status).toBe(200);
    expect((await call(motos.GET, "GET", "/api/admin/motorcycles")).status).toBe(200);
  });

  it("limits code guessing", async () => {
    state.be.users.owner!.mfa = true;
    as("owner", { aal: "aal1" });
    const codes = Array.from({ length: 9 }, (_, i) => String(100000 + i));
    const statuses: number[] = [];
    for (const c of codes) statuses.push((await call(mfaLogin.POST, "POST", "/api/admin/auth/mfa", { json: { code: c } })).status);
    expect(statuses.slice(0, 8).every((s) => s === 401)).toBe(true);
    expect(statuses[8]).toBe(429);
  });
});

describe("request forgery and tampering", () => {
  it("rejects a state-changing request that does not come from this site (CSRF), even with a valid owner session", async () => {
    as("owner");
    for (const origin of ["https://evil.example", null as null]) {
      const res = await call(motos.POST, "POST", "/api/admin/motorcycles", { json: BIKE, origin });
      expect(res.status).toBe(403);
    }
    expect(state.be.tables.motorcycles).toEqual([]);
  });

  it("never reads role or ownership from the request: extra fields are rejected, not obeyed", async () => {
    as("owner");
    for (const extra of [{ role: "owner" }, { is_admin: true }, { id: ID }, { user_id: ID }, { updatedBy: ID }]) {
      const res = await call(motos.POST, "POST", "/api/admin/motorcycles", { json: { ...BIKE, ...extra } });
      expect(res.status).toBe(422);
    }
    expect(state.be.tables.motorcycles).toEqual([]);
    expect(state.be.tables.admin_users).toHaveLength(1);
  });

  it("a visitor cannot promote themselves by any API", async () => {
    as("visitor");
    const res = await call(motos.POST, "POST", "/api/admin/motorcycles", { json: { ...BIKE, role: "owner" } });
    expect(res.status).toBe(403);
    expect(state.be.tables.admin_users).toEqual([{ user_id: state.be.users.owner!.id, role: "owner" }]);
    expect((await call(motos.GET, "GET", "/api/admin/motorcycles")).status).toBe(403); // still not an admin afterwards
  });

  it("requireAdmin() fails closed when the backend is not configured", async () => {
    delete process.env.SUPABASE_ANON_KEY;
    await expect(requireAdmin()).rejects.toMatchObject({ status: 503 });
  });
});

describe("the owner: motorcycles", () => {
  beforeEach(() => as("owner"));

  it("creates, lists, edits, publishes, unpublishes and deletes (with typed confirmation), leaving an audit trail", async () => {
    const created = await call(motos.POST, "POST", "/api/admin/motorcycles", { json: BIKE });
    expect(created.status).toBe(201);
    const { id } = await body(created);
    expect(state.be.tables.motorcycles[0]).toMatchObject({ slug: "test-bike", is_published: false, is_featured: true, colors: ["Blue"], price_amount: 150000, price_currency: "INR", power_value: 18 });

    const list = await body(await call(motos.GET, "GET", "/api/admin/motorcycles"));
    expect(list.items.map((m: { slug: string }) => m.slug)).toEqual(["test-bike"]);

    expect((await call(moto.PUT, "PUT", `/api/admin/motorcycles/${id}`, { json: { ...BIKE, name: "Renamed", isPublished: true } }, { id })).status).toBe(200);
    expect(state.be.tables.motorcycles[0]).toMatchObject({ name: "Renamed", is_published: true });
    expect((await call(moto.PUT, "PUT", `/api/admin/motorcycles/${id}`, { json: { ...BIKE, isPublished: false } }, { id })).status).toBe(200);

    // wrong confirmation is refused, the right one deletes
    expect((await call(moto.DELETE, "DELETE", `/api/admin/motorcycles/${id}`, { json: { confirm: "nope" } }, { id })).status).toBe(422);
    expect(state.be.tables.motorcycles).toHaveLength(1);
    expect((await call(moto.DELETE, "DELETE", `/api/admin/motorcycles/${id}`, { json: { confirm: "test-bike" } }, { id })).status).toBe(200);
    expect(state.be.tables.motorcycles).toEqual([]);

    const actions = state.be.tables.audit_logs.map((r) => r.action);
    expect(actions).toEqual(["motorcycle.create", "motorcycle.publish", "motorcycle.unpublish", "motorcycle.delete"]);
    for (const row of state.be.tables.audit_logs) expect(row.actor_id).toBe(state.be.users.owner!.id);
  });

  it("rejects a duplicate slug with 409", async () => {
    await call(motos.POST, "POST", "/api/admin/motorcycles", { json: BIKE });
    const res = await call(motos.POST, "POST", "/api/admin/motorcycles", { json: BIKE });
    expect(res.status).toBe(409);
    expect((await body(res)).error.fields.slug).toBeTruthy();
  });

  it("validates input on the server and reports each field", async () => {
    const res = await call(motos.POST, "POST", "/api/admin/motorcycles", { json: { ...BIKE, slug: "Bad Slug!", name: "", engineCc: -5, sourceUrl: "javascript:alert(1)", category: "Hovercraft", features: Array(40).fill("x") } });
    expect(res.status).toBe(422);
    const fields = (await body(res)).error.fields;
    expect(Object.keys(fields).sort()).toEqual(["category", "engineCc", "features", "name", "slug", "sourceUrl"]);
    expect(state.be.tables.motorcycles).toEqual([]);
  });

  it("stores script-looking text as inert text (output encoding is React's job; nothing is executed or stripped silently)", async () => {
    const res = await call(motos.POST, "POST", "/api/admin/motorcycles", { json: { ...BIKE, name: "<img src=x onerror=alert(1)>", description: "<script>alert(1)</script>" } });
    expect(res.status).toBe(201);
    expect(state.be.tables.motorcycles[0]!.name).toBe("<img src=x onerror=alert(1)>");
  });

  it("search input cannot break out of the database filter", async () => {
    for (const q of ["a,id.eq.1", "x%) or (true", "'; drop table motorcycles;--"]) {
      expect((await call(motos.GET, "GET", `/api/admin/motorcycles?q=${encodeURIComponent(q)}`)).status).toBe(200);
    }
  });

  it("answers 404 for ids that are not valid UUIDs", async () => {
    expect((await call(moto.GET, "GET", "/api/admin/motorcycles/not-a-uuid", {}, { id: "not-a-uuid" })).status).toBe(404);
  });

  it("does not put secrets in the audit log", async () => {
    await call(motos.POST, "POST", "/api/admin/motorcycles", { json: BIKE });
    expect(JSON.stringify(state.be.tables.audit_logs)).not.toMatch(/password|token|secret|cookie/i);
  });
});

describe("the owner: photos", () => {
  beforeEach(() => as("owner"));

  it("uploads a real image as an unpublished, clean WebP under a generated name", async () => {
    const res = await call(gallery.POST, "POST", "/api/admin/gallery", { form: await upload(["../../evil name.png", await png(800, 600)]) });
    expect(res.status).toBe(201);
    const { results } = await body(res);
    expect(results).toEqual([expect.objectContaining({ ok: true })]);
    const row = state.be.tables.gallery_images[0]!;
    expect(row).toMatchObject({ is_published: false, mime_type: "image/webp", width: 800, height: 600, created_by: state.be.users.owner!.id });
    expect(row.storage_path).toMatch(/^gallery\/[0-9a-f-]{36}\.webp$/); // nothing from the user's file name reaches the path
    expect(state.be.storage.has(`gallery/${row.storage_path}`)).toBe(true);
    expect(state.be.tables.audit_logs.map((r) => r.action)).toEqual(["gallery.upload"]);
  });

  it("rejects disguised, malicious, empty and oversized uploads, storing nothing", async () => {
    const exe = Buffer.from("MZ\x90\x00 pretend photo");
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const php = Buffer.from("<?php system($_GET['c']); ?>");
    const res = await call(gallery.POST, "POST", "/api/admin/gallery", { form: await upload(["photo.jpg", exe, "image/jpeg"], ["pic.png", svg, "image/png"], ["shell.png", php, "image/png"], ["empty.png", Buffer.alloc(0)]) });
    expect(res.status).toBe(422);
    const { results } = await body(res);
    expect(results.every((r: { ok: boolean }) => !r.ok)).toBe(true);
    expect(state.be.tables.gallery_images).toEqual([]);
    expect(state.be.storage.size).toBe(0);
  });

  it("keeps the good files and reports the bad one when a batch is mixed", async () => {
    const res = await call(gallery.POST, "POST", "/api/admin/gallery", { form: await upload(["ok.png", await png()], ["bad.png", Buffer.from("not an image")]) });
    expect(res.status).toBe(201);
    const { results } = await body(res);
    expect(results.map((r: { ok: boolean }) => r.ok)).toEqual([true, false]);
    expect(state.be.tables.gallery_images).toHaveLength(1);
  });

  it("refuses too many files and a request with no files", async () => {
    const many = await upload(...Array.from({ length: 11 }, (_, i) => [`f${i}.png`, Buffer.from("x")] as [string, Buffer]));
    expect((await call(gallery.POST, "POST", "/api/admin/gallery", { form: many })).status).toBe(422);
    expect((await call(gallery.POST, "POST", "/api/admin/gallery", { form: new FormData() })).status).toBe(422);
  });

  it("edits metadata, publishes, reorders, replaces the picture and deletes it with its file", async () => {
    await call(gallery.POST, "POST", "/api/admin/gallery", { form: await upload(["a.png", await png()], ["b.png", await png(500, 400)]) });
    const [a, b] = state.be.tables.gallery_images as Array<Record<string, string>>;

    expect((await call(photo.PATCH, "PATCH", `/api/admin/gallery/${a!.id}`, { json: { caption: "Front view", altText: "A blue bike", isPublished: true } }, { id: a!.id! })).status).toBe(200);
    expect(a).toMatchObject({ caption: "Front view", alt_text: "A blue bike", is_published: true });
    expect((await call(photo.PATCH, "PATCH", `/api/admin/gallery/${a!.id}`, { json: {} }, { id: a!.id! })).status).toBe(422);
    expect((await call(photo.PATCH, "PATCH", `/api/admin/gallery/${a!.id}`, { json: { storage_path: "gallery/x.webp" } }, { id: a!.id! })).status).toBe(422);

    expect((await call(reorder.POST, "POST", "/api/admin/gallery/reorder", { json: { ids: [b!.id, a!.id] } })).status).toBe(200);
    expect([b!.sort_order, a!.sort_order]).toEqual([10, 20]);

    const oldPath = a!.storage_path!;
    expect((await call(photo.PUT, "PUT", `/api/admin/gallery/${a!.id}`, { form: (() => { const f = new FormData(); return upload(["new.png", Buffer.alloc(0)]).then(() => f); })() as never }, { id: a!.id! })).status).toBeGreaterThanOrEqual(400);
    const f = new FormData();
    f.append("file", new File([await png(700, 500)], "new.png", { type: "image/png" }));
    expect((await call(photo.PUT, "PUT", `/api/admin/gallery/${a!.id}`, { form: f }, { id: a!.id! })).status).toBe(200);
    expect(a!.storage_path).not.toBe(oldPath);
    expect(state.be.storage.has(`gallery/${oldPath}`)).toBe(false); // old file removed
    expect(state.be.storage.has(`gallery/${a!.storage_path}`)).toBe(true);

    const pathB = b!.storage_path!;
    expect((await call(photo.DELETE, "DELETE", `/api/admin/gallery/${b!.id}`, {}, { id: b!.id! })).status).toBe(200);
    expect(state.be.storage.has(`gallery/${pathB}`)).toBe(false);
    expect(state.be.tables.gallery_images).toHaveLength(1);
    expect(state.be.tables.audit_logs.map((r) => r.action)).toEqual(expect.arrayContaining(["gallery.upload", "gallery.publish", "gallery.reorder", "gallery.replace", "gallery.delete"]));
  });

  it("previews an unpublished photo for the owner only", async () => {
    await call(gallery.POST, "POST", "/api/admin/gallery", { form: await upload(["a.png", await png()]) });
    const id = state.be.tables.gallery_images[0]!.id as string;
    expect((await call(photoFile.GET, "GET", `/api/admin/gallery/${id}/file`, {}, { id })).status).toBe(200);
    as("visitor");
    expect((await call(photoFile.GET, "GET", `/api/admin/gallery/${id}/file`, {}, { id })).status).toBe(403);
  });
});

describe("removing photos from the public gallery", () => {
  const FIRST = GALLERY[0]!.id;
  const ids = async () => (await getGalleryItems()).map((g) => g.id);

  it("hides a built-in photo for everyone, records who did it, and restoring brings it back", async () => {
    expect(await ids()).toContain(FIRST);
    as("owner");
    expect((await call(hide.POST, "POST", "/api/admin/gallery/hide", { json: { itemId: FIRST } })).status).toBe(200);
    expect(state.be.tables.gallery_hidden).toEqual([expect.objectContaining({ item_id: FIRST, hidden_by: state.be.users.owner!.id })]);

    as("anonymous"); // a visitor now gets a gallery without that photo, and every other built-in photo is untouched
    const after = await ids();
    expect(after).not.toContain(FIRST);
    expect(after).toHaveLength(GALLERY.length - 1);

    as("owner");
    expect((await call(hide.DELETE, "DELETE", "/api/admin/gallery/hide", { json: { itemId: FIRST } })).status).toBe(200);
    as("anonymous");
    expect(await ids()).toContain(FIRST);
    expect(state.be.tables.audit_logs.map((r) => r.action)).toEqual(["gallery.hide_builtin", "gallery.restore_builtin"]);
  });

  it("is harmless to hide the same photo twice", async () => {
    as("owner");
    for (let i = 0; i < 2; i++) expect((await call(hide.POST, "POST", "/api/admin/gallery/hide", { json: { itemId: FIRST } })).status).toBe(200);
    expect(state.be.tables.gallery_hidden).toHaveLength(1);
  });

  it("only accepts real built-in photo ids and nothing else in the body", async () => {
    as("owner");
    for (const itemId of ["nope", "../../etc/passwd", "upload-00000000-0000-4000-8000-0000000000aa", "R15-V4-1", ""]) {
      expect([404, 422], itemId).toContain((await call(hide.POST, "POST", "/api/admin/gallery/hide", { json: { itemId } })).status);
    }
    expect((await call(hide.POST, "POST", "/api/admin/gallery/hide", { json: { itemId: FIRST, role: "owner" } })).status).toBe(422);
    expect((await call(hide.POST, "POST", "/api/admin/gallery/hide", {})).status).toBe(400);
    expect(state.be.tables.gallery_hidden).toEqual([]);
  });

  it("a visitor who is not the owner cannot hide or restore anything, and the gallery is unchanged", async () => {
    as("owner");
    await call(hide.POST, "POST", "/api/admin/gallery/hide", { json: { itemId: FIRST } });
    as("visitor");
    expect((await call(hide.POST, "POST", "/api/admin/gallery/hide", { json: { itemId: GALLERY[1]!.id } })).status).toBe(403);
    expect((await call(hide.DELETE, "DELETE", "/api/admin/gallery/hide", { json: { itemId: FIRST } })).status).toBe(403);
    expect(state.be.tables.gallery_hidden.map((r) => r.item_id)).toEqual([FIRST]);
  });

  it("removing an uploaded photo deletes the row and its file, so it disappears from the public gallery", async () => {
    as("owner");
    await call(gallery.POST, "POST", "/api/admin/gallery", { form: await upload(["mine.png", await png()]) });
    const row = state.be.tables.gallery_images[0]!;
    await call(photo.PATCH, "PATCH", `/api/admin/gallery/${row.id}`, { json: { isPublished: true, caption: "Mine" } }, { id: row.id as string });
    as("anonymous");
    expect(await ids()).toContain(`upload-${row.id}`);
    as("owner");
    expect((await call(photo.DELETE, "DELETE", `/api/admin/gallery/${row.id}`, {}, { id: row.id as string })).status).toBe(200);
    expect(state.be.storage.size).toBe(0);
    as("anonymous");
    expect(await ids()).not.toContain(`upload-${row.id}`);
  });
});

describe("public photo delivery", () => {
  it("serves a published photo to anyone and gives 404 for unpublished, deleted or malformed ids", async () => {
    as("owner");
    await call(gallery.POST, "POST", "/api/admin/gallery", { form: await upload(["a.png", await png()]) });
    const row = state.be.tables.gallery_images[0]!;
    const id = row.id as string;
    as("anonymous");
    const get = (i: string) => media.GET(new Request(`${ORIGIN}/media/${i}`), { params: Promise.resolve({ id: i }) });

    expect((await get(id)).status).toBe(404); // still a draft
    row.is_published = true;
    const ok = await get(id);
    expect(ok.status).toBe(200);
    expect(ok.headers.get("content-type")).toBe("image/webp");
    expect(ok.headers.get("x-content-type-options")).toBe("nosniff");
    row.is_published = false;
    expect((await get(id)).status).toBe(404); // unpublishing takes it down
    expect((await get("../../etc/passwd")).status).toBe(404);
    expect((await get(ID)).status).toBe(404);
  });
});

describe("the owner: site content", () => {
  beforeEach(() => as("owner"));
  const HERO = { eyebrow: "New eyebrow", line1: "Ride the", line2: "Future.", lead: "A lead.", cta1: "Explore", cta2: "Studio", meta: "A / B / C" };

  it("keeps a draft private until it is published, then makes it public; can be unpublished", async () => {
    expect((await call(content.PUT, "PUT", "/api/admin/content/hero", { json: HERO }, { key: "hero" })).status).toBe(200);
    // a visitor (anonymous) sees nothing yet
    const visibleToPublic = () => state.be.tables.site_content.filter((r) => r.status === "published");
    expect(visibleToPublic()).toEqual([]);
    expect((await call(publish.POST, "POST", "/api/admin/content/hero/publish", {}, { key: "hero" })).status).toBe(200);
    expect(visibleToPublic()).toHaveLength(1);
    expect(visibleToPublic()[0]!.value).toEqual(HERO);
    expect((await call(publish.DELETE, "DELETE", "/api/admin/content/hero/publish", {}, { key: "hero" })).status).toBe(200);
    expect(visibleToPublic()).toEqual([]);
    expect(state.be.tables.audit_logs.map((r) => r.action)).toEqual(["content.save_draft", "content.publish", "content.unpublish"]);
  });

  it("will not publish when there is no draft", async () => {
    expect((await call(publish.POST, "POST", "/api/admin/content/hero/publish", {}, { key: "hero" })).status).toBe(409);
  });

  it("limits editable links to this site's own pages and rejects unknown keys and fields", async () => {
    const promo = (linkHref: string) => call(content.PUT, "PUT", "/api/admin/content/promo", { json: { enabled: true, text: "Sale", linkLabel: "Go", linkHref } }, { key: "promo" });
    expect((await promo("javascript:alert(1)")).status).toBe(422);
    expect((await promo("https://evil.example")).status).toBe(422);
    expect((await promo("/gallery")).status).toBe(200);
    expect((await call(content.PUT, "PUT", "/api/admin/content/secrets", { json: {} }, { key: "secrets" })).status).toBe(404);
    expect((await call(content.PUT, "PUT", "/api/admin/content/hero", { json: { ...HERO, extra: "x" } }, { key: "hero" })).status).toBe(422);
    expect((await call(content.PUT, "PUT", "/api/admin/content/hero", { json: { ...HERO, lead: "x".repeat(400) } }, { key: "hero" })).status).toBe(422);
  });
});

describe("sign-in", () => {
  const signIn = (email: string, password: string, extra: Init = {}) => call(login.POST, "POST", "/api/admin/auth/login", { json: { email, password }, ...extra });

  it("signs the owner in and records it", async () => {
    const res = await signIn("owner@example.com", "Correct-Horse-9");
    expect(res.status).toBe(200);
    expect(await body(res)).toEqual({ ok: true, mfaRequired: false });
    expect(state.be.tables.audit_logs.map((r) => r.action)).toEqual(["auth.login"]);
  });

  it("answers wrong passwords, unknown accounts and non-owner accounts identically (no account discovery)", async () => {
    const wrong = await signIn("owner@example.com", "nope");
    const unknown = await signIn("ghost@example.com", "nope");
    const visitor = await signIn("visitor@example.com", "Visitor-Pass-9"); // correct password, but not the owner
    for (const r of [wrong, unknown, visitor]) expect(r.status).toBe(401);
    const msgs = await Promise.all([wrong, unknown, visitor].map(async (r) => (await body(r)).error));
    expect(new Set(msgs.map((m) => JSON.stringify(m))).size).toBe(1);
    expect(state.be.log.signOuts.length).toBeGreaterThan(0); // the non-owner's fresh session was ended
    expect(state.session.userId).toBeNull();
  });

  it("throttles repeated guesses against one account (429 after 5 attempts)", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) statuses.push((await signIn("owner@example.com", `guess-${i}`)).status);
    expect(statuses).toEqual([401, 401, 401, 401, 401, 429, 429]);
    // even the right password is refused while throttled
    expect((await signIn("owner@example.com", "Correct-Horse-9")).status).toBe(429);
  });

  it("throttles one address spraying many accounts (429 after 10 attempts)", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) statuses.push((await signIn(`user${i}@example.com`, "x")).status);
    expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true);
    expect(statuses.slice(10)).toEqual([429, 429]);
  });

  it("rejects cross-site sign-in attempts, malformed bodies and an unconfigured backend", async () => {
    expect((await signIn("owner@example.com", "Correct-Horse-9", { origin: "https://evil.example" })).status).toBe(403);
    expect((await call(login.POST, "POST", "/api/admin/auth/login", { json: { email: "not-an-email", password: "x" } })).status).toBe(422);
    expect((await call(login.POST, "POST", "/api/admin/auth/login", { json: { email: "owner@example.com", password: "x", role: "owner" } })).status).toBe(422);
    delete process.env.SUPABASE_URL;
    expect((await signIn("owner@example.com", "Correct-Horse-9")).status).toBe(503);
  });

  it("asks for the authenticator code when the owner has two-step sign-in on", async () => {
    state.be.users.owner!.mfa = true;
    const res = await signIn("owner@example.com", "Correct-Horse-9");
    expect(await body(res)).toEqual({ ok: true, mfaRequired: true });
    expect((await call(motos.GET, "GET", "/api/admin/motorcycles")).status).toBe(401); // password alone is not enough
  });

  it("signs out everywhere and records it", async () => {
    as("owner");
    const res = await call(logout.POST, "POST", "/api/admin/auth/logout", {});
    expect(res.status).toBe(200);
    expect(state.be.log.signOuts).toEqual(["global"]);
    expect(state.be.tables.audit_logs.map((r) => r.action)).toEqual(["auth.logout"]);
    expect((await call(motos.GET, "GET", "/api/admin/motorcycles")).status).toBe(401);
  });

  it("refuses sign-out without a session or from another site", async () => {
    expect((await call(logout.POST, "POST", "/api/admin/auth/logout", {})).status).toBe(401);
    as("owner");
    expect((await call(logout.POST, "POST", "/api/admin/auth/logout", { origin: "https://evil.example" })).status).toBe(403);
  });
});

describe("password recovery", () => {
  it("gives the same answer for any email, so accounts cannot be discovered", async () => {
    const a = await call(forgot.POST, "POST", "/api/admin/auth/forgot", { json: { email: "owner@example.com" } });
    const b = await call(forgot.POST, "POST", "/api/admin/auth/forgot", { json: { email: "nobody@example.com" } });
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(await body(a)).toEqual(await body(b));
  });

  it("limits how many reset emails can be requested", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 4; i++) statuses.push((await call(forgot.POST, "POST", "/api/admin/auth/forgot", { json: { email: "owner@example.com" } })).status);
    expect(statuses.every((s) => s === 200)).toBe(true); // same answer for the caller...
    expect(state.be.log.resetEmails).toHaveLength(3); // ...but only 3 emails were actually sent
  });

  it("changes the password only with a valid recovery session, and enforces a strong password", async () => {
    expect((await call(reset.POST, "POST", "/api/admin/auth/reset", { json: { password: "Str0ng-Enough-Pass" } })).status).toBe(401);
    as("visitor");
    expect((await call(reset.POST, "POST", "/api/admin/auth/reset", { json: { password: "Str0ng-Enough-Pass" } })).status).toBe(403);
    as("owner");
    for (const weak of ["short1A", "alllowercase12345", "NOLOWERCASE12345"]) {
      expect((await call(reset.POST, "POST", "/api/admin/auth/reset", { json: { password: weak } })).status).toBe(422);
    }
    expect((await call(reset.POST, "POST", "/api/admin/auth/reset", { json: { password: "Str0ng-Enough-Pass" } })).status).toBe(200);
    expect(state.be.log.signOuts).toContain("others");
    expect(state.be.tables.audit_logs.map((r) => r.action)).toEqual(["auth.password_changed"]);
  });
});

describe("registration and role escalation", () => {
  it("offers no public registration route and never calls sign-up", () => {
    const routeFiles: string[] = [];
    const walk = (dir: string) => { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p); else routeFiles.push(p); } };
    for (const d of ["app/api", "app/admin"]) walk(join(process.cwd(), d));
    expect(routeFiles.filter((f) => /regist|signup|sign-up|create-account/i.test(f))).toEqual([]);
    expect(existsSync(join(process.cwd(), "app", "admin", "register"))).toBe(false);
    expect(state.be.log.signUps).toBe(0);
  });
});
