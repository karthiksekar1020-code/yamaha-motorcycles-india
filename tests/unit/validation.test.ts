import { afterEach, describe, expect, it } from "vitest";
import { normalizeIndianMobile, testRideSchema } from "@/lib/validation/test-ride";
import { __resetRateLimit, rateLimit } from "@/lib/security/rate-limit";

const future = () => new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
const valid = () => ({
  fullName: "Asha Rao", mobile: "+91 98765 43210", email: "Asha@Example.com", city: "Pune", motorcycleSlug: "r15-v4",
  preferredDate: future(), preferredTimeWindow: "morning" as const, dealerId: "", consent: true as const, website: "",
});

describe("normalizeIndianMobile", () => {
  it.each([["9876543210", "9876543210"], ["+91 98765-43210", "9876543210"], ["09876543210", "9876543210"]])("accepts %s", (i, o) => expect(normalizeIndianMobile(i)).toBe(o));
  it.each(["12345", "5876543210", "98765432101", "abcdefghij"])("rejects %s", (i) => expect(normalizeIndianMobile(i)).toBeNull());
});

describe("testRideSchema", () => {
  it("accepts a valid request and normalises email", () => {
    const r = testRideSchema.safeParse(valid());
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("asha@example.com");
  });
  it("requires consent", () => expect(testRideSchema.safeParse({ ...valid(), consent: false }).success).toBe(false));
  it("rejects past and far-future dates", () => {
    expect(testRideSchema.safeParse({ ...valid(), preferredDate: "2020-01-01" }).success).toBe(false);
    expect(testRideSchema.safeParse({ ...valid(), preferredDate: new Date(Date.now() + 400 * 86400000).toISOString().slice(0, 10) }).success).toBe(false);
  });
  it("rejects a filled honeypot", () => expect(testRideSchema.safeParse({ ...valid(), website: "http://spam" }).success).toBe(false));
  it("rejects a malformed dealer id", () => expect(testRideSchema.safeParse({ ...valid(), dealerId: "not-a-uuid" }).success).toBe(false));
});

describe("rateLimit", () => {
  afterEach(() => __resetRateLimit());
  it("blocks after the limit and recovers after the window", () => {
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 1000, 0).ok).toBe(true);
    const blocked = rateLimit("k", 3, 1000, 10);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(rateLimit("k", 3, 1000, 1500).ok).toBe(true);
  });
  it("tracks keys independently", () => {
    rateLimit("a", 1, 1000, 0);
    expect(rateLimit("a", 1, 1000, 1).ok).toBe(false);
    expect(rateLimit("b", 1, 1000, 1).ok).toBe(true);
  });
});
