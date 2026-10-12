import type { Dealer } from "../../types/dealer";

/**
 * LOCAL DEALER LIST: used when Supabase is not configured.
 *
 * Entries with `isVerified: false` are UNVERIFIED LISTINGS copied from third-party sites. The dealer page shows
 * them with an "Unverified listing" label, and they are never offered in the test-ride form. To promote one, check it
 * against Yamaha Motor India's dealer locator (or by phone), put that source in `sourceUrl` and set `isVerified: true`.
 *
 * Add dealers here ONLY from a source you trust, ideally Yamaha Motor India's own dealer locator, and put
 * that page in `sourceUrl`. Do not set `isVerified` for entries you have not checked yourself. Aggregator listings
 * are not enough: addresses and phone numbers there go out of date.
 *
 * Example entry (fictional, for format only):
 * {
 *   id: "chennai-anna-nagar",            // any unique string
 *   name: "Dealer name as listed by Yamaha",
 *   city: "Chennai",
 *   postalCode: "600040",                // exactly 6 digits
 *   address: "Street address",
 *   phone: "+91 98765 43210",            // or null
 *   openingHours: "Mon-Sat 9:30 am - 7:30 pm", // or null
 *   isVerified: true,
 *   sourceUrl: "https://...",            // where you verified it
 * },
 */
const BIKEWALE = "https://www.bikewale.com/dealer-showrooms/yamaha/pondicherry/";

export const LOCAL_DEALERS: Dealer[] = [
  // Pondicherry, from BikeWale / Bikes4Sale / 91wheels listings (collected 2026-10-12). Not verified with Yamaha.
  { id: "pondicherry-srinivasa-mudaliarpet", name: "Srinivasa Motors", city: "Pondicherry", postalCode: "605004", address: "Shop No. 1-3, Yeshoda Bhavan, 100 Feet Road, Sundara Raja Nagar, Mudaliarpet", phone: null, openingHours: null, isVerified: false, sourceUrl: BIKEWALE },
  { id: "pondicherry-srinivasa-muthialpet", name: "Srinivasa Motors (Muthialpet)", city: "Pondicherry", postalCode: "605003", address: "D No-92, M G Road, Ward-A, Block No 2, Muthialpet", phone: "+91 82200 53352", openingHours: null, isVerified: false, sourceUrl: BIKEWALE },
  { id: "pondicherry-ams-motors", name: "A M S Motors", city: "Pondicherry", postalCode: "605009", address: "302, Vazhudavur Road", phone: null, openingHours: null, isVerified: false, sourceUrl: BIKEWALE },
  // BikeWale lists this shop as "Indian Bikkes"; Bikes4Sale lists the same address and phone as "Sri Sasan Motors".
  { id: "pondicherry-sri-sasan-villianoor", name: "Sri Sasan Motors", city: "Pondicherry", postalCode: "605110", address: "No 29, Villupuram Main Road, Villianoor", phone: "+91 99408 05523", openingHours: null, isVerified: false, sourceUrl: "https://www.bikes4sale.in/new-bike-showrooms/dealer/yamaha/pondicherry/pondicherry/7253/sri-sasan-motors" },
  { id: "pondicherry-sedarapet-yamaha", name: "Sedarapet Yamaha Motors", city: "Pondicherry", postalCode: "605111", address: "No 5, G.V Complex, Mailam Main Road, Sedarapet", phone: "+91 97510 11951", openingHours: null, isVerified: false, sourceUrl: BIKEWALE },
];
