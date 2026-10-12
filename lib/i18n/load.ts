import type { Dict, Lang } from "./langs";
import { withTitles } from "./titles";

/** One chunk per language: the browser downloads a dictionary only when that language is chosen. */
const LOADERS: Record<Lang, () => Promise<{ default: Dict }>> = {
  en: () => import("./dicts/en"), hi: () => import("./dicts/hi"), bn: () => import("./dicts/bn"),
  mr: () => import("./dicts/mr"), te: () => import("./dicts/te"), ta: () => import("./dicts/ta"),
  gu: () => import("./dicts/gu"), kn: () => import("./dicts/kn"), ml: () => import("./dicts/ml"),
  pa: () => import("./dicts/pa"), or: () => import("./dicts/or"),
};

export const loadDict = async (lang: Lang): Promise<Dict> => withTitles((await LOADERS[lang]()).default);
