import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { adminConfigured, checkCredentials, createSessionToken, sameOrigin, verifySessionToken, SESSION_SECONDS } from "@/lib/admin/session";

const ENV = { ADMIN_EMAIL: "boss@example.com", ADMIN_PASSWORD: "correct horse", ADMIN_SESSION_SECRET: "x".repeat(40) };
const saved = { ...process.env };

beforeEach(() => Object.assign(process.env, ENV));
afterEach(() => { process.env = { ...saved }; });

describe("admin credentials", () => {
  it("accepts the right pair (email is case-insensitive) and rejects anything else", () => {
    expect(checkCredentials("boss@example.com", "correct horse")).toBe(true);
    expect(checkCredentials("BOSS@example.com ", "correct horse")).toBe(true);
    expect(checkCredentials("boss@example.com", "Correct horse")).toBe(false);
    expect(checkCredentials("other@example.com", "correct horse")).toBe(false);
    expect(checkCredentials("", "")).toBe(false);
  });

  it("is disabled unless all three variables are set and the secret is long enough", () => {
    expect(adminConfigured()).toBe(true);
    process.env.ADMIN_SESSION_SECRET = "short";
    expect(adminConfigured()).toBe(false);
    expect(checkCredentials("boss@example.com", "correct horse")).toBe(false);
    process.env.ADMIN_SESSION_SECRET = ENV.ADMIN_SESSION_SECRET;
    delete process.env.ADMIN_PASSWORD;
    expect(adminConfigured()).toBe(false);
  });
});

describe("session token", () => {
  it("verifies a fresh token and rejects expired, tampered and malformed ones", () => {
    const now = Date.now();
    const t = createSessionToken(now);
    expect(verifySessionToken(t, now + 1000)).toBe(true);
    expect(verifySessionToken(t, now + (SESSION_SECONDS + 5) * 1000)).toBe(false);
    const [exp, sig] = t.split(".");
    expect(verifySessionToken(`${Number(exp) + 3600}.${sig}`, now)).toBe(false);
    expect(verifySessionToken(`${exp}.${"0".repeat(sig!.length)}`, now)).toBe(false);
    expect(verifySessionToken("garbage", now)).toBe(false);
    expect(verifySessionToken(undefined, now)).toBe(false);
  });

  it("is invalid under a different secret", () => {
    const t = createSessionToken();
    process.env.ADMIN_SESSION_SECRET = "y".repeat(40);
    expect(verifySessionToken(t)).toBe(false);
  });
});

describe("sameOrigin", () => {
  const req = (h: Record<string, string>) => new Request("http://localhost/api/admin/login", { method: "POST", headers: h });
  it("requires the Origin to match the host", () => {
    expect(sameOrigin(req({ origin: "http://localhost:3000", host: "localhost:3000" }))).toBe(true);
    expect(sameOrigin(req({ origin: "https://evil.example", host: "localhost:3000" }))).toBe(false);
    expect(sameOrigin(req({ host: "localhost:3000" }))).toBe(false);
  });
});
