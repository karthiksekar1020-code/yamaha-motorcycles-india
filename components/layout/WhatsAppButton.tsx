"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { useCompare } from "@/components/compare/CompareProvider";
import { WHATSAPP_URL } from "@/lib/config";

/** Floating "chat on WhatsApp" button, bottom-right on every page. It lifts above the compare tray when that is showing. */
export function WhatsAppButton() {
  const { items } = useCompare();
  const path = usePathname();
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const on = () => setShowTop(window.scrollY > 400);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const lifted = items.length > 0 && path !== "/compare";
  return (
    <>
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
      aria-label="Back to top"
      title="Back to top"
      tabIndex={showTop ? 0 : -1}
      className={`fixed right-4 z-50 grid h-12 w-12 place-items-center rounded-full bg-blue text-white shadow-lg shadow-black/40 transition duration-300 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:right-6 ${showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"} ${lifted ? "bottom-[10.5rem] md:bottom-[10.5rem]" : "bottom-[5.5rem] md:bottom-[6.5rem]"}`}
    >
      <ArrowUp size={22} aria-hidden />
    </button>
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Vignesh Bikez on WhatsApp"
      title="Chat on WhatsApp"
      className={`fixed right-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/40 transition duration-300 hover:scale-110 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:right-6 ${lifted ? "bottom-24 md:bottom-24" : "bottom-5 md:bottom-6"}`}
    >
      <svg viewBox="0 0 32 32" width="30" height="30" fill="currentColor" aria-hidden="true">
        <path d="M16.003 3C8.83 3 3 8.83 3 16c0 2.29.6 4.52 1.74 6.49L3 29l6.7-1.72A12.94 12.94 0 0 0 16.003 29C23.17 29 29 23.17 29 16S23.17 3 16.003 3Zm0 23.6c-1.97 0-3.9-.53-5.58-1.53l-.4-.24-3.98 1.02 1.06-3.88-.26-.4A10.6 10.6 0 0 1 5.4 16c0-5.9 4.8-10.6 10.6-10.6S26.6 10.1 26.6 16s-4.8 10.6-10.6 10.6Zm5.82-7.93c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.19.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.57-.94-.84-1.58-1.88-1.76-2.2-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.98-2.34-.26-.62-.52-.53-.71-.54l-.61-.01c-.21 0-.56.08-.85.4-.29.32-1.11 1.08-1.11 2.64s1.14 3.07 1.3 3.28c.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.14-1.51.27-.74.27-1.37.19-1.51-.08-.13-.29-.21-.61-.37Z" />
      </svg>
    </a>
    </>
  );
}
