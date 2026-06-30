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
import { buildItemAttributes, type CustomField } from './attributes';
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

  // Snipcart's two native price-modifier formats differ by field type (v3 docs):
  //   dropdown option:  "Custom[+3.00]"   — docs verbatim "Brown[+100.00]"
  //   checkbox option:  "true[3.00]|false" — docs verbatim "true[10]|false"
  const modDropdown = (m: number): string =>
    m ? `[${m > 0 ? '+' : '-'}${Math.abs(m).toFixed(2)}]` : '';
  const modCheckbox = (m: number): string => (m ? `[${m.toFixed(2)}]` : '');

  // Build the Snipcart custom fields AND a parallel list of sync descriptors,
  // in the same order, so cartSync.ts can fill each field's value from the
  // live form at click time. One single-choice (radio) group -> one dropdown
  // field. One multi-choice (checkbox) group -> one readonly display field
  // (the chosen colors, no price) plus one native checkbox field per *priced*
  // option (e.g. Custom +$3); free colors ride the display field only.
  const fields: CustomField[] = [];
  const syncDescriptors: string[] = [];

  for (const group of customFieldGroups) {
    const groupName = stegaClean(group.name);
    if (group.inputType === 'checkbox') {
      // Display field: shows the chosen colors in the cart. No `options`
      // means Snipcart treats it as free input and does not price-validate
      // it (validation only covers fields that are required or change price).
      fields.push({ name: groupName, type: 'readonly', value: '' });
      syncDescriptors.push(`multi:${groupName}`);
      for (const option of group.options) {
        if (!option.priceModifier) continue;
        const label = stegaClean(option.label);
        fields.push({
          name: `${groupName}: ${label}`,
          type: 'checkbox',
          options: [`true${modCheckbox(option.priceModifier)}`, 'false'],
          value: 'false',
        });
        syncDescriptors.push(`flag:${groupName}:${label}`);
      }
    } else {
      fields.push({
        name: groupName,
        type: 'dropdown',
        options: group.options.map(
          (option) => `${stegaClean(option.label)}${modDropdown(option.priceModifier ?? 0)}`
        ),
        value: '',
      });
      syncDescriptors.push(`single:${groupName}`);
    }
  }

  const attrs = buildItemAttributes({
    id: `${input.productSlug ?? 'product'}-${input.currentVariantSlug ?? 'default'}`,
    // True base price. Snipcart adds the selected options' modifiers itself
    // and recomputes on quantity change; the crawler validates base price +
    // declared modifiers. (Docs: data-item-price is the standalone base.)
    name,
    price: basePrice,
    url: input.url,
    image: input.imageSrc,
    customFields: fields,
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

  // Our own sync metadata, aligned 1:1 with data-item-customN-*, read only by
  // cartSync.ts to set each field's value from the live form at click time.
  // Never sent to Snipcart; has no bearing on validation.
  syncDescriptors.forEach((descriptor, i) => {
    attrs[`data-sync${i + 1}`] = descriptor;
  });

  return attrs;
}
