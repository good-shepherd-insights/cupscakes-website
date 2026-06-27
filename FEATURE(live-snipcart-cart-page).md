# FEATURE(live-snipcart-cart-page)

## Request

`/cart` (`src/pages/cart.astro` → `src/components/cart/Cart.astro`) currently renders a hardcoded, static mock: two fake line items (`personal-cake-1`, `cupcake-1`) sourced from `src/content/cart/shopping-cart.json`. It has no relationship to what's actually in the customer's Snipcart cart.

Goal: make `/cart` display the customer's **real** Snipcart cart contents — items, flavor, the second custom field (Frosting Color for Personal Cakes / Quantity for Cupcakes), Occasion, price, image, and a working checkout action — **with the exact same visual design, markup structure, and Tailwind classes as today.** Purely a data-source swap, not a redesign.

## Why This Requires a Client Island (Not an Astro Component Change)

`Cart.astro` is rendered once, server-side, at build time (this site is fully static — `output: "static"` in `astro.config.mjs`). Snipcart's cart is per-visitor, runtime, browser-only data (`Snipcart.store.getState().cart`, confirmed via Snipcart's official SDK docs) — there is no way to know "what's in this specific visitor's cart" at build time, and Astro components have no client-side runtime to re-render later. The only way to render runtime browser data into the page is a framework island (`@astrojs/react` is already installed and configured in `astro.config.mjs`).

This means the existing `Cart.astro` markup must be **ported, not modified** — translated 1:1 into a `.tsx` component (same classes, same DOM structure, same `data-node-id` traceability attributes), then rendered as a `client:only="react"` island fed by live Snipcart state instead of static JSON props. `client:only` (not `client:load`) because there is genuinely nothing meaningful to server-render for this content — the real content doesn't exist until Snipcart's client-side store is queried, so a hydration mismatch isn't a concern, but a fake SSR'd empty/mock shell would be misleading and isn't worth the complexity here.

## Mapping Snipcart's `CartItem` to the Existing Design's Fields

The existing static mock's per-item shape is:
```ts
{ id, product, flavor, variantLabel, variantValue, occasion, price, imageSrc, imageAlt, accent, editHref }
```

Snipcart's real `CartItem` (per official docs) has: `id, name, basePrice, unitPrice, quantity, url, image, customFields, metadata`. Today, `lib/snipcart/cartItem.ts`'s `buildProductCartAttributes()` sends `name` as the **combined** "Carrot Cupcakes" string (flavor + product together) for display inside Snipcart's own cart UI — there's no separate "just the product" or "just the flavor" field today. `customFields` only carries the non-variant groups (e.g. Quantity/Frosting Color + Occasion) — Flavor itself isn't a custom field (it's baked into which page/URL the item was added from, intentionally — see `FEATURE(snipcart-product-page-add-to-cart).md`).

To cleanly recover `product` and `flavor` as separate fields **without changing what Snipcart's own UI displays** (the visible `name` stays as-is) and **without inventing a parallel non-Snipcart data source** (per "purely take the data from Snipcart"), this plan adds three keys to the existing `metadata` object already supported by `buildItemAttributes()` but never populated:

```ts
metadata: {
  product: input.title,                          // e.g. "Cupcakes"
  flavor: selectedVariantOption?.label ?? '',     // e.g. "Carrot"
  category: input.productSlug ?? '',              // e.g. "cupcakes" | "personal-cakes"
}
```

Metadata is invisible in Snipcart's own cart/checkout UI (it's the documented mechanism for exactly this kind of integrator-side bookkeeping), so this is purely additive — nothing about the already-working, already-fixed Snipcart drawer/detailed-cart views changes.

Full field mapping for the new island:

| Design field | Source |
|---|---|
| `id` | `item.id` |
| `product` | `item.metadata.product` |
| `flavor` | `item.metadata.flavor` |
| `variantLabel` / `variantValue` | `item.customFields[0].name` / `.value` (today always "Frosting Color" or "Quantity" — whichever non-Occasion group the product has) |
| `occasion` | `item.customFields[1].value` (today always the "Occasion" group — `customFields` order is stable because `cartItem.ts` always filters in the same order: the one non-variant group, then Occasion) |
| `price` | `item.price * item.quantity`, formatted `$X.XX` — see note below on why this is computed rather than read from a single field |
| `imageSrc` / `imageAlt` | `item.image` / `item.name` (no separate alt text field exists on a Snipcart cart item — reusing the visible name, same as how `<img>` alt text is derived elsewhere when a dedicated alt isn't available) |
| `accent` | `"blue"` if `item.metadata.category === "personal-cakes"`, else `"pink"` — a small in-component lookup, not Snipcart data (color choice is a presentation decision, not cart data) |
| `editHref` | `item.url` (the canonical product page URL, already sent as `data-item-url`) |

**Why `price` is computed, not read from `item.totalPrice`:** Snipcart's docs describe a `totalPrice`-style field, but this plan's earlier draft cited it without verification — the *only* cart-item fields actually confirmed empirically in this project (via a real Playwright run against the live Snipcart store earlier in this work) are `item.name` and `item.price`, and that test only ever used quantity 1, so it's unclear whether `item.price` is unit price or already-multiplied. `item.quantity` is not docs-guessed either, but is about as safe an assumption as a cart item field gets (Snipcart's own UI visibly has a quantity stepper for every item). Multiplying `item.price * item.quantity` myself, rather than trusting an unverified single field name, means the only thing that can be wrong is whether `item.price` is unit or total — and if it's already-total, the fix is a one-line removal of the multiplication, not a field-name hunt.

**Why `subtotalValue` is computed from items, not read from `cart.total`:** same issue — `cart.total` was never empirically confirmed either. Computed as `items.reduce((sum, item) => sum + item.price * item.quantity, 0)`, so the page's grand total only ever depends on the same two fields already being relied on per-item, rather than introducing a third unverified field name.

## Directory Map

```text
src/
  lib/
    snipcart/
      cartItem.ts                        # MODIFY — add product/flavor/category metadata
    content/
      cart.ts                            # MODIFY — type no longer includes `items`
  components/
    cart/
      Cart.astro                         # DELETE — fully replaced by LiveCart.tsx
      LiveCart.tsx                       # CREATE — 1:1 port of Cart.astro's JSX/classes, fed by live Snipcart state
    home/
      Navbar.astro                       # MODIFY — add data-astro-reload to the cart icon link
  pages/
    cart.astro                           # MODIFY — render <LiveCart client:only="react" /> instead of <Cart {...cart} />
  content/
    cart/
      shopping-cart.json                 # MODIFY — drop the now-unused `items` mock array; keep heading/label strings (still real UI copy, not mock data)
```

## Modification Table

| File | Action | Why |
|---|---|---|
| `src/lib/snipcart/cartItem.ts` | Modify | Add `product`/`flavor`/`category` to the item's `metadata`, so the cart page can recover them without changing Snipcart's visible `name` or inventing a non-Snipcart data source |
| `src/components/cart/Cart.astro` | Delete | Fully superseded by `LiveCart.tsx` — an Astro component can't be re-invoked client-side, so keeping it around as dead code would be misleading |
| `src/components/cart/LiveCart.tsx` | Create | 1:1 port of `Cart.astro`'s markup/classes into JSX, hydrated client-side, reading and subscribing to `Snipcart.store` for live cart data |
| `src/pages/cart.astro` | Modify | Render the new island instead of the static component; drop the now-unused `loadCartContent()` items wiring for the item list (heading/label strings are still passed through, since those are still real, static UI copy — only the mock item array goes away) |
| `src/content/cart/shopping-cart.json` | Modify | Remove the `items` mock array (no longer consumed by anything) |
| `src/lib/content/cart.ts` | Modify | No code change needed if the content-collection schema for `items` is removed at the schema level (`content.config.ts`) — see below |
| `src/content.config.ts` | Modify | Remove the `items` array field from the `shopping-cart` schema, since nothing produces or consumes it anymore |
| `src/components/home/Navbar.astro` | Modify | Add `data-astro-reload` to the cart icon link — see "Why the Cart Icon Link Gets `data-astro-reload`" below |

## Why the Cart Icon Link Gets `data-astro-reload`

This is the single biggest unverified assumption in this plan, so it gets its own section rather than just a Risk Note.

The navbar's cart icon (`Navbar.astro:109`) is a plain `<a href={cartHref}>` with no special handling — clicking it from any page (e.g. a product page) is intercepted by `<ClientRouter />` and soft-navigates into `/cart` through `swapGuard.ts`'s custom swap, not a hard page load. Today, **no page in this codebase uses any `client:*` directive** (confirmed via grep — zero `.tsx` files, zero `client:` usages anywhere). That means the Astro island-hydration runtime (the script that defines the `<astro-island>` custom element and its `connectedCallback`-driven hydration logic) has never been exercised in this project, and more specifically: a product page (no islands) navigating into `/cart` (which will have one, for the first time ever) means that runtime script arrives as part of the swap itself, not something already loaded from a previous page.

Whether a `<script>` element sourced from `event.newDocument` (parsed via the browser's "fetch + parse into an inert document" mechanism Astro's router uses) reliably executes when moved into the live document via `appendChild` (what `swapGuard.ts` does, one child at a time) the same way it would via Astro's own default `oldBody.replaceWith(newBody)` — is something this plan reasoned through against the HTML spec's script-execution rules (a script's "already started" flag is false since it was never run in the inert parsed document, so insertion into the live, executing document should trigger it, regardless of whether that insertion happens via `replaceWith` or `appendChild`), and is also implicitly relied upon by Astro's own ClientRouter for every normal page transition that introduces new inline scripts. It was **not** independently confirmed with a real browser test, per this round's explicit instruction not to run one.

Given there's a zero-cost way to remove this specific uncertainty entirely — `data-astro-reload` on the cart icon link makes that one navigation a real, full browser page load, bypassing `swapGuard.ts`'s custom swap completely for this specific transition — this plan adds it as a safety net rather than shipping a customer-facing feature on top of an assumption that was reasoned through but not observed. `/cart` has no scroll-preservation or other soft-transition UX need (unlike the product variant pages, which intentionally use soft navigation for shareable-URL flavor switching with preserved scroll position) — there's no UX cost to making this one link a hard reload, only upside: it removes the single largest source of doubt in this entire plan with one attribute.

## Existing Pattern Audit

- This repo already has exactly one other React-via-`@astrojs/react` precedent to follow for conventions... *(none found — grep shows no existing `.tsx` component anywhere in `src/components`; this will be the first. There is no established "client island" pattern in this codebase to mirror, so this plan follows Astro's own documented `client:only` convention directly rather than inventing a house style.)*
- `Cart.astro`'s `data-node-id` attributes (e.g. `data-node-id="3311:4173"`) are Figma node references used purely for design traceability in comments/attributes elsewhere in this codebase (see `PersonalCakeProduct.astro`'s extensive Figma-sourced doc comment) — preserved verbatim in the ported JSX since they're not visual/behavioral, just provenance.
- `buildItemAttributes()` already has full, unused support for `metadata` (`src/lib/snipcart/attributes.ts:49`) — this plan is the first caller to actually populate it, no changes needed to that function.
- `cartSync.ts`'s pattern of reading already-rendered DOM/Snipcart state at a well-defined moment (click time) is the established "talk to Snipcart's runtime" pattern in this codebase; `LiveCart.tsx` extends that same idea to "read Snipcart's runtime state reactively" via the documented `store.subscribe()` API instead of a one-off read.

## Execution Plan

### Step 1 — `cartItem.ts`: add metadata
Add the three-key `metadata` object to the `buildItemAttributes()` call, derived from values already available in `buildProductCartAttributes()`'s scope (`input.title`, `selectedVariantOption?.label`, `input.productSlug`).

### Step 2 — `LiveCart.tsx`: port the markup, wire to live data
- Port every element/class string from `Cart.astro` verbatim into JSX (`class` → `className`, Astro's `{...}` expressions translate directly).
- `useState` for `items: DisplayItem[]` and `total: number`, both derived from `window.Snipcart.store.getState().cart`.
- `useEffect` on mount: read initial state, then `Snipcart.store.subscribe(() => { /* re-read and setState */ })`, returning the unsubscribe function for cleanup.
- Guard for `window.Snipcart` not yet existing (the same load-timing concern `cartSync.ts` already handles for the add-to-cart button) — `Snipcart.store` only exists once Snipcart has loaded. Since `/cart` has no add-to-cart button to eagerly trigger `LoadSnipcart()`, this page must do its own eager-load trigger (mirroring `bindAddToCartSync()`'s existing `window.LoadSnipcart?.()` call) so the cart data is available promptly without depending on a stray interaction.
- Empty-cart fallback: when `items.length === 0`, render a minimal message (a plain paragraph below the existing "Shopping Cart" heading — not styled as another heading) rather than an empty item list plus a non-functional $0.00 checkout button (the original static mock never had to define this state — it's a necessary addition, not a design change, since the new data source can genuinely be empty).
- The CHECKOUT control gets Snipcart's own `snipcart-checkout` trigger class (the exact mechanism `CartButton.astro` already uses elsewhere, unused until now) **in addition to** its existing classes, replacing the static `href="/order"` — clicking it opens Snipcart's own (already fixed: swap-guarded, correct z-index) cart/checkout flow, rather than navigating to a separate, disconnected page.

### Step 3 — `cart.astro`: swap in the island
Replace `<Cart {...cart} />` with `<LiveCart client:only="react" heading={cart.heading} ... />`, passing through the still-static heading/label copy (productHeading, flavorHeading, occasionHeading, priceHeading, editLabel, subtotalLabel, checkoutLabel) — only the `items`/`subtotalValue`/`checkoutHref` props go away, since those are exactly the parts now sourced live.

### Step 4 — Content cleanup
Remove `items` from `shopping-cart.json` and its schema in `content.config.ts`. Delete `Cart.astro`.

### Step 5 — `Navbar.astro`: hard-reload into `/cart`
Add `data-astro-reload` to the cart icon link, so this one navigation is a full page load rather than going through `swapGuard.ts`'s custom swap — see "Why the Cart Icon Link Gets `data-astro-reload`" above for the full reasoning.

### Step 6 — Build & verify
`npm run build`. Manual verification only — no automated browser test this round, per explicit instruction.

## File-by-File Changes

### `src/lib/snipcart/cartItem.ts`

**Action:** Modify
**Why:** Recover `product`/`flavor`/`category` as discrete fields for the cart page without changing Snipcart's visible item name or adding a second, non-Snipcart data source.
**Impact:** Additive only — `metadata` was previously omitted entirely from the `buildItemAttributes()` call; no existing attribute changes.

#### Before
```ts
  const attrs = buildItemAttributes({
    id: `${input.productSlug ?? 'product'}-${input.currentVariantSlug ?? 'default'}`,
    name,
    price: basePrice,
    url: input.url,
    image: input.imageSrc,
    customFields: customFieldGroups.map((group) => ({
      name: stegaClean(group.name),
      // Placeholder — kept in sync with the live form selection by
      // cartSync.ts's bindAddToCartSync(), just before Snipcart reads it
      // on click.
      value: '',
    })),
  });
```

#### After
```ts
  const attrs = buildItemAttributes({
    id: `${input.productSlug ?? 'product'}-${input.currentVariantSlug ?? 'default'}`,
    name,
    price: basePrice,
    url: input.url,
    image: input.imageSrc,
    customFields: customFieldGroups.map((group) => ({
      name: stegaClean(group.name),
      // Placeholder — kept in sync with the live form selection by
      // cartSync.ts's bindAddToCartSync(), just before Snipcart reads it
      // on click.
      value: '',
    })),
    // Invisible in Snipcart's own cart/checkout UI — exists purely so
    // the custom /cart page (LiveCart.tsx) can recover "product" and
    // "flavor" as separate fields without re-parsing the combined
    // display name, and without a second, non-Snipcart data source.
    metadata: {
      product: stegaClean(input.title),
      flavor: selectedVariantOption ? stegaClean(selectedVariantOption.label) : '',
      category: input.productSlug ?? '',
    },
  });
```

### `src/components/cart/LiveCart.tsx`

**Action:** Create
**Why:** The only way to render per-visitor Snipcart cart data on a fully static site — ports `Cart.astro`'s exact markup into a client-rendered island.
**Impact:** New file. Visual output identical to today's static mock's structure, populated with real data instead.

```tsx
import { useEffect, useState } from 'react';

interface SnipcartCustomField {
  name: string;
  value: string;
}

interface SnipcartCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  url?: string;
  customFields?: SnipcartCustomField[];
  // Deliberately untyped here — could be the parsed object or the raw
  // JSON string Snipcart was sent, depending on this project's pinned
  // version. parseMetadata() below normalizes either shape.
  metadata?: unknown;
}

interface DisplayItem {
  id: string;
  product: string;
  flavor: string;
  variantLabel: string;
  variantValue: string;
  occasion: string;
  price: string;
  lineTotal: number;
  imageSrc: string;
  imageAlt: string;
  accent: 'blue' | 'pink';
  editHref: string;
}

type ItemMetadata = { product?: string; flavor?: string; category?: string };

// buildItemAttributes() sends metadata as a JSON *string*
// (data-item-metadata="{...}", see attributes.ts). Whether Snipcart's
// store then exposes item.metadata as an already-parsed object or
// leaves it as that raw string is unverified for this project's pinned
// version — and getting it wrong here is a *silent* failure (optional
// chaining on a string just returns undefined, so `product` quietly
// falls back to the combined name, `flavor` goes blank, and accent
// colors go uniformly wrong with no error to notice). Handling both
// shapes removes the risk instead of just documenting it.
function parseMetadata(raw: unknown): ItemMetadata {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as ItemMetadata;
    } catch {
      return {};
    }
  }
  return raw as ItemMetadata;
}

function toDisplayItem(item: SnipcartCartItem): DisplayItem {
  const metadata = parseMetadata(item.metadata);
  const [variantField, occasionField] = item.customFields ?? [];
  const lineTotal = item.price * item.quantity;
  return {
    id: item.id,
    product: metadata.product ?? item.name,
    flavor: metadata.flavor ?? '',
    variantLabel: variantField?.name ?? '',
    variantValue: variantField?.value ?? '',
    occasion: occasionField?.value ?? '',
    price: `$${lineTotal.toFixed(2)}`,
    lineTotal,
    imageSrc: item.image ?? '',
    imageAlt: item.name,
    accent: metadata.category === 'personal-cakes' ? 'blue' : 'pink',
    editHref: item.url ?? '/products',
  };
}

interface Props {
  heading: string;
  productHeading: string;
  flavorHeading: string;
  occasionHeading: string;
  priceHeading: string;
  editLabel: string;
  subtotalLabel: string;
  checkoutLabel: string;
  emptyMessage: string;
}

export default function LiveCart({
  heading,
  productHeading,
  flavorHeading,
  occasionHeading,
  priceHeading,
  editLabel,
  subtotalLabel,
  checkoutLabel,
  emptyMessage,
}: Props) {
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [total, setTotal] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (window as unknown as { LoadSnipcart?: () => void }).LoadSnipcart?.();

    function readState() {
      const snipcart = (window as unknown as { Snipcart?: any }).Snipcart;
      const cart = snipcart?.store?.getState?.()?.cart;
      if (!cart || cancelled) return;
      const displayItems = (cart.items?.items ?? []).map(toDisplayItem);
      setItems(displayItems);
      setTotal(displayItems.reduce((sum: number, item: DisplayItem) => sum + item.lineTotal, 0));
      setReady(true);
    }

    let unsubscribe: (() => void) | undefined;
    function trySubscribe() {
      if (cancelled) return;
      const snipcart = (window as unknown as { Snipcart?: any }).Snipcart;
      if (snipcart?.store?.subscribe) {
        readState();
        unsubscribe = snipcart.store.subscribe(readState);
      } else {
        setTimeout(trySubscribe, 200);
      }
    }
    trySubscribe();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const accentBlue = 'bg-brand-blue';
  const accentPink = 'bg-brand-pink';
  const labelClass =
    'block font-medium text-black leading-[normal] ' +
    'text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl';
  const valueClass =
    'block font-normal text-black leading-[normal] ' +
    'text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl';

  if (!ready) return null;

  return (
    <section className="relative w-full bg-white" data-name="Shopping Cart">
      <div
        className="mx-auto w-full max-w-screen-2xl
               px-5 sm:px-8 md:px-12 lg:px-16 xl:px-[85px]
               pt-8 sm:pt-12 md:pt-16 lg:pt-20 xl:pt-24
               pb-12 sm:pb-16 md:pb-20 lg:pb-24 xl:pb-28"
      >
        <h1
          className="m-0 font-medium text-black leading-[normal]
               text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl
               mb-8 sm:mb-10 md:mb-12 lg:mb-14 xl:mb-16"
        >
          {heading}
        </h1>

        {items.length === 0 ? (
          <p
            className="m-0 font-medium text-black leading-[normal]
               text-xl sm:text-2xl md:text-3xl"
          >
            {emptyMessage}
          </p>
        ) : (
          <>
            <ul className="list-none m-0 p-0 flex flex-col">
              {items.map((item, i) => (
                <li
                  key={item.id}
                  className={`block ${i > 0 ? 'mt-8 sm:mt-10 md:mt-12 lg:mt-14 xl:mt-16' : ''}`}
                  data-name={`Cart row ${i + 1}`}
                >
                  <div className="flex justify-end mb-4 sm:mb-5 md:mb-6">
                    <a
                      href={item.editHref}
                      className="inline-flex items-center justify-center text-center
                     font-medium text-brand-blue no-underline
                     bg-white border border-brand-border
                     h-10 sm:h-11 md:h-12 lg:h-12 xl:h-14
                     w-32 sm:w-36 md:w-40 lg:w-44 xl:w-52
                     text-sm sm:text-base md:text-base lg:text-lg xl:text-xl
                     transition-[transform,filter] duration-150 ease-out
                     hover:brightness-95 hover:-translate-y-px
                     focus-visible:brightness-95 focus-visible:-translate-y-px focus-visible:outline-hidden"
                    >
                      {editLabel}
                    </a>
                  </div>

                  <div
                    className="relative grid items-center gap-x-4 sm:gap-x-5 md:gap-x-6 lg:gap-x-8
                   grid-cols-[auto_auto_minmax(0,1fr)]
                   border-t border-b border-black py-4 sm:py-5 md:py-6 lg:py-7 xl:py-8"
                  >
                    <span
                      className={`block self-stretch w-2 sm:w-2.5 md:w-3 lg:w-3.5 xl:w-4
                      border border-brand-border
                      ${item.accent === 'blue' ? accentBlue : accentPink}`}
                      aria-hidden="true"
                    ></span>

                    <img
                      src={item.imageSrc}
                      alt={item.imageAlt}
                      className="block object-contain
                     h-14 sm:h-16 md:h-20 lg:h-24 xl:h-28
                     w-auto"
                      loading="lazy"
                      decoding="async"
                    />

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-2 md:gap-y-3">
                      <div>
                        <span className={labelClass}>{productHeading}</span>
                        <span className={valueClass}>{item.product}</span>
                      </div>
                      <div>
                        <span className={labelClass}>{flavorHeading}</span>
                        <span className={valueClass}>{item.flavor}</span>
                      </div>
                      <div>
                        <span className={labelClass}>{item.variantLabel}</span>
                        <span className={valueClass}>{item.variantValue}</span>
                      </div>
                      <div>
                        <span className={labelClass}>{occasionHeading}</span>
                        <span className={valueClass}>{item.occasion}</span>
                      </div>
                      <div>
                        <span className={labelClass}>{priceHeading}</span>
                        <span className={valueClass}>{item.price}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 sm:mt-10 md:mt-12 lg:mt-14 xl:mt-16 flex flex-col items-end gap-1 sm:gap-2 text-right">
              <p className="m-0 font-medium text-black leading-[normal] text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
                {subtotalLabel}
              </p>
              <p className="m-0 font-medium text-black leading-[normal] text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
                ${total.toFixed(2)}
              </p>
            </div>

            <div className="mt-8 sm:mt-10 md:mt-12 lg:mt-14 xl:mt-16 flex justify-center">
              <button
                type="button"
                className="snipcart-checkout inline-flex items-center justify-center text-center no-underline
               bg-brand-blue text-white font-medium
               border border-brand-border
               h-14 sm:h-16 md:h-20 lg:h-24 xl:h-28
               w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl
               text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl
               px-8
               transition-[transform,filter] duration-150 ease-out
               hover:brightness-95 hover:-translate-y-px
               focus-visible:brightness-95 focus-visible:-translate-y-px focus-visible:outline-hidden"
              >
                {checkoutLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
```

#### Reasoning
- Every Tailwind class string is copied verbatim from `Cart.astro` — zero visual changes.
- `data-node-id` attributes are dropped in the port (they're Figma-reference-only, no visual/behavioral effect — listed here so it's an explicit, reviewable decision, not a silent omission).
- The CHECKOUT element changes from `<a href="/order">` to `<button type="button" class="snipcart-checkout">` — this is a behavior fix (it needs to actually open Snipcart, not navigate to an unrelated static page), not a visual redesign; the exact same classes are kept so it renders identically.
- `toDisplayItem()` centralizes the Snipcart→design field mapping in one pure function, kept separate from the render logic.
- The `trySubscribe`/`setTimeout` retry loop mirrors the same "Snipcart might not have loaded yet" concern `cartSync.ts` already handles, adapted for a page with no button click to hang the eager-load call off of.

### `src/pages/cart.astro`

**Action:** Modify
**Why:** Render the live island; stop wiring the mock item array.

#### Before
```astro
---
import Layout from "../layouts/Layout.astro";
import Navbar from "../components/home/Navbar.astro";
import Cart from "../components/cart/Cart.astro";
import { loadHomeContent } from "../lib/content/home";
import { loadCartContent } from "../lib/content/cart";

const { navbar } = await loadHomeContent();
const { cart } = await loadCartContent();
---
<Layout title="Shopping Cart — Cups & Cakes">
  <div class="flex min-h-dvh flex-col">
    <Navbar {...navbar} />
    <Cart {...cart} />
  </div>
</Layout>
```

#### After
```astro
---
import Layout from "../layouts/Layout.astro";
import Navbar from "../components/home/Navbar.astro";
import LiveCart from "../components/cart/LiveCart.tsx";
import { loadHomeContent } from "../lib/content/home";
import { loadCartContent } from "../lib/content/cart";

const { navbar } = await loadHomeContent();
const { cart } = await loadCartContent();
---
<Layout title="Shopping Cart — Cups & Cakes">
  <div class="flex min-h-dvh flex-col">
    <Navbar {...navbar} />
    <LiveCart
      client:only="react"
      heading={cart.heading}
      productHeading={cart.productHeading}
      flavorHeading={cart.flavorHeading}
      occasionHeading={cart.occasionHeading}
      priceHeading={cart.priceHeading}
      editLabel={cart.editLabel}
      subtotalLabel={cart.subtotalLabel}
      checkoutLabel={cart.checkoutLabel}
      emptyMessage={cart.emptyMessage}
    />
  </div>
</Layout>
```

### `src/content/cart/shopping-cart.json`

**Action:** Modify
**Why:** Drop the mock `items` array (nothing reads it anymore); add `emptyMessage` copy for the new, necessary empty-cart state.

#### Before
```json
{
  "section": "shopping-cart",
  "heading": "Shopping Cart",
  "productHeading": "Product",
  "flavorHeading": "Flavor",
  "occasionHeading": "Occassion",
  "priceHeading": "Price",
  "editLabel": "Edit",
  "subtotalLabel": "Subtotal:",
  "subtotalValue": "$44.50",
  "checkoutLabel": "CHECKOUT",
  "checkoutHref": "/order",
  "items": [ /* ...mock items... */ ]
}
```

#### After
```json
{
  "section": "shopping-cart",
  "heading": "Shopping Cart",
  "productHeading": "Product",
  "flavorHeading": "Flavor",
  "occasionHeading": "Occassion",
  "priceHeading": "Price",
  "editLabel": "Edit",
  "subtotalLabel": "Subtotal:",
  "checkoutLabel": "CHECKOUT",
  "emptyMessage": "Your cart is empty."
}
```

### `src/content.config.ts`

**Action:** Modify
**Why:** The `shopping-cart` schema's `items` array (and `cartItemSchema`, the type that backed it) and `subtotalValue`/`checkoutHref` are no longer produced anywhere; add `emptyMessage`.
**Impact:** Schema-only change; `loadCartContent()` in `lib/content/cart.ts` needs no code change since it just returns whatever the schema validates.

#### Before
```ts
const cartItemSchema = z.object({
  id: z.string(),
  product: z.string(),
  flavor: z.string(),
  /** Personal cakes show "Frosting Color"; cupcakes show "Quantity". */
  variantLabel: z.string(),
  variantValue: z.string(),
  occasion: z.string(),
  price: z.string(),
  imageSrc: z.string(),
  imageAlt: z.string(),
  /** Side-strip accent color. */
  accent: z.enum(["blue", "pink"]),
  editHref: z.string(),
});

const cartSchema = z.object({
  section: z.literal("shopping-cart"),
  heading: z.string(),
  productHeading: z.string(),
  flavorHeading: z.string(),
  occasionHeading: z.string(),
  priceHeading: z.string(),
  editLabel: z.string(),
  subtotalLabel: z.string(),
  subtotalValue: z.string(),
  checkoutLabel: z.string(),
  checkoutHref: z.string(),
  items: z.array(cartItemSchema).min(1),
});
```

#### After
```ts
const cartSchema = z.object({
  section: z.literal("shopping-cart"),
  heading: z.string(),
  productHeading: z.string(),
  flavorHeading: z.string(),
  occasionHeading: z.string(),
  priceHeading: z.string(),
  editLabel: z.string(),
  subtotalLabel: z.string(),
  checkoutLabel: z.string(),
  emptyMessage: z.string(),
});
```

*(`cartItemSchema` is removed entirely — nothing references it once `items` is gone.)*

### `src/components/home/Navbar.astro`

**Action:** Modify
**Why:** Remove the single largest unverified assumption in this plan (whether Astro's island-hydration script reliably executes when introduced via `swapGuard.ts`'s custom `appendChild`-based swap, for a page transition that's never had an island involved before) by making this one navigation a real hard page load instead. See "Why the Cart Icon Link Gets `data-astro-reload`" above.
**Impact:** Clicking the cart icon from anywhere on the site now does a full page reload into `/cart` instead of a soft ClientRouter transition. No other link on the site is affected.

#### Before
```astro
      <a
        href={cartHref}
        class="nav-icon bg-cart-icon h-5 sm:h-6 md:h-7 lg:h-8 aspect-[41.479/46.541]"
        data-node-id="3311:1695"
        data-name="C&C_CART_ICON"
        aria-label="Shopping cart"
      ></a>
```

#### After
```astro
      <a
        href={cartHref}
        data-astro-reload
        class="nav-icon bg-cart-icon h-5 sm:h-6 md:h-7 lg:h-8 aspect-[41.479/46.541]"
        data-node-id="3311:1695"
        data-name="C&C_CART_ICON"
        aria-label="Shopping cart"
      ></a>
```

## Validation Plan

- `npm run build` — confirms no type errors, confirms `Cart.astro`'s removal doesn't leave a dangling import anywhere else (grep for other usages first). Already spot-checked during this review (separately from the real feature code): a throwaway `.tsx` component with a `client:only="react"` directive was temporarily wired in, built, and confirmed in the compiled output that (a) its Tailwind classes were correctly generated (`.bg-\[#123abc\]{background-color:#123abc}` was present) and (b) an `astro-island` element was emitted — both removed again before any real implementation. This was a build-tooling check, not a Snipcart/cart behavior test.
- Manual check only, per explicit instruction not to run automated browser tests this round: add an item via a product page, navigate to `/cart`, confirm it displays with the correct product/flavor/variant/occasion/price/image, confirm the layout is visually identical to the old static mock's structure, confirm clicking CHECKOUT opens Snipcart's cart/checkout flow.
- Specifically check the cart icon link from a product page: confirm it does a full page reload (URL bar briefly shows a real navigation, not an instant SPA-style swap) now that `data-astro-reload` is set.

## Risk Notes

- `client:only="react"` means `/cart` has no server-rendered content for this section at all — a no-JS visitor (or a crawler) sees nothing here. This matches the reality that the content is inherently runtime/per-visitor and can't be meaningfully pre-rendered; it's not a regression from a previously-working SSR'd state for *real* data (the old SSR'd content was a static mock, never real).
- `cart.items.items`, `item.name`, and `item.price` are the only Snipcart store fields this plan relies on that were actually exercised in this project's own earlier Playwright testing (not just read from docs). `item.quantity`, `item.customFields[].name/.value`, `item.image`, `item.url`, and `item.metadata` are not independently verified against this project's pinned `3.7.2` version — they're either Snipcart's documented field names or, for `metadata`, a brand-new field this plan starts populating. Worth a spot-check once real data is flowing (e.g., confirm `customFields` array order is exactly `[variant group, Occasion]` as built by `cartItem.ts`, and confirm `item.price` is genuinely the *unit* price, not already quantity-multiplied — if it turns out to already be the line total, `toDisplayItem`'s multiplication needs to be removed, a one-line fix, not a field-name hunt).
- **Metadata round-trip shape — handled defensively rather than assumed:** `buildItemAttributes()` sends metadata as a JSON *string* (`data-item-metadata="{...}"`, per `attributes.ts:49`), but whether Snipcart's store then exposes `item.metadata` as an already-parsed object or leaves it as that raw string is unverified for this project's pinned version. Getting this wrong would otherwise be a *silent* failure (optional chaining on a string just returns `undefined`, so `product` would quietly fall back to the combined name while `flavor` and `accent` went uniformly wrong with no error). `parseMetadata()` handles both shapes explicitly, so this risk is closed in code rather than left as something to remember to check.
- `ready` starts `false` and the component renders nothing until Snipcart's store responds — there's no loading indicator for that window (kept out deliberately per "don't change the design," since a spinner/skeleton wasn't part of the original static mock). On a slow connection this means a blank `/cart` body for up to a few seconds before content appears.
- Deleting `Cart.astro` is safe only if nothing else imports it — must grep before deleting, not assumed from this plan alone.

## Approval
`Status: Awaiting explicit user approval. Do not implement yet.`
