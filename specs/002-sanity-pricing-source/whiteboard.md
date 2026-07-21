# Whiteboard Revision: Complete Sanity-Backed Product Pricing

## 1. Status

**Status: Prepared — awaiting explicit approval.**

## 2. Purpose / Big Picture

The previously approved cupcake portion is already applied in the worktree. Repository inspection then found the identical duplication for Personal Cakes. This revision removes `$25`/`$25.00` from homepage content, products content, and the preview route; both pages and the preview resolve `personal-cakes` from Sanity; and one formatter module produces `$25.00` or `$4.00 each`. No further local build will run, per the user's instruction.

## 3. User Contract

1. Cupcake and Personal Cake numeric prices come only from their Sanity product records.
2. Homepage, products grid, product detail, preview, and cart surfaces use the matching catalog value.
3. Cupcakes display two decimals plus ` each`; Personal Cakes display two decimals without `each`.
4. No repository content or component stores `$4`, `$4.00`, `$25`, or `$25.00` as a product display fallback.
5. Missing or invalid required catalog pricing stops static generation.
6. Product copy, images, links, options, modifiers, routes, and unrelated prices remain unchanged.
7. No new dependency, client fetch, environment variable, catalog mutation, or local build is added.

## 4. Acceptance Coverage

| Criterion | Files | Proof |
|---|---|---|
| 1–2 | Both page entry points, preview route, existing query helper | Each required slug is resolved and passed to its presentation component |
| 3 | `src/lib/format/productPrice.ts`, three Personal Cake consumers | One shared two-decimal currency formatter; cupcake wrapper adds ` each` |
| 4 | Two Personal Cake JSON files, `src/content.config.ts`, preview route | Targeted source search returns no numeric fallback or marketing `price` field |
| 5 | Existing `getRequiredProductPriceBySlug` applied earlier | Both page entry points and preview call the validated helper |
| 6–7 | All nine remaining files | Exact diff contains no unrelated behavior, dependency, config, or data mutation |

## 5. Context and Orientation

- `src/pages/index.astro` already resolves `cupcakes`; it will resolve `personal-cakes` in the same build-time batch and replace `personalCakes.price` from static content.
- `src/pages/products/index.astro` follows the same pattern for `CupcakeGrid` and `PersonalCakeGrid`.
- `PersonalCakes.astro` and `PersonalCakeGrid.astro` currently accept formatted strings; they will accept numbers and format them centrally.
- `preview-personal-cake.astro` is an accessible temporary surface with its own literal and must not remain an exception.
- Product-detail and cart paths already use Sanity and require no edit.

## 6. Directory Map and Modification Table

```text
src/
├── components/home/PersonalCakes.astro
├── components/product/PersonalCakeGrid.astro
├── content/home/personal-cakes.json
├── content/products/personal-cakes.json
├── content.config.ts
├── lib/format/productPrice.ts
└── pages/
    ├── index.astro
    └── products/
        ├── index.astro
        └── preview-personal-cake.astro
```

| File | Action | Reason |
|---|---|---|
| `src/lib/format/productPrice.ts` | Modify | Add base currency formatter reused by both product types |
| `src/pages/index.astro` | Modify | Resolve and pass Personal Cake price |
| `src/components/home/PersonalCakes.astro` | Modify | Accept number and format centrally |
| `src/pages/products/index.astro` | Modify | Resolve and pass Personal Cake price |
| `src/components/product/PersonalCakeGrid.astro` | Modify | Accept one number for both flavor cards |
| `src/pages/products/preview-personal-cake.astro` | Modify | Replace preview literal with Sanity value |
| `src/content/home/personal-cakes.json` | Modify | Remove homepage price duplicate |
| `src/content/products/personal-cakes.json` | Modify | Remove two grid price duplicates |
| `src/content.config.ts` | Modify | Remove both obsolete schema requirements |

## 7. Pattern Audit and Evidence Ledger

| Decision | Evidence | Constraint | Choice |
|---|---|---|---|
| Use the existing required query | `src/lib/sanity/queries/products.ts:getRequiredProductPriceBySlug` is already applied and validates remote values | No fallback may be introduced | Call it with `personal-cakes` |
| Resolve at page frontmatter | Existing cupcake calls in `src/pages/index.astro` and `src/pages/products/index.astro` | Static HTML, no loading/CORS path | Batch both slugs with `Promise.all` |
| Preserve child-card strings | `PersonalCakeCard.astro` and `PersonalCakeProduct.astro` consume formatted string props | Avoid unrelated component changes | Format in parent/preview |
| Remove only price content | Personal Cake JSON also owns legitimate editorial fields | No broad content migration | Delete only `price` keys and schema lines |
| Include preview | `src/pages/products/preview-personal-cake.astro:36` contains `$25.00` | “Every storefront surface” permits no exception | Query and format there too |
| Skip local build | User explicitly said “no need to do build” | Verification cannot claim build success | Use diff/source checks; CI may build later |

## 8. Interfaces and Dependencies

- `formatProductPrice(price: number): string` is added; `formatProductPriceEach` delegates to it.
- `PersonalCakes` prop `price` changes from `string` to `number`.
- `PersonalCakeGrid` prop `price: number` is added; internal item `price` is removed.
- Home `personalCakesSchema.price` and products `productsPersonalCakeSchema.price` are removed.
- No package, lockfile, environment, public endpoint, Sanity schema, cart interface, or route changes.

## 9. Plan of Work

1. Extend the formatter module.
2. Resolve both product prices concurrently in each main page and pass Personal Cake numbers to their components.
3. Convert the two Personal Cake presentation parents to numeric props and shared formatting.
4. Replace the preview literal through the same query/formatter path.
5. Remove three content values and two schema requirements.
6. Run exact diff validation, source searches, and `git diff --check`; do not run a local build.

## 10. Exact File Changes

### `src/lib/format/productPrice.ts`
**Action:** Modify
**Why:** Provide one currency representation for both product types.
**Impact:** Existing cupcake output remains `$0.00 each`.

```diff
diff --git a/src/lib/format/productPrice.ts b/src/lib/format/productPrice.ts
--- a/src/lib/format/productPrice.ts
+++ b/src/lib/format/productPrice.ts
@@ -1,3 +1,7 @@
+export function formatProductPrice(price: number): string {
+  return `$${price.toFixed(2)}`;
+}
+
 export function formatProductPriceEach(price: number): string {
-  return `$${price.toFixed(2)} each`;
+  return `${formatProductPrice(price)} each`;
 }
```

### `src/pages/index.astro`
**Action:** Modify
**Why:** Supply both homepage sections from Sanity.
**Impact:** Two independent queries run concurrently during static generation.

```diff
diff --git a/src/pages/index.astro b/src/pages/index.astro
--- a/src/pages/index.astro
+++ b/src/pages/index.astro
@@ -41,7 +41,10 @@
 const personalCakes = requireSection('personal-cakes');
 const followUs = requireSection('follow-us');
 const footer = requireSection('footer');
-const cupcakePrice = await getRequiredProductPriceBySlug('cupcakes');
+const [cupcakePrice, personalCakePrice] = await Promise.all([
+  getRequiredProductPriceBySlug('cupcakes'),
+  getRequiredProductPriceBySlug('personal-cakes'),
+]);
 ---
 <Layout title="Cups & Cakes">
   <Navbar
@@ -76,7 +79,7 @@
     heading={personalCakes.heading}
     caption={personalCakes.caption}
     flavorHeadline={personalCakes.flavorHeadline}
-    price={personalCakes.price}
+    price={personalCakePrice}
     chocolateHref={personalCakes.chocolateHref}
     chocolateLabel={personalCakes.chocolateLabel}
     vanillaHref={personalCakes.vanillaHref}
```

### `src/components/home/PersonalCakes.astro`
**Action:** Modify
**Why:** Replace formatted content input with catalog number.
**Impact:** Homepage display changes from `$25` to consistent `$25.00` for current data.

```diff
diff --git a/src/components/home/PersonalCakes.astro b/src/components/home/PersonalCakes.astro
--- a/src/components/home/PersonalCakes.astro
+++ b/src/components/home/PersonalCakes.astro
@@ -1,9 +1,11 @@
 ---
+import { formatProductPrice } from "../../lib/format/productPrice";
+
 interface Props {
   heading: string;
   caption: string;
   flavorHeadline: string;
-  price: string;
+  price: number;
   chocolateHref: string;
   chocolateLabel: string;
   vanillaHref: string;
@@ -20,6 +22,8 @@
   vanillaHref,
   vanillaLabel,
 } = Astro.props;
+
+const formattedPrice = formatProductPrice(price);
 ---

 <section
@@ -132,7 +136,7 @@
             class="m-0 text-center text-white font-medium leading-none drop-shadow-md
                    text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl"
             data-node-id="3311:1716"
-          >{price}</p>
+          >{formattedPrice}</p>
         </div>

         <a
```

### `src/pages/products/index.astro`
**Action:** Modify
**Why:** Supply both product grids from Sanity.
**Impact:** Personal Cake grid gains one numeric prop.

```diff
diff --git a/src/pages/products/index.astro b/src/pages/products/index.astro
--- a/src/pages/products/index.astro
+++ b/src/pages/products/index.astro
@@ -12,14 +12,17 @@
 const { navbar, footer, followUs } = await loadHomeContent();
 const { categoryHeader, cupcakes, personalCakes } =
   await loadProductsContent();
-const cupcakePrice = await getRequiredProductPriceBySlug("cupcakes");
+const [cupcakePrice, personalCakePrice] = await Promise.all([
+  getRequiredProductPriceBySlug("cupcakes"),
+  getRequiredProductPriceBySlug("personal-cakes"),
+]);
 ---
 <Layout title="Cupcakes & Personal Cakes — Cups & Cakes">
   <div class="flex min-h-dvh flex-col">
     <Navbar {...navbar} mode="store" activeLink="products" facebookHref={followUs.facebookHref} instagramHref={followUs.instagramHref} />
     <CategoryHeader {...categoryHeader} />
     <CupcakeGrid {...cupcakes} price={cupcakePrice} />
-    <PersonalCakeGrid {...personalCakes} />
+    <PersonalCakeGrid {...personalCakes} price={personalCakePrice} />
     <Footer {...footer} facebookHref={followUs.facebookHref} instagramHref={followUs.instagramHref} />
   </div>
 </Layout>
```

### `src/components/product/PersonalCakeGrid.astro`
**Action:** Modify
**Why:** One catalog number replaces two content strings.
**Impact:** `PersonalCakeCard` keeps its existing string prop.

```diff
diff --git a/src/components/product/PersonalCakeGrid.astro b/src/components/product/PersonalCakeGrid.astro
--- a/src/components/product/PersonalCakeGrid.astro
+++ b/src/components/product/PersonalCakeGrid.astro
@@ -6,12 +6,12 @@
  * anchor target (#personal-cakes) used by the CategoryHeader link.
  */
 import PersonalCakeCard from "./PersonalCakeCard.astro";
+import { formatProductPrice } from "../../lib/format/productPrice";

 interface Item {
   key: "chocolate" | "vanilla";
   name: string;
   description: string;
-  price: string;
   imageSrc: string;
   imageAlt: string;
   orderHref: string;
@@ -21,9 +21,11 @@
   heading: string;
   caption: string;
   items: ReadonlyArray<Item>;
+  price: number;
 }

-const { heading, caption, items } = Astro.props;
+const { heading, caption, items, price } = Astro.props;
+const formattedPrice = formatProductPrice(price);
 ---

 <section
@@ -63,7 +65,7 @@
         <PersonalCakeCard
           name={c.name}
           description={c.description}
-          price={c.price}
+          price={formattedPrice}
           imageSrc={c.imageSrc}
           imageAlt={c.imageAlt}
           orderHref={c.orderHref}
```

### `src/pages/products/preview-personal-cake.astro`
**Action:** Modify
**Why:** The preview is the last component-level `$25.00` literal.
**Impact:** Preview now fails safely with the same catalog dependency.

```diff
diff --git a/src/pages/products/preview-personal-cake.astro b/src/pages/products/preview-personal-cake.astro
--- a/src/pages/products/preview-personal-cake.astro
+++ b/src/pages/products/preview-personal-cake.astro
@@ -5,8 +5,11 @@
 import Footer from "../../components/home/Footer.astro";
 import PersonalCakeProduct from "../../components/product/PersonalCakeProduct.astro";
 import { loadHomeContent } from "../../lib/content/home";
+import { formatProductPrice } from "../../lib/format/productPrice";
+import { getRequiredProductPriceBySlug } from "../../lib/sanity/queries/products";

 const { navbar, footer, followUs } = await loadHomeContent();
+const personalCakePrice = await getRequiredProductPriceBySlug("personal-cakes");
 ---

 <Layout title="Personal Cake — Cups & Cakes">
@@ -33,7 +36,7 @@
         },
         { name: "Occasion", inputType: "radio", options: ["Regular", "Birthday", "Wedding", "Holiday", "Other"].map((label) => ({ label })) },
       ]}
-      price="$25.00"
+      price={formatProductPrice(personalCakePrice)}
     />
     <Footer {...footer} facebookHref={followUs.facebookHref} instagramHref={followUs.instagramHref} />
   </div>
```

### `src/content/home/personal-cakes.json`
**Action:** Modify
**Why:** Remove homepage duplicate.
**Impact:** Editorial fields remain unchanged.

```diff
diff --git a/src/content/home/personal-cakes.json b/src/content/home/personal-cakes.json
--- a/src/content/home/personal-cakes.json
+++ b/src/content/home/personal-cakes.json
@@ -3,7 +3,6 @@
   "heading": "PERSONAL CAKES",
   "caption": "Small in size but big in bringing joy to each bite!",
   "flavorHeadline": "Choose your flavor!",
-  "price": "$25",
   "chocolateHref": "/order",
   "chocolateLabel": "Chocolate",
   "vanillaHref": "/order",
```

### `src/content/products/personal-cakes.json`
**Action:** Modify
**Why:** Remove both grid duplicates.
**Impact:** Flavor-specific editorial fields remain unchanged.

```diff
diff --git a/src/content/products/personal-cakes.json b/src/content/products/personal-cakes.json
--- a/src/content/products/personal-cakes.json
+++ b/src/content/products/personal-cakes.json
@@ -7,7 +7,6 @@
       "key": "chocolate",
       "name": "Chocolate",
       "description": "Rich and indulgent with a smooth, chocolatey finish, layered for a perfectly satisfying bite.",
-      "price": "$25",
       "imageSrc": "/assets/personal-cake-product.png",
       "imageAlt": "Chocolate personal cake with pink frosting",
       "orderHref": "/products/personal-cakes/chocolate"
@@ -16,7 +15,6 @@
       "key": "vanilla",
       "name": "Vanilla",
       "description": "Smooth and delicately sweet with a rich vanilla flavor.",
-      "price": "$25",
       "imageSrc": "/assets/personal-cake-vanilla.png",
       "imageAlt": "Vanilla personal cake with white frosting",
       "orderHref": "/products/personal-cakes/vanilla"
```

### `src/content.config.ts`
**Action:** Modify
**Why:** Match both price-free Personal Cake content shapes.
**Impact:** Other schemas, including transactional Sanity product price, remain unchanged.

```diff
diff --git a/src/content.config.ts b/src/content.config.ts
--- a/src/content.config.ts
+++ b/src/content.config.ts
@@ -50,7 +50,6 @@
   heading: z.string(),
   caption: z.string(),
   flavorHeadline: z.string(),
-  price: z.string(),
   chocolateHref: z.string(),
   chocolateLabel: z.string(),
   vanillaHref: z.string(),
@@ -257,7 +256,6 @@
   key: z.enum(["chocolate", "vanilla"]),
   name: z.string(),
   description: z.string(),
-  price: z.string(),
   imageSrc: z.string(),
   imageAlt: z.string(),
   orderHref: z.string(),
```

## 11. Concrete Steps

From `/Users/dev/Projects/cupscakes-website`:

1. Apply the nine exact diffs above.
2. Run `rg -n '\$4(\.00)? each|\$25(\.00)?|"price"' src/components/home/CupcakeCarousel.astro src/content/home/personal-cakes.json src/content/products/cupcakes.json src/content/products/personal-cakes.json src/pages/products/preview-personal-cake.astro`; expect no product display literal or marketing price field.
3. Run `rg -n 'getRequiredProductPriceBySlug' src/pages/index.astro src/pages/products/index.astro src/pages/products/preview-personal-cake.astro`; expect both slugs covered.
4. Run `git diff --check`; expect no output.
5. Do not run `npm run build` locally.

## 12. Validation and Acceptance

- Source-contract checks confirm both slugs are resolved at every non-transactional page entry point.
- The shared formatter deterministically maps 4 → `$4.00`, cupcake wrapper → `$4.00 each`, and 25 → `$25.00`.
- Targeted source search finds no numeric fallback in the homepage carousel, both marketing content collections, or preview route.
- Existing product-detail/cart Sanity paths remain unchanged.
- `git diff --check` verifies patch hygiene. Build success is deliberately not claimed.

## 13. Idempotence and Recovery

All changes are source-only and repeatable. No Sanity data is written. Failure recovery is to correct the existing catalog record and rerun the normal deployment build. Reverting the nine diffs restores the pre-revision state; previously applied cupcake work remains independently reversible through its earlier diff.

## 14. Risks and Decisions

- The preview route now depends on Sanity, matching every other product surface.
- Homepage and products index each issue two small concurrent build-time queries; no runtime cost is added.
- Personal Cake marketing displays change from `$25` to `$25.00` for consistent two-decimal currency formatting.
- No local build evidence will be available because the user explicitly waived it.

## 15. Review Log

- **2026-07-21 — Revised scaffold**: Expanded scope after repository inspection proved Personal Cake duplicates in two content files and the preview route. Generated all nine remaining diffs mechanically against the current partially implemented worktree; each passed the whiteboarding helper's per-file `git apply --check`. **Status: Scaffolded — review required.**
- **2026-07-21 — Review pass 1**: Concatenated all nine diff blocks and ran the required `git apply --check -`; result passed with no output. Re-read spec, tasks, and current callers and found T016/T017 incorrectly marked parallel even though both edit `src/content.config.ts`, plus User Story 2 lacked an explicit Personal Cake catalog-update scenario. Removed both parallel markers, documented sequential ownership, and added the missing scenario. Exact source diffs did not change. **Status: Revised — review again.**
- **2026-07-21 — Review pass 2**: Re-ran the concatenated patch check successfully and compared all validation instructions. Found `quickstart.md` still instructed an isolated local failure build, conflicting with the user's explicit waiver. Replaced it with source-contract inspection and aligned spec/plan verification language with source checks plus normal PR CI. Exact source diffs did not change. **Status: Revised — review again.**
- **2026-07-21 — Review pass 3**: Re-ran the concatenated patch check successfully and reviewed the revised quickstart against expanded scope. Found its prerequisites and optional CI search still covered cupcakes only and mislabeled Personal Cakes as unrelated. Added the `personal-cakes` prerequisite, `$25.00`/base-price checks, and accurate transactional-regression wording. Exact source diffs did not change. **Status: Revised — review again.**
- **2026-07-21 — Review pass 4**: Re-read the full expanded user contract, spec, plan, tasks, quickstart, current source, and all nine exact diffs. Confirmed directory-map/modification-table/diff parity, caller and schema coverage, preserved child interfaces, absence of overlapping parallel ownership, and the explicit no-local-build constraint. Ran the concatenated `git apply --check -`; result passed with no output. No material issue remained. **Status: Prepared — awaiting explicit approval.**

## 16. Approval

The prior approval is invalid because the routed plan materially changed. Implementation of these nine remaining diffs awaits explicit user approval of this **Prepared** revision.
