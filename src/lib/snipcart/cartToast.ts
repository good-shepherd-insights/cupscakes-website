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
