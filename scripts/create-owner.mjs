#!/usr/bin/env node
/**
 * One-time setup: creates the single owner account and gives it admin rights.
 *
 * Run it on your own computer (never in the browser, never in CI logs):
 *   node --env-file=.env.local scripts/create-owner.mjs you@example.com
 *
 * Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment. The service-role key bypasses all security
 * rules, so it is used here and nowhere else in the admin system. No password is stored in this repository:
 * pass OWNER_PASSWORD in the environment, or leave it out and a strong random one is generated and shown once.
 *
 * Options:  --reset-password   set a new password for an existing owner account
 */
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith("--"))?.trim().toLowerCase();
const resetPassword = args.includes("--reset-password");
const url = process.env.SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const die = (msg) => { console.error(`\n✗ ${msg}\n`); process.exit(1); };

if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) die("Usage: node --env-file=.env.local scripts/create-owner.mjs <owner-email>");
if (!url || !serviceKey) die("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (for example in .env.local).");

const strong = (p) => p.length >= 12 && p.length <= 128 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p);
let password = process.env.OWNER_PASSWORD;
let generated = false;
if (password) {
  if (!strong(password)) die("OWNER_PASSWORD must be 12-128 characters with upper-case, lower-case and a number.");
} else {
  // 18 random bytes -> 24 URL-safe characters; the suffix guarantees every character class is present.
  password = `${randomBytes(18).toString("base64url")}aZ9`;
  generated = true;
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function findUserByEmail(target) {
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) die(`Could not list users: ${error.message}`);
    const hit = data.users.find((u) => u.email?.toLowerCase() === target);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

// Only one owner may exist: refuse to add a second administrator.
const { data: existing, error: listError } = await admin.from("admin_users").select("user_id");
if (listError) die(`Could not read admin_users (${listError.code ?? "error"}). Did you apply supabase/migrations/0002_admin_cms.sql?`);

let user = await findUserByEmail(email);
const alreadyOwner = Boolean(user && existing?.some((r) => r.user_id === user.id));
if (existing && existing.length > 0 && !alreadyOwner) die("An owner account already exists for a different email. This script only ever creates one owner. To replace it, remove the old row from admin_users in the SQL editor first.");

if (!user) {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) die(`Could not create the user: ${error?.message ?? "unknown error"}`);
  user = data.user;
  console.log(`✓ Created account for ${email}`);
} else if (resetPassword) {
  const { error } = await admin.auth.admin.updateUserById(user.id, { password });
  if (error) die(`Could not set the password: ${error.message}`);
  console.log("✓ Password updated");
} else {
  console.log(`• Account for ${email} already exists (use --reset-password to set a new password)`);
  generated = false;
}

if (!alreadyOwner) {
  const { error } = await admin.from("admin_users").insert({ user_id: user.id, role: "owner" });
  if (error) die(`Could not grant admin rights: ${error.message}`);
  console.log("✓ Granted owner rights");
} else {
  console.log("• Already the owner");
}

// Public sign-up must be switched off in the Supabase dashboard; check that it is.
try {
  const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, { headers: { apikey: serviceKey } });
  const settings = await res.json();
  if (settings.disable_signup === true) console.log("✓ Public sign-up is disabled");
  else console.log("\n⚠  PUBLIC SIGN-UP IS STILL ENABLED. Turn it off: Supabase dashboard -> Authentication -> Sign In / Providers -> untick \"Allow new users to sign up\".\n   (New sign-ups would have no admin rights, but there is no reason to allow them.)");
} catch {
  console.log("• Could not check the sign-up setting; please confirm it is disabled in the dashboard.");
}

if (generated) {
  console.log(`\nOwner sign-in\n  email:    ${email}\n  password: ${password}\n\nCopy the password into a password manager NOW. It is not stored anywhere and will not be shown again.`);
  console.log("Then sign in at /admin/login and, under Account security, change it and turn on two-step sign-in.");
}
console.log("\nDone.");
