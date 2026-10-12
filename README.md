# Yamaha Motorcycles India (unofficial concept website)

A Next.js app with a searchable catalogue, official product photos (two per model where available), a comparison engine, dealer search and a server-backed test-ride enquiry flow. Target market: India. **Not affiliated with Yamaha Motor Co., Ltd.**

## Quick start

```bash
npm install
cp .env.example .env.local     # optional: Supabase credentials (see below)
npm run dev                    # http://localhost:3000
```

Without Supabase the site runs on the **labelled demo dataset**; the test-ride form returns an explicit "database not configured" error (it never pretends to save), and dealer search shows a setup notice (no fake dealers).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Develop / production build / serve |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint |
| `npm test` | Vitest: unit, integration and database (RLS) tests |
| `npx playwright install chromium` then `npm run build && npm run test:e2e` | Browser tests (desktop + mobile) |
| `node scripts/generate-seed.mjs` | Regenerate `supabase/seed.sql` from `lib/motorcycles/data.ts` |

## Architecture

- `app/` routes: `/`, `/motorcycles`, `/motorcycles/[slug]`, `/compare`, `/experience` (Studio), `/gallery`, `/dealers`, `/test-ride`, `/about`, `/contact`, `/privacy`, `/terms`, plus `/api/{motorcycles,motorcycles/[slug],dealers,test-ride,health}`, sitemap and robots.
- Server Components by default; Client Components only for interaction.
- `lib/motorcycles/repository.ts` reads Supabase when configured, else the demo dataset. `query.ts` holds the pure, tested filter/sort/pagination logic.
- `lib/validation/*`: Zod schemas shared by client and server; the server re-validates everything.
- `lib/security/rate-limit.ts`: in-memory limiter (per instance only; use a shared store such as Redis for multi-instance deployments).
- Security headers in `next.config.ts`; the service-role key is server-only.

## Images

- Official product images from yamaha-motor-india.com are saved in `public/images/models`: a thumbnail (`<slug>.webp`) and up to two larger photos (`<slug>-1.webp`, `<slug>-2.webp`) per model. The mapping, labels and credit live in `lib/motorcycles/images.ts`.
- The second image is another colour variant; for FZ Blue Flex, FZ-X Hybrid and Aerox 155 (single-colour models) it is Yamaha's promotional banner.
- YZF-R2, YZF-R2M, Aerox-E and EC-06 have fewer images because their pages are on separate Yamaha sites that block automated access.
- The site owner states they have permission to use these images. Keep that on record; if it is withdrawn, delete `public/images` and `lib/motorcycles/images.ts`.
- The catalogue shows only models on the official India lineup page. R3, R7, R1, MT-03, MT-07, MT-09 and Tracer 9 GT are kept in `lib/motorcycles/data.ts` but hidden via `NOT_IN_OFFICIAL_INDIA_LINEUP`.
- There is no 3D viewer; the Studio page and model pages show the photo gallery.

## Database (Supabase)

See **Admin system** below for the full setup (migrations, owner account, security checks).

RLS summary: visitors can read **published** models, photos and content only. `test_ride_requests` has no policies, so anon/authenticated clients cannot read or write it; only the server (service role) can.

## Data verification (required before production)

The motorcycle records are **demo data**: no prices, availability `unverified`, no source URL or verification date. India lineup names, engine sizes and categories were cross-checked against bikedekho.com (a third-party aggregator) and the official Yamaha India page on 2026-10-09. Before launch, verify each model against the official source, record `source_url`, `model_year` and `last_verified_at`, add verified prices, and fill suspension/brake fields. A record only displays as "verified" when both a source URL and a verification date are present. Load dealers into the `dealers` table with `is_verified = true` from a legitimate source.

## Deploying

Any Node host or Vercel: set the variables from `.env.example`, `npm run build`, `npm start`. Set `NEXT_PUBLIC_SITE_URL` and optionally `NEXT_PUBLIC_CONTACT_EMAIL`.

## Production-launch checklist

- Verified data, real contact details, legal review of Privacy/Terms (DPDP Act 2023), retention policy.
- Shared-store rate limiting; consider CAPTCHA in addition to the honeypot.
- Email/CRM notification for new requests and an authorised admin workflow.
- Lighthouse measurement on the deployed site (not yet measured), error monitoring, backups.

## Languages

The language button in the header switches the interface between English and ten Indian languages (Hindi, Bengali, Marathi, Telugu, Tamil, Gujarati, Kannada, Malayalam, Punjabi, Odia). The choice is saved in the browser.

- Strings live in one file per language, `lib/i18n/dicts/<code>.ts`; a unit test checks that every language has every key. Only the active language is sent to the browser; the others load as separate chunks when chosen (`lib/i18n/load.ts`).
- **Translated:** the header and menu, footer, hero, homepage section headings, and the titles and intros of the main pages.
- **Not translated (English only):** model names and specifications, catalogue filters, the test-ride form and its errors, and the About, Privacy, Terms and Contact pages.
- The translations were written by an AI assistant and **have not been reviewed by native speakers**. Have each language checked before launch, especially the footer disclaimer.
- Each script has its own Google font (`app/layout.tsx`), loaded only when that language is used. Urdu (right-to-left) is not included.

## Refresh behaviour

A browser refresh (F5, Ctrl+R, reload button) on any page takes the visitor to the **home page**, scrolled to the top. Links, the back button and typed or bookmarked URLs open normally, and the chosen language is kept. Switch it off by setting `REFRESH_GOES_HOME = false` in `lib/config.ts`.

## Admin system (owner-only content management)

Only the website owner can sign in and change anything. Visitors get read-only access to **published** content; drafts, the admin area and the audit log are invisible to them, even if they call the APIs directly.

### What the owner can manage
Motorcycles (details, specs, price, colours, featured, publish/unpublish, delete with typed confirmation, preview), gallery photos (upload with progress, replace, reorder, captions and alt text, link to a model, publish/unpublish, delete), the homepage hero, headings, top menu and a promo banner (draft, then publish), an activity log, and account security (password, two-step sign-in). The built-in official photos stay in code and are not editable here.

### Architecture
| Layer | How it works |
| --- | --- |
| Identity | **Supabase Auth** (email + password, optional authenticator-app MFA). Public sign-up must be switched off (see setup); the app has no registration page or endpoint. |
| Who is the owner | One row in `admin_users`, written only by `scripts/create-owner.mjs` using the service-role key. No API, policy or form can add rows. |
| Server gate | `lib/admin/auth.ts` `requireAdmin()` runs for every admin page and API: verifies the session with Supabase Auth (**401**), checks the owner row (**403**), and demands the second step when MFA is on. It fails closed. Roles are never read from the request. |
| Database gate | Postgres Row Level Security (`supabase/migrations/0002_admin_cms.sql`). The server talks to Supabase **as the signed-in user** (anon key + that user's JWT), so even a bug in the app cannot write without owner rights. The service-role key is not used by the admin system. |
| Storage | Private `gallery` bucket. Files are readable anonymously only while their gallery row is published; only the owner can upload, replace or delete. Uploads are validated by real file bytes, re-encoded to clean WebP (metadata stripped) and stored under generated names. |
| Sessions | httpOnly, SameSite=Lax cookies (Secure in production), 8-hour inactivity limit, refreshed by `middleware.ts`; sign-out revokes the refresh token everywhere. |
| Abuse limits | Login: 10 attempts per 15 min per IP and 5 per account; MFA codes 8 per 15 min; reset emails 3 per hour per account. The limiter is in-memory per server instance: use a shared store (for example Redis) when running several instances. |
| CSRF | SameSite cookies plus an Origin check on every state-changing request. |
| Audit | `audit_logs` is append-only (even the owner cannot edit or delete rows) and never stores passwords or tokens. |
| Headers | CSP (production), `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, HSTS, COOP. Admin responses are `no-store` and `noindex`. |

### Setup (once)
1. **Create a Supabase project** (supabase.com). Note the Project URL, the `anon` key and the `service_role` key (Project Settings, API).
2. **Copy `.env.example` to `.env.local`** and fill `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Never commit `.env.local` (it is git-ignored).
3. **Apply the migrations.** Easiest: paste `supabase/setup-all.sql` into the Supabase SQL editor and run it **once** on a new project, then optionally `supabase/seed.sql` for the demo lineup. Or let the script do it: put `DATABASE_URL` (Connect, Session pooler, with your database password) in `.env.local` and run `node --env-file=.env.local scripts/apply-migrations.mjs --seed`. The script is safe to re-run; `setup-all.sql` is not.
4. **Turn off public sign-up**: Authentication, Sign In / Providers, untick *Allow new users to sign up*.
5. **Allow the recovery link**: Authentication, URL Configuration: set the Site URL and add `<your site URL>/admin/auth/callback` to Redirect URLs. Configure an email sender (Authentication, SMTP) for production; Supabase's built-in sender is heavily rate-limited.
6. **Create the owner account** (a strong generated password is printed once if `OWNER_PASSWORD` is not set):
   ```bash
   node --env-file=.env.local scripts/create-owner.mjs you@example.com
   ```
7. **Check the live security rules** against your project (needs only the anon key; add `VERIFY_OWNER_EMAIL` and `VERIFY_OWNER_PASSWORD` to also test the owner):
   ```bash
   node --env-file=.env.local scripts/verify-backend.mjs
   ```
   Every line must say PASS. With owner credentials it creates and deletes one throw-away draft and one tiny photo.
8. Run the site, open `/admin/login`, sign in, then under **Account security** change the password and **turn on two-step sign-in**.

### Local development
`npm run dev` (or `npx next dev` if Turbopack cannot fetch Google fonts). Without Supabase settings the public site runs on the demo dataset and `/admin/login` says sign-in is not set up. Recovery emails need your Supabase email settings; open the link in the **same browser** that requested it.

### Production deployment
Set the same environment variables on the host (Vercel, a Node server, and so on), set `NEXT_PUBLIC_SITE_URL` to the real HTTPS address, run `npm run build && npm start`, and apply the migrations to the production project. Serve over HTTPS only. Keep the service-role key in the host's secret store, never in the repo. If you run more than one instance, replace the in-memory rate limiter (`lib/security/rate-limit.ts`) with a shared store.

### Tests
| Command | Covers |
| --- | --- |
| `npm test` | Unit and integration tests. **Real Postgres RLS tests** (PGlite runs both migrations and attacks every table as anonymous, ordinary user and owner); every admin API route (401, 403, CSRF, validation, CRUD, uploads, login throttling, recovery) against an in-memory Supabase stand-in; image-upload validation |
| `npm run build && npm run test:e2e` | Browser tests over real HTTP: the gate (no session, forged cookies and tokens), redirects, the login form (validation, responsive layouts), security headers, the public site |
| `node scripts/verify-backend.mjs` | **Your live Supabase project**: the same rules, checked for real (setup step 7) |

**What the automated tests cannot prove:** that Supabase Auth, Storage and PostgREST behave exactly as the in-memory stand-in assumes (sign-in, MFA, email links, uploads). Run `verify-backend.mjs` and click through the dashboard once against your real project before going live.

### Troubleshooting Owner Sign-In
| What you see | Cause and fix |
| --- | --- |
| **"Admin sign-in is not set up"** with a list of variables | `SUPABASE_URL` and/or `SUPABASE_ANON_KEY` are empty or malformed in `.env.local` (the list names them; values are never shown). Fill them in and **restart the server**: `.env.local` is read only at start-up. |
| The list is empty but the notice still shows | You are running on a host that does not load `.env.local` (set the variables in the host's settings instead), or the dev server was not restarted. |
| "Sign-in is temporarily unavailable" | The server cannot reach Supabase: check `SUPABASE_URL`, your internet connection and the project's status (a free project pauses after inactivity; resume it in the dashboard). |
| "Incorrect email or password" for the right password | The account is not the owner (no row in `admin_users`): run `scripts/create-owner.mjs`. Sign-in deliberately gives the same message for every failure. |
| Dashboard pages show "Couldn't load..." | The migrations are not applied (run `supabase/setup-all.sql`), or the anon key belongs to a different project. |
| Reset link says "invalid or expired" | Open it in the same browser that requested it, within the hour, and make sure `<site>/admin/auth/callback` is in Supabase Redirect URLs. |
| Uploads fail | The `gallery` storage bucket is missing: re-run `supabase/setup-all.sql` (it creates the bucket). |

### Removing photos from the public gallery
While signed in as the owner, open the public **Gallery** page: every photo shows a trash button (visitors never see it, and the server and database refuse anyone but the owner). Photos you uploaded are deleted with their file. The **built-in official photos** live in the site's code, so removing one is recorded in the `gallery_hidden` table (migration `0003_gallery_hidden.sql`) and the page skips it. Restore them any time from **Admin → Gallery → Removed built-in photos**. Existing projects: apply `0003` once (SQL editor, or `node --env-file=.env.local scripts/apply-migrations.mjs`).
