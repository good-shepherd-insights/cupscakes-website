# Quickstart: Validate the Add-to-Cart Double-Add Fix

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

This is the runnable validation this project has instead of an automated
test suite (Constitution Principle V — `test`/`lint` are not real npm
scripts yet, so verification here is explicit and manual/scripted, not
implied by a green CI check). Re-run this after implementing the fix; it
must pass both scenarios before the fix is considered done.

## Prerequisites

- Node 24, this repo's `.env` populated with real
  `PUBLIC_SANITY_PROJECT_ID` / `PUBLIC_SANITY_DATASET` /
  `PUBLIC_SNIPCART_API_KEY` (already present in this repo's `.env`).
- Playwright's Chromium browser available. If not already installed:
  ```bash
  npx --yes playwright install chromium --with-deps
  ```
  (Playwright itself is not a project dependency — install it in a scratch
  directory outside the repo, e.g. `/tmp/pw-verify`, with
  `npm init -y && npm install playwright`, so it never touches
  `package.json`.)

## Setup

```bash
cd /Users/dev/Projects/cupscakes-website
npm run dev &            # starts Astro dev server on :4321
```

Wait for `astro v6.3.6 ready` in the output before proceeding.

## Scenario A — fresh page load (must already pass; guards against regressing this path)

Navigate directly to a product page (not via an in-app link), click "Add to
Cart" once, and assert:

- Exactly one `POST https://app.snipcart.com/api/cart/{id}/items` request
  fires.
- `window.Snipcart.store.getState().cart.items.items` contains exactly one
  entry for that product with `quantity: 1`.

## Scenario B — in-app (ClientRouter) navigation, then single click (the bug)

Navigate to `/products` (a hard load is fine here), click an in-app
product link (a real `<a>` click, not `page.goto`, so Astro's `ClientRouter`
handles it as a client-side transition), wait for the transition to
settle, then click "Add to Cart" **once**, and assert:

- Exactly **one** `POST .../items` request fires (previously: two, at the
  same millisecond, each creating a distinct `uniqueId` line item — see
  [research.md](./research.md) Finding 2).
- Exactly **one** `click` listener bound to `document` whose bind call
  stack includes `snipcart.js` exists after the navigation (previously:
  two — see research.md Finding 3). Check via:
  ```js
  // Run in-page after instrumenting addEventListener before navigation,
  // per the approach in research.md — or, simpler, check indirectly:
  // exactly one 'snipcart.ready' CustomEvent should have fired since the
  // last hard page load.
  ```
- Cart ends at `quantity: 1` for the newly-added product.

## Scenario C — regression guard for the already-fixed rapid-double-click case

Click "Add to Cart" twice in quick succession (<200ms apart) on the same
product. Assert the cart ends at `quantity: 1`, not 2 — this is the
existing, already-shipped `cartToast.ts` capture-phase guard (commit
`83ab38a`); the fix for this feature must not weaken it.

## Scenario D — deliberate repeated clicks (Spec User Story 2)

Click "Add to Cart" once, wait for the button's "ADDED!" lock to clear
(~3.5s, `BUTTON_LOCK_MS` in `cartToast.ts`), then click again. Assert the
cart ends at `quantity: 2` — confirms the fix does not over-correct into
swallowing genuine repeated adds.

## Teardown

```bash
kill %1   # stop the dev server, or: pkill -f "astro dev"
```
