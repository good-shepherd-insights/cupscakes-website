# Research: Fix Add-to-Cart Double-Add

**Feature**: [spec.md](./spec.md) | **Date**: 2026-07-14

This bug had no `NEEDS CLARIFICATION` markers in the spec's Technical Context
(there is no Technical Context section for a bug fix — this research instead
resolves the one real unknown: *why* the duplicate add happens, established
through live reproduction rather than static code reading, per this
project's evidence-first conventions).

## Investigation method

Static reading of `src/lib/snipcart/cartSync.ts` and `cartToast.ts` was not
sufficient: both already contain deliberate idempotency guards
(`dataset.syncBound`, `_cartToastClickBound`) written for two *previously
fixed* double-add incidents (commits `cc5e781` and `83ab38a`, both already on
`main`). A third, still-live occurrence needed to be reproduced, not
inferred.

Reproduced live using Playwright (headless Chromium) driving the real dev
server (`npm run dev`) against the project's real Sanity/Snipcart
credentials from `.env`, with `window.fetch` / `XMLHttpRequest.send` /
`EventTarget.prototype.addEventListener` monkey-patched to log call stacks
and timestamps. Scripts and full output are preserved for reference; the
validation sequence is captured in [quickstart.md](./quickstart.md).

## Finding 1: The bug requires an in-app (ClientRouter) navigation — a fresh page load does not reproduce it

- **Fresh full page load** of a product page → one click on "Add to Cart" →
  exactly **one** `POST https://app.snipcart.com/api/cart/{id}/items`
  request, cart ends at quantity 1. No bug.
- **In-app navigation** (clicking a product link, which Astro's
  `ClientRouter` handles as a client-side transition, not a hard reload) to
  a product page → one click on "Add to Cart" → **two** identical `POST
  .../items` requests fire at the same millisecond, each creating a
  server-side line item with a distinct `uniqueId` for the same product.
  This matches the spec's User Story 1, Acceptance Scenario 3 exactly.

## Finding 2: Both requests originate entirely inside Snipcart's own vendor bundle — not this repo's code

Capturing `new Error().stack` at the `XMLHttpRequest.send` call site for
both duplicate requests showed both call stacks bottoming out at
`callAPI` → `post` → `fetch` entirely within
`https://cdn.snipcart.com/themes/v3.7.2/default/snipcart.js`. Neither stack
contains any first-party file. `cartSync.ts` and `cartToast.ts` are not
involved in triggering either request — they only sync attribute values
before Snipcart's own handler reads them.

## Finding 3: Snipcart's SDK binds a second `document`-level delegated click listener after the in-app navigation

Instrumenting `EventTarget.prototype.addEventListener` to log every
`click` listener bound to `document`, filtered to stacks containing
`snipcart.js`:

- After a fresh load: **1** such listener (from `snipcart.js`'s SDK
  constructor — confirmed in the downloaded bundle:
  `this.document.addEventListener("click", this.documentClickEventListener)`,
  where `documentClickEventListener` dispatches through
  `clickListenersMap["snipcart-add-item"]` to the actual add-to-cart call).
- After one in-app navigation: **2** such listeners — the first is never
  removed, and a second, functionally identical one is added. A single
  click event now bubbles through both, so Snipcart processes the add
  twice. This was also confirmed by watching for the `snipcart.ready`
  `CustomEvent` (which Snipcart's bundle dispatches once per SDK
  construction): it fires twice around the same navigation, meaning a whole
  second SDK instance is constructed, not just a second listener.

## Finding 4: This project's explicit `LoadSnipcart()` call is not the trigger

`cartSync.ts`'s `bindAddToCartSync()` calls `window.LoadSnipcart?.()` on
every `astro:page-load`, and it was reasonable to suspect this was
re-entering Snipcart's loader. Instrumenting `window.LoadSnipcart` to log
every call, ordered against the click-listener-bind events, showed **both**
duplicate binds and both `snipcart.ready` dispatches happening on a page
load that never calls `LoadSnipcart()` at all (`/products`, the listing
page, which has no `AddToCartButton` and no `bindAddToCartSync` call). The
duplication is produced by Snipcart's own native
`loadStrategy: "on-user-interaction"` auto-load mechanism (five separate
`document` interaction listeners — `focus`, `mouseover`, `touchmove`,
`scroll`, `keydown` — plus a fallback `setTimeout`, any of which calls the
loader's `LoadSnipcart`/`o()` function; see `src/lib/snipcart/loader.ts`),
not by this repository's own explicit call.

## Finding 5: Root cause is bounded but not fully attributable past the vendor boundary

The loader's own re-entrancy guard (`if(c)return;c=!0;`, checked
synchronously as the first statement of `o()`) is sound against being
*called* twice — but is a closure-local flag. Deeper static inspection of
the 1.1MB minified bundle (searching for `MutationObserver`,
`popstate`/`pushState` usage, and the `documentClickEventListener` /
`initialize` call sites) did not surface a single, provable trigger for the
second SDK construction within the effort proportionate to a bug-fix
research phase — the `popstate`/`pushState` hits in the bundle turned out to
belong to Snipcart's own internal Vue Router (used for the cart drawer's
checkout-step navigation), a false lead. Going further would mean fully
deobfuscating proprietary vendor code, which Constitution Principle III
(Third-Party Integration Fidelity) already puts out of scope — the fix must
live in how this project drives Snipcart's public, documented loading
surface, not inside `snipcart.js`.

## Decision

**Primary direction for Phase 1 / implementation**: stop relying on
Snipcart's native multi-trigger `"on-user-interaction"` auto-load path,
which Finding 4 showed is sufficient by itself (with no help from this
repo's code) to produce the duplicate SDK construction after a ClientRouter
navigation. Move to `loadStrategy: "manual"` (an existing, documented
`SnipcartLoaderConfig` option already supported by `loader.ts`) and trigger
`LoadSnipcart()` from exactly one first-party call site, guarded by a
`window`-scoped flag (not a per-button `dataset` flag, since the guard must
survive across every navigation for the lifetime of the page, not just per
button) so it can only ever run once per page session regardless of how
many times `astro:page-load` fires or how many pages the user visits
in-app.

This must not silently break sitewide cart-badge/drawer access on pages
that have no `AddToCartButton` (e.g. the homepage) — today,
`on-user-interaction`'s generic listeners guarantee Snipcart eventually
loads on *any* page the customer lingers on. The single guarded trigger
must therefore be installed at a layout-wide level (near where `Snipcart`
and `ClientRouter` are already wired in `src/layouts/Layout.astro`), not
scoped to product pages only.

**Rationale**: This is the smallest change that removes a redundant,
uncontrolled trigger surface (five native event listeners plus a timer, all
capable of independently invoking the loader) in favor of one first-party
call this project can guard idempotently — without touching vendor code
(Principle III) and without weakening the specific rapid-double-click fix
already shipped in `cartToast.ts` (Principle I: that remains the single
source of truth for the "real double click" case; this fix addresses a
different failure mode — one click, vendor-side double SDK init — and is
orthogonal).

**Alternatives considered**:

- *Network-level de-duplication* (wrap `window.fetch`/`XMLHttpRequest` to
  detect and cancel a near-simultaneous duplicate POST to Snipcart's items
  endpoint). Rejected as primary approach: fragile (depends on payload
  comparison and timing windows), and treats the symptom rather than the
  redundant-trigger cause found in Finding 4. Kept as a documented fallback
  if the load-strategy change does not fully eliminate the duplicate in
  implementation-time testing.
- *Capture-phase event-swallowing* (the same technique `cartToast.ts` uses
  for rapid double-clicks). Rejected: that technique swallows a second
  *click event*; this bug is one click event reaching two listeners already
  bound to the same target, so swallowing in capture phase would block the
  add entirely (0 items) rather than fix the count (1 item), since
  `stopImmediatePropagation` in capture phase precedes both of Snipcart's
  bubble-phase listeners.

**Validation requirement carried into tasks.md**: whichever approach is
implemented must be verified by re-running the reproduction sequence in
[quickstart.md](./quickstart.md) (fresh load and in-app-navigation paths,
both single- and double-click scenarios) and confirming exactly one
`POST .../items` request per click, per Constitution Principle V (no
claiming a fix works without honest, executable verification — this
codebase has no automated test runner yet, so this manual/scripted
reproduction is the real verification gate).

## Addendum (2026-07-15): the Decision above was implemented and its central assumption was falsified — corrected root cause found

The `loadStrategy: "manual"` change (Milestone A as originally planned) was
implemented and verified against quickstart.md Scenario B. **It did not fix
the bug**: `snipcart.ready` still fired twice on a single in-app
ClientRouter navigation, with zero clicks involved, and with `LoadSnipcart()`
now provably called exactly once (window-guarded). This falsifies Finding 4
and the Decision above — the native `on-user-interaction` listeners were
never the actual cause; removing them just happened to look plausible
because Milestone A's own diagnostic reproduction ran through the same
buggy `swapGuard.ts` machinery that turned out to be the real cause (below).

**The actual root cause**, found by controlled, isolated live-reproduction
testing (holding every other variable constant across each run, not
inferred): `src/lib/snipcart/swapGuard.ts`'s hand-rolled `astro:before-swap`
override — specifically the part that removes and re-appends (or
`moveBefore()`-relocates) Snipcart's own runtime-injected
`<script src="snipcart.js">` tag in `<head>` on every navigation, to protect
it from Astro's native head-element diff. Touching that live script tag at
all — by any DOM operation, including the supposedly-non-disconnecting
`moveBefore()` — makes Snipcart's vendor bundle construct a second internal
SDK instance and bind a second `document`-level add-to-cart click listener.
The `#snipcart` div's own handling (which the original file's header
comment, and this file's Decision above, both blamed) was never the cause:
six isolated variants were tested, varying only one thing at a time —
protecting/not protecting the script tag, protecting/not protecting the CSS
link, hand-rolled vs. Astro's native `swapBodyElement`, `remove()+appendChild()`
vs. `moveBefore()` — and the result tracked the script-tag handling in every
case, never the div's. The console warning "The #snipcart div was removed
from the document" fired identically in both the broken and the fixed
configurations, so it is not a reliable signal of the actual cause and
should not be used to diagnose this class of bug in the future.

**Corrected fix** (implemented, see `swapGuard.ts` and `Layout.astro`):
- `swapGuard.ts` no longer touches the `<script src="snipcart.js">` tag at
  all. Letting Astro's native head diff delete it after the first
  navigation is harmless: its work (constructing `window.Snipcart`, binding
  `document`'s click listener) has already happened, JS side effects don't
  undo when the originating `<script>` node is later removed from the DOM,
  and `window.LoadSnipcart`'s own re-entrancy guard (plus this project's
  `window.__snipcartLoadTriggered` guard in `Layout.astro`) prevents it
  from ever being recreated.
- `swapGuard.ts` still protects the CSS `<link rel="stylesheet"
  href="snipcart.css">` tag (remove+reappend) — unlike the script, removing
  that link immediately unloads the styles, a real visual regression, and
  protecting it does not trigger the double-SDK-construction bug (isolated
  and confirmed empirically as its own variant).
- `#snipcart`'s persistence across navigations is now handled by Astro's
  *native* `swapFunctions.swapBodyElement`, via a real `transition:persist`
  attribute set directly in `Layout.astro`'s markup, instead of the
  hand-rolled body-children diff loop the original `swapGuard.ts` used.
- The `loadStrategy="manual"` + single `window`-guarded trigger change from
  the original Decision is kept — it's still real, harmless cleanup
  (Constitution Principle I: one trigger site instead of Snipcart's five
  native listeners), it just wasn't sufficient on its own.

**Verification** (re-run in full against the corrected fix, using
Playwright with explicit wait-for-real-state instead of fixed timeouts,
after fixed-timeout races against Snipcart's real CDN load were found to be
producing false negatives in earlier ad hoc test runs):
- Scenario A (fresh load, single click): 1 request. No regression.
- Scenario B (in-app nav, single click — the bug): 1 request. Fixed.
- Scenario C (rapid clicks, 0ms/50ms/150ms gaps): 1 request each. Existing
  `cartToast.ts` guard unaffected (that file was not touched).
- Scenario D (deliberate separated clicks, 4000ms gap): 2 requests. No
  over-correction into a debounce.
- Sitewide cart access: `window.Snipcart` loads and `snipcart.css` is
  actually applied (not just present as a disconnected link) on the
  homepage, which has no `AddToCartButton`.
- `npm run build`: succeeds.
