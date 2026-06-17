export interface Product {
  _id: string;
  name: string;
  price: number;
  slug: { current: string };
  image: unknown;
  description?: string;
  subtitle?: string;
  servingInfo?: string;
  flavors?: string[];
  /** Frosting Color options. Absence hides the section on the order page. */
  frostingColors?: string[];
  /** Quantity options. Absence hides the section on the order page. */
  quantities?: string[];
  occasions?: string[];
}
