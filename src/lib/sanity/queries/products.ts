import type { Product } from '../../../types/product';
import { sanityClient } from '../client';

const PRODUCT_FIELDS = `
  _id,
  name,
  price,
  slug,
  image,
  description,
  subtitle,
  servingInfo,
  flavors,
  frostingColors,
  quantities,
  occasions
`;

export async function getAllProducts(): Promise<Product[]> {
  return sanityClient.fetch<Product[]>(
    `*[_type == "product" && defined(slug.current)]{ ${PRODUCT_FIELDS} }`
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
