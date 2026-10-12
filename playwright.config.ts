import { defineConfig, devices } from "@playwright/test";

// Two production servers are started:
//  - :3100  no Supabase settings at all (how the site runs on the demo dataset; admin shows "not set up")
//  - :3200  Supabase "configured" but pointing at an address nothing listens on. This exercises the real admin gate
//           (middleware redirects, 401 responses, forged-cookie handling, the login form) without a live backend.
//           The public pages are not tested on this one: with no database reachable they correctly show an outage notice.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 }, // two servers plus parallel browsers can make a language-chunk load or hydration take a few seconds
  use: { baseURL: "http://localhost:3100" },
  webServer: [
    {
      command: "npx next start -p 3100",
      url: "http://localhost:3100",
      reuseExistingServer: true,
      timeout: 240_000,
      // Empty values win over .env.local, so this server never touches a real Supabase project even on a configured machine.
      env: { SUPABASE_URL: "", SUPABASE_ANON_KEY: "", SUPABASE_SERVICE_ROLE_KEY: "", DATABASE_URL: "" },
    },
    {
      command: "npx next start -p 3200",
      url: "http://localhost:3200/robots.txt",
      reuseExistingServer: true,
      timeout: 240_000,
      env: { SUPABASE_URL: "http://127.0.0.1:59999", SUPABASE_ANON_KEY: "fake-anon-key-for-tests-only", NEXT_PUBLIC_SITE_URL: "http://localhost:3200" },
    },
  ],
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
