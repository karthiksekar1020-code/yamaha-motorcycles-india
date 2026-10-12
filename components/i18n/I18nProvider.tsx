"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isLang, LANGS, type Dict, type Lang } from "@/lib/i18n/langs";
import { loadDict } from "@/lib/i18n/load";

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<Ctx | null>(null);
const KEY = "ymi.lang";

const writeCookie = (l: Lang) => { document.cookie = `${KEY}=${l}; path=/; max-age=31536000; samesite=lax`; };

/**
 * Only the active language's dictionary is sent with the page (`initialDict`, chosen on the server). Other
 * languages are separate chunks fetched when the visitor picks one; the switch happens once the chunk arrives.
 */
export function I18nProvider({ children, initialLang = "en", initialDict }: { children: ReactNode; initialLang?: Lang; initialDict: Dict }) {
  const [state, setState] = useState<{ lang: Lang; dict: Dict }>({ lang: initialLang, dict: initialDict });
  const { lang, dict } = state;

  useEffect(() => {
    // migrate a choice saved before cookies were used
    try {
      const v = localStorage.getItem(KEY);
      if (isLang(v) && initialLang === "en" && v !== "en") {
        writeCookie(v);
        loadDict(v).then((d) => setState({ lang: v, dict: d })).catch(() => { /* offline: stay in English */ });
      }
    } catch {}
  }, [initialLang]);

  useEffect(() => {
    const el = document.documentElement;
    el.lang = LANGS.find((l) => l.code === lang)?.tag ?? "en-IN";
    el.dataset.script = lang === "en" ? "latin" : "indic"; // drives font and casing rules in CSS
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    writeCookie(l);
    try { localStorage.setItem(KEY, l); } catch {}
    loadDict(l).then((d) => setState({ lang: l, dict: d })).catch(() => { /* offline: keep the current language */ });
  }, []);

  const value = useMemo<Ctx>(() => ({ lang, setLang, t: (k) => dict[k] ?? k }), [lang, dict, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const c = useContext(I18nContext);
  if (!c) throw new Error("useI18n must be used within I18nProvider");
  return c;
}

/** Inline translated text, usable from Server Components. */
export function T({ k }: { k: string }) {
  const { t } = useI18n();
  return <>{t(k)}</>;
}
