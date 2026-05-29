export interface Product {
  _id: string;
  name: string;
  price: number;
  slug: { current: string };
  image: unknown;
  description?: string;
}
