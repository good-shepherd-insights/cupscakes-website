import type { Product, ProductCategory } from '../../../types/product';
import { sanityClient } from '../client';

const PRODUCT_FIELDS = `
  _id,
  name,
  price,
  slug,
  category->{ _id, title, slug, heading, caption, displayOrder },
  image,
  description,
  subtitle,
  servingInfo,
  customOptions
`;

export async function getAllProducts(): Promise<Product[]> {
  return sanityClient.fetch<Product[]>(
    `*[_type == "product" && defined(slug.current)]{ ${PRODUCT_FIELDS} }`
  );
}

export async function getProductsByCategorySlug(categorySlug: string): Promise<Product[]> {
  return sanityClient.fetch<Product[]>(
    `*[_type == "product" && category->slug.current == $categorySlug && defined(slug.current)]{ ${PRODUCT_FIELDS} }`,
    { categorySlug }
  );
}

export async function getAllProductCategories(): Promise<ProductCategory[]> {
  return sanityClient.fetch<ProductCategory[]>(
    `*[_type == "productCategory"] | order(displayOrder asc) { _id, title, slug, heading, caption, displayOrder }`
  );
}
