export interface HotspotDef {
  id: "engine" | "suspension" | "brakes";
  label: string;
  /** Generic fallback text, used only for a model that has no entry in ENGINEERING_MODELS. */
  description: string;
}

export const HOTSPOTS: HotspotDef[] = [
  { id: "engine", label: "Engine", description: "The engine sits low and central to keep mass close to the centre of gravity. Displacement, cylinder layout and power figures for each motorcycle appear in its specification table." },
  { id: "suspension", label: "Suspension", description: "Front forks and a rear shock manage ride quality and tyre contact. Travel, adjustability and damper type vary by model and are listed only where verified." },
  { id: "brakes", label: "Braking", description: "Disc brakes with ABS are common on modern road bikes. Disc size, caliper type and ABS configuration are shown per model only when verified." },
];

type Id = HotspotDef["id"];

/**
 * Models cycled in the home page Engineering section.
 *  - pos:   hotspot positions in % of the 3:2 photo box
 *  - facts: what each system is on THAT model
 * Facts come from third-party spec listings (BikeDekho, Autocar India and similar), checked 2026-10-09. They are
 * not from Yamaha India, and the sources disagree on a few details (those are worded as such). Confirm with
 * Yamaha India or a dealer before relying on them.
 */
export const ENGINEERING_SOURCE = "Source: third-party spec listings (e.g. BikeDekho, Autocar India), checked 9 Oct 2026. Not from Yamaha; confirm with a dealer.";

const DEFAULT_POS = { engine: { left: "46%", top: "66%" }, suspension: { left: "70%", top: "52%" }, brakes: { left: "78%", top: "72%" } };

export const ENGINEERING_MODELS: { slug: string; pos: Record<Id, { left: string; top: string }>; facts: Record<Id, string> }[] = [
  {
    slug: "r15-v4", pos: DEFAULT_POS,
    facts: {
      engine: "155 cc liquid-cooled, single-cylinder SOHC 4-valve engine with Variable Valve Actuation, making about 18.4 PS and 14.2 Nm. It runs a 6-speed gearbox with a quickshifter and a wet multi-plate clutch, and has traction control with Track and Street riding modes.",
      suspension: "A 37 mm upside-down front fork and a linked-type monocross rear shock, mounted on a Deltabox frame. Tubeless 17-inch tyres: 100/80 at the front and 140/70 at the rear.",
      brakes: "A 282 mm front disc with a 2-piston caliper and a 220 mm rear disc with a 1-piston caliper, backed by dual-channel ABS.",
    },
  },
  {
    slug: "mt-15-v2", pos: DEFAULT_POS,
    facts: {
      engine: "155 cc liquid-cooled, single-cylinder SOHC 4-valve engine with Variable Valve Actuation: about 18.4 PS at 10,000 rpm and 14.1 Nm at 7,500 rpm. A 6-speed gearbox with a wet multi-plate clutch (slipper function listed) and traction control.",
      suspension: "A 37 mm upside-down front fork and a linked-type monocross rear shock. Tubeless 17-inch tyres: 100/80 at the front and 140/70 at the rear.",
      brakes: "A 282 mm front disc (2-piston caliper) and a 220 mm rear disc (1-piston caliper), with dual-channel ABS.",
    },
  },
  {
    slug: "xsr-155",
    pos: { engine: { left: "46%", top: "66%" }, suspension: { left: "66%", top: "52%" }, brakes: { left: "77%", top: "72%" } },
    facts: {
      engine: "155 cc liquid-cooled, 4-valve single-cylinder engine making about 18.4 PS, with a 6-speed gearbox and a slipper clutch. It sits in a Deltabox frame.",
      suspension: "A front fork and a linked-type monocross rear shock with preload adjustment. Listings differ on whether the fork is telescopic or upside-down, so check the variant. Tubeless 17-inch tyres: 100/80 at the front and 140/70 at the rear.",
      brakes: "A 282 mm front disc and a 220 mm rear disc, with dual-channel ABS.",
    },
  },
  {
    slug: "fz-x",
    pos: { engine: { left: "49%", top: "59%" }, suspension: { left: "68%", top: "52%" }, brakes: { left: "77%", top: "72%" } },
    facts: {
      engine: "149 cc air-cooled, SOHC 2-valve, fuel-injected single-cylinder engine: about 12.4 PS at 7,250 rpm and 13.3 Nm at 5,500 rpm, through a 5-speed gearbox and wet multi-plate clutch. Traction control is listed.",
      suspension: "A 41 mm telescopic front fork with a fork boot, and a 7-step adjustable monocross rear shock, on a single-downtube frame. 17-inch alloy wheels with tubeless radial tyres.",
      brakes: "A 282 mm front disc with a 2-piston caliper and a 220 mm rear disc. Most listings give single-channel ABS; one review says dual-channel.",
    },
  },
  {
    slug: "fz-s-fi",
    pos: { engine: { left: "49%", top: "60%" }, suspension: { left: "69%", top: "52%" }, brakes: { left: "78%", top: "72%" } },
    facts: {
      engine: "149 cc air-cooled, SOHC 2-valve, fuel-injected single-cylinder engine: about 12.4 PS and 13.3 Nm at 5,500 rpm, with a 5-speed gearbox and a wet multi-plate clutch.",
      suspension: "A telescopic front fork and a 7-step adjustable monocross rear shock.",
      brakes: "Front and rear disc brakes (the front is listed at 282 mm on the V4 DLX) with ABS. Listings do not agree on the ABS channel setup.",
    },
  },
  {
    slug: "aerox-155",
    pos: { engine: { left: "36%", top: "64%" }, suspension: { left: "69%", top: "59%" }, brakes: { left: "77%", top: "73%" } },
    facts: {
      engine: "155 cc liquid-cooled, SOHC 4-valve single-cylinder engine: about 15 PS at 8,000 rpm and 13.9 Nm at 6,500 rpm. A V-belt automatic (CVT) with a dry centrifugal clutch, so there are no gears to shift.",
      suspension: "A telescopic front fork and a unit-swing rear with twin shock absorbers. Tubeless 14-inch tyres: 110/80 at the front and 140/70 at the rear.",
      brakes: "A 230 mm front disc with a 1-piston caliper and a 130 mm rear drum, with single-channel ABS.",
    },
  },
];
