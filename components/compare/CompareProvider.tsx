"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { MAX_COMPARE } from "@/lib/utils/format";

interface Item { slug: string; name: string }
interface Ctx {
  items: Item[];
  slugs: string[];
  has: (slug: string) => boolean;
  toggle: (item: Item) => "added" | "removed" | "full";
  remove: (slug: string) => void;
  clear: () => void;
}

const CompareContext = createContext<Ctx | null>(null);
const KEY = "ymi.compare"; // stores only public model slugs/names, nothing sensitive

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    try {
      const v = JSON.parse(sessionStorage.getItem(KEY) ?? "[]");
      if (Array.isArray(v)) setItems(v.filter((i) => typeof i?.slug === "string" && typeof i?.name === "string").slice(0, MAX_COMPARE));
    } catch {}
  }, []);

  const persist = useCallback((next: Item[]) => {
    setItems(next);
    try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }, []);

  const toggle = useCallback<Ctx["toggle"]>((item) => {
    if (items.some((i) => i.slug === item.slug)) { persist(items.filter((i) => i.slug !== item.slug)); return "removed"; }
    if (items.length >= MAX_COMPARE) return "full";
    persist([...items, item]);
    return "added";
  }, [items, persist]);

  const value = useMemo<Ctx>(() => ({
    items, slugs: items.map((i) => i.slug), has: (s) => items.some((i) => i.slug === s), toggle,
    remove: (s) => persist(items.filter((i) => i.slug !== s)), clear: () => persist([]),
  }), [items, toggle, persist]);

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const c = useContext(CompareContext);
  if (!c) throw new Error("useCompare must be used within CompareProvider");
  return c;
}
