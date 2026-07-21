# Research: Add Guava Cupcake

## Repository observations

- The public Sanity `Cupcakes` product is document `product-chocolate-cupcake`. Its `_key: "flavor"` option group drives statically generated variant routes.
- `src/pages/products/[slug]/[...variant].astro` generates one route per flavor slug and resolves the selected flavor image without flavor-specific branches.
- `buildProductCartAttributes` derives the unique ID as `productSlug-currentVariantSlug`, the name as `<Flavor> <Product>`, and metadata flavor from the selected route option.
- `src/pages/snipcart-products.json.ts` expands the same route-defining options, calls the shared cart builder, and emits one Snipcart JSON definition per flavor.
- The products landing page is separately driven by `src/content/products/cupcakes.json`, validated by `src/content.config.ts` and local flavor-key types in the two grid components.

## Client asset verification

- Public folder: `https://drive.google.com/drive/folders/1igoSV2x8H55EnyclG4GAT9wXgZvfYkGm`
- File: `C&C_GUAVA_CUPCAKE_002_NO_SHADOW.png`
- Drive file ID: `1oh-BXK0I8lfgOSixk-qBCO0zDMiLGX3X`
- Media: PNG, 4000×4000, RGBA, 5,736,619 bytes
- SHA-1: `fa0b217d6dd22b1bc6c707290a7fe9ed35b7f148`
- SHA-256: `49016389bdd0ff1e6cfd4715e6d7d6c7d5ee8b3a4e094a7a34194d1577621bf6`
- The “Other Angles” folder redirects to Google authentication and is not needed for the primary-image scope.

## Verified Sanity behavior

- The project Assets API uploads an image and creates a `sanity.imageAsset` document with the asset URL and metadata.
- Asset identity is content-hash based, so uploading identical bytes reuses the asset rather than creating a duplicate.
- Sanity recommends targeted patches over document replacement, and authenticated mutations support patching existing documents and inserting array members.

Sources:

- https://www.sanity.io/docs/http-reference/assets
- https://www.sanity.io/docs/content-lake/manage-assets
- https://www.sanity.io/docs/content-lake/http-patches
- https://www.sanity.io/docs/apis-and-sdks/js-client-mutations

## Verified Snipcart behavior

- A Snipcart product definition requires a unique ID, name, and numeric price; its URL is used to validate order integrity.
- Snipcart's JSON crawler accepts an array of product definitions and requires matching `id`, `price`, and `url` fields.
- Products are defined on the merchant site and can be discovered by fetching an HTML page or JSON document; they are not authored as independent catalog records through the Products resource.

Sources:

- https://docs.snipcart.com/v3/setup/products
- https://docs.snipcart.com/v3/configuration/json-crawler
- https://docs.snipcart.com/v3/api-reference/products

## Decision

Reuse the existing data-driven route and checkout pipeline. Upload one verified image, append one Sanity flavor option, append one products-page card, and extend only the existing closed flavor-key types. Do not add special checkout logic, a new product document, a new dependency, or direct Snipcart dashboard mutation.

## Alternatives considered

- **Create a separate top-level Guava product**: rejected because all existing cupcake flavors share the Cupcakes parent product, price, quantity, and occasion configuration.
- **Store the image only in `public/`**: rejected because the product detail route resolves variant imagery from Sanity and the repository already uses Sanity CDN imagery for product cards.
- **Refactor the products grid to query Sanity**: rejected as a broader catalog-architecture change beyond CUP-66.
- **Add gallery images now**: rejected because the ticket supplies one primary no-shadow image and CUP-59 separately owns gallery behavior.
