/**
 * Keeps a "snipcart-add-item" button's data-item-* attributes in sync
 * with the live state of its enclosing form, read at click time — just
 * before Snipcart's own delegated click handler reads the same
 * attributes. A listener bound directly on the button always runs before
 * any ancestor/document-level listener in the bubble phase, regardless of
 * registration order, so this needs no capture-phase trickery to win the
 * race against Snipcart's own handler.
 *
 * What gets synced: the custom field values (data-item-customN-value),
 * from whichever inputs are currently checked, per the data-syncN
 * descriptor cartItem.ts emitted for each field. Price is NOT synced here
 * — option price modifiers are declared natively in each field's
 * data-item-customN-options (e.g. "Custom[+3.00]"), so Snipcart computes
 * and recomputes the price itself (including on quantity change), and its
 * crawler validates it against those same declared modifiers.
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
      // Snipcart v3 price-validation crawler requires a fully-qualified URL;
      // a relative path silently fails the add. Rewrite to absolute using the
      // page's actual origin so the crawler always reaches the right server
      // (dev or prod), regardless of what Astro.site is set to at build time.
      // data-item-url is always server-rendered against Astro.site (a fixed
      // production URL — see astro.config.mjs), so it's already absolute even
      // in dev; the origin must be force-replaced, not just filled in when
      // missing, or the crawler is sent to production while testing locally.
      const itemUrl = button.getAttribute('data-item-url');
      if (itemUrl) {
        const absoluteUrl = new URL(itemUrl, location.origin);
        absoluteUrl.protocol = location.protocol;
        absoluteUrl.host = location.host;
        button.setAttribute('data-item-url', absoluteUrl.href);
      }
      // Price is owned by Snipcart now (native option modifiers declared in
      // each field's data-item-customN-options); we only sync each field's
      // value from the live form selection.
      syncCustomFields(button, form);
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

// Sets each Snipcart custom field's value from the live form, driven by the
// data-syncN descriptor cartItem.ts emitted alongside each field:
//   single:<group>          -> the checked radio's value in <group>
//   multi:<group>           -> comma-joined checked labels in <group>
//   flag:<group>:<option>   -> 'true' if <option> is checked in <group>, else 'false'
//   text:<group>            -> the live value of that group's message textarea
//     (see bindMessageFields() below), '' if absent
// Each produces exactly the value its native field type expects, so the
// submitted value always matches a declared (validatable) option.
function syncCustomFields(button: HTMLButtonElement, form: HTMLElement): void {
  let n = 1;
  while (button.hasAttribute(`data-item-custom${n}-name`)) {
    const descriptor = button.getAttribute(`data-sync${n}`) ?? '';
    const [kind, group, option] = descriptor.split(':');
    let value = '';
    if (kind === 'single') {
      const checked = form.querySelector<HTMLInputElement>(`input[name="${group}"]:checked`);
      value = checked?.value ?? '';
    } else if (kind === 'multi') {
      const checked = form.querySelectorAll<HTMLInputElement>(`input[name="${group}"]:checked`);
      value = Array.from(checked)
        .map((input) => input.value)
        .join(', ');
    } else if (kind === 'flag') {
      const target = form.querySelector<HTMLInputElement>(
        `input[name="${group}"][value="${option}"]`
      );
      value = target?.checked ? 'true' : 'false';
    } else if (kind === 'text') {
      const textarea = form.querySelector<HTMLTextAreaElement>(
        `textarea[data-message-for="${group}"]`
      );
      value = textarea?.value.trim() ?? '';
    }
    button.setAttribute(`data-item-custom${n}-value`, value);
    n++;
  }
}

// Which selections reveal a group's message textarea (see
// PersonalCakeProduct.astro's MESSAGE_FIELD_GROUPS, which renders the
// textarea markup, always initially `hidden` since every group's default
// selection is "safe" — Occasion defaults to Regular, Frosting Color and
// Quantity default to nothing/1 Dozen with no Custom checked). Matched by
// group name string, same convention as DEFAULT_OPTION_LABEL elsewhere.
//   occasion       -> any option other than "Regular"
//   frosting color -> "Custom" checked (alongside up to one other color)
//   quantity       -> "Custom" selected (once authored in Sanity)
const MESSAGE_TRIGGERS: Record<string, (checkedLabels: string[]) => boolean> = {
  occasion: (labels) => labels.some((label) => label !== 'Regular'),
  'frosting color': (labels) => labels.includes('Custom'),
  quantity: (labels) => labels.includes('Custom'),
};

// Reveals/hides each group's message textarea (rendered by
// PersonalCakeProduct.astro as `<textarea data-message-for="<group>">`
// inside a `[data-message-wrapper]` container) as that group's selection
// changes, and clears the textarea's value whenever it hides — so a
// customer can't leave stale text in a field they can no longer see, and
// syncCustomFields() above never sends a message for a group that isn't
// actually in its "needs a note" state.
export function bindMessageFields(): void {
  document.querySelectorAll<HTMLTextAreaElement>('textarea[data-message-for]').forEach((textarea) => {
    // Same double-fire guard as bindAddToCartSync/bindPriceDisplay above.
    if (textarea.dataset.syncBound === 'true') return;
    textarea.dataset.syncBound = 'true';

    const groupName = textarea.dataset.messageFor ?? '';
    const wrapper = textarea.closest<HTMLElement>('[data-message-wrapper]');
    const form = textarea.closest('form');
    const trigger = MESSAGE_TRIGGERS[groupName.trim().toLowerCase()];
    if (!wrapper || !form || !trigger) return;

    const groupInputs = Array.from(
      form.querySelectorAll<HTMLInputElement>(`input[name="${groupName}"]`)
    );

    const update = () => {
      const checkedLabels = groupInputs.filter((input) => input.checked).map((input) => input.value);
      const shouldShow = trigger(checkedLabels);
      wrapper.hidden = !shouldShow;
      if (!shouldShow) textarea.value = '';
    };

    groupInputs.forEach((input) => input.addEventListener('change', update));
    update();
  });
}

// Maximum checked options allowed per multi-select (checkbox) group.
// Matched by group name string, same convention as MESSAGE_TRIGGERS above —
// the "(please choose up to 2 colors)" helper copy is authored in Sanity,
// but the enforced cap lives here, so keep the two in agreement.
const SELECTION_CAPS: Record<string, number> = {
  'frosting color': 2,
};

// Enforces SELECTION_CAPS: once a capped checkbox group has its maximum
// number of options checked, every remaining unchecked box in the group is
// disabled (PersonalCakeProduct.astro dims them via has-disabled: label
// variants) until one is unchecked again. Checked boxes are never disabled,
// so the customer can always swap a selection by unchecking first.
export function bindSelectionCaps(): void {
  document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((input) => {
    // Same double-fire guard as bindAddToCartSync/bindPriceDisplay above.
    if (input.dataset.capBound === 'true') return;
    input.dataset.capBound = 'true';

    const cap = SELECTION_CAPS[input.name.trim().toLowerCase()];
    const form = input.closest('form');
    if (!cap || !form) return;

    const update = () => {
      const groupInputs = Array.from(
        form.querySelectorAll<HTMLInputElement>(`input[name="${input.name}"]`)
      );
      const atCap = groupInputs.filter((box) => box.checked).length >= cap;
      groupInputs.forEach((box) => {
        if (!box.checked) box.disabled = atCap;
      });
    };

    input.addEventListener('change', update);
    update();
  });
}

/**
 * Keeps the on-page price display (the "$0.00" text below ADD TO CART)
 * in sync with the live form selection (base price plus the
 * data-price-modifier of every checked input), updating on every change so
 * the customer sees the real total before they commit. This is a *display
 * only* preview computed from the page's own data attributes — Snipcart
 * computes the authoritative price from the native option modifiers.
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
