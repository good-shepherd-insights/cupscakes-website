# Research: Sanity-Backed Display Pricing

## Decision 1: Resolve marketing prices during static generation

- **Decision**: Fetch the cupcake base price in the server-side frontmatter of the homepage and products index during the existing build.
- **Rationale**: Both pages are statically generated already, the configured Sanity client is available there, and customers receive complete HTML without a loading state or browser-side CORS dependency.
- **Alternatives considered**:
  - Browser fetch from `/api/product-options`: rejected because it would add a loading state and client JavaScript for data already available at build time.
  - Retain synchronized JSON values: rejected because synchronization is unenforced and caused the current drift risk.

## Decision 2: Add a focused required-price query

- **Decision**: Add a query-layer function that accepts a product slug, returns its valid numeric price, and throws a descriptive error if the product or price is absent/invalid.
- **Rationale**: Pages need only one field, and explicit failure prevents a deploy containing guessed or stale pricing.
- **Alternatives considered**:
  - Fetch all product fields through `getAllProducts()`: valid but unnecessarily broad for two price-only consumers.
  - Return a fallback value: rejected because any repository fallback recreates a second source of truth.

## Decision 3: Keep presentation formatting centralized

- **Decision**: Add one shared currency formatter plus a per-item wrapper for `$0.00` and `$0.00 each`, and pass numeric prices into the marketing components.
- **Rationale**: The catalog owns the number while the application owns presentation. A single formatter prevents differences in decimal precision or suffix spacing.
- **Alternatives considered**:
  - Store the formatted string in Sanity: rejected because `price` is correctly modeled as a number used by checkout calculations.
  - Format independently in each component: rejected under the constitution's single-source principle.

## Decision 4: Remove only duplicated price fields from marketing content and preview code

- **Decision**: Delete cupcake and Personal Cake `price` fields from home/products content and matching schema/type paths, and replace the preview route literal; retain names, descriptions, images, alternate text, and links.
- **Rationale**: Those fields remain legitimate marketing content, while the duplicated price is the defect in scope.
- **Alternatives considered**:
  - Migrate every flavor-card field into Sanity: rejected as a materially larger content-model migration not required to correct pricing authority.

## Verified repository constraints

- Product detail pages already obtain `product.price` through the Sanity product query.
- The cart's generated options endpoint already obtains base prices and modifiers from Sanity.
- The repository has a real `build` script but no `test` or `lint` scripts.
- Sanity uses `useCdn: false`, so the build queries authoritative dataset data rather than cached CDN responses.
