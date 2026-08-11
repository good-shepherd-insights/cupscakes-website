import type { Product, ProductCategory } from '../../../types/product';
import { sanityClient } from '../client';
import { deepStegaClean } from '../stega';

const PRODUCT_FIELDS = `
  _id,
  name,
  price,
  slug,
  category->{ _id, title, slug, heading, caption, displayOrder, anchorHref, seo },
  image,
  description,
  subtitle,
  servingInfo,
  seo,
  structuredData,
  customOptions
`;

export async function getAllProducts(): Promise<Product[]> {
  const products = await sanityClient.fetch<Product[]>(
    `*[_type == "product" && defined(slug.current)]{ ${PRODUCT_FIELDS} }`
  );
  return deepStegaClean(products);
}

export async function getProductsByCategorySlug(categorySlug: string): Promise<Product[]> {
  const products = await sanityClient.fetch<Product[]>(
    `*[_type == "product" && category->slug.current == $categorySlug && defined(slug.current)]{ ${PRODUCT_FIELDS} }`,
    { categorySlug }
  );
  return deepStegaClean(products);
}

export async function getRequiredProductBySlug(productSlug: string): Promise<Product> {
  const product = await sanityClient.fetch<Product | null>(
    `*[_type == "product" && slug.current == $productSlug][0]{ ${PRODUCT_FIELDS} }`,
    { productSlug }
  );

  if (!product) {
    throw new Error(`Product "${productSlug}" is missing from Sanity.`);
  }

  if (typeof product.price !== 'number' || !Number.isFinite(product.price) || product.price < 0) {
    throw new Error(
      `Product "${productSlug}" is missing a valid non-negative price in Sanity.`
    );
  }

  return deepStegaClean(product);
}

export async function getRequiredProductPriceBySlug(productSlug: string): Promise<number> {
  const price = await sanityClient.fetch<unknown>(
    `*[_type == "product" && slug.current == $productSlug][0].price`,
    { productSlug }
  );

  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
    throw new Error(
      `Product "${productSlug}" is missing a valid non-negative price in Sanity.`
    );
  }

  return price;
}

export async function getAllProductCategories(): Promise<ProductCategory[]> {
  const categories = await sanityClient.fetch<ProductCategory[]>(
    `*[_type == "productCategory"] | order(displayOrder asc) { _id, title, slug, heading, caption, displayOrder, anchorHref, seo }`
  );
  return deepStegaClean(categories);
}
