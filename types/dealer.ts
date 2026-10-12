export interface Dealer {
  id: string;
  name: string;
  city: string;
  postalCode: string;
  address: string;
  phone: string | null;
  openingHours: string | null;
  isVerified: boolean;
  sourceUrl: string | null;
}
