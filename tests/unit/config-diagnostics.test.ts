import { afterEach, describe, expect, it } from "vitest";
import { configDiagnostics } from "@/lib/supabase/config";

const saved = { ...process.env };
afterEach(() => { process.env = { ...saved }; });
const set = (url?: string, anon?: string, service?: string) => {
  for (const [k, v] of [["SUPABASE_URL", url], ["SUPABASE_ANON_KEY", anon], ["SUPABASE_SERVICE_ROLE_KEY", service]] as const) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
};

describe("configDiagnostics", () => {
  it("names every missing variable", () => {
    set("", "");
    expect(configDiagnostics()).toEqual({ missing: ["SUPABASE_URL", "SUPABASE_ANON_KEY"], problems: [] });
    set();
    expect(configDiagnostics().missing).toEqual(["SUPABASE_URL", "SUPABASE_ANON_KEY"]);
  });

  it("accepts a well-formed project address and key", () => {
    set("https://abcdefgh.supabase.co", "x".repeat(40), "y".repeat(40));
    expect(configDiagnostics()).toEqual({ missing: [], problems: [] });
  });

  it("explains common mistakes without revealing any value", () => {
    set("abcdefgh.supabase.co", "short", "short");
    const d = configDiagnostics();
    expect(d.problems.join(" ")).toMatch(/not a valid web address/);
    expect(d.problems.join(" ")).toMatch(/incomplete/);
    expect(d.problems.join(" ")).toMatch(/identical/);
    set("https://abcdefgh.supabase.co/rest/v1/", "z".repeat(40));
    expect(configDiagnostics().problems.join(" ")).toMatch(/nothing after it/);
    set("http://example.com", "z".repeat(40));
    expect(configDiagnostics().problems.join(" ")).toMatch(/https/);
    for (const d2 of [configDiagnostics()]) expect(JSON.stringify(d2)).not.toContain("z".repeat(40));
  });
});
