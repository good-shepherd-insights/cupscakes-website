# FEATURE(sanity-image-alt-text)

## Request

Alt text for product photos is currently *computed in code*, not stored in Sanity:

- On `src/pages/products/[slug]/[...variant].astro`, the hero image's `imageAlt` is hardcoded to `` `${selectedOption.label} ${product.name}` `` (e.g. "Carrot Cupcakes") — there is no way for an editor to override it with more accurate/SEO-friendly copy.
- There is no `alt` field anywhere in the Sanity schema (`src/sanity/schemaTypes/product.ts`) — confirmed by grep, the only `alt` usages in the codebase are JSX `alt={...}` props, never a Sanity field.

This came up because the asset currently used for both the "Chocolate" and "Carrot" flavor options is actually a photo of a carrot cupcake (mislabeled in Sanity as `chocolate-cupcake.png`, since fixed — chocolate's image reference was removed, and the asset's `originalFilename` was renamed to `carrot-cupcake.png`). Renaming `originalFilename` does **not** change rendered alt text, because alt text isn't sourced from Sanity at all today. This plan adds an editorial `alt` field to Sanity's image fields so editors can set accurate, SEO-friendly alt text per image, with the current computed string kept as a fallback when blank.

## Directory Map

```text
src/
  sanity/
    schemaTypes/
      product.ts                          # MODIFY — add `alt` field to product.image and customOptionValue.image
  types/
    product.ts                            # MODIFY — type `image` as an object with optional `alt` instead of `unknown`
  pages/
    products/
      [slug]/
        [...variant].astro                # MODIFY — prefer Sanity alt text, fall back to computed displayName
```

No other files change. `src/lib/sanity/queries/products.ts` is untouched because its GROQ projection already selects whole `image` objects (`image,` with no field narrowing), so the new `alt` field is returned automatically. `src/lib/sanity/image.ts` (`resolveCustomOptionImages`) is untouched because option thumbnails are never rendered in the UI today (confirmed via grep — `PersonalCakeProduct.astro` only renders one hero `<img>`, never per-option swatches), so there is no second alt-text consumer to wire up.

## Modification Table

| File | Action | Why |
|---|---|---|
| `src/sanity/schemaTypes/product.ts` | Modify | Add an optional `alt` string field to both image fields so editors can set descriptive alt text in Studio |
| `src/types/product.ts` | Modify | Replace `image: unknown` with a typed shape exposing `alt?: string` so the page can read it without casting to `any` |
| `src/pages/products/[slug]/[...variant].astro` | Modify | Compute `imageAlt` from Sanity's `alt` field first, falling back to the existing computed string when blank |

## Existing Pattern Audit

- Sanity `image` type fields in this schema use `defineField({ name: 'image', type: 'image', options: { hotspot: true }, ... })` with no `fields:` sub-array anywhere yet — this will be the first use of the image type's `fields` option in this project. This is Sanity's standard, documented mechanism for attaching custom metadata (like alt text) to an image field, so it is not introducing a foreign pattern.
- All other optional/editorial string fields in this schema (`helperText`, `subtitle`, `servingInfo`) use `type: 'string'` with a `description` explaining intent to the editor — the new `alt` field follows that exact convention.
- `types/product.ts` already has a documented optional field precedent: `CustomOptionValue.priceModifier` uses a `/** ... */` doc comment above the field. The new `image` type follows that style.
- `[...variant].astro` already has a fallback-chain pattern for `imageUrl` (`selectedOption?.image ? ... : product.image ? ... : undefined`) — the new `imageAlt` logic mirrors that same ternary-chain style rather than introducing a different conditional idiom.

## Execution Plan

### Step 1 — Schema: add `alt` field to both image fields in `product.ts`
Add a `fields: [defineField({ name: 'alt', ... })]` array to the product-level `image` field and to the `customOptionValue`'s `image` field.

### Step 2 — Types: type `image` precisely in `types/product.ts`
Add a small `SanityImage` interface with an optional `alt` and replace the two `image: unknown` usages.

### Step 3 — Page: compute `imageAlt` with a Sanity-first fallback chain in `[...variant].astro`
Read `selectedOption?.image?.alt`, then `product.image?.alt`, then fall back to the current computed `displayName` string.

### Step 4 — Validate
Run `npm run build` (the only real script per `CLAUDE.md`) and manually check `/products/cupcakes/carrot` renders with the existing fallback alt text unchanged (since no Sanity `alt` value exists yet), confirming no regression.

## File-by-File Changes

### `src/sanity/schemaTypes/product.ts`

**Action:** Modify
**Why:** Editors need a place in Studio to enter descriptive, SEO-friendly alt text per image.
**Impact:** Two `image` fields gain an optional sub-field. No required-field changes, so existing documents (including `product-chocolate-cupcake`) remain valid with no migration needed.

#### Before
```ts
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
```

#### After
```ts
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description:
            'Descriptive alt text for SEO and accessibility, e.g. "Carrot cupcake with cream cheese frosting". Falls back to a generated label if left blank.',
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
```

#### Before
```ts
                    defineField({
                      name: 'image',
                      title: 'Image',
                      type: 'image',
                      options: { hotspot: true },
                      description: 'Optional photo for this specific option. Falls back to the product image if blank.',
                    }),
```

#### After
```ts
                    defineField({
                      name: 'image',
                      title: 'Image',
                      type: 'image',
                      options: { hotspot: true },
                      description: 'Optional photo for this specific option. Falls back to the product image if blank.',
                      fields: [
                        defineField({
                          name: 'alt',
                          title: 'Alt Text',
                          type: 'string',
                          description:
                            'Descriptive alt text for SEO and accessibility, e.g. "Carrot cupcake with cream cheese frosting". Falls back to a generated label if left blank.',
                        }),
                      ],
                    }),
```

#### Reasoning
- `fields:` is Sanity's built-in way to attach metadata to an `image` type; it appears in Studio as an extra field directly under the image asset picker.
- Optional (no `Rule.required()`) so existing documents stay valid and editors can fill it in opportunistically.
- Description text explicitly states the fallback behavior so editors understand blank is safe.

### `src/types/product.ts`

**Action:** Modify
**Why:** `image: unknown` forces `as any`/`as SanityImageSource` casts everywhere it's consumed (already visible in `[...variant].astro`); typing it precisely lets the new `.alt` access be type-checked instead of cast.
**Impact:** Two fields change type. `unknown` is a supertype-safe placeholder already being cast at every call site, so narrowing it to a concrete shape is non-breaking — every existing cast site (`urlFor(selectedOption.image as any)`, `urlFor(product.image as any)`) still compiles unchanged, since `SanityImage` is structurally compatible with `SanityImageSource` usage via the existing `as any`/`as SanityImageSource` casts.

#### Before
```ts
export interface CustomOptionValue {
  label: string;
  /** Added to the product's base price when this option is selected, e.g. 3 for +$3.00. */
  priceModifier?: number;
  slug?: { current: string };
  image?: unknown;
}
```

#### After
```ts
export interface SanityImage {
  asset?: { _ref?: string; _type?: string };
  /** Editorial alt text set in Sanity Studio. Falls back to a generated label when blank. */
  alt?: string;
}

export interface CustomOptionValue {
  label: string;
  /** Added to the product's base price when this option is selected, e.g. 3 for +$3.00. */
  priceModifier?: number;
  slug?: { current: string };
  image?: SanityImage;
}
```

#### Before
```ts
export interface Product {
  _id: string;
  name: string;
  price: number;
  slug: { current: string };
  category: ProductCategory;
  image: unknown;
  description?: string;
  subtitle?: string;
  servingInfo?: string;
  /** Selection groups shown on the order page, e.g. Flavor, Frosting Color. Absence renders no sections. */
  customOptions?: CustomOption[];
}
```

#### After
```ts
export interface Product {
  _id: string;
  name: string;
  price: number;
  slug: { current: string };
  category: ProductCategory;
  image: SanityImage;
  description?: string;
  subtitle?: string;
  servingInfo?: string;
  /** Selection groups shown on the order page, e.g. Flavor, Frosting Color. Absence renders no sections. */
  customOptions?: CustomOption[];
}
```

#### Reasoning
- `SanityImage` only types the two fields the codebase actually reads (`asset` for `urlFor`, `alt` for the new fallback chain) — it does not attempt to fully type Sanity's image shape (hotspot, crop, etc.), matching this project's existing low-ceremony typing style.
- Placed above `CustomOptionValue` since that's the first consumer in file order, matching the file's top-to-bottom dependency ordering.

### `src/pages/products/[slug]/[...variant].astro`

**Action:** Modify
**Why:** The hero image's alt text should prefer editor-supplied Sanity copy over the generated string.
**Impact:** Only the `imageAlt` value passed to `<PersonalCakeProduct>` changes; `displayName` (used for the page `<title>` and breadcrumb) is untouched.

#### Before
```ts
const displayName = selectedOption ? `${selectedOption.label} ${product.name}` : product.name;
const canonicalPath = variant
```

#### After
```ts
const displayName = selectedOption ? `${selectedOption.label} ${product.name}` : product.name;
const imageAlt = selectedOption?.image?.alt ?? product.image?.alt ?? displayName;
const canonicalPath = variant
```

#### Before
```astro
    <PersonalCakeProduct
      breadcrumbHrefHome={navbar.homeHref}
      breadcrumbHrefOrder={navbar.orderHref}
      breadcrumbLabel={product.name}
      title={displayName}
      subtitle={product.subtitle ?? ""}
      servingInfo={product.servingInfo}
      imageSrc={imageUrl}
      imageAlt={displayName}
      customOptions={customOptions}
      productSlug={slug}
      currentVariantSlug={selectedOption?.slug?.current}
      price={`$${product.price.toFixed(2)}`}
    />
```

#### After
```astro
    <PersonalCakeProduct
      breadcrumbHrefHome={navbar.homeHref}
      breadcrumbHrefOrder={navbar.orderHref}
      breadcrumbLabel={product.name}
      title={displayName}
      subtitle={product.subtitle ?? ""}
      servingInfo={product.servingInfo}
      imageSrc={imageUrl}
      imageAlt={imageAlt}
      customOptions={customOptions}
      productSlug={slug}
      currentVariantSlug={selectedOption?.slug?.current}
      price={`$${product.price.toFixed(2)}`}
    />
```

#### Reasoning
- Mirrors the existing `imageUrl` ternary-chain pattern directly above it (selected option's image, then product's image, then a default) — same precedence order, same data source priority, just for `alt` instead of the URL.
- `displayName` stays as the final fallback so behavior for every product/option that doesn't yet have Sanity alt text is byte-for-byte unchanged from today.

## Validation Plan

- `npm run build` — the only real script per `CLAUDE.md`; confirms the schema/type/page changes compile and the static build succeeds.
- Manually visit `/products/cupcakes/carrot`, `/products/cupcakes/chocolate`, and `/products/cupcakes` (no variant) in dev (`npm run dev`) and inspect the rendered `<img alt="...">` — all three should show the exact same alt text as before this change (since no Sanity document yet has an `alt` value set), proving the fallback chain preserves current behavior.
- In Sanity Studio (`/admin`), open the Cupcakes product, set an `Alt Text` value on the Carrot option's image, save, and reload `/products/cupcakes/carrot` in dev — the rendered `alt` attribute should now show the new Studio value instead of "Carrot Cupcakes".

## Risk Notes

- None of the schema changes are required fields, so no existing Sanity documents need migration — `product-chocolate-cupcake` continues to validate as-is.
- The `SanityImage` type only adds fields; it doesn't remove anything `unknown` already allowed, so no other file that reads `product.image` or `option.image` needs to change.
- Out of scope by design: `src/content/products/cupcakes.json`, `CupcakeCarousel.astro`, and `preview-cupcakes.astro` are the static/temporary system (per prior conversation and the file's own `// TEMP — delete when Sanity is live` comment) and are not touched here.

## Approval
`Status: Awaiting explicit user approval. Do not implement yet.`
