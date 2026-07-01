interface SnipcartCartState {
  cart: {
    items: {
      count: number;
    };
  };
}

interface SnipcartInstance {
  store: {
    subscribe(listener: (state: SnipcartCartState) => void): void;
  };
}

declare global {
  interface Window {
    Snipcart: SnipcartInstance;
  }
}

let itemCount = 0;

export function initCartBadgeStore(): void {
  window.Snipcart.store.subscribe((state) => {
    itemCount = state.cart.items.count;
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
