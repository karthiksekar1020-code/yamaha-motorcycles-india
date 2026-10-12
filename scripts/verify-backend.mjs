#!/usr/bin/env node
/**
 * Live security check against YOUR real Supabase project. Run it after applying the migrations and creating the owner:
 *
 *   node --env-file=.env.local scripts/verify-backend.mjs
 *
 * Uses only the public anon key. Optionally set VERIFY_OWNER_EMAIL and VERIFY_OWNER_PASSWORD to also test what the
 * owner CAN do; it creates one draft model and one tiny photo, then deletes them again. Nothing public is changed.
 * Exit code 0 = every check passed.
 */
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL?.trim();
const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
if (!url || !anonKey) { console.error("SUPABASE_URL and SUPABASE_ANON_KEY must be set."); process.exit(2); }

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const anon = createClient(url, anonKey, opts);
const results = [];
const check = async (name, fn) => {
  try { const r = await fn(); results.push({ name, ok: r === true, note: r === true ? "" : String(r) }); }
  catch (e) { results.push({ name, ok: false, note: `threw: ${e.message}` }); }
};
// Writes are refused either with an error or by quietly affecting zero rows; both are fine, a change is not.
const refused = (res) => Boolean(res.error) || (Array.isArray(res.data) && res.data.length === 0) || res.data === null;
const PIXEL = Buffer.from("UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAUAmJaQAA3AA/vz0AAA=", "base64"); // 1x1 WebP

console.log(`Checking ${new URL(url).host}\n`);

// ---- as an anonymous visitor -------------------------------------------------
await check("anon can read published motorcycles", async () => { const r = await anon.from("motorcycles").select("slug,is_published").limit(50); return !r.error && r.data.every((m) => m.is_published === true) || r.error?.message; });
await check("anon cannot insert a motorcycle", async () => refused(await anon.from("motorcycles").insert({ slug: `hack-${Date.now()}`, name: "x", market: "India", category: "Street" }).select()));
await check("anon cannot update motorcycles", async () => refused(await anon.from("motorcycles").update({ name: "HACKED" }).neq("slug", "").select()));
await check("anon cannot delete motorcycles", async () => refused(await anon.from("motorcycles").delete().neq("slug", "").select()));
await check("anon sees only published gallery rows", async () => { const r = await anon.from("gallery_images").select("is_published"); return !r.error && r.data.every((x) => x.is_published === true) || r.error?.message; });
await check("anon cannot insert gallery rows", async () => refused(await anon.from("gallery_images").insert({ storage_path: `gallery/${randomUUID()}.webp`, width: 10, height: 10, mime_type: "image/webp", size_bytes: 1 }).select()));
await check("anon sees only the published copy of site content", async () => { const r = await anon.from("site_content").select("status"); return !r.error && r.data.every((x) => x.status === "published") || r.error?.message; });
await check("anon cannot write site content", async () => refused(await anon.from("site_content").upsert({ key: "hero", status: "published", value: { line1: "defaced" } }, { onConflict: "key,status" }).select()));
await check("anon cannot read the audit log", async () => { const r = await anon.from("audit_logs").select("id").limit(1); return Boolean(r.error) || (r.data ?? []).length === 0; });
await check("anon cannot write the audit log", async () => refused(await anon.from("audit_logs").insert({ action: "forged" }).select()));
await check("anon cannot read or write admin_users", async () => { const r = await anon.from("admin_users").select("user_id"); const w = await anon.from("admin_users").insert({ user_id: randomUUID() }).select(); return (Boolean(r.error) || (r.data ?? []).length === 0) && refused(w); });
await check("anon cannot upload to the gallery bucket", async () => Boolean((await anon.storage.from("gallery").upload(`gallery/${randomUUID()}.webp`, PIXEL, { contentType: "image/webp" })).error));
await check("anon cannot list or download unpublished gallery files", async () => { const l = await anon.storage.from("gallery").list("gallery"); return Boolean(l.error) || (l.data ?? []).length === 0 || "files are listable: check storage policies"; });
await check("public sign-up is disabled", async () => { const s = await (await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, { headers: { apikey: anonKey } })).json(); return s.disable_signup === true || "Allow new users to sign up is ON; turn it off in the dashboard"; });

// ---- as a signed-in user who is NOT the owner is covered by the SQL tests (tests/db); here: the owner ----------------
const email = process.env.VERIFY_OWNER_EMAIL, password = process.env.VERIFY_OWNER_PASSWORD;
if (email && password) {
  const owner = createClient(url, anonKey, opts);
  const signIn = await owner.auth.signInWithPassword({ email, password });
  await check("owner can sign in", async () => !signIn.error || signIn.error.message);
  if (!signIn.error) {
    const uid = signIn.data.user.id;
    await check("owner is listed in admin_users", async () => { const r = await owner.from("admin_users").select("role").eq("user_id", uid).maybeSingle(); return r.data?.role === "owner" || "not an owner: run scripts/create-owner.mjs"; });
    const slug = `verify-${Date.now()}`;
    let id = null;
    await check("owner can create a draft model", async () => { const r = await owner.from("motorcycles").insert({ slug, name: "Verify", market: "India", category: "Street", updated_by: uid }).select("id,is_published").single(); id = r.data?.id; return (!r.error && r.data.is_published === false) || r.error?.message; });
    await check("the draft is invisible to anonymous visitors", async () => { const r = await anon.from("motorcycles").select("slug").eq("slug", slug); return (r.data ?? []).length === 0; });
    await check("owner can update then delete it", async () => { const u = await owner.from("motorcycles").update({ name: "Verify 2" }).eq("id", id).select("id"); const d = await owner.from("motorcycles").delete().eq("id", id).select("id"); return (u.data?.length === 1 && d.data?.length === 1) || (u.error ?? d.error)?.message || "no rows changed"; });
    const path = `gallery/${randomUUID()}.webp`;
    await check("owner can upload a photo and anonymous cannot see it until published", async () => {
      const up = await owner.storage.from("gallery").upload(path, PIXEL, { contentType: "image/webp" });
      if (up.error) return up.error.message;
      const row = await owner.from("gallery_images").insert({ storage_path: path, width: 1, height: 1, mime_type: "image/webp", size_bytes: PIXEL.length, created_by: uid }).select("id").single();
      if (row.error) return row.error.message;
      const hidden = (await anon.storage.from("gallery").download(path)).error ? true : "unpublished file was downloadable";
      await owner.from("gallery_images").delete().eq("id", row.data.id);
      await owner.storage.from("gallery").remove([path]);
      return hidden;
    });
    await check("audit log accepts the owner's entries and refuses edits", async () => {
      const ins = await owner.from("audit_logs").insert({ actor_id: uid, action: "verify.backend" }).select("id").single();
      if (ins.error) return ins.error.message;
      const upd = await owner.from("audit_logs").update({ action: "tampered" }).eq("id", ins.data.id).select();
      const del = await owner.from("audit_logs").delete().eq("id", ins.data.id).select();
      return refused(upd) && refused(del);
    });
    await owner.auth.signOut();
  }
} else {
  console.log("(Set VERIFY_OWNER_EMAIL and VERIFY_OWNER_PASSWORD to also test the owner's permissions.)\n");
}

const width = Math.max(...results.map((r) => r.name.length));
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name.padEnd(width)}${r.note ? `  -> ${r.note}` : ""}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed.${failed ? " FIX THE FAILURES BEFORE GOING LIVE." : ""}`);
process.exit(failed ? 1 : 0);
