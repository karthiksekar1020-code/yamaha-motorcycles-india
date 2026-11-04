/**
 * When true, refreshing the browser (F5, Ctrl+R or the reload button) on any page takes the visitor to the
 * home page, scrolled to the top. Normal links, the back button and typed or bookmarked URLs are unaffected.
 * Set to false to make a refresh stay on the current page.
 */
export const REFRESH_GOES_HOME = true;

/**
 * The brand intro animation (name fills the screen, shrinks, then flies into the header logo).
 * true: plays once per browser tab session. false: plays on every page load and refresh.
 * It is always skipped for visitors who prefer reduced motion.
 */
export const INTRO_ONCE_PER_SESSION = false;

/** Dealership details shown in the header, footer, Contact page and About page. Edit here to change them everywhere. */
export const SHOP = {
  name: "Vignesh Bikez - Yamaha, Pondicherry",
  shortName: "Vignesh Bikez",
  addressLines: ["No. 126, 100 Feet Road", "Ozhandhai Keerapalayam, Mudaliarpet", "Puducherry - 605004"],
  phones: [
    { display: "+91 90474 77091", tel: "+919047477091" },
    { display: "+91 90474 00551", tel: "+919047400551" },
  ],
} as const;
export const SHOP_ADDRESS_LINES = SHOP.addressLines;
export const SHOP_ADDRESS_ONE_LINE = SHOP.addressLines.join(", ");
export const SHOP_MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${SHOP.name}, ${SHOP_ADDRESS_ONE_LINE}`)}`;

/** WhatsApp chat link (country code + number, no "+"). Opens a chat with the showroom with a ready-typed message. */
export const WHATSAPP_NUMBER = "919047477091";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi Vignesh Bikez, I would like to know more about Yamaha bikes.")}`;

/** Social media profiles shown in the footer. */
export const SOCIAL_LINKS = [
  { id: "youtube", label: "YouTube", href: "https://www.youtube.com/channel/UCFKA8_JgrQNEDb7luTmgn9Q" },
  { id: "facebook", label: "Facebook", href: "https://www.facebook.com/VigneshNissan" },
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/yamaha_vignesh_bikez/" },
  { id: "x", label: "X (Twitter)", href: "https://x.com/VigneshMoteurx" },
  { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/company/69943655" },
] as const;
