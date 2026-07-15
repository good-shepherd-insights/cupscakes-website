# 2026-07-03 — Order flow feedback: action items

Raw feedback this was derived from:

> Also, when people select an occasion other than regular such as birthday, wedding, etc, can you have it prompt a box so they can add a message (see second image)?
>
> And if they want to select more than 4 dozen, can you another box option that says Custom and prompt them to a message box like the other one that allows them to specify?
> It's the same for the personal cakes, right now if they click on the custom box, it doesn't prompt them to a message box
> Currently, if someone clicks on order now from one of them cupcakes or cakes (i.e chocolate) it takes them to the pick up/delivery prompts and forms to fill out and then to the shop page.
>
> Can adjust it so that after they finish the pick up/delivery form, it takes them directly to the product page of the cupcake they selected from the home page?
> I'm also noticing that when for instance, I select add to cart for an item and only picked one dozen, the cart will show 2 dozen instead.

Not yet implemented — grounded in current code as of this date, for later pickup. Note that per `CLAUDE.md`, a `whiteboarding` plan (`FEATURE(...).md` / `REFACTOR(...).md`) should be produced and approved before actually editing code for any of these.

---

## 1. Message box on non-"Regular" occasion (cupcakes + personal cakes)

**Where:** `src/components/product/PersonalCakeProduct.astro` renders one `<fieldset>` per `customOptions` group generically (line 293-344); `Occasion` is just a radio group like any other (Sanity schema, `src/sanity/schemaTypes/product.ts`). There's currently no concept of a conditional follow-up text field.

**Task:**
- Add a new option-group behavior: when the `Occasion` radio group's checked value is anything other than `"Regular"`, reveal a `<textarea>` ("Add a message") below the fieldset.
- Needs: (a) a UI branch in `PersonalCakeProduct.astro` (hidden-by-default message box, toggled via a `change` listener), (b) a new custom field wired through `buildProductCartAttributes` (`src/lib/snipcart/cartItem.ts`) so the message text actually reaches Snipcart/the order, and (c) a sync entry in `cartSync.ts`'s `syncCustomFields` so the textarea's live value is read at add-to-cart time (same pattern as the existing `single:`/`multi:`/`flag:` descriptors).
- Applies to **both** the cupcakes product page and the personal cakes product page since both go through the same `PersonalCakeProduct.astro` component — one fix covers both.

## 2. "Custom" quantity option (both product types) needs its own message box

**Where:** Same component/file. `Quantity` is also just a radio group (`DEFAULT_OPTION_LABEL.quantity = "1 Dozen"`, line 136). A "Custom" option can be added as a plain Sanity option in that group, but nothing today makes any option pop a text box — this is the same underlying mechanism as item 1.

**Task:**
- Reuse the same "conditional message box" mechanism built for item 1, generalized to trigger off *any* group+option pair (e.g. `Occasion != Regular` OR `Quantity == Custom`), not hardcoded to one group.
- Add a "Custom" option to the `Quantity` custom-options group in Sanity Studio content for both cupcakes and personal cakes.
- Explicitly note: user says personal cakes *already has* a "Custom" box (for Frosting Color, per the Figma comment at line 42 `Custom (1282, 1106)`) that currently does nothing when clicked — confirm whether that's the same bug or a separate one (Frosting Color is a `checkbox` group, not `radio`, so it needs its own conditional-reveal wiring, likely per-checkbox rather than per-group).

## 3. Post-pickup/delivery-form redirect should land on the selected product, not `/products`

**Where:** `src/content/order/order-pickup-date.json:9` and `src/content/order/order-delivery-date.json:9` both hardcode `"nextHref": "/products"` — this is the final step of `DateSelect.astro`, reached after `/order → pickup-or-delivery → date`.

**Root cause of "always shop page":** The homepage "ORDER NOW" links that kick off this flow (`src/components/home/CupcakeCarousel.astro:112`, using `href={routes.order}`) go to the generic `/order` entry point without ever recording *which* product/flavor the user clicked. The multi-step draft store (`src/lib/order/draftStore.ts`, sessionStorage-backed) captures pickup/delivery + date but has no field for "which product."

**Task:**
- Have `CupcakeFlavorCard`/`CupcakeCarousel`'s per-flavor "ORDER NOW" and `PersonalCakeCard`'s "ORDER NOW" (both currently just `href={orderHref}` → `routes.order`) pass the target product slug into the order flow — e.g. `routes.order + "?product=<slug>"`, or seed it into `draftStore` via `bindOrderCapture` (`src/lib/order/bindOrderCapture.ts`) the same way `fulfillment` is seeded today (`DateSelect.astro:196-199`).
- Change `nextHref` resolution so it's no longer a static JSON string — either compute it client-side from the draft's stored product slug via `routes.product(slug)` / `routes.productVariant(slug, variantSlug)` (`src/lib/routes.ts`), or branch in the date-form submit handler.
- Fallback: if no product was captured (e.g. user entered `/order` directly, not via a flavor card), keep `/products` as the default.

## 4. Add-to-cart quantity bug: "1 Dozen" selected but cart shows "2 Dozen"

**Where:** `src/lib/snipcart/cartItem.ts:93` — the Snipcart `data-item-id` is built as `` `${productSlug}-${currentVariantSlug}` `` and does **not** include the selected `Quantity` (or `Occasion`) custom-field value. Snipcart merges/increments cart lines that share the same `data-item-id`, regardless of differing custom field selections.

**Likely failure scenario:** user adds "Chocolate Cupcakes, 1 Dozen" — if a line for that same product/variant already exists in the cart (e.g. added earlier with "2 Dozen" selected, or defaulted), Snipcart bumps the existing line's native quantity/keeps its original custom-field display rather than creating a distinct line, so the cart shows "2 Dozen" even though the customer's last action selected "1 Dozen."

**Task:**
- Reproduce: add same product/variant twice with different `Quantity` selections, confirm merge behavior in the live cart (`src/components/cart/LiveCart.tsx`).
- Fix by incorporating the selected `Quantity` (and likely `Occasion`) option value into `data-item-id` so distinct selections become distinct cart lines instead of merging — mirroring how `currentVariantSlug` is already part of the id. Needs care: `syncCustomFields` sets the button's custom-field values at click time (`cartSync.ts:107`), so the id computation must read the same live-checked values, not just server-rendered defaults.
- Regression-check `LiveCart.tsx`'s edit-in-place flow (`draftValues.Quantity`, lines 265/431) which currently assumes editing quantity in the cart doesn't change the item's identity — that assumption breaks if id now encodes quantity, so the "edit quantity in cart" UX needs to actually swap the line to a new id rather than mutate in place.
