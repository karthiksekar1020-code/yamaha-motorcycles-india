"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Check, Globe } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { LANGS } from "@/lib/i18n/langs";
import { loadDict } from "@/lib/i18n/load";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const current = LANGS.find((l) => l.code === lang)!;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); root.current?.querySelector("button")?.focus(); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-controls={id}
        aria-label={`${t("nav.language")}: ${current.label}`}
        className="flex h-10 items-center gap-1.5 px-2.5 text-xs font-semibold uppercase tracking-[.12em] hover:text-blue-bright"
      >
        <Globe size={18} aria-hidden /><span>{current.short}</span>
      </button>
      {open && (
        <div id={id} role="menu" aria-label={t("nav.language")} className="absolute right-0 top-full z-50 mt-2 max-h-[70vh] min-w-[180px] overflow-y-auto border border-line bg-surface p-1 shadow-xl">
          {LANGS.map((l) => (
            <button
              key={l.code} role="menuitemradio" aria-checked={l.code === lang} lang={l.code}
              onPointerEnter={() => { void loadDict(l.code); }} onFocus={() => { void loadDict(l.code); }} // warm the language chunk before the click
              onClick={() => { setLang(l.code); setOpen(false); }}
              className="flex w-full items-center justify-between gap-4 px-3 py-2.5 text-left text-sm hover:bg-blue/20 aria-checked:text-blue-bright"
            >
              {l.label}{l.code === lang && <Check size={16} aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
