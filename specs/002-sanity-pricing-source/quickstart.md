# Quickstart: Validate Sanity-Backed Display Pricing

## Prerequisites

- Existing repository environment variables are available.
- The Sanity dataset contains `cupcakes` and `personal-cakes` products with valid numeric base prices.
- Dependencies are already installed.

## 1. Confirm duplicate repository pricing is gone

```sh
rg -n '\$4(\.00)? each|\$25(\.00)?|"price"' src/components/home/CupcakeCarousel.astro src/content/home/personal-cakes.json src/content/products/cupcakes.json src/content/products/personal-cakes.json src/pages/products/preview-personal-cake.astro
```

Expected: no numeric cupcake or Personal Cake price and no marketing `price` field is present in the targets.

## 2. Inspect catalog resolution

Confirm `src/pages/index.astro`, `src/pages/products/index.astro`, and `src/pages/products/preview-personal-cake.astro` resolve the appropriate product slug through `getRequiredProductPriceBySlug` and pass the result into their components.

## 3. Optional CI/generated-output verification

The user explicitly waived another local build for this change. CI may run the normal build; if generated output is inspected there, verify:

```sh
rg -n '\$4\.00 each|\$25\.00|"basePrice":(4|25)' dist/index.html dist/products/index.html dist/products/cupcakes dist/products/personal-cakes dist/api/product-options/index.html
```

Expected:

- Homepage cupcake cards show `$4.00 each`.
- Every products-page cupcake flavor card shows `$4.00 each`.
- Homepage, products-page, preview, and detail Personal Cake surfaces show `$25.00`.
- Generated cupcake product pages retain base price `4`.
- Generated product options retain base price `4` and the existing modifiers.

If the catalog price is intentionally changed for validation, substitute that amount in the search and restore the catalog afterward.

## 4. Confirm transactional pricing is unchanged

If CI output is inspected, confirm product detail and product-options data retain current base prices and modifiers for both product types.

## 5. Verify explicit failure behavior

Inspect `getRequiredProductPriceBySlug` and confirm both page entry points and the preview use it. Expected: missing or invalid catalog pricing throws a descriptive error and no repository fallback exists. Do not mutate a dataset or run a local build for this task.
