import { beforeEach, describe, expect, it, vi } from "vitest";

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

beforeEach(() => { __resetRateLimit(); });

describe("POST /api/test-ride", () => {
  it("says plainly that nothing was saved for a valid request (no backend)", async () => {
    const res = await post(body());
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("STORAGE_NOT_AVAILABLE");
  });

  it("returns field errors for invalid input", async () => {
    const res = await post(body({ mobile: "123", consent: false }));
    expect(res.status).toBe(422);
  });

  it("rejects an unknown model", async () => {
    const res = await post(body({ motorcycleSlug: "nope" }));
    expect(res.status).toBe(422);
  });

  it("rejects malformed JSON", async () => {
    const res = await post(null, "2.2.2.2", "{bad");
    expect(res.status).toBe(400);
  });
});
