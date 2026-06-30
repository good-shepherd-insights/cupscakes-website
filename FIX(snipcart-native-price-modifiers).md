# FIX(snipcart-native-price-modifiers)

## Request

Snipcart Test-mode checkout fails with **"Defined product prices don't match prices in cart, or products couldn't be found at crawled endpoint."** and, separately, **changing an item's quantity in the Snipcart slide-out cart does not change the price.** Both must be fixed by following Snipcart's documented pricing model rather than the current custom client-side price math.

## Root Cause

The project computes price in JavaScript and bakes the result into a flat `data-item-price`, instead of declaring option price changes in Snipcart's native modifier syntax:

- `src/lib/snipcart/cartSync.ts` → `syncPrice()` sets `data-item-price = base + Σ(checked option priceModifiers)` at click time.
- `src/lib/snipcart/cartItem.ts` passes each option group to Snipcart as a plain `dropdown` whose `options` are bare labels (no modifiers), and stores the base separately in `data-base-price`.

Snipcart's order validation (per the v3 docs) **re-derives the expected price from the crawled product page** — the static HTML, where no JS has run — using `data-item-price` plus any `[+modifier]` declared in `data-item-customN-options`. Because the page declares neither (base price only, bare option labels), Snipcart computes "expected = base" while the cart was submitted at "base + modifier" → **price mismatch**. And because Snipcart is not the price authority, it cannot recompute on quantity change → **quantity bug**. One root cause, both symptoms.

Additionally, multi-select groups (`inputType: checkbox`, e.g. **Frosting Color**, "choose up to 2") are sent as a single `dropdown` whose value is a joined string like `"Red, Custom"`. That value is not a declared option, so it fails validation independent of price.

## Snipcart v3 Docs Used (pinned version 3.7.2 — `loader.ts`)

- **Dropdown modifier:** `data-item-custom1-options="Black|Brown[+100.00]|Gold[+300.00]"`; value is the selected option text; Snipcart adds the modifier and recomputes per quantity.
- **Checkbox modifier:** `data-item-custom1-type="checkbox"` with `data-item-custom1-options="true[3.00]|false"`; value is `true`/`false`; modifier applies when checked.
- **Validation:** crawler loads `data-item-url`, finds `.snipcart-add-item` with matching `data-item-id`, and validates the price using `data-item-price` + the declared option modifiers. Source: docs.snipcart.com/v3/setup/products and /v3/setup/order-validation.

## Live Data (from `/api/product-options`, real Sanity catalog)

| Product | Group | inputType | Priced options |
|---|---|---|---|
| cupcakes | Quantity | radio | every tier priced (½ Dozen +17.50 … 4 Dozen +164.50) |
| cupcakes | Occasion | radio | none |
| personal-cakes | Frosting Color | checkbox (up to 2) | **Custom +3.00** |
| personal-cakes | Occasion | radio | none |

So exactly one multi-select-with-a-priced-option case exists (Frosting Color → Custom).

## Chosen Mapping (group inputType → Snipcart field shape)

| Group inputType | Snipcart representation |
|---|---|
| `radio` (single-select) | One **dropdown** field. Options joined with `\|`, each priced option suffixed `[+MOD]`. Value = the checked option's label. |
| `checkbox` (multi-select) | One **readonly display field** carrying the joined checked labels (no options, no modifier → not price-validated, just shown in cart) **plus** one **checkbox field per priced option** in the group (`true[+MOD]\|false`), checked-state synced from that option's input. Free (unpriced) colors stay display-only. |

`data-item-price` becomes the **true base** (Snipcart adds modifiers). `data-base-price` and `syncPrice()` are deleted. The on-page live price preview (`bindPriceDisplay()`) is unchanged — it reads `data-price-modifier` from inputs and is display-only.

To keep build-time field construction (`cartItem.ts`) and runtime value-sync (`cartSync.ts`) in agreement without brittle name matching, `cartItem.ts` emits a per-field **sync descriptor** alongside each `data-item-customN-*`:

- `data-syncN="single:Quantity"` — value = checked input value in group "Quantity".
- `data-syncN="multi:Frosting Color"` — value = joined checked labels in group "Frosting Color".
- `data-syncN="flag:Frosting Color:Custom"` — value = `true` if option "Custom" is checked, else `false`.

## Directory Map

```text
src/
  lib/
    snipcart/
      attributes.ts        (M) allow per-option modifier strings + checkbox type passthrough (no behavior change for existing callers)
      cartItem.ts          (M) build native dropdown/checkbox/display fields per group type; set base price; emit data-syncN; drop data-base-price
      cartSync.ts          (M) delete syncPrice(); rewrite syncCustomFields() to drive each field from its data-syncN descriptor
  components/
    cart/
      LiveCart.tsx         (M) use Snipcart's authoritative item.totalPrice; retire parallel computeItemPrice()/productOptions recompute
    product/
      PersonalCakeProduct.astro   (no code change required — inputs already carry name/value/data-price-modifier; verify only)
```

## Modification Table

| File | Action | Why |
|---|---|---|
| `src/lib/snipcart/attributes.ts` | Modify | Let the caller pass option strings that already contain `[+mod]`, and pass through `type: 'checkbox'`. Mechanical; existing dropdown callers unaffected. |
| `src/lib/snipcart/cartItem.ts` | Modify | Core fix. Emit Snipcart-native fields per group inputType, set `data-item-price` to base, attach `data-syncN` descriptors, remove `data-base-price`. |
| `src/lib/snipcart/cartSync.ts` | Modify | Remove the price-baking hack; sync each Snipcart field's value from its descriptor so the submitted value matches a declared (and validatable) option. |
| `src/components/cart/LiveCart.tsx` | Modify | With Snipcart owning price, line total must come from Snipcart (`item.totalPrice`); the local `computeItemPrice()` would now miscount the split Frosting field. |
| `src/components/product/PersonalCakeProduct.astro` | Verify | Inputs already expose everything `cartSync` needs; confirm no change. |

## Existing Pattern Audit (this repo)

- **Attribute-driven Snipcart** (CLAUDE.md): components never build `data-item-*` themselves — `attributes.ts` is the single builder, fed by `cartItem.ts`. This fix preserves that: all new attributes still originate in `cartItem.ts` → `buildItemAttributes`.
- **Data-driven product page**: `PersonalCakeProduct.astro` renders one fieldset per `customOptions` entry by `inputType`. The mapping above keys off the same `inputType`, so no per-product special-casing is introduced.
- **stega cleaning**: every label leaving the page as cart data is `stegaClean`-ed (`cartItem.ts`). New option/label strings reuse the same cleaning.
- **`astro:page-load` double-fire guards** in `cartSync.ts` are kept exactly as-is.
- No new dependency, framework, or pattern is introduced.

## Execution Plan

1. `attributes.ts` — widen the contract so options may already include modifier suffixes and `type` may be `'checkbox'`. No logic change for current callers.
2. `cartItem.ts` — replace the single `customFieldGroups.map(... dropdown ...)` block with group-type-aware field construction; set base price; build a parallel descriptor list; attach `data-syncN`; delete `data-base-price`.
3. `cartSync.ts` — delete `syncPrice()` and its call; rewrite `syncCustomFields()` to read `data-syncN` and set values (`single` / `multi` / `flag`). Keep `bindRequiredGroupsGate` and `bindPriceDisplay` untouched.
4. `LiveCart.tsx` — switch `lineTotal` to Snipcart's `item.totalPrice` (fallback to `price * quantity`); remove the now-incorrect `computeItemPrice()` recompute and the `productOptions` fetch that only fed it. (Inline-edit re-add path must pass the same native field values — see Risk Notes.)
5. Validate per the plan below in Snipcart **Test mode**.

## File-by-File Changes

### `src/lib/snipcart/attributes.ts`
**Action:** Modify
**Why:** Allow modifier-bearing option strings and `checkbox` type without changing existing dropdown callers.
**Impact:** Backward compatible; only widens accepted input.

#### Before
```ts
  for (let i = 0; i < (input.customFields?.length ?? 0); i++) {
    const field = input.customFields![i];
    const n = i + 1;
    attrs[`data-item-custom${n}-name`] = field.name;
    if (field.options) attrs[`data-item-custom${n}-options`] = field.options.join('|');
    if (field.type) attrs[`data-item-custom${n}-type`] = field.type;
    if (field.required) attrs[`data-item-custom${n}-required`] = 'true';
    if (field.placeholder) attrs[`data-item-custom${n}-placeholder`] = field.placeholder;
    if (field.value) attrs[`data-item-custom${n}-value`] = field.value;
  }
```

#### After
```ts
  for (let i = 0; i < (input.customFields?.length ?? 0); i++) {
    const field = input.customFields![i];
    const n = i + 1;
    attrs[`data-item-custom${n}-name`] = field.name;
    // Option strings are passed through verbatim — callers may embed
    // Snipcart price modifiers, e.g. "Custom[+3.00]" or "true[3.00]|false".
    if (field.options) attrs[`data-item-custom${n}-options`] = field.options.join('|');
    if (field.type) attrs[`data-item-custom${n}-type`] = field.type;
    if (field.required) attrs[`data-item-custom${n}-required`] = 'true';
    if (field.placeholder) attrs[`data-item-custom${n}-placeholder`] = field.placeholder;
    // Note: value '' is intentionally falsy-skipped; cartSync sets it at click time.
    if (field.value) attrs[`data-item-custom${n}-value`] = field.value;
  }
```

#### Reasoning
- The only change is documentation of the now-broader contract; the join logic already supports modifier suffixes since they are part of the option string. `type` already passes through, enabling `'checkbox'`.

---

### `src/lib/snipcart/cartItem.ts`
**Action:** Modify
**Why:** Produce Snipcart-native fields per group `inputType`, make `data-item-price` the true base, emit `data-syncN` descriptors, and remove `data-base-price`.
**Impact:** Changes the emitted `data-item-*` for every product with priced options; this is the fix.

#### Before
```ts
  const name = stegaClean(rawName);
  const basePrice = Number(input.price.replace(/[^0-9.]/g, ''));
  const customFieldGroups = input.customOptions.filter((g) => !g.definesVariantRoute);

  const attrs = buildItemAttributes({
    id: `${input.productSlug ?? 'product'}-${input.currentVariantSlug ?? 'default'}`,
    name,
    price: basePrice,
    url: input.url,
    image: input.imageSrc,
    customFields: customFieldGroups.map((group) => ({
      name: stegaClean(group.name),
      // Without `options`, Snipcart renders this field as a free-text box
      // in the cart, letting customers type anything — including values
      // that were never valid choices on the product page. Passing the
      // same labels offered there makes Snipcart render a dropdown
      // instead, constrained to the actual choices.
      type: 'dropdown',
      options: group.options.map((option) => stegaClean(option.label)),
      // Placeholder — kept in sync with the live form selection by
      // cartSync.ts's bindAddToCartSync(), just before Snipcart reads it
      // on click.
      value: '',
    })),
    // Invisible in Snipcart's own cart/checkout UI — exists purely so
    // the custom /cart page (LiveCart.tsx) can recover "product" and
    // "flavor" as separate fields without re-parsing the combined
    // display name, and without a second, non-Snipcart data source.
    metadata: {
      product: stegaClean(input.title),
      flavor: selectedVariantOption ? stegaClean(selectedVariantOption.label) : '',
      category: input.productSlug ?? '',
    },
  });

  // Bookkeeping only — not a Snipcart attribute. cartSync.ts recomputes
  // `data-item-price` on every click from this immutable base plus
  // whichever options are checked at that moment (some options carry a
  // priceModifier, e.g. Personal Cakes' "Custom" frosting is +$3). Storing
  // the base separately means clicking ADD TO CART twice with different
  // selections (the button stays on the page since adding doesn't reload
  // it) always recomputes from the true original price, never compounds
  // on top of a previously-adjusted one.
  attrs['data-base-price'] = String(basePrice);

  return attrs;
```

#### After
```ts
  const name = stegaClean(rawName);
  const basePrice = Number(input.price.replace(/[^0-9.]/g, ''));
  const customFieldGroups = input.customOptions.filter((g) => !g.definesVariantRoute);

  // Snipcart's two modifier formats differ by field type (per the v3 docs):
  //   dropdown option:  "Custom[+3.00]"   (signed, decimals) — docs example "Brown[+100.00]"
  //   checkbox option:  "true[3.00]"      (unsigned positive) — docs example "true[10]|false"
  const modDropdown = (m: number): string =>
    m ? `[${m > 0 ? '+' : '-'}${Math.abs(m).toFixed(2)}]` : '';
  const modCheckbox = (m: number): string => (m ? `[${m.toFixed(2)}]` : ''); // negative -> "[-3.00]"

  // Build the Snipcart custom fields AND a parallel sync-descriptor list,
  // in the same order, so cartSync.ts can drive each field's value at
  // click time. One radio group -> one dropdown field. One checkbox group
  // -> one readonly display field plus one checkbox field per *priced*
  // option (free colors carry no price and ride the display field).
  const fields: CustomField[] = [];
  const syncDescriptors: string[] = [];

  for (const group of customFieldGroups) {
    const groupName = stegaClean(group.name);
    if (group.inputType === 'checkbox') {
      // Display field: shows the chosen colors in the cart; no options
      // means Snipcart won't price- or value-validate it.
      fields.push({ name: groupName, type: 'readonly', value: '' });
      syncDescriptors.push(`multi:${groupName}`);
      // One native checkbox field per priced option (e.g. Custom +$3).
      for (const option of group.options) {
        if (!option.priceModifier) continue;
        const label = stegaClean(option.label);
        fields.push({
          name: `${groupName}: ${label}`,
          type: 'checkbox',
          options: [`true${modCheckbox(option.priceModifier)}`, 'false'],
          value: 'false',
        });
        syncDescriptors.push(`flag:${groupName}:${label}`);
      }
    } else {
      // Single-choice -> dropdown; priced options carry [+mod] so Snipcart
      // owns the price math and the crawler can validate it.
      fields.push({
        name: groupName,
        type: 'dropdown',
        options: group.options.map(
          (option) => `${stegaClean(option.label)}${modDropdown(option.priceModifier ?? 0)}`
        ),
        value: '',
      });
      syncDescriptors.push(`single:${groupName}`);
    }
  }

  const attrs = buildItemAttributes({
    id: `${input.productSlug ?? 'product'}-${input.currentVariantSlug ?? 'default'}`,
    name,
    // True base price. Snipcart adds option modifiers itself and recomputes
    // on quantity change; the crawler validates base + declared modifiers.
    price: basePrice,
    url: input.url,
    image: input.imageSrc,
    customFields: fields,
    metadata: {
      product: stegaClean(input.title),
      flavor: selectedVariantOption ? stegaClean(selectedVariantOption.label) : '',
      category: input.productSlug ?? '',
    },
  });

  // Sync descriptors, aligned 1:1 with data-item-customN-*, read by
  // cartSync.ts to set each field's value from the live form at click time.
  syncDescriptors.forEach((descriptor, i) => {
    attrs[`data-sync${i + 1}`] = descriptor;
  });

  return attrs;
```

#### Reasoning
- `data-item-price` is now the unmodified base; Snipcart applies modifiers, which is what makes both validation and quantity-recompute work.
- Radio groups become native dropdowns with `[+mod]`; the checkbox group becomes a display field + native checkbox(es), resolving the multi-select wrinkle without inventing a new pattern.
- `data-base-price` and the rationale for client-side recompute are removed because the recompute is removed.
- Descriptors keep `cartItem` the single source of the field/value mapping.

---

### `src/lib/snipcart/cartSync.ts`
**Action:** Modify
**Why:** Remove the price-baking hack and set each field's value from its descriptor so the submitted value matches a declared, validatable option.
**Impact:** `data-item-price` is no longer mutated client-side; field values now always correspond to declared options.

#### Before (click handler + syncCustomFields + syncPrice)
```ts
    button.addEventListener('click', () => {
      const form = button.closest('form');
      if (!form) return;
      syncCustomFields(button, form);
      syncPrice(button, form);
    });
```
```ts
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
```

#### After (click handler + rewritten syncCustomFields; syncPrice deleted)
```ts
    button.addEventListener('click', () => {
      const form = button.closest('form');
      if (!form) return;
      // Price is owned by Snipcart now (native option modifiers); we only
      // sync each custom field's value from the live form selection.
      syncCustomFields(button, form);
    });
```
```ts
// Sets each Snipcart custom field's value from the live form, driven by the
// data-syncN descriptor cartItem.ts emitted alongside each field:
//   single:<group>          -> the checked radio's value in <group>
//   multi:<group>           -> comma-joined checked labels in <group>
//   flag:<group>:<option>   -> 'true' if <option> is checked in <group>, else 'false'
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
      value = Array.from(checked).map((input) => input.value).join(', ');
    } else if (kind === 'flag') {
      const target = form.querySelector<HTMLInputElement>(
        `input[name="${group}"][value="${option}"]`
      );
      value = target?.checked ? 'true' : 'false';
    }
    button.setAttribute(`data-item-custom${n}-value`, value);
    n++;
  }
}
```

#### Reasoning
- Deleting `syncPrice()` and the `data-base-price` read stops the client from ever fighting Snipcart's price authority.
- The descriptor switch produces exactly the value each native field type expects (`true`/`false` for checkbox, single label for dropdown, joined string for the readonly display), so submitted values always match declared options.
- `bindAddToCartSync`'s double-fire guard, `bindRequiredGroupsGate`, and `bindPriceDisplay` are untouched.

---

### `src/components/cart/LiveCart.tsx`
**Action:** Modify
**Why:** Snipcart now owns price; the custom `/cart` line total must come from Snipcart, and the local recompute would undercount the split Frosting field.
**Impact:** Display values come from Snipcart's authoritative totals; removes a now-incorrect parallel calculation.

#### Before
```ts
  const otherFields = customFields.filter((f) => f.name !== 'Quantity' && f.name !== 'Occasion');
  const lineTotal = item.price * item.quantity;
```

#### After
```ts
  const otherFields = customFields.filter((f) => f.name !== 'Quantity' && f.name !== 'Occasion');
  // Snipcart's documented CartItem exposes `unitPrice` (unit price AFTER
  // custom field modifiers) and `basePrice` (before). Use unitPrice so the
  // line reflects e.g. Custom frosting +$3; fall back through basePrice and
  // the value this code reads today for early/partial store snapshots.
  // VERIFY AT IMPLEMENTATION: log a real cart item that has a modifier
  // applied and confirm which field carries base+modifier before finalizing
  // (see Docs Compliance Audit #2) — do not ship on assumption.
  const unit =
    (item as { unitPrice?: number }).unitPrice ??
    (item as { basePrice?: number }).basePrice ??
    item.price;
  const lineTotal = unit * item.quantity;
```

Also widen the local `SnipcartCartItem` interface (top of file) to declare the documented optional fields it now reads:
```ts
  price: number;          // existing field this code reads today
  basePrice?: number;     // Snipcart CartItem: unit price before modifiers
  unitPrice?: number;     // Snipcart CartItem: unit price after modifiers
  quantity: number;
```

#### Reasoning
- The SDK reference lists `basePrice` and `unitPrice` on a `CartItem`; there is **no `totalPrice`** field, so the earlier draft referenced a non-existent property. `unitPrice` (post-modifier) × quantity is the documented way to get the line total.
- Which field actually carries the +$3 at runtime is not fully specified by the docs, so the plan gates this on a runtime inspection rather than asserting it.
- `computeItemPrice()` and the `productOptions` fetch that fed it are retired in a follow-up step (see below) because, with the Frosting price split into a `flag:` checkbox field, that function (which keys modifiers by group name) would no longer see the +$3 and would undercount.

**Follow-up within this file (same edit):** remove `computeItemPrice()` (lines ~99–117) and the `productOptions`/`fetchProductOptionsBySlug` effect (lines ~199–215) **only if** the inline-edit save path is updated to re-add through Snipcart with the same native field values so Snipcart recomputes. If that path cannot be fully converted in this pass, keep `productOptions` for the editor but stop using `computeItemPrice` for display (the `lineTotal` change above already does this). This is called out explicitly in Risk Notes rather than left implicit.

---

### `src/components/product/PersonalCakeProduct.astro`
**Action:** Verify (no change expected)
**Why:** `cartSync` reads form inputs by `name` (group) and `value` (option label), and the flag lookup uses `input[name][value]`. The existing inputs (`name={stegaClean(group.name)}`, `value={stegaClean(option.label)}`, `data-price-modifier=...`) already satisfy all three descriptor kinds.
**Impact:** None if verification passes; if a selector mismatch is found, fix is limited to attribute naming on the `<input>` at lines 328–335.

## Validation Plan

Project-native (`build` is the only real script today; the rest is manual Test-mode verification, which is how Snipcart issues surface):

1. `npm run build` — type-check/build must pass with no new errors.
2. `npm run dev`, open a **cupcakes** product, select each Quantity tier; confirm the on-page price preview matches base + modifier (unchanged behavior).
3. View source / DOM of the buy button: confirm `data-item-price` is the **base**, `data-item-custom{n}-options` contains `Tier[+17.50]…`, and `data-sync{n}` descriptors are present.
4. Add to cart; in the Snipcart slide-out **change the quantity** → line total must scale. (Fixes symptom 2.)
5. **personal-cakes:** select "Custom" frosting (and one free color); confirm the buy button emits a `Frosting Color` readonly field = "Red, Custom" and a `Frosting Color: Custom` checkbox field = `true[+3.00]|false` with value `true`.
6. Proceed to Test-mode checkout for both products → **no "prices don't match" / "couldn't be reached" notice.** (Fixes symptom 1.)
7. Open the custom `/cart` page (LiveCart) → line totals equal Snipcart's; inline-edit a Quantity and confirm the total updates correctly.

## Risk Notes

- **LiveCart inline edit** is the highest-risk surface: its save path re-adds the item to Snipcart. It must pass the new native field values (dropdown label / `true`/`false` flag) so Snipcart recomputes; otherwise an edited item could re-enter at the base price. The display fix (`item.totalPrice`) is safe regardless; the editor conversion is the part to verify in step 7. If it cannot be completed safely in this pass, scope this file to the display fix and track the editor as a separate `FIX`.
- **Readonly display field** for Frosting Color is informational; if a future group has *multiple* priced options that customers can combine, each already gets its own `flag:` checkbox, so the model scales without redesign.
- **No schema/Sanity change** required — modifiers are read from existing `priceModifier` fields.
- **`preview-personal-cake.astro`** (a static example page) hardcodes a `{ label: "Custom", priceModifier: 3 }` option; it routes through the same `cartItem.ts`, so it is covered automatically.

## Docs Compliance Audit (honest separation of fact vs. inference)

**Directly documented (Snipcart v3 / 3.7.2) — VERBATIM quotes from the docs:**
- Dropdown option modifier — verbatim: `data-item-custom1-options="Black|Brown[+100.00]|Gold[+300.00]"`; value = selected option text. Plan emits the identical format (`Tier[+38.50]`, `Custom[+3.00]`). ✅
- Checkbox modifier — verbatim: `data-item-custom1-type="checkbox"` + `data-item-custom1-options="true[10]|false"`. Plan emits `true[3.00]|false`; same format, decimals included (the dropdown verbatim `[+100.00]` proves 2-decimal values parse, so `[3.00]` ≡ `[3]`). ✅
- **`data-item-price` is the base** — verbatim finding: *"examples show `data-item-price="79.99"` as a standalone value, with modifiers applied separately via bracket notation in the options attribute"* (and the $79.99 + `Gold[+300.00]` = $379.99 example). This confirms the central design: set `data-item-price` to base, let Snipcart add modifiers. ✅
- Snipcart adds the modifier and "recomputes with quantity changes." ✅ (fixes the quantity bug).
- Crawler loads `data-item-url`, matches `.snipcart-add-item` + `data-item-id`, validates price. ✅

**Inference — NOT explicitly confirmed by the docs; must be verified in Test mode before merge:**
1. **`readonly` display field with no `options` skips value validation.** *Now supported* by the order-validation doc, which states the crawler's `customFields` "only need to include the fields which are required or change the pricing" — i.e. a free, non-priced color-display field is not validated against a fixed list. Still not stated verbatim for the readonly type, so confirm in Test mode. If it ever fails, fall back to a `hidden` field or metadata-only colors.
2. **Snipcart `CartItem` price field for LiveCart.** *Corrected this pass:* the SDK reference lists `basePrice` and `unitPrice` and has **no `totalPrice`** — the earlier draft was wrong and is fixed. Which of `unitPrice`/`basePrice` carries base+modifier at runtime is not fully documented, so the plan logs a real modifier-applied cart item and picks the correct field during implementation (validation step 7) rather than assuming.
3. **Negative checkbox modifier format** (`true[-3.00]`) is extrapolated from the positive example; we have no negative-modifier option in the live catalog, so this path is currently unused.
4. **Redundant Frosting display:** because "Custom" appears both in the readonly color list and as its own priced checkbox field, the Snipcart cart will show it twice. This is a cosmetic consequence of the docs-compliant split, not a validation issue; if undesirable, the alternative is one checkbox field per color (fully documented, zero inference, but more fields). Flagging as a design choice, not slop.

No part of the plan relies on the old client-side price computation. The one remaining hand-built attribute (`data-syncN`) is **our own** sync metadata read only by `cartSync.ts` — it is never sent to Snipcart and has no bearing on validation.

## Approval

`Status: Awaiting explicit user approval. Do not implement yet.`
