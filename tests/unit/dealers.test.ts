import { describe, expect, it } from "vitest";
import { cityMatches } from "@/lib/dealers/match";

describe("cityMatches", () => {
  it("matches substrings and forgives typos in longer words", () => {
    expect(cityMatches("Pondicherry", "pondi")).toBe(true);
    expect(cityMatches("Pondicherry", "Pondicerry")).toBe(true);
    expect(cityMatches("Pondicherry", "pondicherri")).toBe(true);
  });
  it("does not match unrelated terms", () => {
    expect(cityMatches("Pondicherry", "Pune")).toBe(false);
    expect(cityMatches("Pondicherry", "Chennai")).toBe(false);
    expect(cityMatches("Pune", "Pu")).toBe(true); // plain substring still works
    expect(cityMatches("Pune", "Pnexx")).toBe(false);
  });
});
