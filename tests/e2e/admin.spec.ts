import { expect, test, type APIRequestContext } from "@playwright/test";

const NOT_CONFIGURED = "http://localhost:3100";
const CONFIGURED = "http://localhost:3200";
const ID = "00000000-0000-4000-8000-0000000000aa";

const API: Array<[string, string]> = [
  ["GET", "/api/admin/motorcycles"], ["POST", "/api/admin/motorcycles"], ["GET", `/api/admin/motorcycles/${ID}`], ["PUT", `/api/admin/motorcycles/${ID}`],
  ["PATCH", `/api/admin/motorcycles/${ID}`], ["DELETE", `/api/admin/motorcycles/${ID}`],
  ["GET", "/api/admin/gallery"], ["POST", "/api/admin/gallery"], ["PATCH", `/api/admin/gallery/${ID}`], ["PUT", `/api/admin/gallery/${ID}`], ["DELETE", `/api/admin/gallery/${ID}`],
  ["GET", `/api/admin/gallery/${ID}/file`], ["POST", "/api/admin/gallery/reorder"], ["POST", "/api/admin/gallery/hide"], ["DELETE", "/api/admin/gallery/hide"],
  ["GET", "/api/admin/content/hero"], ["PUT", "/api/admin/content/hero"], ["DELETE", "/api/admin/content/hero"], ["POST", "/api/admin/content/hero/publish"], ["DELETE", "/api/admin/content/hero/publish"],
  ["POST", "/api/admin/mfa"], ["PUT", "/api/admin/mfa"], ["DELETE", "/api/admin/mfa"],
  ["POST", "/api/admin/auth/logout"], ["POST", "/api/admin/auth/reset"], ["POST", "/api/admin/auth/mfa"],
];
const PAGES = ["/admin", "/admin/dashboard", "/admin/motorcycles", "/admin/motorcycles/new", `/admin/motorcycles/${ID}`, `/admin/motorcycles/${ID}/preview`, "/admin/gallery", "/admin/content", "/admin/audit", "/admin/security"];

const send = (request: APIRequestContext, method: string, path: string, headers: Record<string, string> = {}) =>
  request.fetch(`${CONFIGURED}${path}`, { method, headers: { origin: CONFIGURED, "content-type": "application/json", ...headers }, data: method === "GET" || method === "DELETE" ? undefined : "{}", maxRedirects: 0 });

test.describe("backend not configured (demo mode)", () => {
  test.use({ baseURL: NOT_CONFIGURED });

  test("the admin pages say sign-in is not set up and offer no form", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByText(/admin sign-in is not set up/i)).toBeVisible();
    await expect(page.getByLabel("Password")).toHaveCount(0);
  });

  test("admin APIs answer 503, never data", async ({ request }) => {
    const res = await request.get("/api/admin/motorcycles");
    expect(res.status()).toBe(503);
    expect((await res.json()).error.code).toBe("BACKEND_NOT_CONFIGURED");
  });
});

test.describe("public site stays read-only and clean", () => {
  test.use({ baseURL: NOT_CONFIGURED });

  test("visitors get a Login link but no admin controls", async ({ page, isMobile }) => {
    await page.goto("/");
    if (isMobile) await page.getByRole("button", { name: /open menu/i }).click({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: "Login", exact: true }).first()).toHaveAttribute("href", "/admin/login");
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "Owner sign-in" })).toHaveAttribute("href", "/admin/login");
    await expect(page.getByText(/new motorcycle|add motorcycle|upload photos|publish/i)).toHaveCount(0); // no management controls on public pages
    await expect(page.getByText("Owner console")).toHaveCount(0);
  });

  test("the gallery page offers visitors no way to remove anything", async ({ page, request }) => {
    await page.goto("/gallery");
    await expect(page.getByRole("heading", { name: "Gallery" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Remove photo/ })).toHaveCount(0);
    await expect(page.getByText(/remove this photo/i)).toHaveCount(0);
    // and the endpoints behind those buttons refuse an anonymous caller outright
    expect((await request.post("/api/admin/gallery/hide", { data: { itemId: "r15-v4-1" }, headers: { origin: "http://localhost:3100" } })).status()).toBeGreaterThanOrEqual(401);
  });

  test("security headers are present and the admin area is hidden from search engines", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["content-security-policy"]).toContain("connect-src 'self'");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/Disallow: \/admin/);
    const login = await request.get("/admin/login");
    expect(login.headers()["cache-control"]).toContain("no-store");
    expect(await login.text()).toMatch(/noindex/);
  });

  test("reloading an admin page does not bounce to the home page", async ({ page }) => {
    await page.goto("/admin/login");
    await page.reload();
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("there is no public registration page or endpoint", async ({ request, page }) => {
    // Unknown admin addresses send signed-out visitors to the login page (a redirect), never to a sign-up form.
    for (const path of ["/admin/register", "/admin/signup"]) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect([307, 404]).toContain(res.status());
      if (res.status() === 307) expect(res.headers().location).toContain("/admin/login");
    }
    for (const path of ["/register", "/signup"]) expect((await request.get(path)).status()).toBe(404);
    for (const path of ["/api/admin/auth/register", "/api/admin/auth/signup", "/api/auth/signup"]) {
      const res = await request.post(path, { data: { email: "a@b.co", password: "Str0ng-Enough-Pass" }, maxRedirects: 0 });
      expect(res.status(), path).toBeGreaterThanOrEqual(300); // never a 2xx: nothing is created
      expect(res.status(), path).not.toBe(201);
    }
    await page.goto("/admin/login");
    await expect(page.getByText(/create (an )?account|sign up|register/i)).toHaveCount(0);
  });
});

test.describe("backend configured: the gate (no valid session)", () => {
  test.use({ baseURL: CONFIGURED });

  for (const [method, path] of API) {
    test(`${method} ${path} -> 401 for an anonymous caller`, async ({ request }) => {
      const res = await send(request, method, path);
      expect(res.status()).toBe(401);
      expect((await res.json()).error.code).toBe("UNAUTHENTICATED");
    });
  }

  test("forged credentials do not get in: fake session cookies and bearer tokens are refused", async ({ request }) => {
    const forgedJwt = `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url")}.${Buffer.from('{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"admin"},"exp":9999999999}').toString("base64url")}.forged`;
    const cookie = `sb-127-auth-token=${encodeURIComponent(JSON.stringify({ access_token: forgedJwt, refresh_token: "x", token_type: "bearer", expires_in: 3600, expires_at: 9999999999, user: { id: "00000000-0000-4000-8000-000000000001", app_metadata: { role: "admin" } } }))}`;
    const attempts: Array<Record<string, string>> = [{ cookie }, { authorization: `Bearer ${forgedJwt}` }, { cookie: "ymi_admin=1; admin=true; role=owner", "x-admin": "true", "x-user-role": "owner" }];
    for (const headers of attempts) {
      for (const [method, path] of [["GET", "/api/admin/motorcycles"], ["POST", "/api/admin/motorcycles"], ["DELETE", `/api/admin/motorcycles/${ID}`], ["POST", "/api/admin/gallery"]] as const) {
        expect((await send(request, method, path, headers)).status(), `${method} ${path} with ${Object.keys(headers)}`).toBe(401);
      }
    }
  });

  test("a body that claims admin rights changes nothing", async ({ request }) => {
    const res = await request.post(`${CONFIGURED}/api/admin/motorcycles`, { headers: { origin: CONFIGURED }, data: { role: "owner", is_admin: true, slug: "x" } });
    expect(res.status()).toBe(401);
  });

  for (const path of PAGES) {
    test(`${path} redirects an anonymous visitor to the login page`, async ({ request }) => {
      const res = await request.get(`${CONFIGURED}${path}`, { maxRedirects: 0 });
      expect([307, 308]).toContain(res.status());
      expect(res.headers().location).toMatch(/\/admin\/login/);
    });
  }

  test("the unpublished-photo route gives nothing away", async ({ request }) => {
    for (const id of [ID, "not-a-uuid", "../../etc/passwd"]) expect((await request.get(`${CONFIGURED}/media/${encodeURIComponent(id)}`)).status()).toBe(404);
  });

  test("a recovery callback with a bad code goes to the login page, never an outside address", async ({ request }) => {
    for (const q of ["code=bad", "code=bad&next=https://evil.example", "next=https://evil.example"]) {
      const res = await request.get(`${CONFIGURED}/admin/auth/callback?${q}`, { maxRedirects: 0 });
      expect(res.status()).toBe(307);
      expect(new URL(res.headers().location!).origin).toBe(CONFIGURED);
      expect(res.headers().location).toContain("/admin/login");
    }
  });
});

test.describe("backend configured: the login page", () => {
  test.use({ baseURL: CONFIGURED });

  test("shows an accessible form, validates, toggles the password and handles a failed sign-in", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { name: "Owner sign-in" })).toBeVisible();
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Enter a valid email address")).toBeVisible();
    await expect(page.getByText("Enter your password")).toBeVisible();

    const pw = page.getByLabel("Password", { exact: true });
    await expect(pw).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(pw).toHaveAttribute("type", "text");

    await page.getByLabel("Email").fill("owner@example.com");
    await pw.fill("not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator("form [role=alert]")).toBeVisible(); // unreachable backend: a clear message, no crash, no redirect
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("links to password recovery, which gives the same answer for any address", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page).toHaveURL(/\/admin\/forgot-password$/);
    await page.getByLabel("Account email").fill("anyone@example.com");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("status")).toContainText(/if that email belongs to the site owner/i);
  });

  test("the reset page needs the emailed link, and offers no way to register", async ({ page }) => {
    await page.goto("/admin/reset-password");
    await expect(page).toHaveURL(/\/admin\/login\?error=link/);
    await expect(page.getByText(/invalid or has expired/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /register|sign up|create account/i })).toHaveCount(0);
  });

  for (const [name, width, height] of [["phone", 375, 740], ["tablet", 820, 1100], ["desktop", 1366, 800]] as const) {
    test(`fits a ${name} screen (${width}px) without sideways scrolling`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/admin/login");
      await page.waitForLoadState("networkidle");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await expect(page.getByLabel("Email")).toBeVisible();
      await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
      if (width >= 1024) await expect(page.locator(".auth-hero")).toBeVisible(); else await expect(page.locator(".auth-hero")).toBeHidden();
    });
  }
});
