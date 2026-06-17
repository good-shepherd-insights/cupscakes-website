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
 *
 * Also proactively kicks off Snipcart's own script load. Snipcart's
 * `loadStrategy: "on-user-interaction"` (site-wide default, see
 * Snipcart.astro) only treats focus/mouseover/touchmove/scroll/keydown as
 * "start loading" triggers — a plain `click` isn't one of them, and there's
 * a ~2.75s fallback timer otherwise. A customer whose very first
 * interaction with the page is clicking ADD TO CART can click before
 * Snipcart has loaded and attached its own handler, and that click is
 * lost — nothing happens. Calling the loader's exposed `LoadSnipcart()`
 * here starts loading the moment a page with a real add-to-cart button is
 * ready, well before any click can land, without forcing eager loading on
 * pages that never call this function.
 */
export function bindAddToCartSync(): void {
  (window as unknown as { LoadSnipcart?: () => void }).LoadSnipcart?.();

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
