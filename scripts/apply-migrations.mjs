#!/usr/bin/env node
/**
 * Applies the database migrations to your Supabase project over a direct Postgres connection.
 *
 *   node --env-file=.env.local scripts/apply-migrations.mjs            # schema + admin security rules
 *   node --env-file=.env.local scripts/apply-migrations.mjs --seed     # also load the 22 demo motorcycles
 *
 * Needs DATABASE_URL in .env.local: Supabase dashboard -> Connect -> "Session pooler" connection string (works on IPv4),
 * with [YOUR-PASSWORD] replaced by the database password you chose when you created the project. That string is a
 * secret: keep it in .env.local only (git-ignored). It is used here and nowhere else.
 *
 * Safe to run again: 0001 is skipped when the tables already exist, and 0002 is idempotent. Nothing is ever dropped.
 * Each file runs inside a transaction, so a failure leaves the database unchanged.
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = fileURLToPath(new URL("../", import.meta.url));
const sql = (f) => readFileSync(`${root}supabase/${f}`, "utf8");
const seed = process.argv.includes("--seed");
const url = process.env.DATABASE_URL?.trim();
const die = (m) => { console.error(`\n✗ ${m}\n`); process.exit(1); };

if (!url) die("DATABASE_URL is not set. Add it to .env.local (Supabase dashboard -> Connect -> Session pooler -> URI, with your database password filled in).");
if (url.includes("[YOUR-PASSWORD]")) die("DATABASE_URL still contains [YOUR-PASSWORD]. Replace it with your database password (no brackets).");

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
} catch (e) {
  die(`Could not connect to the database (${e.code ?? e.message}). Check the password, and use the *Session pooler* string if direct connections fail.`);
}

const run = async (label, text) => {
  try {
    await client.query("begin");
    await client.query(text);
    await client.query("commit");
    console.log(`✓ ${label}`);
  } catch (e) {
    await client.query("rollback").catch(() => {});
    die(`${label} failed and was rolled back: ${e.message}`);
  }
};

const exists = async (rel) => (await client.query("select to_regclass($1) as t", [rel])).rows[0].t !== null;

if (await exists("public.motorcycles")) console.log("• 0001_init.sql skipped (tables already exist)");
else await run("0001_init.sql (tables)", sql("migrations/0001_init.sql"));
// Every migration after 0001 is idempotent, so all of them run, in order, every time.
const later = readdirSync(`${root}supabase/migrations`).filter((f) => f.endsWith(".sql") && !f.startsWith("0001")).sort();
for (const f of later) await run(`${f}`, sql(`migrations/${f}`));
if (seed) await run("seed.sql (22 demo motorcycles, published)", sql("seed.sql"));

// Report what is really there, rather than assuming.
const q = async (text) => (await client.query(text)).rows;
const rls = await q(`select c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname in ('motorcycles','gallery_images','gallery_hidden','site_content','audit_logs','admin_users','test_ride_requests','dealers') order by 1`);
const bucket = await q(`select id, public from storage.buckets where id = 'gallery'`);
const bikes = (await q(`select count(*)::int n, count(*) filter (where is_published)::int p from public.motorcycles`))[0];
console.log("\nRow Level Security: " + rls.map((r) => `${r.relname}=${r.relrowsecurity ? "on" : "OFF"}`).join(", "));
console.log(`Gallery storage bucket: ${bucket.length ? (bucket[0].public ? "PUBLIC (unexpected!)" : "private ✓") : "missing"}`);
console.log(`Motorcycles: ${bikes.n} (${bikes.p} published)`);
if (rls.some((r) => !r.relrowsecurity) || !bucket.length) { await client.end(); die("Something is not as expected: see above."); }
await client.end();
console.log("\nDone. Next: create the owner with scripts/create-owner.mjs, then run scripts/verify-backend.mjs.");
