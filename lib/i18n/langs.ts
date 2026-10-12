export type Lang = "en" | "hi" | "bn" | "mr" | "te" | "ta" | "gu" | "kn" | "ml" | "pa" | "or";

export interface LangInfo {
  code: Lang;
  /** Name in its own script. */
  label: string;
  /** Short badge shown on the button. */
  short: string;
  /** BCP-47 tag applied to <html lang>. */
  tag: string;
}

export const LANGS: LangInfo[] = [
  { code: "en", label: "English", short: "EN", tag: "en-IN" },
  { code: "ta", label: "தமிழ்", short: "தமி", tag: "ta-IN" },
  { code: "hi", label: "हिन्दी", short: "हिं", tag: "hi-IN" },
  { code: "bn", label: "বাংলা", short: "বাং", tag: "bn-IN" },
  { code: "mr", label: "मराठी", short: "मरा", tag: "mr-IN" },
  { code: "te", label: "తెలుగు", short: "తెలు", tag: "te-IN" },
  { code: "gu", label: "ગુજરાતી", short: "ગુજ", tag: "gu-IN" },
  { code: "kn", label: "ಕನ್ನಡ", short: "ಕನ್ನ", tag: "kn-IN" },
  { code: "ml", label: "മലയാളം", short: "മല", tag: "ml-IN" },
  { code: "pa", label: "ਪੰਜਾਬੀ", short: "ਪੰਜਾ", tag: "pa-IN" },
  { code: "or", label: "ଓଡ଼ିଆ", short: "ଓଡ଼ି", tag: "or-IN" },
];

export type Dict = Record<string, string>;

export const isLang = (v: unknown): v is Lang => typeof v === "string" && LANGS.some((l) => l.code === v);
