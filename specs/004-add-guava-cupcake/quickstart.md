# Quickstart: Validate Guava Cupcake

## Prerequisites

- Work from `feature/cup-66` after the routed plan is explicitly approved.
- Use the existing authenticated Sanity CLI session for the production dataset mutation.
- Use the verified source image at `/tmp/cup66-guava-no-shadow-source.png` or redownload it and confirm the hashes in [research.md](research.md).

## Validation

1. Query the public Cupcakes document and confirm Guava is present exactly once with `_key`, label, slug, image asset reference, and alt text matching [data-model.md](data-model.md).
2. Run `npm run build`.
3. Confirm `dist/products/index.html` contains one Guava card, its description, image URL, and `/products/cupcakes/guava` link.
4. Confirm `dist/products/cupcakes/guava/index.html` exists and contains:
   - `data-item-id="cupcakes-guava"`
   - `data-item-name="Guava Cupcakes"`
   - `data-item-price="4"`
   - Guava flavor metadata and the verified image URL
5. Parse `dist/snipcart-products.json` and confirm exactly one object has ID `cupcakes-guava`, numeric price `4`, the canonical Guava URL, and the same Quantity and Occasion custom fields as another cupcake flavor.
6. Confirm the generated cupcake variant count increased from seven to eight and every ID is unique.
7. Run `git diff --check`.
8. Review `git diff` and the Sanity query result to ensure no existing flavor, price, or customization data changed.

## Expected outcome

Guava is visible and orderable through the existing Cupcakes flow, its image resolves from Sanity's CDN, its cart identity is `cupcakes-guava`, and no existing flavor behavior changes.
