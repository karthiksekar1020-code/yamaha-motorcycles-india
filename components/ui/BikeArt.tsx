export type BikeVariant = "fairing" | "naked" | "touring";

/** Original line illustration used as a poster / non-WebGL fallback. It is NOT a depiction of any specific model. */
export function BikeArt({ accent = "#1677ff", variant = "fairing", className = "", title }: { accent?: string; variant?: BikeVariant; className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 640 300" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} fill="none">
      <ellipse cx="320" cy="282" rx="270" ry="9" fill="#000" opacity=".5" />
      {[150, 500].map((x) => (
        <g key={x}>
          <circle cx={x} cy="210" r="62" stroke="#2a2e37" strokeWidth="14" />
          <circle cx={x} cy="210" r="44" stroke="#858b96" strokeWidth="2" />
          <circle cx={x} cy="210" r="8" fill="#858b96" />
        </g>
      ))}
      <path d="M500 210 L452 112" stroke="#a5abb5" strokeWidth="8" strokeLinecap="round" />
      <path d="M150 210 L280 186" stroke="#3a3f4a" strokeWidth="10" strokeLinecap="round" />
      <rect x="270" y="168" width="104" height="52" rx="12" fill="#1d2027" stroke="#3a3f4a" />
      {variant === "fairing" && (
        <>
          <path d="M470 150 L428 114 L340 98 L258 104 L206 130 L188 162 L262 184 L352 190 L432 178Z" fill={accent} opacity=".92" />
          <path d="M470 150 L430 120 L404 152Z" fill="#fff" opacity=".18" />
        </>
      )}
      {variant === "naked" && (
        <>
          <path d="M420 122 L340 106 L270 112 L236 140 L256 170 L342 174 L410 162Z" fill={accent} opacity=".92" />
          <circle cx="452" cy="132" r="20" fill="#e9f1ff" stroke="#858b96" strokeWidth="3" />
        </>
      )}
      {variant === "touring" && (
        <>
          <path d="M476 130 L432 96 L346 88 L260 98 L214 134 L240 176 L352 186 L442 170Z" fill={accent} opacity=".92" />
          <path d="M436 94 L470 78 L466 126Z" fill="#9cc2ff" opacity=".5" />
        </>
      )}
      <path d="M206 128 Q170 124 150 150 L214 152Z" fill="#14161b" />
      <path d="M214 124 L304 118 L304 134 L220 140Z" fill="#0b0c0f" />
      <path d="M432 112 L394 96" stroke="#d5d9e2" strokeWidth="6" strokeLinecap="round" />
      <path d="M160 190 L262 208 L366 220" stroke="#858b96" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

export const variantFor = (category: string): BikeVariant => (category === "Supersport" ? "fairing" : category === "Sport Touring" ? "touring" : "naked");
