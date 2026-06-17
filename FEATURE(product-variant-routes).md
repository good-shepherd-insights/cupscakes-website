# FEATURE(product-variant-routes)

## Request
Some customization options (e.g. cupcake Flavor) have their own distinct photo. Selecting a different one should be reflected in a real, shareable URL — not just client-side form state — so a link to "Vanilla Cupcakes" unfurls correctly in social/marketing previews (Facebook/iMessage/Twitter, which don't execute JS and only ever see whatever a crawler fetches at a fixed URL). That requires the variant to be a real prerendered page with its own `<title>`/`og:image`, not a query-string toggle on one page.

**Scope:** exactly one customization group per product may be flagged as the "route-defining" group (its options get real URLs + images). Other groups (Quantity, Occasion, etc.) stay exactly as they are today — in-page form selectors, no routing impact. This builds directly on `FEATURE(product-catalog-extensibility).md`'s `customOptions` model; it does not revisit category or the grid migration.

---

## Directory Map
```text
astro.config.mjs                              ← MODIFY (+site: "https://cupscakes.com" — required for absolute canonical/OG URLs)
src/
├── sanity/schemaTypes/
│   └── product.ts                         ← MODIFY (customOptionValue: +slug, +image; customOption: +definesVariantRoute; +at-most-one-route-group validation)
├── types/
│   └── product.ts                          ← MODIFY (CustomOptionValue: +slug?, +image?; CustomOption: +definesVariantRoute?)
├── lib/
│   ├── routes.ts                            ← MODIFY (+routes.productVariant)
│   └── sanity/
│       ├── image.ts                          ← MODIFY (+resolveCustomOptionImages helper)
│       └── queries/products.ts                ← MODIFY (remove getProductBySlug + getAllProductSlugs — dead after the merge below)
├── layouts/
│   └── Layout.astro                          ← MODIFY (+description/image/canonicalUrl props, OG + Twitter meta tags — none exist today)
├── components/product/
│   └── PersonalCakeProduct.astro              ← MODIFY (route-defining group renders <a> links instead of <input> radios)
└── pages/products/
    ├── [slug].astro                           ← DELETE (merged into the rest-param route below)
    └── [slug]/[...variant].astro              ← CREATE (one route for both /products/<slug> and /products/<slug>/<variant>)
```

---

## Modification Table
| File | Action | Why |
|---|---|---|
| `astro.config.mjs` | Modify | `site` is not currently configured at all, so `Astro.site` is `undefined` — `new URL(path, Astro.site)` throws if relied on unconditionally. Needed for canonical/OG URLs to be the absolute URLs the spec requires. |
| `src/sanity/schemaTypes/product.ts` | Modify | Options need a stable `slug` (URL segment) and optional `image`; one group per product needs to be flagged as route-defining |
| `src/types/product.ts` | Modify | Mirror the new fields |
| `src/lib/routes.ts` | Modify | Centralize the new URL shape, same as every other route in this file |
| `src/lib/sanity/image.ts` | Modify | One shared place to turn an option's raw image into a URL, kept separate from the page so the resolution logic isn't buried inline in the route file |
| `src/lib/sanity/queries/products.ts` | Modify | `getProductBySlug` and `getAllProductSlugs` lose their only caller when `[slug].astro` is deleted — remove both rather than leave unused exports behind |
| `src/layouts/Layout.astro` | Modify | No OG/Twitter/canonical tags exist at all today — required for link previews to work, not optional polish |
| `src/components/product/PersonalCakeProduct.astro` | Modify | Route-defining group's options must be real links, not form inputs, to actually navigate |
| `src/pages/products/[slug].astro` | Delete | Replaced by the rest-param route — having both would duplicate the entire fetch/render path in two files |
| `src/pages/products/[slug]/[...variant].astro` | Create | One route handles both the bare product URL and every variant URL — single fetch, single render path, single place that knows about the route-defining group |

---

## Existing Pattern Audit

- **`customOptions` is still fetched as a bare, unprojected GROQ field** (`PRODUCT_FIELDS` in `queries/products.ts` just lists `customOptions`, no `{...}` projection) — exactly like `priceModifier` before it, the new `slug`/`image`/`definesVariantRoute` fields flow through automatically with **zero query changes needed**. This is the same payoff the generic-array design already proved once.
- **`Product.image` is `unknown` (raw Sanity data), resolved to a URL string at the page level** via `urlFor(product.image).width(...).url()` in `[slug].astro`, then passed to the component as a plain `imageSrc` string — the component itself never touches Sanity-specific image APIs. `CustomOptionValue.image` follows the identical pattern: raw `unknown` in the type, resolved to a URL by the page before being handed to the component. This is why `resolveCustomOptionImages` lives in `src/lib/sanity/image.ts` (the one file that already owns this concern) rather than being inlined separately in two pages.
- **`Layout.astro` currently has no meta tags beyond `<title>`** — there's nothing to "extend," this is new surface. It already imports `<ClientRouter />` (Astro's View Transitions), which is the mechanism that makes variant-to-variant navigation feel instant without writing any custom transition JS — that's an existing tool already wired into every page via this layout, not something this plan introduces.
- **`routes.ts` is a flat object of path builders**, one per route, used everywhere instead of hand-built strings (`routes.product(slug)`). `routes.productVariant(slug, variantSlug)` follows that exact convention.
- **No conditional-required validation is added for `slug`/`image` on a route-defining group's options.** Sanity conditional-required rules add real complexity for a soft requirement; instead, `getStaticPaths` simply skips generating a route for any option missing a `slug`, and the page falls back to the product's main image when an option has none. This is a deliberate "degrade, don't crash the build" choice, flagged in Risk Notes rather than enforced with schema machinery.
- **One route file, not two.** An earlier draft of this plan modified `[slug].astro` *and* created a separate `[slug]/[variant].astro`, each independently wiring up `Layout`/`Navbar`/`Footer`/`PersonalCakeProduct` and each independently re-deriving "find the route-defining group." Astro's rest parameter (`[...variant]`) lets one file match both `/products/<slug>` (zero segments, `variant` is `undefined`) and `/products/<slug>/<segment>` (one segment) — so there's exactly one fetch, one render path, and one place that knows about route-defining groups, with the only branch being "was a variant segment present." Two files that must always agree on rendering logic is the kind of duplication this whole feature set has been actively avoiding (`PRODUCT_FIELDS`, `validateUniqueSlug`, `resolveCustomOptionImages` are all the same instinct applied elsewhere).
- **`astro.config.mjs` has no `site` configured today** — confirmed by grep, there's no `site:` key anywhere in the config. That means `Astro.site` is `undefined` at runtime. An earlier draft of this plan computed `canonicalUrl` via `new URL(relativePath, Astro.site).toString()` unconditionally — with `Astro.site` undefined, the `URL` constructor throws `TypeError: Invalid URL` for any relative input, and since this computation runs for *every* page this route generates, that would have broken the entire build, not degraded gracefully. `site` is added to the config (`https://cupscakes.com`), and the canonical-URL computation now also falls back to a relative path if `Astro.site` is ever unset for any reason, so a config regression degrades instead of taking down every build.
- **`getStaticPaths` passes the already-fetched product through `props`, instead of the page body fetching it again.** The original `[slug].astro` used a cheap `getAllProductSlugs()` in `getStaticPaths` (just slugs) and a separate `getProductBySlug()` per page — that split made sense *because* the `getStaticPaths` fetch was cheap. This feature breaks that assumption: `getStaticPaths` now needs the *full* product (including `customOptions`, to find the route-defining group), via `getAllProducts()`. Once the full data is already in hand there, having every individual generated page re-fetch the same data via `getProductBySlug()` is pure waste — and worse, it's a second, separate fetch that could in principle disagree with the first if content changed mid-build. Astro's documented fix for exactly this is returning `props` alongside `params` from `getStaticPaths`, so each page receives its product directly with no second fetch and no possible mismatch. This also means `getProductBySlug`/`getAllProductSlugs` lose their only caller and should be deleted, not left as unused exports.

---

## Execution Plan

### Step 1 — Schema: `customOptionValue` gets `slug` + `image`; `customOption` gets `definesVariantRoute`
`slug` auto-generates from `label` (same `options: { source: 'label' }` pattern as every other slug field in this schema). Add a `customOptions`-level validator: at most one group may have `definesVariantRoute: true`.

### Step 2 — Types
Mirror the new fields on `CustomOptionValue`/`CustomOption`.

### Step 3 — `routes.productVariant`
Add the builder; no other route file changes needed.

### Step 4 — `resolveCustomOptionImages` helper
One function in `src/lib/sanity/image.ts`: takes a product's `customOptions` and an image width, returns the same array shape with each option's `image` replaced by a resolved URL string (or `undefined`). Used by the merged product page (Step 7).

### Step 5 — `Layout.astro`: add OG/Twitter/canonical support
New optional props (`description`, `image`, `canonicalUrl`), rendered as standard meta tags. Defaults preserve today's bare `<title>`-only behavior for every page that doesn't pass them.

### Step 6 — `PersonalCakeProduct.astro`: route-defining group renders links
The `customOptions.map()` loop already built in the prior feature gets one branch: if `group.definesVariantRoute`, render `<a href={...}>` (styled identically to `selectionBtn`, with an active-state class instead of relying on `:checked`) instead of `<input>`. Every other group is untouched.

### Step 7 — Remove `getProductBySlug`/`getAllProductSlugs`, delete `[slug].astro`, create `[slug]/[...variant].astro`
`getStaticPaths` calls `getAllProducts()` once and returns both the bare path and every variant path per product, passing the already-fetched product through `props` — no second fetch anywhere. At render time: if `variant` is present, resolve that specific option (404 if it doesn't match anything `getStaticPaths` actually generated — see Risk Notes for why this should be unreachable in practice); if absent, fall back to the route-defining group's first option (if any) for the image, and point `<link rel="canonical">` at that default variant's URL instead of this one.

---

## File-by-File Changes

### `astro.config.mjs`
**Action:** Modify
**Why:** `Astro.site` is `undefined` today — nothing in this config sets it. Canonical/OG URLs must be absolute per spec, and the new product page's canonical-URL computation depends on it.

```js
export default defineConfig({
  site: 'https://cupscakes.com',
  env: {
    // ...unchanged
```

#### Reasoning
- Placed as the first top-level key, consistent with Astro's own convention of `site` being the first thing defined in `defineConfig` in most Astro projects/docs examples.
- This is a prerequisite for every other absolute-URL claim in this plan (canonical tags, `og:url`) — without it, those tags would either be missing or (before the defensive fallback below) crash the build outright.

---

### `src/sanity/schemaTypes/product.ts`
**Action:** Modify
**Why:** Options need a URL-safe identity and an optional photo; exactly one group per product may drive the route.

```ts
// Inside the customOptionValue object's fields, alongside `label` / `priceModifier`:
defineField({
  name: 'slug',
  title: 'Slug',
  type: 'slug',
  description: 'URL segment when this option is part of a shareable variant link, e.g. "vanilla".',
  options: { source: 'label', maxLength: 96 },
}),
defineField({
  name: 'image',
  title: 'Image',
  type: 'image',
  options: { hotspot: true },
  description: 'Optional photo for this specific option. Falls back to the product image if blank.',
}),
```
```ts
// Inside the customOption object's fields, alongside `name` / `inputType` / `helperText`:
defineField({
  name: 'definesVariantRoute',
  title: 'Use as shareable variant URL',
  type: 'boolean',
  description: 'At most one group per product. Each option becomes its own URL (e.g. /products/cupcakes/vanilla) with its own image and link preview.',
  initialValue: false,
}),
```
```ts
// customOptions field validation gains a sibling-group check:
validation: (Rule) =>
  Rule.custom((groups) => {
    if (!groups) return true;
    const routeGroups = groups.filter((g: { definesVariantRoute?: boolean }) => g.definesVariantRoute);
    return routeGroups.length > 1 ? 'Only one group may be used as the shareable variant URL.' : true;
  }),
```

#### Reasoning
- `slug` is optional, not required — most groups (Quantity, Occasion) will never set `definesVariantRoute` and have no use for a slug at all; making it required would force every existing option in every group to be backfilled for no reason.
- `image` likewise optional — Quantity/Occasion options have no photo and shouldn't be forced to fake one.
- `definesVariantRoute` defaults `false` so every existing `customOption` group (Flavor, Quantity, Occasion on the seeded Cupcakes product) is unaffected until an editor explicitly opts one in.

---

### `src/types/product.ts`
**Action:** Modify

```ts
export interface CustomOptionValue {
  label: string;
  priceModifier?: number;
  slug?: { current: string };
  image?: unknown;
}

export interface CustomOption {
  name: string;
  inputType: 'radio' | 'checkbox';
  helperText?: string;
  definesVariantRoute?: boolean;
  options: CustomOptionValue[];
}
```

---

### `src/lib/routes.ts`
**Action:** Modify

```ts
export const routes = {
  order: "/order",
  orderPickup: "/order/pickup",
  orderPickupDate: "/order/pickup/date",
  orderDelivery: "/order/delivery",
  orderDeliveryDate: "/order/delivery/date",
  orderLoading: "/order/loading",
  cart: "/cart",
  product: (slug: string) => `/products/${slug}`,
  productVariant: (slug: string, variantSlug: string) => `/products/${slug}/${variantSlug}`,
};
```

---

### `src/lib/sanity/image.ts`
**Action:** Modify
**Why:** Keeps Sanity-specific image resolution out of the route file, consistent with how the main product image is already resolved via `urlFor` in this same module.

```ts
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import { sanityClient } from './client';
import type { CustomOption } from '../../types/product';

const builder = imageUrlBuilder(sanityClient);

export const urlFor = (source: SanityImageSource) => builder.image(source);

/** Resolves each option's raw `image` to a URL string, leaving everything else untouched. */
export function resolveCustomOptionImages(customOptions: CustomOption[], width: number): CustomOption[] {
  return customOptions.map((group) => ({
    ...group,
    options: group.options.map((option) => ({
      ...option,
      image: option.image ? urlFor(option.image as SanityImageSource).width(width).url() : undefined,
    })),
  }));
}
```

#### Reasoning
- Returns the same `CustomOption[]` shape (just with `image` replaced by a string) so it slots into the existing `customOptions` prop with no other type changes — same approach `[slug].astro` already uses for the main product image (`unknown` in, URL string out, same variable name reused for the resolved value).

---

### `src/layouts/Layout.astro`
**Action:** Modify
**Why:** No OG/Twitter/canonical meta tags exist today — required for any shared link to unfurl correctly.

#### Before
```astro
interface Props {
  title?: string;
}
const { title = 'Cupcakes' } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
```

#### After
```astro
interface Props {
  title?: string;
  description?: string;
  image?: string;
  canonicalUrl?: string;
}
const { title = 'Cupcakes', description, image, canonicalUrl } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
    <meta property="og:title" content={title} />
    {description && <meta property="og:description" content={description} />}
    {image && <meta property="og:image" content={image} />}
    {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
    <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
```

#### Reasoning
- All new props optional, all new tags conditionally rendered — every existing page using `<Layout title="...">` is byte-for-byte unaffected.

---

### `src/components/product/PersonalCakeProduct.astro`
**Action:** Modify
**Why:** A route-defining group's options must be real navigable links, not form inputs.

```ts
// Props gain (both optional — only read inside the definesVariantRoute branch,
// so the two TEMP preview pages, whose groups never set that flag, need no changes):
productSlug?: string;
currentVariantSlug?: string;
```
```astro
{/* Inside the existing customOptions.map() loop, the options.map() branches: */}
{group.options.map((option) =>
  group.definesVariantRoute && option.slug ? (
    <a
      href={routes.productVariant(productSlug, option.slug.current)}
      class={`${selectionBtn} ${option.slug.current === currentVariantSlug ? "underline" : ""}`}
    >
      {option.label}
      {!!option.priceModifier && ` (+$${option.priceModifier.toFixed(2)})`}
    </a>
  ) : (
    <label class={selectionBtn}>
      <input type={group.inputType} name={group.name} value={option.label} class="sr-only peer" />
      <span class="peer-checked:underline">
        {option.label}
        {!!option.priceModifier && ` (+$${option.priceModifier.toFixed(2)})`}
      </span>
    </label>
  )
)}
```

#### Reasoning
- Active-state styling (`underline` when `option.slug.current === currentVariantSlug`) mirrors the existing `peer-checked:underline` look for radios — visually consistent, just driven by the URL instead of form state.
- Non-route groups (`group.definesVariantRoute` false/undefined) take the exact same branch as before — zero behavior change for Quantity/Occasion.
- `<ClientRouter />` (already in `Layout.astro`) intercepts these same-origin `<a>` clicks automatically — no new client JS needed for the smooth transition between variant pages.
- `productSlug`/`currentVariantSlug` are optional with no defaults needed — `preview-cupcakes.astro` and `preview-personal-cake.astro` (neither of which sets `definesVariantRoute` on any group) require zero changes, since the new props are simply never read for them.

---

### `src/lib/sanity/queries/products.ts`
**Action:** Modify
**Why:** `getProductBySlug` and `getAllProductSlugs` lose their only caller in this plan (Step 7) and become dead code.

```ts
// Remove these two functions entirely:
export async function getProductBySlug(slug: string): Promise<Product | null> { /* ... */ }
export async function getAllProductSlugs(): Promise<Pick<Product, 'slug'>[]> { /* ... */ }
```

#### Reasoning
- Confirmed via grep before writing this plan: `[slug].astro` is the only caller of either function anywhere in the codebase. Once it's deleted, keeping these would be exporting dead code — exactly what `getAllProductCategories` (added in the prior feature, still genuinely unused but intentionally future-facing for the grid migration) is *not* meant to be a precedent for. These two are removed because nothing will call them, not kept "just in case."

---

### `src/pages/products/[slug].astro` → `src/pages/products/[slug]/[...variant].astro`
**Action:** Delete + Create
**Why:** One file, using Astro's rest parameter, handles both the bare product URL and every variant URL — same fetch, same render path, branching only on whether a variant segment is present. The product is fetched exactly once, in `getStaticPaths`, and handed to each generated page via `props` — no second fetch in the page body.

```astro
---
import Layout from '../../../layouts/Layout.astro';
import Navbar from '../../../components/home/Navbar.astro';
import Footer from '../../../components/home/Footer.astro';
import PersonalCakeProduct from '../../../components/product/PersonalCakeProduct.astro';
import { loadHomeContent } from '../../../lib/content/home';
import { getAllProducts } from '../../../lib/sanity/queries/products';
import { urlFor, resolveCustomOptionImages } from '../../../lib/sanity/image';
import { routes } from '../../../lib/routes';
import { IMAGE_WIDTHS } from '../../../lib/constants';
import type { Product } from '../../../types/product';

interface Props {
  product: Product;
}

export async function getStaticPaths() {
  const products = await getAllProducts();
  return products.flatMap((product) => {
    const bare = { params: { slug: product.slug.current, variant: undefined }, props: { product } };
    const routeGroup = product.customOptions?.find((g) => g.definesVariantRoute);
    if (!routeGroup) return [bare];
    const variantPaths = routeGroup.options
      .filter((option) => option.slug)
      .map((option) => ({
        params: { slug: product.slug.current, variant: option.slug!.current },
        props: { product },
      }));
    return [bare, ...variantPaths];
  });
}

const { slug, variant } = Astro.params;
const { product } = Astro.props;
const { navbar, footer } = await loadHomeContent();

const routeGroup = product.customOptions?.find((g) => g.definesVariantRoute);
const defaultOption = routeGroup?.options.find((o) => o.slug);
const selectedOption = variant
  ? routeGroup?.options.find((o) => o.slug?.current === variant)
  : defaultOption;

if (variant && !selectedOption) return Astro.redirect('/404');

const customOptions = resolveCustomOptionImages(product.customOptions ?? [], IMAGE_WIDTHS.detail);
const imageUrl = selectedOption?.image
  ? urlFor(selectedOption.image as any).width(IMAGE_WIDTHS.detail).url()
  : product.image
    ? urlFor(product.image as any).width(IMAGE_WIDTHS.detail).url()
    : undefined;

const displayName = selectedOption ? `${selectedOption.label} ${product.name}` : product.name;
const canonicalPath = variant
  ? routes.productVariant(slug!, variant)
  : defaultOption
    ? routes.productVariant(slug!, defaultOption.slug!.current)
    : routes.product(slug!);
const canonicalUrl = Astro.site ? new URL(canonicalPath, Astro.site).toString() : canonicalPath;
---

<Layout
  title={`${displayName} — Cups & Cakes`}
  description={product.description}
  image={imageUrl}
  canonicalUrl={canonicalUrl}
>
  <div class="flex min-h-dvh flex-col">
    <Navbar {...navbar} />
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
    <Footer {...footer} />
  </div>
</Layout>
```

#### Reasoning
- No `getProductBySlug` call, no `if (!product)` null check — `Astro.props.product` is guaranteed for every page Astro actually generates, because `getStaticPaths` is the sole source of every path *and* its accompanying props. There's no code path where this page renders without a product, so there's nothing to guard against.
- `variant && !selectedOption` (rather than `!selectedOption` alone) — a product with no route-defining group at all has `selectedOption` `undefined` on the bare path, which is fine and expected, not a 404. Only an explicit variant segment that doesn't match any option `getStaticPaths` actually generated would hit this, which given the props-passthrough above is now effectively unreachable — kept only as cheap defensive insurance, not because it's expected to fire.
- `variant ? ... : defaultOption` is the only branch in the whole file — the bare URL behaves exactly like today's `[slug].astro` (falls back to the route-defining group's first option for image/title purposes) except its canonical tag points at that default variant's real URL instead of itself.
- Title/image change per variant (`"Vanilla Cupcakes"`, that option's photo) on every URL this file serves — the actual content difference that makes a shared link show the right preview, which a query-string approach on one static page can't do.
- `Astro.site ? new URL(...) : canonicalPath` — with `site` set in `astro.config.mjs` (this plan adds it), this always produces an absolute URL. The conditional exists purely as a defensive fallback so a future config regression (someone removing `site` again) degrades to a relative canonical/OG URL instead of crashing every page this route generates.

---

## Validation Plan
- `npm run build` — confirms `getStaticPaths` generates the bare path for every product plus one path per route-defining-group option, that `props` flow through to each generated page correctly (no second fetch), that the merged page + component compile with the new optional props and `getProductBySlug`/`getAllProductSlugs` removed, and — critically — that the build doesn't crash on the canonical-URL computation now that `astro.config.mjs` has `site` set.
- Temporarily comment out the new `site: 'https://cupscakes.com'` line and rebuild, to confirm the defensive `Astro.site ? ... : canonicalPath` fallback actually produces a relative URL instead of throwing — this is the one path in this plan that previously would have taken down the whole build, so it's worth proving the fallback really works, not just trusting the ternary.
- In Studio: flag Flavor as `definesVariantRoute: true` on the Cupcakes test product, add a `slug` + `image` to a couple of flavor options (e.g. Chocolate, Vanilla), rebuild, and confirm `/products/cupcakes/chocolate` and `/products/cupcakes/vanilla` both exist as real static pages with different `<title>`/`og:image`, and that `/products/cupcakes` (no variant segment) still renders too.
- View source (not just rendered DOM) on a variant page and confirm the `og:image`/`og:title`/canonical tags are present in the raw HTML — this is what link-preview crawlers actually see, not what JS renders.
- Confirm `/products/cupcakes`'s `<link rel="canonical">` points at `/products/cupcakes/<first-flavor-slug>`, while a variant page's canonical points at itself.
- Confirm a product with no route-defining group at all (anything not yet opted in) still renders its bare `/products/[slug]` page exactly as before — `selectedOption` being `undefined` there must not 404.
- Click between flavor links on a variant page and confirm `<ClientRouter />` gives a soft, no-full-reload transition (Network tab shows no full document request on click).
- Attempt to flag a second group as `definesVariantRoute: true` on the same product in Studio and confirm publish is blocked by the new validator.
- Confirm the two TEMP preview pages still build untouched (they never set `definesVariantRoute`, so `productSlug`/`currentVariantSlug` being optional means zero changes were needed there).

## Risk Notes
- **`astro.config.mjs` previously had no `site` set at all** — this plan adds it (`https://cupscakes.com`). If that's ever wrong or changes (staging domain, custom domain migration, etc.), every canonical/OG URL silently points at the wrong host until `site` is updated — there's no runtime check that `site` matches where the build is actually deployed.
- **No conditional-required enforcement** on `slug`/`image` for options inside a route-defining group — an editor can flag a group as route-defining and forget to fill in slugs. `getStaticPaths` silently skips any option missing a slug rather than failing the build; this is intentional graceful degradation, but it does mean an incomplete group just produces fewer variant pages with no warning in Studio.
- **`/products/[slug]` and `/products/[slug]/[default-variant]` both render the same content** once a route-defining group exists. `Astro.redirect()` already works in this project's static output (used in this same file for the variant-mismatch case, and previously in the original `[slug].astro` for its `!product` case), so a redirect from the bare URL to the default variant was a real option, not a technical unknown — canonical tags were chosen instead as a deliberate UX/SEO tradeoff: the bare URL stays live and renders immediately (no extra redirect hop, no risk to anything already bookmarked/indexed at that URL), while the canonical tag still tells search engines which URL is authoritative.
- **Still not covered:** combining a route-defining selection with other in-page selections (e.g. Flavor=Vanilla *and* Quantity=2 Dozen) into one shareable URL — only the single flagged group gets URL-level treatment. Combinatorial variant URLs are a much larger feature and out of scope here.

## Approval
`Status: Awaiting explicit user approval. Do not implement yet.`
