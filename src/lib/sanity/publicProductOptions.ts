/**
 * Browser-side fetch of product pricing/option metadata, used only by
 * LiveCart.tsx (a `client:only` island that never runs on the server) to
 * recompute an item's price when its Quantity/Occasion custom fields are
 * edited inline in the cart. Goes through the same-origin
 * `/api/product-options` endpoint (backed by `sanityClient`) rather than
 * fetching Sanity's query API directly from the browser — direct browser
 * fetches hit the project's Sanity CORS allowlist, which doesn't cover
 * arbitrary dev/preview origins.
 *
 * That endpoint is statically prerendered (this project has no SSR
 * adapter configured) and returns every product's options in one
 * build-time JSON file, so this just fetches the whole map once and
 * picks out the requested slugs client-side.
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
  const res = await fetch('/api/product-options');
  if (!res.ok) return {};
  const all = (await res.json()) as Record<string, ProductOptionsMeta>;
  const picked: Record<string, ProductOptionsMeta> = {};
  for (const slug of slugs) {
    if (all[slug]) picked[slug] = all[slug];
  }
  return picked;
}
