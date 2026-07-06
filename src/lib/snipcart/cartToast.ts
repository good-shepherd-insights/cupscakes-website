/**
 * Add-to-cart confirmation feedback (CUP-49): a toast with the item's
 * image/name, plus a temporary lock on the clicked button ("ADDING…" →
 * "ADDED!") so the customer gets immediate feedback and can't double-add
 * while the first add is in flight.
 *
 * Trigger: a store subscription like initCartShakeAnimation()
 * (cartBadge.ts) — this Snipcart build never dispatches
 * 'snipcart.item.added' on document. The signal is TOTAL QUANTITY, not
 * cart.items.count: count is the number of distinct line items, and
 * re-adding a product already in the cart only bumps that line's
 * quantity, leaving count unchanged — count-based detection silently
 * misses every repeat add. Snipcart's own "snipcart-items-count" HTML
 * binding sums item quantities for the same reason.
 *
 * Which item: read off the clicked .snipcart-add-item button's
 * data-item-name / data-item-image at click time (both already emitted by
 * attributes.ts) and held as a short-lived "pending" record until the
 * quantity increase confirms the add. Requiring a recent click means
 * drawer-side quantity bumps never produce a mislabeled toast.
 */

interface PendingAdd {
  name: string;
  image: string;
  at: number;
  button: HTMLButtonElement;
}

// A click older than this can no longer claim a quantity increase (e.g.
// the add failed Snipcart validation and a later, unrelated increase
// arrives) — prevents showing a stale name/image.
const PENDING_MAX_AGE_MS = 8000;
const TOAST_DISMISS_MS = 4000;
// How long the clicked button stays locked ("ADDING…"/"ADDED!") before
// returning to normal — long enough to absorb impatient re-clicks, short
// enough not to block an intentional second add.
const BUTTON_LOCK_MS = 3500;

let pending: PendingAdd | null = null;
let dismissTimer: ReturnType<typeof setTimeout> | undefined;
let restoreTimer: ReturnType<typeof setTimeout> | undefined;
let lockedButton: HTMLButtonElement | null = null;

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
      button,
    };
    lockButton(button);
  });

  // Capture-phase re-entry guard. lockButton() disables the button a tick
  // late (deferred so Snipcart's own handler still sees the first click),
  // which leaves a sliver where a genuine double-click gets BOTH clicks
  // through to Snipcart — a real double add. Capture runs before every
  // bubble listener, so swallowing the event here means neither Snipcart's
  // handler nor the pending-setter above ever sees the extra click. The
  // first click always passes: pending is only set during its bubble phase,
  // after this guard has already run for that event.
  document.addEventListener(
    'click',
    (e) => {
      const button = (e.target as HTMLElement).closest<HTMLButtonElement>('.snipcart-add-item');
      if (!button) return;
      if (pending && Date.now() - pending.at < BUTTON_LOCK_MS) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );
}

// Locks the clicked button for BUTTON_LOCK_MS: disabled, pressed-pulse
// animation, label swapped to "ADDING…" (then "ADDED!" once the store
// confirms — see the subscription below). Deferred a tick so Snipcart's
// own document-delegated click handler — which runs after this bubble
// listener in the same dispatch — still sees the enabled button it needs
// to process the add.
function lockButton(button: HTMLButtonElement): void {
  setTimeout(() => {
    if (lockedButton && lockedButton !== button) restoreButton();
    lockedButton = button;
    button.dataset.addLock = 'true';
    button.dataset.addLockLabel = button.textContent ?? '';
    button.textContent = 'ADDING…';
    button.disabled = true;
    button.classList.add('add-feedback-pulse');
    clearTimeout(restoreTimer);
    restoreTimer = setTimeout(restoreButton, BUTTON_LOCK_MS);
  }, 0);
}

function restoreButton(): void {
  const button = lockedButton;
  lockedButton = null;
  if (!button) return;
  delete button.dataset.addLock;
  button.textContent = button.dataset.addLockLabel ?? 'ADD TO CART';
  delete button.dataset.addLockLabel;
  button.classList.remove('add-feedback-pulse');
  button.disabled = false;
}

// Same store-subscription approach as initCartShakeAnimation
// (cartBadge.ts); both subscriptions coexist without interfering.
export function initCartToastStore(): void {
  if ((document as unknown as Record<string, unknown>)['_cartToastInit']) return;
  (document as unknown as Record<string, unknown>)['_cartToastInit'] = true;

  const totalQuantity = (): number =>
    window.Snipcart.store
      .getState()
      .cart.items.items.reduce((sum, item) => sum + item.quantity, 0);

  let lastTotal = totalQuantity();
  window.Snipcart.store.subscribe(() => {
    const total = totalQuantity();
    if (total > lastTotal) {
      // Show only when the pending item verifiably landed in the cart —
      // an increase alone isn't proof this click succeeded (the add could
      // have failed and the increase come from a drawer-side quantity
      // bump), so also require a line item matching the pending name.
      // Consume pending on every increase either way, so a stale record
      // from a failed add can never claim a later increase.
      if (
        pending &&
        Date.now() - pending.at < PENDING_MAX_AGE_MS &&
        window.Snipcart.store
          .getState()
          .cart.items.items.some((item) => item.name === pending!.name)
      ) {
        showToast(pending);
        if (lockedButton === pending.button) lockedButton.textContent = 'ADDED!';
      }
      pending = null;
    }
    lastTotal = total;
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
