# FEATURE: Route order flow to the specific product page

## Problem

Clicking "Order Now" on a specific flavor card in `CupcakeCarousel.astro`
(home page) links to the same generic `routes.order` ("/order") as the
Navbar/Hero/Footer generic "Order Now" links. Nothing captured downstream in
the multi-step order flow (pickup-or-delivery → date select) tracks which
flavor (if any) the customer started from, so after finishing date selection
everyone lands on the same place — today's actual `nextHref` for both
`order-pickup-date.json` and `order-delivery-date.json` is `/products` (the
generic listing), not a per-flavor product page.

## Trace of the current flow (verified by reading, not assuming)

1. `CupcakeCarousel.astro` flavor card → `<a href={routes.order}>` ("/order"), no product context recorded.
2. `/order` → `PickupOrDelivery.astro` → pickup/delivery buttons → `/order/pickup` or `/order/delivery`.
3. `/order/pickup` (`OrderForm.astro`) submit → `bindOrderCapture` commits fields to `draftStore`, then `navigate(nextHref)` where `nextHref` = `order-pickup.json`'s `"nextHref": "/order/pickup/date"` (delivery analogous → `/order/delivery/date`).
4. `/order/pickup/date` (`DateSelect.astro`) submit → same `bindOrderCapture` mechanism, `nextHref` passed in via `form.dataset.nextHref`, sourced from `order-pickup-date.json`'s `"nextHref": "/products"` (delivery analogous, same value). **This is today's actual fallback destination** — confirmed by reading the JSON content files, not loading.astro (which is WIP/unlinked per its own top-of-file comment).

The cupcake flavor → product/variant slug mapping already exists elsewhere in
the codebase: `src/content/products/cupcakes.json` (used by the separate
`/products` page's `CupcakeFlavorCard`/`CupcakeGrid`, out of this ticket's
scope) links each flavor directly to `/products/cupcakes/<flavor-key>` — i.e.
Sanity product slug `"cupcakes"`, variant slug = the flavor key
(`chocolate`, `butter-pecan`, `carrot`, ...). `CupcakeCarousel.astro`'s three
flavor keys (`chocolate`, `butter-pecan`, `carrot`) already match this
convention, confirmed against `src/pages/products/[slug]/[...variant].astro`'s
`definesVariantRoute` handling and `routes.productVariant(slug, variantSlug)`.

## Plan

### 1. `src/lib/order/draftStore.ts`
Add two small helpers on top of the existing generic `OrderDraft` map (no new
storage mechanism):
- `recordProductSelection(productSlug, variantSlug?)` — `updateDraft` with `productSlug`/`variantSlug` keys.
- `getProductSelection()` — reads `productSlug`/`variantSlug` back out of `getDraft()`, returns `undefined` if nothing was recorded.

### 2. `src/components/home/CupcakeCarousel.astro`
- Add `data-product-slug="cupcakes"` and `data-variant-slug={f.key}` to each flavor's "ORDER NOW" `<a>` (href stays `routes.order` — the flow still starts at `/order`; only the capture is new).
- Add a small inline `<script>` (module, bound on `astro:page-load` like `DateSelect.astro`'s pattern) that, on click of a `.cupcake-cta[data-product-slug]` link, calls `recordProductSelection(...)` before the browser/ClientRouter proceeds with navigation. `sessionStorage.setItem` is synchronous so this is safe to fire from a plain click listener without `preventDefault`.
- The "Other Options" link and generic Navbar/Hero/Footer "Order Now" links are untouched — they carry no `data-product-slug`, so nothing is recorded for them (unchanged fallback behavior).

### 3. `src/components/order/DateSelect.astro`
In `initDateCapture()`, compute `nextHref` dynamically instead of using `form.dataset.nextHref` directly:
- If `getProductSelection()` returns a selection, target `routes.productVariant(productSlug, variantSlug)` (or `routes.product(productSlug)` if no variant), imported from `src/lib/routes.ts`.
- Otherwise, fall back to `form.dataset.nextHref` exactly as today (`/products`) — unchanged for generic entry points.

## Explicitly out of scope (per ticket's "Owns" list)

- Not touching `src/components/product/**` (`CupcakeFlavorCard.astro`/`CupcakeGrid.astro` already have their own direct-to-product links; unrelated to this flow).
- Not touching Navbar/Hero/Footer to clear a stale prior flavor selection before a later generic "Order Now" click in the same tab — `clearDraft()` is never called anywhere in the current codebase (pre-existing behavior, not introduced by this change), and those files are outside this ticket's "Owns" list. Flagging as a known edge case in the PR description rather than fixing it.
