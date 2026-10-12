import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn();
let configured = true;

vi.mock("@/lib/db/supabase", () => ({
  isDbConfigured: () => configured,
  getDb: () =>
    configured
      ? {
          from: (table: string) => {
            if (table === "motorcycles") return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "moto-1" } }) }) }) };
            return { insert };
          },
        }
      : null,
}));
vi.mock("@/lib/motorcycles/repository", async () => {
  const { DEMO_MOTORCYCLES } = await import("@/lib/motorcycles/data");
  return { getMotorcycle: async (slug: string) => DEMO_MOTORCYCLES.find((m) => m.slug === slug) ?? null };
});
vi.mock("@/lib/dealers/repository", () => ({ dealerExists: async (id: string) => id === "11111111-1111-4111-8111-111111111111" }));

import { POST } from "@/app/api/test-ride/route";
import { __resetRateLimit } from "@/lib/security/rate-limit";

const future = () => new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
const body = (o: object = {}) => ({
  fullName: "Asha Rao", mobile: "9876543210", email: "asha@example.com", city: "Pune", motorcycleSlug: "r15-v4",
  preferredDate: future(), preferredTimeWindow: "evening", dealerId: "", consent: true, website: "", ...o,
});
const post = (b: unknown, ip = "1.1.1.1", raw?: string) =>
  POST(new Request("http://x/api/test-ride", { method: "POST", headers: { "x-forwarded-for": ip, "content-type": "application/json" }, body: raw ?? JSON.stringify(b) }));

beforeEach(() => { __resetRateLimit(); insert.mockReset(); insert.mockResolvedValue({ error: null }); configured = true; });

describe("POST /api/test-ride", () => {
  it("persists a valid request and returns a pending reference (not a confirmed booking)", async () => {
    const res = await post(body());
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.referenceCode).toMatch(/^TR-[0-9A-F]{8}$/);
    expect(json.status).toBe("pending");
    expect(insert).toHaveBeenCalledOnce();
    expect(insert.mock.calls[0]![0]).toMatchObject({ phone: "9876543210", status: "pending", motorcycle_slug: "r15-v4" });
  });

  it("returns field errors for invalid input and writes nothing", async () => {
    const res = await post(body({ mobile: "123", consent: false }));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error.fields).toHaveProperty("mobile");
    expect(json.error.fields).toHaveProperty("consent");
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects unknown model slugs", async () => {
    const res = await post(body({ motorcycleSlug: "does-not-exist" }));
    expect(res.status).toBe(422);
    expect((await res.json()).error.fields).toHaveProperty("motorcycleSlug");
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects unknown dealer ids", async () => {
    const res = await post(body({ dealerId: "22222222-2222-4222-8222-222222222222" }));
    expect(res.status).toBe(422);
    expect((await res.json()).error.fields).toHaveProperty("dealerId");
  });

  it("rejects malformed JSON and oversized payloads", async () => {
    expect((await post(null, "2.2.2.2", "{nope")).status).toBe(400);
    expect((await post(null, "3.3.3.3", JSON.stringify({ x: "a".repeat(9000) }))).status).toBe(413);
  });

  it("rate limits repeated submissions from one IP", async () => {
    for (let i = 0; i < 5; i++) await post(body(), "9.9.9.9");
    const res = await post(body(), "9.9.9.9");
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });

  it("never claims success when the database is not configured", async () => {
    configured = false;
    const res = await post(body());
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("DATABASE_NOT_CONFIGURED");
  });

  it("returns a safe error when the insert fails", async () => {
    insert.mockResolvedValue({ error: new Error("secret connection string") });
    const res = await post(body());
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("secret");
  });
});
