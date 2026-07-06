interface SnipcartCartState {
  cart: {
    items: {
      /** Number of distinct line items — NOT total quantity. Re-adding a
          product already in the cart bumps that line's quantity and
          leaves this unchanged, so add-detection must sum quantities
          instead (see initCartShakeAnimation and cartToast.ts). */
      count: number;
      /** Line items currently in the cart (Snipcart v3 SDK store shape). */
      items: { name: string; quantity: number }[];
    };
  };
}

interface SnipcartInstance {
  store: {
    subscribe(listener: () => void): void;
    getState(): SnipcartCartState;
  };
}

declare global {
  interface Window {
    Snipcart: SnipcartInstance;
  }
}

let itemCount = 0;

export function initCartBadgeStore(): void {
  window.Snipcart.store.subscribe(() => {
    itemCount = window.Snipcart.store.getState().cart.items.count;
    applyCartBadge();
  });
}

export function applyCartBadge(): void {
  document.querySelectorAll<HTMLElement>('.cart-container').forEach((container) => {
    const badge = container.querySelector<HTMLElement>('.snipcart-items-count');
    const cartLink = container.querySelector<HTMLAnchorElement>('.cart-link');
    if (!badge || !cartLink) return;

    const empty = itemCount === 0;
    badge.hidden = empty;
    badge.setAttribute('aria-hidden', String(empty));
    cartLink.setAttribute(
      'aria-label',
      empty ? 'Shopping cart' : `Shopping cart (${itemCount} item${itemCount === 1 ? '' : 's'})`
    );
  });
}

export function initCartShakeAnimation(): void {
  if ((document as unknown as Record<string, unknown>)['_cartShakeInit']) return;
  (document as unknown as Record<string, unknown>)['_cartShakeInit'] = true;

  // Driven by the store, not the 'snipcart.item.added' DOM event: this
  // Snipcart build never dispatches that event on `document` (confirmed by
  // injecting a listener before Snipcart loads and adding an item — it
  // never fires), so anything waiting on it silently never runs. The cart
  // badge already reacts correctly via store.subscribe(), so shaking
  // reuses that same proven-working signal. Total quantity, not
  // items.count: count only counts distinct line items, so re-adding a
  // product already in the cart (quantity bump, count unchanged) would
  // never shake on a count-based signal.
  const totalQuantity = (): number =>
    window.Snipcart.store
      .getState()
      .cart.items.items.reduce((sum, item) => sum + item.quantity, 0);

  let lastCount = totalQuantity();
  window.Snipcart.store.subscribe(() => {
    const count = totalQuantity();
    if (count > lastCount) {
      document.querySelectorAll<HTMLElement>('.cart-link').forEach((el) => {
        el.classList.remove('cart-shake');
        void el.offsetWidth; // force reflow so animation restarts if triggered twice quickly
        el.classList.add('cart-shake');
        el.addEventListener('animationend', () => el.classList.remove('cart-shake'), { once: true });
      });
    }
    lastCount = count;
  });
}
