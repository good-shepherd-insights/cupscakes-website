# FEATURE(add-to-cart-toast)

## Request

CUP-49 — when a customer clicks ADD TO CART, the only feedback today is the navbar cart icon shaking/tinting pink. Add a toast notification that explicitly confirms the add, showing the item's image and name, so the customer isn't confused about whether it worked.

Ticket constraints (from CUP-49):

- Must NOT re-enable Snipcart's drawer auto-open (`addProductBehavior="none"` stays, per CUP-42).
- Trigger must use the store-subscription approach — this Snipcart build never fires `snipcart.item.added` on `document` (confirmed in `cartBadge.ts:51-56`).
- Item image/name read straight off the clicked button's `data-item-image` / `data-item-name` (already emitted by `buildItemAttributes()`, `src/lib/snipcart/attributes.ts:43,47`) — no new data pipeline.
- Auto-dismisses after a reasonable delay; rapid successive adds must not stack awkwardly.
- Coexists with the cart-shake icon animation.

## Directory Map

```text
src/
├── components/snipcart/
│   └── CartToast.astro          [CREATE]  toast markup + script wiring
├── lib/snipcart/
│   └── cartToast.ts             [CREATE]  pending-click capture + store trigger + show/dismiss
├── layouts/
│   └── Layout.astro             [MODIFY]  mount <CartToast /> once, site-wide
└── styles/
    └── global.css               [MODIFY]  .cart-toast rest/show states + reduced-motion opt-out
```

## Modification Table

| File | Action | Why |
|---|---|---|
| `src/lib/snipcart/cartToast.ts` | Create | The behavior module: capture `{name, image}` from the clicked add button, show the toast when the store's item count increases, auto-dismiss. Mirrors `cartBadge.ts`'s structure and store-subscription trigger. |
| `src/components/snipcart/CartToast.astro` | Create | The toast element + its script wiring. Lives beside `Snipcart.astro` / `AddToCartButton.astro`, the existing home for Snipcart UI components. |
| `src/layouts/Layout.astro` | Modify | Single site-wide mount point (same rationale as the `#snipcart` div living here) — any current or future page with an add button gets the toast for free. |
| `src/styles/global.css` | Modify | Toast show/hide transition classes. Existing convention: state-class animations (`.cart-shake`, `.loading-dot`) live here because Tailwind v4 has no first-class keyframe primitive, each with a `prefers-reduced-motion` opt-out. |

## Existing Pattern Audit

| Concern | Existing pattern followed |
|---|---|
| Add-detection trigger | `initCartShakeAnimation()` (`cartBadge.ts:47-70`): `window.Snipcart.store.subscribe()` + compare `cart.items.count` against a `lastCount` closure. The DOM event `snipcart.item.added` is documented there as never firing in this build. |
| One-time init guard | `cartBadge.ts:48-49` sets a `document['_cartShakeInit']` flag; `cartToast.ts` uses the same idiom (`_cartToastClickBound`, `_cartToastInit`). |
| Animation restart on rapid re-trigger | `cartBadge.ts:62-64`: remove class → `void el.offsetWidth` reflow → re-add class. Reused so a second add replaces the visible toast and restarts its slide-in instead of stacking. |
| ClientRouter swap survival | Buttons/toast element are replaced on navigation. Click capture is **delegated on `document`** (persists across swaps, like Navbar's `document.addEventListener("keydown", ...)`), and the toast element is **queried at show time**, not cached. |
| `snipcart.ready` wiring | `Navbar.astro:301-302` binds init functions to `snipcart.ready` at module-script top level; `CartToast.astro` does the same. |
| State-class CSS + reduced motion | `global.css:257-271` (`.cart-shake`) — new `.cart-toast` block sits directly below it with its own `prefers-reduced-motion` opt-out. |
| Visual language | White surface + `border-brand-border` (navbar, buttons), `brand-pink` accent, `font-medium`/`font-light` weights, arbitrary-px sizing values. Navbar is `z-50`; toast uses `z-[60]` to clear it. |
| Snipcart types | `window.Snipcart` is already globally declared in `cartBadge.ts:16-20`; `cartToast.ts` relies on that ambient declaration rather than re-declaring. |

## Execution Plan

1. Create `src/lib/snipcart/cartToast.ts` (behavior module — no DOM assumptions beyond ids/classes).
2. Create `src/components/snipcart/CartToast.astro` (markup + wiring).
3. Mount `<CartToast />` in `src/layouts/Layout.astro`.
4. Add `.cart-toast` styles to `src/styles/global.css`.
5. Validate: `npm run build` + static grep of `dist/` (per project verification preference).

## File-by-File Changes

### `src/lib/snipcart/cartToast.ts`

**Action:** Create
**Why:** Behavior lives in `src/lib/snipcart/` beside `cartBadge.ts`/`cartSync.ts`, keeping the `.astro` component markup-only.
**Impact:** Net-new module; no existing imports change.

#### After

```ts
/**
 * Add-to-cart confirmation toast (CUP-49).
 *
 * Trigger: the same store-subscription signal as initCartShakeAnimation()
 * (cartBadge.ts) — this Snipcart build never dispatches
 * 'snipcart.item.added' on document, but the store's item count
 * increasing is the proven-working add signal.
 *
 * Which item: read off the clicked .snipcart-add-item button's
 * data-item-name / data-item-image at click time (both already emitted by
 * attributes.ts) and held as a short-lived "pending" record until the
 * count increase confirms the add. Requiring a recent click means
 * drawer-side quantity bumps never produce a mislabeled toast.
 */

interface PendingAdd {
  name: string;
  image: string;
  at: number;
}

// A click older than this can no longer claim a count increase (e.g. the
// add failed Snipcart validation and a later, unrelated increase arrives)
// — prevents showing a stale name/image.
const PENDING_MAX_AGE_MS = 8000;
const TOAST_DISMISS_MS = 4000;

let pending: PendingAdd | null = null;
let dismissTimer: ReturnType<typeof setTimeout> | undefined;

// Delegated on document so it survives ClientRouter swaps — add buttons
// are replaced wholesale on navigation, so a per-button listener would
// need rebinding on every astro:page-load.
export function bindCartToastClickCapture(): void {
  if ((document as unknown as Record<string, unknown>)['_cartToastClickBound']) return;
  (document as unknown as Record<string, unknown>)['_cartToastClickBound'] = true;

  document.addEventListener('click', (e) => {
    const button = (e.target as HTMLElement).closest<HTMLButtonElement>('.snipcart-add-item');
    if (!button || button.disabled) return;
    pending = {
      name: button.getAttribute('data-item-name') ?? '',
      image: button.getAttribute('data-item-image') ?? '',
      at: Date.now(),
    };
  });
}

// Same count-increase detection as initCartShakeAnimation (cartBadge.ts);
// both subscriptions coexist on the same store without interfering.
export function initCartToastStore(): void {
  if ((document as unknown as Record<string, unknown>)['_cartToastInit']) return;
  (document as unknown as Record<string, unknown>)['_cartToastInit'] = true;

  let lastCount = window.Snipcart.store.getState().cart.items.count;
  window.Snipcart.store.subscribe(() => {
    const count = window.Snipcart.store.getState().cart.items.count;
    if (count > lastCount && pending && Date.now() - pending.at < PENDING_MAX_AGE_MS) {
      showToast(pending);
      pending = null;
    }
    lastCount = count;
  });
}

function showToast({ name, image }: PendingAdd): void {
  // Queried at show time — the element is swapped on every ClientRouter
  // navigation, so caching it at init would leave a detached reference.
  const toast = document.getElementById('cart-toast');
  if (!toast) return;
  const img = toast.querySelector<HTMLImageElement>('.cart-toast-image');
  const nameEl = toast.querySelector<HTMLElement>('.cart-toast-name');
  if (img) {
    if (image) img.src = image;
    img.hidden = !image;
  }
  if (nameEl) nameEl.textContent = name;

  // Remove/reflow/re-add so a rapid second add replaces the visible toast
  // and restarts its slide-in rather than stacking — same restart trick
  // as the cart-shake animation (cartBadge.ts).
  toast.classList.remove('cart-toast-show');
  void toast.offsetWidth;
  toast.classList.add('cart-toast-show');

  clearTimeout(dismissTimer);
  dismissTimer = setTimeout(() => toast.classList.remove('cart-toast-show'), TOAST_DISMISS_MS);
}
```

#### Reasoning

- **Pending-click pairing** (not "toast on any count increase"): a count increase alone also fires when the customer bumps quantity inside the cart drawer; pairing with a recent add-button click keeps the toast exclusively an add-to-cart confirmation and gives it the right name/image with zero new data plumbing.
- **8s freshness window**: if Snipcart rejects the add (e.g. crawler validation failure), the pending record would otherwise linger forever and mislabel a much later add.
- **Single toast element, replace-and-restart**: satisfies the "doesn't stack awkwardly" acceptance criterion with the least machinery — no queue, no multiple elements.
- **No conflict with cart-shake**: both are independent `store.subscribe` listeners; Snipcart's store supports multiple subscribers (badge + shake already coexist).

### `src/components/snipcart/CartToast.astro`

**Action:** Create
**Why:** Markup + script wiring in the established Snipcart component folder.
**Impact:** Net-new component, mounted only by `Layout.astro`.

#### After

```astro
---
/**
 * Add-to-cart confirmation toast (CUP-49). Fixed to the bottom-right,
 * invisible at rest; cartToast.ts flips .cart-toast-show when a click on
 * an add button is confirmed by the store's item count increasing, then
 * auto-dismisses. Deliberately its own lightweight element — Snipcart's
 * drawer confirmation stays disabled (addProductBehavior="none" in
 * Layout.astro, per CUP-42), and the navbar cart-shake runs alongside.
 *
 * role="status" + aria-live="polite": the name/text swap on show is
 * announced by screen readers without stealing focus.
 */
---
<div
  id="cart-toast"
  class="cart-toast fixed bottom-[18px] right-[18px] z-[60]
         flex items-center gap-[12px]
         bg-white border border-brand-border rounded-md shadow-lg
         py-[10px] pl-[10px] pr-[18px]
         max-w-[calc(100vw-36px)]"
  role="status"
  aria-live="polite"
>
  <img class="cart-toast-image block w-[52px] h-[52px] object-cover rounded-sm" alt="" hidden />
  <div class="min-w-0">
    <p class="cart-toast-name m-0 text-black font-medium leading-[1.2] text-[14px] truncate"></p>
    <p class="m-0 text-black font-light leading-[1.2] text-[12px]">Added to your cart</p>
  </div>
</div>

<script>
  import { bindCartToastClickCapture, initCartToastStore } from "../../lib/snipcart/cartToast";

  bindCartToastClickCapture();
  document.addEventListener("snipcart.ready", initCartToastStore);
</script>
```

#### Reasoning

- **Bottom-right, `z-[60]`**: clears the sticky `z-50` navbar and never covers the cart icon the shake animation is drawing attention to (top-right).
- **`<img hidden>` at rest with `alt=""`**: no empty-`src` request; unhidden only when the button actually carried `data-item-image`. Decorative alt — the adjacent name text is the accessible content.
- **Module-script wiring**: identical shape to `Navbar.astro:299-303` (`snipcart.ready` bindings at top level); both functions self-guard so double-execution is harmless.

### `src/layouts/Layout.astro`

**Action:** Modify
**Why:** One site-wide mount, same placement rationale as the `#snipcart` div.
**Impact:** Toast is available on every page; invisible and inert (pointer-events: none at rest) on pages without add buttons.

#### Before

```astro
import { ClientRouter } from 'astro:transitions';
import { stegaClean } from '@sanity/client/stega';
import Snipcart from '../components/snipcart/Snipcart.astro';
import '../styles/global.css';
import '../styles/snipcart-overrides.css';
```

```astro
  <body class="m-0 p-0 bg-white font-sans antialiased">
    <slot />
    {/* Snipcart's loader (lib/snipcart/loader.ts) reuses this div if it
```

#### After

```astro
import { ClientRouter } from 'astro:transitions';
import { stegaClean } from '@sanity/client/stega';
import Snipcart from '../components/snipcart/Snipcart.astro';
import CartToast from '../components/snipcart/CartToast.astro';
import '../styles/global.css';
import '../styles/snipcart-overrides.css';
```

```astro
  <body class="m-0 p-0 bg-white font-sans antialiased">
    <slot />
    <CartToast />
    {/* Snipcart's loader (lib/snipcart/loader.ts) reuses this div if it
```

#### Reasoning

- Placed after `<slot />` (normal swap-participating content) and before the swap-guarded `#snipcart` div — the toast has no persistence requirement; if one is visible mid-navigation it simply resets, which is acceptable.

### `src/styles/global.css`

**Action:** Modify (append below the `.cart-shake` block, `global.css:271`)
**Why:** State-class animations with reduced-motion opt-outs live here by convention.
**Impact:** Additive only; no existing rules change.

#### Before

```css
@media (prefers-reduced-motion: reduce) {
  .cart-shake { animation: none; filter: none !important; }
}
```

#### After

```css
@media (prefers-reduced-motion: reduce) {
  .cart-shake { animation: none; filter: none !important; }
}

/* Add-to-cart toast (CartToast.astro) — invisible/inert at rest;
   cartToast.ts adds .cart-toast-show on a confirmed add and removes it
   again on auto-dismiss. */
.cart-toast {
  opacity: 0;
  transform: translateY(12px);
  pointer-events: none;
  transition: opacity 0.25s ease-out, transform 0.25s ease-out;
}
.cart-toast-show {
  opacity: 1;
  transform: translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  .cart-toast { transition: none; transform: none; }
}
```

#### Reasoning

- **Opacity/transform transition, not keyframes**: dismiss needs a symmetric fade-out on class removal, which a transition gives for free and keyframes don't.
- **`pointer-events: none` on the base class** (never re-enabled): the toast is purely informational — it must never block clicks on content behind it, even while visible.
- **Reduced motion**: still fades via opacity (transition removed = instant show/hide), no translate.

## Validation Plan

1. `npm run build` — must complete (currently 22 pages).
2. Static built-output checks (project convention — no browser walkthrough):
   - `grep -o 'id="cart-toast"' dist/products/personal-cakes/chocolate/index.html` → present (and in `dist/index.html`, since it's in Layout).
   - `grep -o 'cart-toast-show' dist/_astro/*.css` → transition classes generated.
   - `grep -rl '_cartToastInit' dist/` → toast script bundled into pages.
3. Reviewer smoke test on the PR's Vercel preview: add an item → toast slides in bottom-right with image + name, cart icon still shakes, drawer stays closed, toast auto-dismisses ~4s, second rapid add replaces the first toast.

## Risk Notes

- **Drawer quantity bumps**: deliberately produce no toast (no recent button click) — matches the ticket's framing of this as an *add-to-cart* confirmation.
- **`snipcart.ready` timing**: Snipcart loads lazily on first interaction; `initCartToastStore` binds via the `snipcart.ready` listener exactly like the badge/shake, so it can't race the loader.
- **Failed adds**: if Snipcart rejects an add, the count never increases → no toast (correct: nothing was added). The 8s pending window prevents that stale click from mislabeling a later success.
- **View transitions**: click capture is document-delegated and the element is re-queried per show, so navigation swaps can't detach the feature.

## Approval

`Status: Awaiting explicit user approval. Do not implement yet.`
