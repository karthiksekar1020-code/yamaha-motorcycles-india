import { isLang, LANGS, type Dict, type Lang, type LangInfo } from "./langs";
import { withTitles } from "./titles";
import en from "./dicts/en";
import hi from "./dicts/hi";
import bn from "./dicts/bn";
import mr from "./dicts/mr";
import te from "./dicts/te";
import ta from "./dicts/ta";
import gu from "./dicts/gu";
import kn from "./dicts/kn";
import ml from "./dicts/ml";
import pa from "./dicts/pa";
import or from "./dicts/or";

/**
 * Server and test entry point that holds every language. Client components must NOT import this file: they import
 * `./langs` (tiny) and receive one dictionary from the server, loading others on demand through `./load`.
 */
export { isLang, LANGS };
export type { Dict, Lang, LangInfo };

export const MESSAGES: Record<Lang, Dict> = {
  en: withTitles(en), hi: withTitles(hi), bn: withTitles(bn), mr: withTitles(mr), te: withTitles(te),
  ta: withTitles(ta), gu: withTitles(gu), kn: withTitles(kn), ml: withTitles(ml), pa: withTitles(pa), or: withTitles(or),
};

/** Looks up a key in the chosen language, falling back to English, then to the key itself. */
export function translate(lang: Lang, key: string): string {
  return MESSAGES[lang][key] ?? MESSAGES.en[key] ?? key;
}
