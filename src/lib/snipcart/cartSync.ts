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
    // `astro:page-load` is documented to fire twice on the initial page
    // load with Astro's ClientRouter. Without this guard, a second call
    // against the same (still-attached) button stacks a second 'click'
    // listener and a second set of 'change' listeners (via
    // bindRequiredGroupsGate below), so every real click double-syncs
    // data-item-* attributes and double-processes the quantity gate.
    if (button.dataset.syncBound === 'true') return;
    button.dataset.syncBound = 'true';

    button.addEventListener('click', () => {
      const form = button.closest('form');
      if (!form) return;
      syncCustomFields(button, form);
      syncPrice(button, form);
    });
    bindRequiredGroupsGate(button);
  });
}

// Every single-choice (radio) group is required: PersonalCakeProduct.astro
// renders the button already `disabled` whenever any such group has no
// default-checked option (so there's no flash of an enabled button before
// this runs). This re-enables it once every radio group has a checked
// option, and disables it again if any selection is ever cleared. Checkbox
// groups (e.g. Frosting Color) stay optional — they're excluded because
// they aren't `input[type="radio"]`. Flavor is also excluded: it renders as
// `<a>` variant links, not form inputs, so it's always "selected" via route.
function bindRequiredGroupsGate(button: HTMLButtonElement): void {
  const form = button.closest('form');
  if (!form) return;
  const radioInputs = Array.from(form.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
  if (radioInputs.length === 0) return;
  const groupNames = Array.from(new Set(radioInputs.map((input) => input.name)));

  const updateDisabled = () => {
    button.disabled = groupNames.some(
      (name) => !form.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)
    );
  };
  radioInputs.forEach((input) => input.addEventListener('change', updateDisabled));
  updateDisabled();
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

/**
 * Keeps the on-page price display (the "$0.00" text below ADD TO CART)
 * in sync with the live form selection, same math as syncPrice() above
 * but updating on every change rather than just at add-to-cart click
 * time, so the customer sees the real total before they commit.
 */
export function bindPriceDisplay(): void {
  document.querySelectorAll<HTMLElement>('[data-price-display]').forEach((el) => {
    // Same double-fire guard as bindAddToCartSync above — astro:page-load
    // can fire twice on initial load, which would otherwise stack a
    // second 'change' listener per input.
    if (el.dataset.syncBound === 'true') return;
    el.dataset.syncBound = 'true';

    const form = el.closest('form');
    if (!form) return;
    const basePrice = Number(el.dataset.basePrice ?? '0');

    const update = () => {
      const checked = form.querySelectorAll<HTMLInputElement>('input:checked');
      const modifierTotal = Array.from(checked).reduce(
        (sum, input) => sum + Number(input.dataset.priceModifier ?? '0'),
        0
      );
      el.textContent = `$${(basePrice + modifierTotal).toFixed(2)}`;
    };

    form
      .querySelectorAll<HTMLInputElement>('input')
      .forEach((input) => input.addEventListener('change', update));
    update();
  });
}
