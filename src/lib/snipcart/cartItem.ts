/**
 * Derives Snipcart data-item-* attributes for a product detail page from
 * its already-resolved display props and routing context.
 *
 * URL resolution is intentionally the caller's job, not this function's:
 * building the canonical per-variant URL needs `Astro.site`, which only
 * exists inside `.astro` frontmatter, so passing the final string in here
 * keeps this module Astro-free and independently testable.
 */
import { stegaClean } from '@sanity/client/stega';
import { buildItemAttributes } from './attributes';
import type { CustomOption } from '../../types/product';

export interface ProductCartItemInput {
  /** The product's display name, e.g. "Cupcakes" (not flavor-prefixed). */
  title: string;
  /** Formatted display price, e.g. "$25.00" — parsed to a number internally. */
  price: string;
  imageSrc: string;
  customOptions: CustomOption[];
  productSlug?: string;
  currentVariantSlug?: string;
  /** Canonical URL for the current variant route, resolved by the caller. */
  url: string;
}

export function buildProductCartAttributes(input: ProductCartItemInput): Record<string, string> {
  const variantGroup = input.customOptions.find((g) => g.definesVariantRoute);
  const selectedVariantOption = input.currentVariantSlug
    ? variantGroup?.options.find((o) => o.slug?.current === input.currentVariantSlug)
    : undefined;
  const rawName = selectedVariantOption ? `${selectedVariantOption.label} ${input.title}` : input.title;
  // Sanity's stega visual-editing encoding (see astro.config.mjs's
  // `stega: { enabled: true }`) injects invisible Unicode into every GROQ
  // string, including title/label here. Harmless for on-page text (the
  // characters don't render), but Snipcart's order data is extracted and
  // displayed verbatim in its dashboard, emails, and receipts — so it must
  // be cleaned before it leaves the page as cart-item data, same as the
  // <title>/meta cleanup in Layout.astro.
  const name = stegaClean(rawName);
  const basePrice = Number(input.price.replace(/[^0-9.]/g, ''));
  const customFieldGroups = input.customOptions.filter((g) => !g.definesVariantRoute);

  const attrs = buildItemAttributes({
    id: `${input.productSlug ?? 'product'}-${input.currentVariantSlug ?? 'default'}`,
    name,
    price: basePrice,
    url: input.url,
    image: input.imageSrc,
    customFields: customFieldGroups.map((group) => ({
      name: stegaClean(group.name),
      // Without `options`, Snipcart renders this field as a free-text box
      // in the cart, letting customers type anything — including values
      // that were never valid choices on the product page. Passing the
      // same labels offered there makes Snipcart render a dropdown
      // instead, constrained to the actual choices.
      type: 'dropdown',
      options: group.options.map((option) => stegaClean(option.label)),
      // Placeholder — kept in sync with the live form selection by
      // cartSync.ts's bindAddToCartSync(), just before Snipcart reads it
      // on click.
      value: '',
    })),
    // Invisible in Snipcart's own cart/checkout UI — exists purely so
    // the custom /cart page (LiveCart.tsx) can recover "product" and
    // "flavor" as separate fields without re-parsing the combined
    // display name, and without a second, non-Snipcart data source.
    metadata: {
      product: stegaClean(input.title),
      flavor: selectedVariantOption ? stegaClean(selectedVariantOption.label) : '',
      category: input.productSlug ?? '',
    },
  });

  // Bookkeeping only — not a Snipcart attribute. cartSync.ts recomputes
  // `data-item-price` on every click from this immutable base plus
  // whichever options are checked at that moment (some options carry a
  // priceModifier, e.g. Personal Cakes' "Custom" frosting is +$3). Storing
  // the base separately means clicking ADD TO CART twice with different
  // selections (the button stays on the page since adding doesn't reload
  // it) always recomputes from the true original price, never compounds
  // on top of a previously-adjusted one.
  attrs['data-base-price'] = String(basePrice);

  return attrs;
}
