# Quickstart: Validate Sanity-Backed Display Pricing

## Prerequisites

- Existing repository environment variables are available.
- The Sanity dataset contains `cupcakes` and `personal-cakes` products with valid numeric base prices.
- Dependencies are already installed.

## 1. Confirm duplicate repository pricing is gone

```sh
rg -n '\$3\.75 each|\$25(\.00)?|"price"' src/components/home/CupcakeCarousel.astro src/content/home/personal-cakes.json src/content/products/cupcakes.json src/content/products/personal-cakes.json src/pages/products/preview-personal-cake.astro
```

Expected: no numeric cupcake or Personal Cake price and no marketing `price` field is present in the targets.

## 2. Inspect catalog resolution

Confirm `src/pages/index.astro`, `src/pages/products/index.astro`, and `src/pages/products/preview-personal-cake.astro` resolve the appropriate product slug through `getRequiredProductPriceBySlug` and pass the result into their components.

## 3. Optional CI/generated-output verification

The user explicitly waived another local build for this change. CI may run the normal build; if generated output is inspected there, verify:

```sh
rg -n '\$3\.75 each|\$25\.00|"basePrice":(3\.75|25)' dist/index.html dist/products/index.html dist/products/cupcakes dist/products/personal-cakes dist/api/product-options/index.html
```

Expected:

- Homepage cupcake cards show `$3.75 each`.
- Every products-page cupcake flavor card shows `$3.75 each`.
- Homepage, products-page, preview, and detail Personal Cake surfaces show `$25.00`.
- Generated cupcake product pages use base price `3.75`.
- Generated product options use base price `3.75` and the existing modifiers.

The authoritative Sanity `Cupcakes` product record is currently `3.75`; do not hardcode this value in storefront components or content.

For the quantity options, the native Snipcart modifier is the package total minus the `$3.75` base item price. The current values are:

| Quantity | Package total | `priceModifier` |
| --- | ---: | ---: |
| 1/2 Dozen | `$22.50` | `18.75` |
| 1 Dozen | `$45.00` | `41.25` |
| 2 Dozen | `$90.00` | `86.25` |
| 3 Dozen | `$135.00` | `131.25` |
| 4 Dozen | `$180.00` | `176.25` |

This correction addresses the prior oversight where the base price was changed but the quantity modifiers remained calculated from the former `$4.00` base.

## 4. Confirm transactional pricing is unchanged

If CI output is inspected, confirm product detail and product-options data retain current base prices and modifiers for both product types.

## 5. Verify explicit failure behavior

Inspect `getRequiredProductPriceBySlug` and confirm both page entry points and the preview use it. Expected: missing or invalid catalog pricing throws a descriptive error and no repository fallback exists. Do not mutate a dataset or run a local build for this task.
