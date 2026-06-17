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

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return sanityClient.fetch<Product | null>(
    `*[_type == "product" && slug.current == $slug][0]{ ${PRODUCT_FIELDS} }`,
    { slug }
  );
}

export async function getAllProductSlugs(): Promise<Pick<Product, 'slug'>[]> {
  return sanityClient.fetch(`*[_type == "product" && defined(slug.current)]{ slug }`);
}

export async function getAllProductCategories(): Promise<ProductCategory[]> {
  return sanityClient.fetch<ProductCategory[]>(
    `*[_type == "productCategory"] | order(displayOrder asc) { _id, title, slug, heading, caption, displayOrder }`
  );
}
