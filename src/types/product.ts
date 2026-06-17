export interface ProductCategory {
  _id: string;
  title: string;
  slug: { current: string };
  heading?: string;
  caption?: string;
  displayOrder?: number;
}

export interface CustomOptionValue {
  label: string;
  /** Added to the product's base price when this option is selected, e.g. 3 for +$3.00. */
  priceModifier?: number;
  slug?: { current: string };
  image?: unknown;
}

export interface CustomOption {
  name: string;
  inputType: 'radio' | 'checkbox';
  helperText?: string;
  definesVariantRoute?: boolean;
  options: CustomOptionValue[];
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  slug: { current: string };
  category: ProductCategory;
  image: unknown;
  description?: string;
  subtitle?: string;
  servingInfo?: string;
  /** Selection groups shown on the order page, e.g. Flavor, Frosting Color. Absence renders no sections. */
  customOptions?: CustomOption[];
}
