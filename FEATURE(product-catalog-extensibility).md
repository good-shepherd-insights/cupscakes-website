# FEATURE(product-catalog-extensibility)

## Request
Design the Sanity `product` schema so that:
1. New product **categories** (today: cupcakes, personal cakes) can be added by an editor in Studio, with no schema/code deploy.
2. New product **customization axes** (today: Flavor, Frosting Color, Quantity, Occasion) can be added the same way — no new schema field, no new component prop, no new GROQ field per axis.
3. Individual **options within a group can carry a price surcharge** — concretely, on Personal Cakes, choosing "Custom" under Frosting Color adds $3.00. This must be data (editable in Studio per option), not a hardcoded `if (color === "Custom")` somewhere in code.
4. **No silent slug collisions.** Splitting products across categories raises the odds of two documents generating the same `slug` (e.g. a "Chocolate" cupcake and a "Chocolate" personal cake both default to `chocolate`). Both `product.slug` and `productCategory.slug` get an enforced uniqueness check in Studio, since an undetected collision breaks `getProductBySlug`/`getProductsByCategorySlug` (arbitrary pick via `[0]`) and `getStaticPaths` (duplicate static routes) silently, with no error until someone notices the wrong product rendering.

This supersedes the earlier, narrower `FEATURE(product-category-schema).md` plan, which made `category` a closed 2-value enum and left the four customization axes as four separate fixed fields — both of which require a code change to extend. That plan optimized for "matches today's two categories" rather than "doesn't need a redeploy when a third one shows up," which is the actual ask.

**Scope boundary on the price surcharge:** this plan makes the surcharge data-driven and shows it next to the option label (e.g. "Custom (+$3.00)") so the customer sees it before choosing. It does **not** add live price recalculation — the `$25.00` price display on the product page is still static server-rendered text today, with zero client-side JS in this component, and wiring up "selecting Custom updates the displayed total" is a real, separate feature (client state, a JS island, and a decision about whether Snipcart's own line-item pricing or this page's display is the source of truth). That gap is called out explicitly in Risk Notes rather than silently left implicit.

**Still schema + type + query + the one component that renders customization groups (`PersonalCakeProduct.astro`) and its two callers.** Still does not touch `CupcakeGrid`/`PersonalCakeGrid`/`products/index.astro` — that's a separate, orthogonal duplication problem (two near-identical grid templates) and is called out explicitly in Risk Notes as the next thing this groundwork enables.

---

## Directory Map
```text
src/
├── sanity/
│   ├── lib/
│   │   └── uniqueSlug.ts                            ← CREATE (shared slug-uniqueness validator)
│   └── schemaTypes/
│       ├── productCategory.ts                       ← CREATE (category as its own document type)
│       ├── product.ts                                ← MODIFY (category → reference; 4 fixed fields → 1 generic array)
│       └── index.ts                                  ← MODIFY (register productCategory)
├── types/
│   └── product.ts                                  ← MODIFY (ProductCategory + CustomOption types; Product reshaped)
├── lib/sanity/queries/
│   └── products.ts                                  ← MODIFY (dereference category; fetch customOptions; category-slug query; category list query)
├── components/product/
│   └── PersonalCakeProduct.astro                    ← MODIFY (4 hardcoded fieldsets → 1 generic loop over customOptions)
└── pages/products/
    ├── [slug].astro                                 ← MODIFY (pass customOptions; drop DEFAULT_OCCASIONS fallback)
    ├── preview-cupcakes.astro                        ← MODIFY (inline arrays → customOptions shape; still TEMP)
    └── preview-personal-cake.astro                   ← MODIFY (inline arrays → customOptions shape; still TEMP)
```

---

## Modification Table
| File | Action | Why |
|---|---|---|
| `src/sanity/lib/uniqueSlug.ts` | Create | Shared async validator so both `product` and `productCategory` slugs reject collisions, without duplicating the query in two schema files |
| `src/sanity/schemaTypes/productCategory.ts` | Create | Category becomes editor-owned content, not a code-level enum; `slug` is enforced-unique |
| `src/sanity/schemaTypes/product.ts` | Modify | `category` → reference; `flavors`/`frostingColors`/`quantities`/`occasions` → one generic `customOptions` array, each option carrying an optional price surcharge; `slug` is enforced-unique |
| `src/sanity/schemaTypes/index.ts` | Modify | Register the new document type |
| `src/types/product.ts` | Modify | Add `ProductCategory`, `CustomOption`, `CustomOptionValue`; reshape `Product` |
| `src/lib/sanity/queries/products.ts` | Modify | Dereference `category`, fetch `customOptions`, add category-aware queries |
| `src/components/product/PersonalCakeProduct.astro` | Modify | Collapse 4 hardcoded fieldsets into 1 generic, data-driven loop |
| `src/pages/products/[slug].astro` | Modify | Adapt to the new `Product` shape; drop the hardcoded occasions fallback |
| `src/pages/products/preview-cupcakes.astro` | Modify | Adapt inline props to the new component contract (still temp, still deleted once Sanity catalog is live) |
| `src/pages/products/preview-personal-cake.astro` | Modify | Same |

---

## Existing Pattern Audit

- **`category` as enum vs. reference:** every other "this product belongs to X" relationship in this schema is absent — there's no precedent either way in `src/sanity/schemaTypes/`. But Sanity's own idiom for "a finite-but-growing, editor-managed set of named things a document belongs to" is a referenced document type, not a `string` enum — enums are for closed sets that only change via code (e.g. an `inputType` of `radio`/`checkbox`, which truly is closed because it's tied to two hardcoded rendering branches). Category is not closed; using a reference matches the actual cardinality of the problem.
- **`customOptions` as a generic array vs. four fixed fields:** this directly mirrors a pattern that already exists in this codebase — `src/lib/snipcart/attributes.ts`'s `CustomField { name, options, type, required, ... }` is exactly "a named, typed, option-bearing field, repeated N times." The current Sanity schema (`flavors`, `frostingColors`, `quantities`, `occasions` as four parallel top-level fields) is the inconsistent half — it solves the same shape of problem the Snipcart side already solved generically, but with one field per instance instead of an array of instances. Generalizing `customOptions` resolves that inconsistency by following the dominant pattern already proven elsewhere in the repo, not inventing a new one.
- **`PersonalCakeProduct.astro`'s four fieldsets (lines 218–368)** are structurally identical: `<fieldset><legend>{label}{optional helper}</legend><div class="grid ...">{options.map(option => <label class={selectionBtn}><input type=.../></label>)}</div></fieldset>`. The only real per-section differences are: top margin (first section uses a smaller `mt-*` scale than the rest), input `type` (radio vs. checkbox), and whether a trailing spacer `<span>` is rendered to keep the 3-column grid stride full. The spacer is present for Flavor (2 options) and Occasion (5 options) but *absent* for Frosting Color (8 options) — an existing inconsistency in the component itself, not something this change introduces. Per the skill's normalization rule, the dominant pattern (3 of 4 sections currently special-case toward a filled grid; only Frosting Color's 8-item case doesn't trigger it) is followed: the generic loop computes `needsSpacer = options.length % 3 === 2` for every group, which means Frosting Color's last row becomes filled too. This is a visual normalization, not a redesign — it makes the existing layout intent consistent across all groups instead of arbitrary per-section.
- **Figma `data-node-id` traceability attributes** on the four current fieldsets are tied to specific named Figma nodes (3311:2301, 3311:2320, 3311:2236). Once sections are generic/CMS-ordered, there is no longer a 1:1 mapping between "the Nth customOption" and a fixed Figma node — these attributes are dropped on the generated fieldsets. They were debug/traceability aids only, never functional; removing them is an accepted, explicit loss (see Risk Notes), not an oversight.
- **`DEFAULT_OCCASIONS` in `pages/products/[slug].astro:11`** is a code-level fallback used when a Sanity product has no `occasions`. With customization fully generalized into `customOptions`, there is no longer a special-cased "occasions" field for code to default — if an editor omits an Occasion group in Studio, the product simply has no Occasion section, matching how Frosting Color and Quantity already behave today when omitted. This is a deliberate behavior change: it moves "every product needs an Occasion choice" from an implicit code default to an explicit editorial responsibility, called out in Risk Notes.
- **Per-option price surcharge:** nothing in the current schema, types, or component has any notion of price varying by selection — `price` is one flat number on the product, and option labels in the original hardcoded arrays (`"Custom"`) are plain strings with no associated cost. The "Custom frosting color costs +$3" requirement cannot be expressed at all today; it would otherwise have to live as a hardcoded string check in component or checkout code (`if (selectedColor === "Custom") total += 3`), which is the exact kind of logic-in-code-instead-of-data this whole plan exists to avoid. So `options` within a `customOption` group changes from `string[]` to an array of `{ label, priceModifier? }` objects — the minimum structure needed to let an editor attach a cost to *any* option, on *any* group, on *any* product, without it being special-cased to "frosting color" or "Custom" anywhere in code.
- **Slug uniqueness:** neither `product.slug` nor (the new) `productCategory.slug` has ever had a uniqueness check — the original schema only had `Rule.required()`. `options: { source: 'name' }` auto-suggests a slug but does not prevent two documents from ending up with the same one. This was a latent gap before this plan (single category, smaller content set, lower odds of collision); splitting products across categories raises the odds directly, since the same flavor name (e.g. "Chocolate") plausibly recurs across both Cupcakes and Personal Cakes and both would default-slugify to `chocolate`. Every slug-keyed query this plan adds or already relies on (`getProductBySlug`, `getProductsByCategorySlug`, `getAllProductSlugs` → `getStaticPaths`) assumes uniqueness and degrades silently (wrong product served, or a static-route collision at build time) if it's violated. Sanity has no built-in uniqueness constraint for `slug` — the documented pattern is an async `Rule.custom()` validator querying the dataset for any other document sharing the slug, which is what's added here.

---

## Execution Plan

### Step 1 — Add the shared slug-uniqueness validator
Create `src/sanity/lib/uniqueSlug.ts` before either schema file needs it, since both `product` and `productCategory` depend on it.

### Step 2 — Create `productCategory` as its own document type
Title, slug (uniqueness-checked), optional heading/caption override, optional display-order — gives editors a place to add a new category without touching code.

### Step 3 — Reshape `product` schema
`category` becomes a required reference to `productCategory`. `slug` gets the same uniqueness check. The four fixed customization fields are removed and replaced by one `customOptions` array of objects, each with `name`, `inputType` (`radio` | `checkbox`), optional `helperText`, and `options`.

### Step 4 — Register the new document type
Add `productCategory` to `schemaTypes/index.ts`.

### Step 5 — Reshape the TS types
Add `ProductCategory` and `CustomOption`; `Product.category` becomes the dereferenced object shape, `customOptions` replaces the four removed fields.

### Step 6 — Update the GROQ read path
Dereference `category->{...}` in `PRODUCT_FIELDS`; fetch `customOptions` (no per-field projection needed — it's already a flat array of plain objects). Replace `getProductsByCategory(category: string)` (from the superseded plan — never implemented, no callers to migrate) with `getProductsByCategorySlug(categorySlug: string)`, and add `getAllProductCategories()` for the eventual grid migration.

### Step 7 — Collapse `PersonalCakeProduct.astro`'s four fieldsets into one generic loop
Single `customOptions.map()` loop renders each group with the same markup/classes the four sections already use, parameterized by `name`, `inputType`, `helperText`, `options`, and position (first vs. rest, for the margin-top scale).

### Step 8 — Update the three callers of `PersonalCakeProduct`
`[slug].astro` passes `product.customOptions ?? []` and drops `DEFAULT_OCCASIONS`. The two TEMP preview pages convert their inline arrays to the `customOptions` shape so the build keeps passing until they're deleted in the (separate, already-planned) grid migration.

---

## File-by-File Changes

### `src/sanity/lib/uniqueSlug.ts` (new file)
**Action:** Create
**Why:** One shared async validator for both `product.slug` and `productCategory.slug`, instead of duplicating the same Sanity-dataset query in two schema files.

```ts
import type { SlugValidationContext } from 'sanity';

/**
 * Rejects publishing a document whose slug matches another document
 * of the same `_type`. Sanity's `slug` field has no built-in uniqueness
 * constraint — this is the standard async-custom-validator pattern.
 */
export function validateUniqueSlug(documentType: string) {
  return async (slug: { current?: string } | undefined, context: SlugValidationContext) => {
    if (!slug?.current) return true;

    const { document, getClient } = context;
    const client = getClient({ apiVersion: '2026-05-01' });
    const id = document?._id.replace(/^drafts\./, '');

    const conflictId = await client.fetch<string | null>(
      `*[_type == $type && !(_id in [$draft, $published]) && slug.current == $slug][0]._id`,
      { type: documentType, draft: `drafts.${id}`, published: id, slug: slug.current }
    );

    return conflictId ? 'Slug is already in use by another document — slugs must be unique.' : true;
  };
}
```

#### Reasoning
- Parameterized by `documentType` so the same function backs both `product` and `productCategory` rather than two near-identical inline validators — same reasoning as why `PRODUCT_FIELDS` is one shared constant instead of being repeated per query.
- Excludes both the draft and published IDs of the document being checked (`!(_id in [$draft, $published])`) — without that exclusion, a document would flag itself as a conflict with its own published/draft counterpart every time it's saved.
- Returns a string (the error message) on conflict, `true` otherwise — the shape Sanity's `Rule.custom()` expects.

---

### `src/sanity/schemaTypes/productCategory.ts` (new file)
**Action:** Create
**Why:** Category becomes editor-managed content instead of a closed code-level enum.

```ts
import { defineField, defineType } from 'sanity';
import { validateUniqueSlug } from '../lib/uniqueSlug';

export const productCategory = defineType({
  name: 'productCategory',
  title: 'Product Category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Editorial name, e.g. "Cupcakes". Used as the /products grid heading unless overridden below.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required().custom(validateUniqueSlug('productCategory')),
    }),
    defineField({
      name: 'heading',
      title: 'Grid Heading Override',
      type: 'string',
      description: 'Overrides Title on the /products grid heading, if set.',
    }),
    defineField({
      name: 'caption',
      title: 'Grid Caption',
      type: 'string',
      description: 'Tagline shown next to the heading on /products.',
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers render first on /products. Leave blank to sort last.',
    }),
  ],
});
```

#### Reasoning
- `title` + optional `heading` override (rather than just one field) follows the same "structural identity vs. display copy" split already used on `product` itself (`name` is identity, `subtitle`/`servingInfo` are display copy that can differ from it).
- `displayOrder` is opt-in (nullable `number`), not a required field — adding a category without setting it just sorts it last, never breaks publish.
- `slug` validation gains `.custom(validateUniqueSlug('productCategory'))` for the same reason as `product.slug` — `getProductsByCategorySlug` and the eventual grid migration both key off this slug, and a collision between two categories would be just as silent and just as bad as a collision between two products.

---

### `src/sanity/schemaTypes/product.ts`
**Action:** Modify
**Why:** Category becomes a reference; customization axes become one generic, extensible array.

#### Before
```ts
import { defineField, defineType } from 'sanity';

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      description: 'Medium-weight line displayed below the product title.',
    }),
    defineField({
      name: 'servingInfo',
      title: 'Serving Info',
      type: 'string',
      description: 'Italic line below subtitle, e.g. "Serves 3-4 people." Leave blank for cupcakes.',
    }),
    defineField({
      name: 'flavors',
      title: 'Flavors',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Flavor options shown as radio buttons, e.g. ["Chocolate", "Vanilla"].',
    }),
    defineField({
      name: 'frostingColors',
      title: 'Frosting Colors',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Frosting color options shown as checkboxes. Leave blank to hide the section (e.g. cupcakes).',
    }),
    defineField({
      name: 'quantities',
      title: 'Quantities',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Quantity options shown as radio buttons. Leave blank to hide the section (e.g. personal cakes).',
    }),
    defineField({
      name: 'occasions',
      title: 'Occasions',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Occasion options. Defaults to Regular/Birthday/Wedding/Holiday/Other when left blank.',
    }),
  ],
});
```

#### After
```ts
import { defineArrayMember, defineField, defineType } from 'sanity';
import { validateUniqueSlug } from '../lib/uniqueSlug';

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required().custom(validateUniqueSlug('product')),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'productCategory' }],
      description: 'Which catalog grid this product appears in on /products.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: (Rule) => Rule.required().positive().precision(2),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      description: 'Medium-weight line displayed below the product title.',
    }),
    defineField({
      name: 'servingInfo',
      title: 'Serving Info',
      type: 'string',
      description: 'Italic line below subtitle, e.g. "Serves 3-4 people." Leave blank for cupcakes.',
    }),
    defineField({
      name: 'customOptions',
      title: 'Customization Options',
      type: 'array',
      description:
        'Each entry is one selection group on the product page (e.g. Flavor, Frosting Color, Quantity, Occasion). Add, remove, or reorder groups here — no code change needed.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'customOption',
          fields: [
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
              description: 'Shown to the customer as the group label, e.g. "Flavor".',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'inputType',
              title: 'Input Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Single choice (radio buttons)', value: 'radio' },
                  { title: 'Multiple choice (checkboxes)', value: 'checkbox' },
                ],
                layout: 'radio',
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'helperText',
              title: 'Helper Text',
              type: 'string',
              description: 'Optional clarifying text after the label, e.g. "(please choose up to 2 colors)".',
            }),
            defineField({
              name: 'options',
              title: 'Options',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'customOptionValue',
                  fields: [
                    defineField({
                      name: 'label',
                      title: 'Label',
                      type: 'string',
                      description: 'e.g. "Custom".',
                      validation: (Rule) => Rule.required(),
                    }),
                    defineField({
                      name: 'priceModifier',
                      title: 'Price Modifier',
                      type: 'number',
                      description: 'Added to the base price when this option is selected, e.g. 3 for +$3.00. Leave blank for no change.',
                      validation: (Rule) => Rule.precision(2),
                    }),
                  ],
                  preview: {
                    select: { title: 'label', subtitle: 'priceModifier' },
                  },
                }),
              ],
              validation: (Rule) =>
                Rule.required()
                  .min(1)
                  .custom((options) => {
                    if (!options) return true;
                    const labels = options
                      .map((o: { label?: string }) => o.label?.trim().toLowerCase())
                      .filter(Boolean);
                    const hasDuplicate = labels.length !== new Set(labels).size;
                    return hasDuplicate ? 'Option labels must be unique within a group.' : true;
                  }),
            }),
          ],
          preview: {
            select: { title: 'name', subtitle: 'inputType' },
          },
        }),
      ],
    }),
  ],
});
```

#### Reasoning
- `slug` validation gains `.custom(validateUniqueSlug('product'))` alongside the existing `.required()` — closes the collision risk described in Existing Pattern Audit. Studio will now block publishing a second product with a slug already in use.
- `category` placed right after `slug` (identity fields), exactly where the superseded plan put the enum version — only the field `type` changed, not its position.
- `customOptions` placed where the four removed fields used to be (after display copy, since it's still "customer-facing presentation," just generalized).
- `inputType` (not `type`) deliberately avoids colliding with Sanity's own `type` keyword inside an object field definition, and avoids implying a false 1:1 match with Snipcart's own `CustomField.type` enum (which has different values like `dropdown`/`textbox` that we don't use) — same shape, intentionally not the same vocabulary.
- `helperText` is the one piece of per-group flexibility the old hardcoded markup needed (the "(please choose up to 2 colors)" suffix on Frosting Color only) — generalizing without it would have silently dropped that copy.
- `preview.select` on the array member means Studio's array list view shows each group's `name` and `inputType` instead of "Untitled" — small but real Studio usability detail for an array editors will be reordering.
- `options` is itself an array of `{ label, priceModifier }` objects, not plain strings — `priceModifier` is optional and defaults to no surcharge, so existing-style option lists (Flavor, Quantity, Occasion — none of which have a cost today) need zero extra input from an editor; only Frosting Color's "Custom" entry gets a `priceModifier: 3` value. This keeps the common case (no surcharge) just as simple as a plain string list was, while making the surcharge expressible on any option, on any group, on any product — not just "Custom" on "Frosting Color" on personal cakes.
- `price` and `priceModifier` both get `.precision(2)` — without it, `number` accepts arbitrary floating-point values (`19.999999999996`, `3.005`), which is the standard class of bug that produces a wrong total at checkout months later for no visible reason. Both money fields get the same constraint rather than leaving one fixed and one not, per the same "don't introduce a third pattern" rule already applied to the spacer normalization.
- The `options` array gets a `.custom()` validator rejecting duplicate `label` values (case-insensitive, trimmed) within the same group — two options named "Custom" in one group would render as two visually identical, ambiguous buttons with no way for the customer (or Snipcart, downstream) to tell which one they picked. Comparison is case-insensitive/trimmed so `"Custom"` and `"custom "` are still caught as the same collision, not a way around the check.

---

### `src/sanity/schemaTypes/index.ts`
**Action:** Modify
**Why:** Register the new document type.

#### Before
```ts
import { product } from './product';

export const schemaTypes = [product];
```

#### After
```ts
import { product } from './product';
import { productCategory } from './productCategory';

export const schemaTypes = [product, productCategory];
```

---

### `src/types/product.ts`
**Action:** Modify
**Why:** Mirror the new reference + generic array shape.

#### Before
```ts
export interface Product {
  _id: string;
  name: string;
  price: number;
  slug: { current: string };
  image: unknown;
  description?: string;
  subtitle?: string;
  servingInfo?: string;
  flavors?: string[];
  /** Frosting Color options. Absence hides the section on the order page. */
  frostingColors?: string[];
  /** Quantity options. Absence hides the section on the order page. */
  quantities?: string[];
  occasions?: string[];
}
```

#### After
```ts
export interface ProductCategory {
  _id: string;
  title: string;
  slug: { current: string };
  heading?: string;
  caption?: string;
  displayOrder?: number;
}

export interface CustomOptionValue {
  label: string;
  /** Added to the product's base price when this option is selected, e.g. 3 for +$3.00. */
  priceModifier?: number;
}

export interface CustomOption {
  name: string;
  inputType: 'radio' | 'checkbox';
  helperText?: string;
  options: CustomOptionValue[];
}

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

#### Reasoning
- `category: ProductCategory` (not `category: { current: string }` style) — `PRODUCT_FIELDS` dereferences the whole object, so the type reflects what's actually fetched, not the raw Sanity reference shape (`{ _ref, _type }`).
- `customOptions` stays optional — a product with zero customization groups (hypothetically a simple no-options item) is valid, same as today's "frostingColors/quantities absent = section hidden" behavior, just generalized to all groups instead of two of them.

---

### `src/lib/sanity/queries/products.ts`
**Action:** Modify
**Why:** Dereference `category`, fetch `customOptions`, expose category-aware queries for the eventual grid migration.

#### Before
```ts
import type { Product } from '../../../types/product';
import { sanityClient } from '../client';

const PRODUCT_FIELDS = `
  _id,
  name,
  price,
  slug,
  image,
  description,
  subtitle,
  servingInfo,
  flavors,
  frostingColors,
  quantities,
  occasions
`;

export async function getAllProducts(): Promise<Product[]> {
  return sanityClient.fetch<Product[]>(
    `*[_type == "product" && defined(slug.current)]{ ${PRODUCT_FIELDS} }`
  );
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return sanityClient.fetch<Product | null>(
    `*[_type == "product" && slug.current == $slug][0]{ ${PRODUCT_FIELDS} }`,
    { slug }
  );
}

export async function getAllProductSlugs(): Promise<Pick<Product, 'slug'>[]> {
  return sanityClient.fetch(`*[_type == "product" && defined(slug.current)]{ slug }`);
}
```

#### After
```ts
import type { Product, ProductCategory } from '../../../types/product';
import { sanityClient } from '../client';

const PRODUCT_FIELDS = `
  _id,
  name,
  price,
  slug,
  category->{ _id, title, slug, heading, caption, displayOrder },
  image,
  description,
  subtitle,
  servingInfo,
  customOptions
`;

export async function getAllProducts(): Promise<Product[]> {
  return sanityClient.fetch<Product[]>(
    `*[_type == "product" && defined(slug.current)]{ ${PRODUCT_FIELDS} }`
  );
}

export async function getProductsByCategorySlug(categorySlug: string): Promise<Product[]> {
  return sanityClient.fetch<Product[]>(
    `*[_type == "product" && category->slug.current == $categorySlug && defined(slug.current)]{ ${PRODUCT_FIELDS} }`,
    { categorySlug }
  );
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return sanityClient.fetch<Product | null>(
    `*[_type == "product" && slug.current == $slug][0]{ ${PRODUCT_FIELDS} }`,
    { slug }
  );
}

export async function getAllProductSlugs(): Promise<Pick<Product, 'slug'>[]> {
  return sanityClient.fetch(`*[_type == "product" && defined(slug.current)]{ slug }`);
}

export async function getAllProductCategories(): Promise<ProductCategory[]> {
  return sanityClient.fetch<ProductCategory[]>(
    `*[_type == "productCategory"] | order(displayOrder asc) { _id, title, slug, heading, caption, displayOrder }`
  );
}
```

#### Reasoning
- `category->{...}` dereference fetches the full category object in one round trip — no N+1 follow-up query needed per product.
- `getProductsByCategorySlug` filters on `category->slug.current` rather than an `_id`/title match, so callers (the eventual grid migration) work with the same human-readable slugs already used everywhere else (`getProductBySlug`, `routes.product(slug)`).
- `getAllProductCategories()` sorted by `displayOrder` server-side (GROQ `order()`) rather than client-side — keeps the sort logic in one place, not duplicated by every future caller.

---

### `src/components/product/PersonalCakeProduct.astro`
**Action:** Modify
**Why:** Replace four hardcoded, near-identical fieldsets with one generic, data-driven loop.

#### Before — Props + destructure (lines 74–111)
```ts
interface Props {
  breadcrumbHrefHome: string;
  breadcrumbHrefOrder: string;
  breadcrumbLabel: string;
  title: string;
  subtitle: string;
  servingInfo?: string;
  imageSrc?: string;
  imageAlt?: string;
  addToCartHref?: string;
  flavors: string[];
  frostingColors?: string[];
  quantities?: string[];
  occasions: string[];
  price: string;
}

const {
  breadcrumbHrefHome,
  breadcrumbHrefOrder,
  breadcrumbLabel,
  title,
  subtitle,
  servingInfo,
  imageSrc = "/assets/personal-cake-product.png",
  imageAlt = "Personal cake with pink frosting",
  addToCartHref = "#",
  flavors,
  frostingColors,
  quantities,
  occasions,
  price,
} = Astro.props;
```

#### After — Props + destructure
```ts
import type { CustomOption } from "../../types/product";

interface Props {
  breadcrumbHrefHome: string;
  breadcrumbHrefOrder: string;
  breadcrumbLabel: string;
  title: string;
  subtitle: string;
  servingInfo?: string;
  imageSrc?: string;
  imageAlt?: string;
  addToCartHref?: string;
  /** Selection groups rendered in order, e.g. Flavor, Frosting Color, Quantity, Occasion. */
  customOptions: CustomOption[];
  price: string;
}

const {
  breadcrumbHrefHome,
  breadcrumbHrefOrder,
  breadcrumbLabel,
  title,
  subtitle,
  servingInfo,
  imageSrc = "/assets/personal-cake-product.png",
  imageAlt = "Personal cake with pink frosting",
  addToCartHref = "#",
  customOptions,
  price,
} = Astro.props;
```

#### Before — Four hardcoded fieldsets (lines 218–368, Flavor / Frosting Color / Quantity / Occasion)
```astro
<fieldset
  class="m-0 p-0 border-0
         mt-6 sm:mt-7 md:mt-8 lg:mt-10 xl:mt-[55px]"
  data-node-id="3311:2301"
>
  <legend
    class="p-0 m-0 text-black font-light leading-[1]
           text-[15px] sm:text-[18px] md:text-[22px] lg:text-[28px] xl:text-[35px]"
  >Flavor:</legend>

  <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-3 sm:gap-x-4 md:gap-x-5 lg:gap-x-6 xl:gap-x-[46px] gap-y-3 sm:gap-y-4 md:gap-y-5 lg:gap-y-6 xl:gap-y-[49px] mt-4 sm:mt-5 md:mt-6 lg:mt-8 xl:mt-[60px] max-w-[810px]">
    {flavors.map((label, i) => (
      <label class={selectionBtn} data-node-id={i === 0 ? "3311:2306" : "3311:2313"}>
        <input type="radio" name="flavor" value={label} class="sr-only peer" />
        <span class="peer-checked:underline">{label}</span>
      </label>
    ))}
    <span class="hidden sm:block" aria-hidden="true"></span>
  </div>
</fieldset>

{frostingColors && (
  <fieldset class="m-0 p-0 border-0 mt-8 sm:mt-10 md:mt-12 lg:mt-14 xl:mt-[78px]" data-node-id="3311:2320">
    <legend class="p-0 m-0 text-black leading-[1.15] text-[15px] sm:text-[18px] md:text-[22px] lg:text-[28px] xl:text-[35px]">
      <span class="font-light">Frosting Color: </span>
      <span class="font-normal">(please choose up to 2 colors)</span>
    </legend>
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-3 sm:gap-x-4 md:gap-x-5 lg:gap-x-6 xl:gap-x-[46px] gap-y-3 sm:gap-y-4 md:gap-y-5 lg:gap-y-6 xl:gap-y-[56px] mt-4 sm:mt-5 md:mt-6 lg:mt-8 xl:mt-[60px] max-w-[810px]">
      {frostingColors.map((label) => (
        <label class={selectionBtn}>
          <input type="checkbox" name="frosting" value={label} class="sr-only peer" />
          <span class="peer-checked:underline">{label}</span>
        </label>
      ))}
    </div>
  </fieldset>
)}

{quantities && (
  <fieldset class="m-0 p-0 border-0 mt-8 sm:mt-10 md:mt-12 lg:mt-14 xl:mt-[78px]">
    <legend class="p-0 m-0 text-black font-light leading-[1] text-[15px] sm:text-[18px] md:text-[22px] lg:text-[28px] xl:text-[35px]">Quantity:</legend>
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-3 sm:gap-x-4 md:gap-x-5 lg:gap-x-6 xl:gap-x-[46px] gap-y-3 sm:gap-y-4 md:gap-y-5 lg:gap-y-6 xl:gap-y-[49px] mt-4 sm:mt-5 md:mt-6 lg:mt-8 xl:mt-[60px] max-w-[810px]">
      {quantities.map((label) => (
        <label class={selectionBtn}>
          <input type="radio" name="quantity" value={label} class="sr-only peer" />
          <span class="peer-checked:underline">{label}</span>
        </label>
      ))}
    </div>
  </fieldset>
)}

<fieldset class="m-0 p-0 border-0 mt-8 sm:mt-10 md:mt-12 lg:mt-14 xl:mt-[78px]" data-node-id="3311:2236">
  <legend class="p-0 m-0 text-black font-light leading-[1] text-[15px] sm:text-[18px] md:text-[22px] lg:text-[28px] xl:text-[35px]">Occassion:</legend>
  <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-3 sm:gap-x-4 md:gap-x-5 lg:gap-x-6 xl:gap-x-[46px] gap-y-3 sm:gap-y-4 md:gap-y-5 lg:gap-y-6 xl:gap-y-[49px] mt-4 sm:mt-5 md:mt-6 lg:mt-8 xl:mt-[60px] max-w-[810px]">
    {occasions.map((label) => (
      <label class={selectionBtn}>
        <input type="radio" name="occasion" value={label} class="sr-only peer" />
        <span class="peer-checked:underline">{label}</span>
      </label>
    ))}
    <span class="hidden sm:block" aria-hidden="true"></span>
  </div>
</fieldset>
```

#### After — One generic loop
```astro
{customOptions.map((group, i) => {
  const needsSpacer = group.options.length % 3 === 2;
  return (
    <fieldset
      class={`m-0 p-0 border-0 ${
        i === 0
          ? "mt-6 sm:mt-7 md:mt-8 lg:mt-10 xl:mt-[55px]"
          : "mt-8 sm:mt-10 md:mt-12 lg:mt-14 xl:mt-[78px]"
      }`}
    >
      <legend
        class="p-0 m-0 text-black leading-[1.15]
               text-[15px] sm:text-[18px] md:text-[22px] lg:text-[28px] xl:text-[35px]"
      >
        <span class="font-light">{group.name}: </span>
        {group.helperText && <span class="font-normal">{group.helperText}</span>}
      </legend>

      <div
        class="grid grid-cols-2 sm:grid-cols-3
               gap-x-3 sm:gap-x-4 md:gap-x-5 lg:gap-x-6 xl:gap-x-[46px]
               gap-y-3 sm:gap-y-4 md:gap-y-5 lg:gap-y-6 xl:gap-y-[49px]
               mt-4 sm:mt-5 md:mt-6 lg:mt-8 xl:mt-[60px]
               max-w-[810px]"
      >
        {group.options.map((option) => (
          <label class={selectionBtn}>
            <input type={group.inputType} name={group.name} value={option.label} class="sr-only peer" />
            <span class="peer-checked:underline">
              {option.label}
              {!!option.priceModifier && ` (+$${option.priceModifier.toFixed(2)})`}
            </span>
          </label>
        ))}
        {needsSpacer && <span class="hidden sm:block" aria-hidden="true"></span>}
      </div>
    </fieldset>
  );
})}
```

#### Reasoning
- Margin-top is positional (`i === 0` vs. rest), not name-keyed — matches the actual original rule (first section closer to the subtitle, every section after that uses the wider gap), so it survives groups being renamed/reordered in Studio.
- `needsSpacer` computed uniformly (`options.length % 3 === 2`) — applies the dominant existing behavior (Flavor, Occasion) to Frosting Color too, where it was previously inconsistent. Quantity (3 items, no remainder) is unaffected either way.
- `data-node-id` attributes are dropped from the generated fieldsets — they pointed at specific named Figma nodes that no longer correspond 1:1 to a dynamic, CMS-ordered list of groups. This is a deliberate, accepted loss of Figma traceability metadata, not a visual change (see Risk Notes).
- `option.priceModifier` is rendered inline next to the label (e.g. "Custom (+$3.00)") only when present and non-zero — every other option in every other group today has no `priceModifier`, so this line is a no-op for them and the visual output for Flavor/Quantity/Occasion is unchanged. Frosting Color's "Custom" option is the one visual change this plan introduces, and it's the one the request specifically asked for.
- The displayed `price` prop below the form (the product's base price) is unaffected by selection — it does not add the surcharge live. See Risk Notes for why that's an explicit, separate concern.

---

### `src/pages/products/[slug].astro`
**Action:** Modify
**Why:** Adapt to the new `Product` shape; the hardcoded occasions fallback no longer applies once occasions are just another `customOptions` entry.

#### Before
```ts
const DEFAULT_OCCASIONS = ["Regular", "Birthday", "Wedding", "Holiday", "Other"];

export async function getStaticPaths() {
  const slugs = await getAllProductSlugs();
  return slugs.map((p) => ({ params: { slug: p.slug.current } }));
}

const { slug } = Astro.params;
const [{ navbar, footer }, product] = await Promise.all([
  loadHomeContent(),
  getProductBySlug(slug!),
]);

if (!product) return Astro.redirect('/404');

const imageUrl = product.image
  ? urlFor(product.image as any).width(IMAGE_WIDTHS.detail).url()
  : undefined;
```
```astro
    <PersonalCakeProduct
      breadcrumbHrefHome={navbar.homeHref}
      breadcrumbHrefOrder={navbar.orderHref}
      breadcrumbLabel={product.name}
      title={product.name}
      subtitle={product.subtitle ?? ""}
      servingInfo={product.servingInfo}
      imageSrc={imageUrl}
      imageAlt={product.name}
      flavors={product.flavors ?? []}
      frostingColors={product.frostingColors}
      quantities={product.quantities}
      occasions={product.occasions ?? DEFAULT_OCCASIONS}
      price={`$${product.price.toFixed(2)}`}
    />
```

#### After
```ts
export async function getStaticPaths() {
  const slugs = await getAllProductSlugs();
  return slugs.map((p) => ({ params: { slug: p.slug.current } }));
}

const { slug } = Astro.params;
const [{ navbar, footer }, product] = await Promise.all([
  loadHomeContent(),
  getProductBySlug(slug!),
]);

if (!product) return Astro.redirect('/404');

const imageUrl = product.image
  ? urlFor(product.image as any).width(IMAGE_WIDTHS.detail).url()
  : undefined;
```
```astro
    <PersonalCakeProduct
      breadcrumbHrefHome={navbar.homeHref}
      breadcrumbHrefOrder={navbar.orderHref}
      breadcrumbLabel={product.name}
      title={product.name}
      subtitle={product.subtitle ?? ""}
      servingInfo={product.servingInfo}
      imageSrc={imageUrl}
      imageAlt={product.name}
      customOptions={product.customOptions ?? []}
      price={`$${product.price.toFixed(2)}`}
    />
```

#### Reasoning
- `DEFAULT_OCCASIONS` removed entirely — there is no longer an "occasions" concept in code to default; if a product needs an Occasion group, it must be authored on that product's `customOptions` in Studio. This is the explicit behavior change flagged in Risk Notes.

---

### `src/pages/products/preview-cupcakes.astro`
**Action:** Modify
**Why:** Keep this temp page compiling against the new component contract until it's deleted in the grid migration.

#### Before
```astro
import cupcakesJson from "../../content/products/cupcakes.json";

const { navbar, footer } = await loadHomeContent();

const flavors = cupcakesJson.flavors.map((f) => f.name);
---
...
    <PersonalCakeProduct
      ...
      flavors={flavors}
      quantities={["6", "12", "24"]}
      occasions={["Regular", "Birthday", "Wedding", "Holiday", "Other"]}
      price="$3.25"
    />
```

#### After
```astro
import cupcakesJson from "../../content/products/cupcakes.json";

const { navbar, footer } = await loadHomeContent();

const flavors = cupcakesJson.flavors.map((f) => ({ label: f.name }));
---
...
    <PersonalCakeProduct
      ...
      customOptions={[
        { name: "Flavor", inputType: "radio", options: flavors },
        { name: "Quantity", inputType: "radio", options: ["6", "12", "24"].map((label) => ({ label })) },
        { name: "Occasion", inputType: "radio", options: ["Regular", "Birthday", "Wedding", "Holiday", "Other"].map((label) => ({ label })) },
      ]}
      price="$3.25"
    />
```

---

### `src/pages/products/preview-personal-cake.astro`
**Action:** Modify
**Why:** Same as above.

#### Before
```astro
    <PersonalCakeProduct
      ...
      flavors={["Chocolate", "Vanilla"]}
      frostingColors={["Red", "Blue", "Green", "Yellow", "Purple", "Pink", "White", "Custom"]}
      occasions={["Regular", "Birthday", "Wedding", "Holiday", "Other"]}
      price="$25.00"
    />
```

#### After
```astro
    <PersonalCakeProduct
      ...
      customOptions={[
        { name: "Flavor", inputType: "radio", options: ["Chocolate", "Vanilla"].map((label) => ({ label })) },
        {
          name: "Frosting Color",
          inputType: "checkbox",
          helperText: "(please choose up to 2 colors)",
          options: ["Red", "Blue", "Green", "Yellow", "Purple", "Pink", "White"]
            .map((label) => ({ label }))
            .concat({ label: "Custom", priceModifier: 3 }),
        },
        { name: "Occasion", inputType: "radio", options: ["Regular", "Birthday", "Wedding", "Holiday", "Other"].map((label) => ({ label })) },
      ]}
      price="$25.00"
    />
```

---

## Validation Plan
- `npm run build` — confirms the Sanity schema, Astro types, GROQ projections, and the rewritten `PersonalCakeProduct.astro` loop all compile, and that both TEMP preview pages still build against the new prop contract.
- Open `/admin` after `npm run dev`: confirm a `Product Category` document can be created, that `product.category` offers a reference picker, and that `customOptions` renders as an editable, reorderable array of groups in Studio.
- Visually diff `/products/preview-cupcakes` and `/products/preview-personal-cake` before/after — both should render pixel-identical to today (same classes, same grid, same spacer behavior for Flavor/Quantity/Occasion; Frosting Color's last row becomes filled, the one intentional normalization).
- Once a real Sanity product exists with `category` + `customOptions` populated, load `/products/<slug>` and confirm groups render in authored order with correct radio/checkbox behavior and the add-to-cart form still submits the right field names.
- Specifically for the surcharge: author a Personal Cake product with Frosting Color's "Custom" option set to `priceModifier: 3`, load its page, and confirm the option renders as "Custom (+$3.00)" while every other option (no `priceModifier` set) renders with no suffix.
- Specifically for slug uniqueness: in Studio, create a second `product` (or `productCategory`) document and attempt to set its slug to one already in use — confirm Studio blocks publish with the validator's error message. Then confirm a normal, non-colliding slug still publishes fine (i.e. the validator's draft/published self-exclusion isn't a false positive on every save).
- Specifically for the new field-level guards: attempt to enter a `price` or `priceModifier` with more than 2 decimal places and confirm Studio rejects it; attempt to add two options with the same `label` (including a case/whitespace variant like `"custom "`) to one `customOptions` group and confirm Studio blocks publish.
- No automated `lint`/`test` npm scripts exist yet (see `CLAUDE.md`) — `build` plus the manual checks above are the available gates.

## Risk Notes
- **Behavior change, not just refactor:** removing `DEFAULT_OCCASIONS` means a product with no Occasion group in Studio will show no Occasion section, where today it would silently get one. Every existing/new product needs that group authored explicitly going forward.
- **Existing published documents:** any `product` document already in the dataset has none of the new shape (`category` reference, `customOptions` array) and the old fields (`flavors`, etc.) will simply be ignored by the new GROQ projection once deployed. Content needs to be migrated/re-authored in Studio — no automatic data migration script is included in this plan.
- **Dropped Figma `data-node-id` traceability** on the generated fieldsets (see Existing Pattern Audit) — accepted, since the sections are no longer fixed to specific Figma nodes once they're CMS-driven.
- **The price surcharge is informational only in this plan — it is not enforced anywhere.** Concretely:
  - The product detail page shows "Custom (+$3.00)" next to the option, but the `$25.00` price text below the form does not update when the customer selects it — there is no client-side JS in `PersonalCakeProduct.astro` today to recompute a displayed total, and adding that is a real feature (client state, a JS island) intentionally left out of this data-model whiteboard.
  - Nothing in this plan wires `priceModifier` into the actual checkout charge. `PersonalCakeProduct.astro`'s `<form>` doesn't currently use Snipcart's `data-item-*` attributes at all (it posts to `addToCartHref` via a plain HTML form) — the Snipcart attribute builder in `src/lib/snipcart/attributes.ts` (`buildItemAttributes`) is built but not yet called from this component. Snipcart's own custom-field syntax can express a per-option price delta (appending `[+3.00]` to an option string in `data-item-customN-options`), so once that wiring happens, the natural integration point is to have whatever builds the Snipcart attributes compose that bracket syntax from `option.label` + `option.priceModifier` — but that's part of the not-yet-planned "wire Snipcart into the product detail page" feature, not this one. Until that lands, a customer could select "Custom" and still be charged the base price at actual checkout. This plan only makes the surcharge visible and editor-configurable; it does not make it charged.
- **Still deferred, and now easier:** unifying `CupcakeGrid`/`PersonalCakeGrid`/`products/index.astro` into one category-driven grid, and deleting the two TEMP preview pages. This whiteboard's `getProductsByCategorySlug` and `getAllProductCategories` are exactly what that migration would call — but it's a UI-consolidation change (collapsing two near-duplicate templates into one), which is a different kind of risk (visual regression surface) than a data-model change, and is left for its own whiteboard.

## Approval
`Status: Awaiting explicit user approval. Do not implement yet.`
