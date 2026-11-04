/** Photos of the Vignesh Bikez showroom (No. 126, 100 Feet Road, Mudaliarpet). Add or reorder cards here. */
export interface ShowroomPhoto {
  id: string;
  src: string;
  width: number;
  height: number;
  tag: string;
  title: string;
  description: string;
  alt: string;
}

export const SHOWROOM_PHOTOS: ShowroomPhoto[] = [
  {
    id: "facade",
    src: "/images/showroom/facade.webp",
    width: 1200,
    height: 1600,
    tag: "Exterior",
    title: "Showroom facade",
    description: "The front of our showroom on 100 Feet Road, with the Yamaha emblem and Vignesh Bikez signage above full-height glass. Finishing work was still under way when this photo was taken.",
    alt: "Front of the Vignesh Bikez showroom with Yamaha and Vignesh Bikez signage, seen through construction scaffolding",
  },
  {
    id: "booking-banner",
    src: "/images/showroom/booking-banner.webp",
    width: 1200,
    height: 1600,
    tag: "Bookings",
    title: "Booking open",
    description: "Our Yamaha Authorized Dealer banner outside the showroom: bookings are open. Call 9047477091 to book your Yamaha.",
    alt: "Yamaha Authorized Dealer Vignesh Bikez banner reading Booking Open, with a scooter and a sports motorcycle and the contact number 9047477091",
  },
  {
    id: "showroom-floor",
    src: "/images/showroom/showroom-floor.webp",
    width: 1200,
    height: 1600,
    tag: "Showroom floor",
    title: "Main display floor",
    description: "A wide, open floor with track lighting and a mesh-panel ceiling, laid out to show the Yamaha lineup in natural light from the street-facing glass.",
    alt: "Inside the Vignesh Bikez showroom: open floor with track lights, mesh ceiling panels and glass frontage",
  },
  {
    id: "display-racks",
    src: "/images/showroom/display-racks.webp",
    width: 1200,
    height: 1600,
    tag: "Accessories & branding",
    title: "Display racks and Yamaha blue wall",
    description: "Wall racks for genuine accessories and merchandise, beside Yamaha blue panelling and an MT-15 2.0 poster.",
    alt: "Showroom wall racks with shelves, a Yamaha MT-15 Version 2.0 poster and blue corrugated panels",
  },
  {
    id: "display-stands",
    src: "/images/showroom/display-stands.webp",
    width: 1200,
    height: 1600,
    tag: "Customer area",
    title: "Display stands and enquiry tables",
    description: "Tables and display stands where our team sits down with you to go through models, colours, prices and finance options.",
    alt: "Showroom interior with enquiry tables, a display stand and wall racks near the glass frontage",
  },
];
