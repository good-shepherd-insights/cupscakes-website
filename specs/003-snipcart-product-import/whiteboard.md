# Whiteboard: Snipcart JSON Product Import Document

## Status

**Prepared JSON plan — explicitly approved by the user on 2026-07-21.**

## Contract

- Create only `src/pages/snipcart-products.json.ts`.
- Return one static JSON object per Sanity product variant.
- Reuse `getAllProducts`, `routes`, and `buildProductCartAttributes`.
- Translate the shared checkout attributes into Snipcart's documented `id`, `name`, `price`, `url`, and `customFields` JSON representation.
- Keep existing absolute product pages as validation URLs.
- Add no HTML page, UI, navigation link, dependency, secret, runtime, or existing storefront modification.
- The endpoint remains retrievable by someone who knows its URL because the catalog is public and the site is static.

## Exact implementation diff

```diff
diff --git a/src/pages/snipcart-products.json.ts b/src/pages/snipcart-products.json.ts
new file mode 100644
--- /dev/null
+++ b/src/pages/snipcart-products.json.ts
@@ -0,0 +1,80 @@
+import type { APIRoute } from 'astro';
+import { getAllProducts } from '../lib/sanity/queries/products';
+import { routes } from '../lib/routes';
+import { buildProductCartAttributes } from '../lib/snipcart/cartItem';
+
+interface SnipcartJsonCustomField {
+  name: string;
+  options?: string;
+  type?: string;
+  required?: boolean;
+}
+
+interface SnipcartJsonProduct {
+  id: string;
+  name: string;
+  price: number;
+  url: string;
+  customFields: SnipcartJsonCustomField[];
+}
+
+function toJsonProduct(attributes: Record<string, string>): SnipcartJsonProduct {
+  const customFields: SnipcartJsonCustomField[] = [];
+
+  for (let index = 1; attributes[`data-item-custom${index}-name`]; index += 1) {
+    const prefix = `data-item-custom${index}`;
+    const field: SnipcartJsonCustomField = {
+      name: attributes[`${prefix}-name`],
+    };
+    if (attributes[`${prefix}-options`]) field.options = attributes[`${prefix}-options`];
+    if (attributes[`${prefix}-type`]) field.type = attributes[`${prefix}-type`];
+    if (attributes[`${prefix}-required`] === 'true') field.required = true;
+    customFields.push(field);
+  }
+
+  return {
+    id: attributes['data-item-id'],
+    name: attributes['data-item-name'],
+    price: Number(attributes['data-item-price']),
+    url: attributes['data-item-url'],
+    customFields,
+  };
+}
+
+export const GET: APIRoute = async ({ site }) => {
+  if (!site) {
+    throw new Error('Astro site configuration is required for Snipcart product URLs.');
+  }
+
+  const products = await getAllProducts();
+  const definitions = products.flatMap((product) => {
+    const productSlug = product.slug.current;
+    const customOptions = product.customOptions ?? [];
+    const routeGroup = customOptions.find((group) => group.definesVariantRoute);
+    const routeVariants =
+      routeGroup?.options.filter((option) => option.slug?.current) ?? [];
+    const variants = routeVariants.length > 0 ? routeVariants : [undefined];
+
+    return variants.map((variant) => {
+      const variantSlug = variant?.slug?.current;
+      const productPath = variantSlug
+        ? routes.productVariant(productSlug, variantSlug)
+        : routes.product(productSlug);
+      const attributes = buildProductCartAttributes({
+        title: product.name,
+        price: `$${product.price.toFixed(2)}`,
+        imageSrc: '',
+        customOptions,
+        productSlug,
+        currentVariantSlug: variantSlug,
+        url: new URL(productPath, site).toString(),
+      });
+
+      return toJsonProduct(attributes);
+    });
+  });
+
+  return new Response(JSON.stringify(definitions), {
+    headers: { 'Content-Type': 'application/json; charset=utf-8' },
+  });
+};
```

## Verification

1. `npm run build`.
2. Parse `dist/snipcart-products.json` and verify array shape, required fields, numeric prices, unique IDs, absolute URLs, and custom-field modifier strings.
3. Confirm source contains no links to `/snipcart-products.json`.
4. Run `git diff --check`.
5. Commit only intended feature files and update ready PR #81.

## Review log

- **2026-07-21**: Replaced the rejected HTML design with the Snipcart-documented JSON crawler/import representation. The implementation remains one isolated static endpoint and derives all product definitions from the existing checkout builder. User explicitly approved this JSON execution sequence.
