# FEATURE(snipcart-product-page-add-to-cart)

## Request

The "ADD TO CART" button on the product detail page (`PersonalCakeProduct.astro`, used by both `/products/cupcakes/[variant]` and `/products/personal-cakes/[variant]`) is currently a dead link — it renders `<Button href={addToCartHref} .../>`, an `<a>` tag pointing at `addToCartHref`, which defaults to `"#"` and is never overridden by either real caller (`[...variant].astro` doesn't pass it at all). Clicking it does nothing.

Meanwhile, this repo already has a complete, unused Snipcart wiring layer from a prior feature (`FEATURE(snipcart-integration).md`): `buildItemAttributes()`, `<AddToCartButton>` (a `<button class="snipcart-add-item">` that spreads pre-built `data-item-*` attrs), and `<CartButton>` (`<button class="snipcart-checkout">`, Snipcart's built-in cart-open trigger class) — none of these are imported or rendered anywhere in the codebase today.

Goal: wire the real product page button to actually add the correct item to Snipcart (id, name, price, url, image, and the customer's selected Frosting Color / Occasion as Snipcart custom fields), and have the cart open automatically after adding.

## Directory Map

```text
src/
  components/
    snipcart/
      Snipcart.astro                     # MODIFY — drop the "none" addProductBehavior default param
      AddToCartButton.astro              # MODIFY — accept `class` + `type="button"`, no behavior change otherwise
    product/
      PersonalCakeProduct.astro          # MODIFY — swap <Button> for <AddToCartButton>; thin glue only, no derivation logic of its own
  lib/
    snipcart/
      cartItem.ts                        # CREATE — pure helper: product/variant props -> Snipcart data-item-* attrs
      cartSync.ts                        # CREATE — pure helper: keeps a snipcart-add-item button's custom-field values and price in sync with its form's live state
```

No other files change. `attributes.ts` and `CartButton.astro` are untouched — `buildItemAttributes()` already supports everything needed (the two new helpers above are *callers* of it, not replacements), and `CartButton` isn't part of this request (opening the cart happens automatically via the `addProductBehavior` setting, not a separate visible button). `lib/snipcart/loader.ts` is also untouched — it already does `if (config.addProductBehavior) settings.addProductBehavior = config.addProductBehavior;`, so once `Snipcart.astro` stops defaulting the prop to `'none'`, `loader.ts`'s existing guard naturally omits the setting and Snipcart falls back to its own native default — no edit needed there.

## Modification Table

| File | Action | Why |
|---|---|---|
| `src/components/snipcart/Snipcart.astro` | Modify | Stop defaulting `addProductBehavior` to `"none"` so Snipcart's native default (open cart after adding) takes effect |
| `src/components/snipcart/AddToCartButton.astro` | Modify | Add a `class` prop (so the existing visual styling can be applied) and `type="button"` (the button now sits inside a real `<form>`, so it must not implicitly submit) |
| `src/lib/snipcart/cartItem.ts` | Create | Single-responsibility helper: takes a product's resolved display props (title, price string, image, selection groups, routing context) and returns Snipcart `data-item-*` attrs via `buildItemAttributes()`, plus a `data-base-price` bookkeeping attribute the price-sync step needs. Pure function, no Astro/DOM dependency — testable in isolation. |
| `src/lib/snipcart/cartSync.ts` | Create | Single-responsibility helper: pure DOM logic that reads a `snipcart-add-item` button's enclosing form and writes the live-selected custom field values *and* the live-recomputed price (base + any checked option's `priceModifier`, e.g. Personal Cakes' "Custom" frosting at +$3) onto the button just before click. No product-specific knowledge, no Astro dependency — reusable by any future page that renders `AddToCartButton`. |
| `src/components/product/PersonalCakeProduct.astro` | Modify | Replace the dead `<Button href="#">` with a real `<AddToCartButton>`. The component's own job is now just: resolve the Astro-specific canonical URL, call `buildProductCartAttributes()`, render the button, and register `bindAddToCartSync()` on `astro:page-load` — no derivation or DOM-sync logic lives in the component itself. |

## Existing Pattern Audit

- `buildItemAttributes()` (`src/lib/snipcart/attributes.ts`) already accepts everything this needs: `id`, `name`, `price`, `url`, `image`, and `customFields: { name, value }[]`. No changes needed there — this plan is purely about *calling* it correctly from the one place that should.
- `AddToCartButton.astro` already follows this repo's "pure presentational component, parent builds attrs" convention (see `FEATURE(snipcart-integration).md` §5) — adding a `class` prop follows the exact same pattern already used by `Button.astro`'s `extraClass`.
- The codebase's established pattern is "components hold zero business logic, `lib/` helpers hold all of it" — `attributes.ts` already does this for raw attribute serialization; `cartItem.ts` and `cartSync.ts` extend that same pattern to product-derivation and DOM-sync logic respectively, instead of growing `PersonalCakeProduct.astro` into a file that does layout *and* cart-math *and* DOM event wiring.
- `[...variant].astro` already has an inline `<script>` with `import`-free plain DOM logic (the `astro:before-preparation`/`astro:after-swap` scroll-position handler) — that script is intentionally tiny and stays inline since it's a one-off, page-specific concern with no reusable logic to extract. The add-to-cart sync behavior is different: it's generic (any future `AddToCartButton` usage needs it) and non-trivial enough to warrant its own testable module, which is exactly what `cartSync.ts` is for. `PersonalCakeProduct.astro`'s own `<script>` becomes a 2-line import-and-call.
- Selection groups already render real `<input type={group.inputType} name={group.name} value={option.label}>` elements with `sr-only` styling — Frosting Color and Occasion's current values are already live, queryable form state; no new state needs to be introduced, just read at click time.
- The Flavor group (the one with `definesVariantRoute: true`) is intentionally excluded from Snipcart custom fields — it's not a same-page radio choice, it's baked into which page/variant URL the customer is already on (hence already reflected in `data-item-id` / `data-item-url` / `data-item-name`).

## Execution Plan

### Step 1 — `Snipcart.astro`: stop forcing `addProductBehavior: 'none'`
Remove the `'none'` default so omitting the prop falls through to `loader.ts`'s existing `if (config.addProductBehavior)` guard (which then leaves `window.SnipcartSettings.addProductBehavior` unset) and from there to Snipcart's own documented native default of opening the cart after an item is added. The prop's type still allows `'none'` to be passed explicitly by some future caller that wants the old behavior — only the *default* changes.

### Step 2 — `AddToCartButton.astro`: accept `class`, force `type="button"`
Mirrors `Button.astro`'s existing `class` passthrough convention. `type="button"` prevents the button from acting as the form's implicit submit button now that it's a real `<button>` inside `<form action="#" method="post">`.

### Step 3 — `cartItem.ts`: product-to-Snipcart-attrs derivation (new, pure)
A single exported function, `buildProductCartAttributes()`, that:
- Derives the selected variant's label (if any) from `customOptions` + `currentVariantSlug`, to build a flavor-aware `name` (e.g. "Carrot Cupcakes") — same lookup `[...variant].astro` already does for `imageAlt`.
- Parses the numeric price out of the existing display `price` string (e.g. `"$25.00"` → `25`).
- Filters `customOptions` down to the groups that aren't the variant-route group, mapping each to a Snipcart custom field with a placeholder `value` (synced for real by `cartSync.ts`).
- Delegates to the existing `buildItemAttributes()` for the actual `data-item-*` serialization.
- Takes the final `url` as a plain string input rather than computing it — URL resolution needs `Astro.site`, which only exists inside `.astro` frontmatter, so that one piece of glue stays in the component (Step 5) and everything else here is plain, Astro-free TypeScript.

### Step 4 — `cartSync.ts`: live custom-field sync (new, pure DOM logic)
A single exported function, `bindAddToCartSync()`, that finds every `.snipcart-add-item` button on the page and attaches a `click` listener which reads its enclosing form's currently-checked inputs (matched by the `data-item-customN-name` the button already carries) and writes the joined value(s) into `data-item-customN-value`, just before Snipcart's own document-level delegated handler reads those same attributes on the same click (per-element listeners always run before ancestor/document listeners in the bubble phase, regardless of registration order). Has no knowledge of products, prices, or this specific page — purely "sync a Snipcart button's custom fields from its form."

### Step 5 — `PersonalCakeProduct.astro`: wire the real button (thin glue only)
- Import `AddToCartButton`, `buildProductCartAttributes` (from `cartItem.ts`), and `bindAddToCartSync` (from `cartSync.ts`). Drop the `Button` import.
- Resolve the one piece of Astro-specific context the helpers can't: the canonical per-variant URL, via `routes.productVariant()` + `Astro.site` (falling back to `Astro.url` only when `productSlug`/`currentVariantSlug` aren't passed, e.g. the temp preview page).
- Call `buildProductCartAttributes({ title, price, imageSrc, customOptions, productSlug, currentVariantSlug, url })`.
- Replace the `<Button href={addToCartHref} ... />` block with `<AddToCartButton attrs={cartAttrs} class="...">ADD TO CART</AddToCartButton>`, carrying over the exact same visual classes the `<Button>` usage had.
- Add a 2-line `<script>` that imports `bindAddToCartSync` and registers it on `astro:page-load` (fires on initial load AND every ClientRouter swap) — no inline logic of its own.

### Step 6 — Build & verify
`npm run build`, then manually verify in dev: select a Frosting Color + Occasion, click ADD TO CART, confirm the Snipcart cart drawer opens automatically and the line item shows the correct flavor-aware name, price, image, and the selected Frosting Color / Occasion as custom field values.

## File-by-File Changes

### `src/components/snipcart/Snipcart.astro`

**Action:** Modify
**Why:** This is where `addProductBehavior` defaults to `'none'` today. `loader.ts` itself needs no change — it already does `if (config.addProductBehavior) settings.addProductBehavior = config.addProductBehavior;`, so once this prop is `undefined` by default, that line naturally skips setting it and Snipcart falls back to its own native default.
**Impact:** Global default change — affects every `snipcart-add-item` button site-wide. Currently zero buttons use this class anywhere in the codebase, so this is risk-free today.

#### Before
```astro
const {
  version,
  currency,
  modalStyle = 'side',
  addProductBehavior = 'none',
  loadStrategy = 'on-user-interaction',
} = Astro.props;
```

#### After
```astro
const {
  version,
  currency,
  modalStyle = 'side',
  addProductBehavior,
  loadStrategy = 'on-user-interaction',
} = Astro.props;
```

### `src/components/snipcart/AddToCartButton.astro`

**Action:** Modify
**Why:** Needs a `class` passthrough to carry the existing button's visual styling, and an explicit `type="button"` since it will now live inside a real `<form>`.
**Impact:** Backward compatible — `class` is optional and defaults to empty.

#### Before
```astro
---
interface Props {
  /** Pre-built Snipcart data-item-* attributes from buildItemAttributes(). */
  attrs: Record<string, string>;
}

const { attrs } = Astro.props;
---
<button class="snipcart-add-item" {...attrs}>
  <slot>Add to Cart</slot>
</button>
```

#### After
```astro
---
interface Props {
  /** Pre-built Snipcart data-item-* attributes from buildItemAttributes(). */
  attrs: Record<string, string>;
  /** Optional extra utility classes for visual styling. */
  class?: string;
}

const { attrs, class: extraClass = '' } = Astro.props;
---
<button type="button" class={`snipcart-add-item ${extraClass}`} {...attrs}>
  <slot>Add to Cart</slot>
</button>
```

### `src/lib/snipcart/cartItem.ts`

**Action:** Create
**Why:** Single responsibility — "given a product's resolved display props, what are its Snipcart attrs" is its own concern, separate from both raw attribute serialization (`attributes.ts`) and page layout (`PersonalCakeProduct.astro`). Plain TypeScript, no Astro/DOM dependency, so it's trivially unit-testable on its own.
**Impact:** New file only — nothing else changes as a side effect of creating it.

```ts
/**
 * Derives Snipcart data-item-* attributes for a product detail page from
 * its already-resolved display props and routing context.
 *
 * URL resolution is intentionally the caller's job, not this function's:
 * building the canonical per-variant URL needs `Astro.site`, which only
 * exists inside `.astro` frontmatter, so passing the final string in here
 * keeps this module Astro-free and independently testable.
 */
import { buildItemAttributes } from './attributes';
import type { CustomOption } from '../../types/product';

export interface ProductCartItemInput {
  /** The product's display name, e.g. "Cupcakes" (not flavor-prefixed). */
  title: string;
  /** Formatted display price, e.g. "$25.00" — parsed to a number internally. */
  price: string;
  imageSrc: string;
  customOptions: CustomOption[];
  productSlug?: string;
  currentVariantSlug?: string;
  /** Canonical URL for the current variant route, resolved by the caller. */
  url: string;
}

export function buildProductCartAttributes(input: ProductCartItemInput): Record<string, string> {
  const variantGroup = input.customOptions.find((g) => g.definesVariantRoute);
  const selectedVariantOption = input.currentVariantSlug
    ? variantGroup?.options.find((o) => o.slug?.current === input.currentVariantSlug)
    : undefined;
  const name = selectedVariantOption ? `${selectedVariantOption.label} ${input.title}` : input.title;
  const basePrice = Number(input.price.replace(/[^0-9.]/g, ''));
  const customFieldGroups = input.customOptions.filter((g) => !g.definesVariantRoute);

  const attrs = buildItemAttributes({
    id: `${input.productSlug ?? 'product'}-${input.currentVariantSlug ?? 'default'}`,
    name,
    price: basePrice,
    url: input.url,
    image: input.imageSrc,
    customFields: customFieldGroups.map((group) => ({
      name: group.name,
      // Placeholder — kept in sync with the live form selection by
      // cartSync.ts's bindAddToCartSync(), just before Snipcart reads it
      // on click.
      value: '',
    })),
  });

  // Bookkeeping only — not a Snipcart attribute. cartSync.ts recomputes
  // `data-item-price` on every click from this immutable base plus
  // whichever options are checked at that moment (some options carry a
  // priceModifier, e.g. Personal Cakes' "Custom" frosting is +$3). Storing
  // the base separately means clicking ADD TO CART twice with different
  // selections (the button stays on the page since adding doesn't reload
  // it) always recomputes from the true original price, never compounds
  // on top of a previously-adjusted one.
  attrs['data-base-price'] = String(basePrice);

  return attrs;
}
```

### `src/lib/snipcart/cartSync.ts`

**Action:** Create
**Why:** Single responsibility — "keep a Snipcart button's data-item-* attrs in sync with its form's live state" is pure DOM behavior with zero product-specific knowledge (it reads whatever `data-price-modifier`/`name` attributes the inputs already carry; it doesn't know what a "Frosting Color" or a cupcake even is). Extracting it means any future page that renders `AddToCartButton` with custom fields or priced options gets this for free, and it's testable independent of any specific product page.
**Impact:** New file only.

```ts
/**
 * Keeps a "snipcart-add-item" button's data-item-* attributes in sync
 * with the live state of its enclosing form, read at click time — just
 * before Snipcart's own delegated click handler reads the same
 * attributes. A listener bound directly on the button always runs before
 * any ancestor/document-level listener in the bubble phase, regardless of
 * registration order, so this needs no capture-phase trickery to win the
 * race against Snipcart's own handler.
 *
 * Two things get synced:
 *   1. Custom field values (data-item-customN-value) — from whichever
 *      inputs are currently checked for each customN-name group.
 *   2. The price (data-item-price) — recomputed from the button's
 *      immutable data-base-price plus the data-price-modifier of every
 *      currently-checked input in the form (e.g. Personal Cakes' "Custom"
 *      frosting option carries data-price-modifier="3").
 *
 * Call this on `astro:page-load` (fires on initial load AND after every
 * ClientRouter swap) rather than at parse time — switching between pages
 * that each render their own AddToCartButton swaps in a new button
 * element, and a listener bound only once at parse time would be left
 * attached to the old, now-detached element.
 */
export function bindAddToCartSync(): void {
  document.querySelectorAll<HTMLButtonElement>('.snipcart-add-item').forEach((button) => {
    button.addEventListener('click', () => {
      const form = button.closest('form');
      if (!form) return;
      syncCustomFields(button, form);
      syncPrice(button, form);
    });
  });
}

function syncCustomFields(button: HTMLButtonElement, form: HTMLElement): void {
  let n = 1;
  while (button.hasAttribute(`data-item-custom${n}-name`)) {
    const groupName = button.getAttribute(`data-item-custom${n}-name`);
    const checked = form.querySelectorAll<HTMLInputElement>(`input[name="${groupName}"]:checked`);
    const value = Array.from(checked)
      .map((input) => input.value)
      .join(', ');
    button.setAttribute(`data-item-custom${n}-value`, value);
    n++;
  }
}

function syncPrice(button: HTMLButtonElement, form: HTMLElement): void {
  const basePrice = Number(button.getAttribute('data-base-price') ?? '0');
  const checked = form.querySelectorAll<HTMLInputElement>('input:checked');
  const modifierTotal = Array.from(checked).reduce(
    (sum, input) => sum + Number(input.dataset.priceModifier ?? '0'),
    0
  );
  button.setAttribute('data-item-price', String(basePrice + modifierTotal));
}
```

### `src/components/product/PersonalCakeProduct.astro`

**Action:** Modify
**Why:** This is the actual product page button — it needs to call into the existing Snipcart wiring instead of being a dead `<a href="#">`.
**Impact:** Visual output is unchanged (same classes, same position); behavior changes from "does nothing" to "adds the correct item to Snipcart and opens the cart."

#### Before
```astro
import Button from "../ui/Button.astro";
import Breadcrumb from "../ui/Breadcrumb.astro";
import type { CustomOption } from "../../types/product";
import { routes } from "../../lib/routes";
```

#### After
```astro
import Breadcrumb from "../ui/Breadcrumb.astro";
import AddToCartButton from "../snipcart/AddToCartButton.astro";
import { buildProductCartAttributes } from "../../lib/snipcart/cartItem";
import type { CustomOption } from "../../types/product";
import { routes } from "../../lib/routes";
```

*(`Button` import is dropped entirely — nothing else in this component uses it once ADD TO CART switches to `AddToCartButton`. `buildItemAttributes` is no longer imported directly here — `cartItem.ts`'s `buildProductCartAttributes()` calls it internally.)*

#### Before
```astro
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
  productSlug,
  currentVariantSlug,
  price,
} = Astro.props;
```

#### After
```astro
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
  productSlug,
  currentVariantSlug,
  price,
} = Astro.props;

// The one piece of Astro-specific context buildProductCartAttributes()
// can't resolve itself: URL building needs Astro.site, which only exists
// here in frontmatter. Mirrors [...variant].astro's own canonicalPath
// computation — prefer the canonical per-variant route (correct even on
// the bare, no-flavor-segment URL, where currentVariantSlug is still the
// default flavor) and fall back to the current request URL when this
// component is used without those props (e.g. preview-personal-cake.astro).
const cartItemPath =
  productSlug && currentVariantSlug
    ? routes.productVariant(productSlug, currentVariantSlug)
    : Astro.url.pathname;
const cartItemUrl = Astro.site ? new URL(cartItemPath, Astro.site).toString() : cartItemPath;

const cartAttrs = buildProductCartAttributes({
  title,
  price,
  imageSrc,
  customOptions,
  productSlug,
  currentVariantSlug,
  url: cartItemUrl,
});
```

#### Before
```astro
                  ) : (
                    <label class={`${selectionBtn} has-checked:bg-brand-pink! has-checked:text-white!`}>
                      <input type={group.inputType} name={group.name} value={option.label} class="sr-only" />
                      <span>
                        {option.label}
                        {!!option.priceModifier && ` (+$${option.priceModifier.toFixed(2)})`}
                      </span>
                    </label>
                  )
```

#### After
```astro
                  ) : (
                    <label class={`${selectionBtn} has-checked:bg-brand-pink! has-checked:text-white!`}>
                      <input
                        type={group.inputType}
                        name={group.name}
                        value={option.label}
                        data-price-modifier={option.priceModifier ?? 0}
                        class="sr-only"
                      />
                      <span>
                        {option.label}
                        {!!option.priceModifier && ` (+$${option.priceModifier.toFixed(2)})`}
                      </span>
                    </label>
                  )
```

*(Only this one line is new: `data-price-modifier={option.priceModifier ?? 0}`. The variant-route `<a>` branch above it is untouched — Flavor selection is its own page/price already baked into the product, not a same-page priced add-on.)*

#### Before
```astro
        {/* ADD TO CART (3311:2281) — reuses the shared ui/Button. The
            `lg` solid size matches the homepage ORDER NOW CTA geometry;
            class overrides swap the fill to brand-pink to match Figma. */}
        <Button
          href={addToCartHref}
          label="ADD TO CART"
          variant="solid"
          size="lg"
          shape="square"
          class="mt-8 sm:mt-10 md:mt-12 lg:mt-16 xl:mt-[75px] bg-brand-pink! hover:bg-brand-pink!
                 text-[15px]! sm:text-[17px]! md:text-[20px]! lg:text-[26px]!"
          ariaLabel="Add to cart"
        />
```

#### After
```astro
        {/* ADD TO CART (3311:2281) — real Snipcart button. Visual classes
            replicate the old shared ui/Button "solid lg square" output
            exactly (border, sizing, hover/focus, brand-pink fill) now that
            this is a plain <button> instead of an <a>. */}
        <AddToCartButton
          attrs={cartAttrs}
          class="inline-flex items-center justify-center font-medium no-underline text-center
                 border border-brand-border
                 transition-[transform,filter] duration-150 ease-out
                 hover:brightness-95 hover:-translate-y-px
                 focus-visible:brightness-95 focus-visible:-translate-y-px focus-visible:outline-hidden
                 bg-brand-pink text-white
                 h-10 sm:h-12 md:h-14 lg:h-[68px] xl:h-20
                 w-48 sm:w-56 md:w-[245px] lg:w-[272px] xl:w-[326px]
                 mt-8 sm:mt-10 md:mt-12 lg:mt-16 xl:mt-[75px]
                 text-[15px] sm:text-[17px] md:text-[20px] lg:text-[26px]"
        >ADD TO CART</AddToCartButton>
```

*(Drops the `bg-brand-pink!`/`text-[…]!` forced-important hack from the old override — since we're no longer fighting `Button.astro`'s own `bg-brand-blue text-white` variant class, plain `bg-brand-pink text-white` is enough.)*

#### After (new — appended at the end of the file, after the closing `</main>`)
```astro
<script>
  import { bindAddToCartSync } from "../../lib/snipcart/cartSync";

  document.addEventListener("astro:page-load", bindAddToCartSync);
</script>
```

#### Reasoning
- `buildProductCartAttributes()` does all the derivation work (flavor-aware name, numeric price, custom-field list) — this component just gathers its own already-existing props into that one call. No business logic of its own.
- `cartItemUrl` mirrors `[...variant].astro`'s own `canonicalPath`/`canonicalUrl` computation rather than relying on `Astro.url.pathname` directly — this matters on the bare, no-flavor-segment route, where `currentVariantSlug` is still the default flavor's slug (set via `selectedOption = defaultOption` in `[...variant].astro`) but `Astro.url.pathname` would just be the bare product path. Using `routes.productVariant()` when both props are available keeps the cart item's URL pointing at the same canonical, crawlable page Snipcart's order validation expects, consistent with what the page's own `<link rel="canonical">` already points to. This is the one piece of glue that has to live here rather than in `cartItem.ts`, since it needs `Astro.site`.
- The `<script>` is now two lines: import the generic sync helper, register it on `astro:page-load`. No inline DOM logic, no per-page reimplementation — any future page rendering `AddToCartButton` gets the same behavior by importing the same function.
- The button itself needs no `data-cart-form-id` or similar wiring prop — `cartSync.ts` locates its form via `button.closest("form")` at click time, which needs no parent-side plumbing at all.
- `data-price-modifier` is added directly on the existing `<input>` elements (not a new element, not a new prop) — `cartSync.ts` can read it generically without this component needing to pass anything extra into `buildProductCartAttributes()` for it.

## Validation Plan

- `npm run build` — confirms no type errors from removing the `Button` import or wiring up `buildProductCartAttributes`/`bindAddToCartSync`.
- Manual dev check on `/products/cupcakes/carrot`: select an Occasion, click ADD TO CART, confirm:
  - Snipcart's cart drawer opens automatically (no more `addProductBehavior: 'none'` suppressing it).
  - The line item's name includes "Carrot", the price is `3.25` (numeric, not `"$3.25"`), and the image matches the carrot photo.
  - The line item's custom fields show the selected Quantity/Occasion values, not blank.
- Manual dev check on `/products/personal-cakes/chocolate`: same, verifying Frosting Color (multi-select) joins multiple selections with `", "` correctly.
- **Price-modifier check (this is the gap this revision fixes — confirmed live in Sanity, not hypothetical):** on `/products/personal-cakes/chocolate`, select Frosting Color "Custom" (priceModifier `+3`), click ADD TO CART, confirm the cart line item price is `28` (`25` base + `3`), not `25`. Then reload the page, select a non-modifier color like "Red", click ADD TO CART, confirm the price is back to `25` — proving each click recomputes fresh from `data-base-price` rather than compounding on a previous click's adjusted total.
- Confirm clicking ADD TO CART does **not** trigger a real form submission/page navigation (the `type="button"` fix) — i.e., the URL bar doesn't change and no `?` query string from a GET-as-fallback form submission appears.
- **Navigate between two flavors first** (e.g. carrot → chocolate via the Flavor links, a `<ClientRouter />`-mediated swap, not a hard reload), *then* select an Occasion and click ADD TO CART on the *second* page — confirms `astro:page-load` correctly re-bound the sync listener to the new button instance rather than leaving it attached to the detached old one.
- On the bare `/products/cupcakes` route (no flavor segment in the URL), open dev tools and inspect the button's `data-item-url` — confirm it resolves to the canonical default-flavor URL (e.g. `https://cupscakes.com/products/cupcakes/chocolate`), not the bare `/products/cupcakes` path.

## Risk Notes

- The `addProductBehavior` default change is global (`Snipcart.astro` has exactly one call site, `Layout.astro`, with no props passed), so every future `snipcart-add-item` button site-wide will also auto-open the cart unless it's an intentional, separate decision later to suppress it for a specific button. Today that's the desired behavior everywhere, since this is the first real button.
- `cartItemUrl` is built the same way `[...variant].astro` already builds its own `canonicalUrl` (`new URL(path, Astro.site)`), so it's guaranteed to match the page's own `<link rel="canonical">` — no new assumption about Snipcart's URL-resolution behavior is being introduced.
- The click-time custom-field sync relies on Snipcart's add-to-cart handling being a document-level (or otherwise ancestor-level) delegated listener rather than an early capture-phase listener of its own. This matches Snipcart v3's documented behavior (a single delegated click handler), but if a future Snipcart version changes this, the sync script would need to move to capture phase defensively.
- The sync script binds a fresh `click` listener on every `astro:page-load` (initial load + every swap). Since each swap also replaces the button DOM node entirely (old node and its listeners are garbage), there's no listener-accumulation risk — every swap starts with zero listeners on the new node before this script runs.

## Implementation Note (found during build, not anticipated in the original plan)

Building this surfaced a real bug the plan didn't anticipate: Sanity's stega visual-editing encoding (the same mechanism fixed for `<title>`/meta tags in an earlier PR) also pollutes `product.name` and every `customOption`/`customOptionValue.label` with invisible Unicode — confirmed live, not hypothetical (`data-item-name` came out as "Carrot Cupcakes" plus ~2300 invisible characters). `slug` fields are unaffected (verified the rendered hrefs stay exact), so routing was never at risk — only plain string fields feeding into Snipcart's order data.

Fixed by applying `stegaClean()` (from `@sanity/client/stega`) in two places, both required together:
- `cartItem.ts`: cleans `name` (title + selected variant label) and each custom field's `name`.
- `PersonalCakeProduct.astro`: cleans the same `group.name`/`option.label` values where they're rendered as the actual `name`/`value` attributes on the `<input>` elements — required because `cartSync.ts` queries `input[name="${groupName}"]` using the *cleaned* name read back off the button's `data-item-customN-name`; if the live `<input>` still carried the *raw* polluted name, the selector would silently match nothing.

Verified with a real headless-browser click test (Playwright, temporary — not added as a project dependency): confirmed `data-item-custom1-value`/`data-item-custom2-value` go from `null` to the correct selected values after a real click, confirmed the Personal Cakes "Custom" frosting case computes `data-item-price="28"` (`25` base `+ 3`), and confirmed the `astro:page-load` re-binding fix by clicking ADD TO CART on a second page reached via a ClientRouter flavor-switch (not a hard reload) and seeing it still resolve to that page's own correct `data-item-id`/`name`/custom values.

## Approval
`Status: Implemented and verified.`
