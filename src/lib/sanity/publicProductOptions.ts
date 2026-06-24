/**
 * Browser-side fetch of product pricing/option metadata, used only by
 * LiveCart.tsx (a `client:only` island that never runs on the server) to
 * recompute an item's price when its Quantity/Occasion custom fields are
 * edited inline in the cart. Goes through the same-origin
 * `/api/product-options` endpoint (backed by `sanityClient`) rather than
 * fetching Sanity's query API directly from the browser — direct browser
 * fetches hit the project's Sanity CORS allowlist, which doesn't cover
 * arbitrary dev/preview origins.
 */
export interface ProductOptionGroup {
  name: string;
  options: { label: string; priceModifier: number }[];
}

export interface ProductOptionsMeta {
  basePrice: number;
  groups: ProductOptionGroup[];
}

export async function fetchProductOptionsBySlug(
  slugs: string[]
): Promise<Record<string, ProductOptionsMeta>> {
  if (slugs.length === 0) return {};
  const res = await fetch(`/api/product-options?slugs=${encodeURIComponent(slugs.join(','))}`);
  if (!res.ok) return {};
  return (await res.json()) as Record<string, ProductOptionsMeta>;
}
