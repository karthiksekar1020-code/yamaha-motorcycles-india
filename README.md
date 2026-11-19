# Yamaha Vignesh Bikez (unofficial concept website)

A Next.js app with a searchable catalogue, official product photos (two per model where available), a comparison engine, dealer search and a test-ride enquiry form that sends the request through WhatsApp. This is the **frontend-only** version: there is no backend, no API routes and no database. Target market: India. **Not affiliated with Yamaha Motor Co., Ltd.**

## Quick start

```bash
npm install
npm run dev                    # http://localhost:3000
```

The site runs entirely on the built-in **labelled demo dataset**. There is no database, login or server code to run: the test-ride form opens WhatsApp with the request ready to send, and dealer search shows only the local list in `lib/dealers/data.ts`. No environment variables are needed; the site address is set in `lib/config.ts` (`SITE_URL`).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Develop / production build / serve |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npx playwright install chromium` then `npm run build && npm run test:e2e` | Browser tests (desktop + mobile) |

## Architecture

- `app/` routes: `/`, `/motorcycles`, `/motorcycles/[slug]`, `/compare`, `/experience` (Studio), `/gallery`, `/dealers`, `/test-ride`, `/about`, `/contact`, `/privacy`, `/terms`, sitemap and robots. There are no `/api` routes.
- Server Components by default; Client Components only for interaction.
- `lib/motorcycles/repository.ts` serves the built-in demo dataset. `query.ts` holds the pure, tested filter/sort/pagination logic.
- `lib/validation/*`: Zod schemas for the test-ride form and the catalogue filters (run in the browser and when pages render).
- Security headers and the Content-Security-Policy are in `next.config.ts`.

## Images

- Official product images from yamaha-motor-india.com are saved in `public/images/models`: a thumbnail (`<slug>.webp`) and up to two larger photos (`<slug>-1.webp`, `<slug>-2.webp`) per model. The mapping, labels and credit live in `lib/motorcycles/images.ts`.
- The second image is another colour variant; for FZ Blue Flex, FZ-X Hybrid and Aerox 155 (single-colour models) it is Yamaha's promotional banner.
- YZF-R2, YZF-R2M, Aerox-E and EC-06 have fewer images because their pages are on separate Yamaha sites that block automated access.
- The site owner states they have permission to use these images. Keep that on record; if it is withdrawn, delete `public/images` and `lib/motorcycles/images.ts`.
- The catalogue shows only models on the official India lineup page. R3, R7, R1, MT-03, MT-07, MT-09 and Tracer 9 GT are kept in `lib/motorcycles/data.ts` but hidden via `NOT_IN_OFFICIAL_INDIA_LINEUP`.
- There is no 3D viewer; the Studio page and model pages show the photo gallery.

## Data verification (required before production)

The motorcycle records are **demo data**: no prices, availability `unverified`, no source URL or verification date. India lineup names, engine sizes and categories were cross-checked against bikedekho.com (a third-party aggregator) and the official Yamaha India page on 2026-10-09. Before launch, verify each model against the official source, record `source_url`, `model_year` and `last_verified_at`, add verified prices, and fill suspension/brake fields. A record only displays as "verified" when both a source URL and a verification date are present. Load dealers into the `dealers` table with `is_verified = true` from a legitimate source.

## Deploying

Any Node host (including Hostinger Node.js hosting) or Vercel: `npm install`, `npm run build`, `npm start`. No environment variables are required. If the domain changes, edit `SITE_URL` in `lib/config.ts`.

## Production-launch checklist

- Verified data, real contact details, legal review of Privacy/Terms (DPDP Act 2023), retention policy.
- Test-ride requests are not stored anywhere; they are sent by WhatsApp. Add a backend if you need to store them or send email/CRM notifications.
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
