# Whiteboard: Fix Add-to-Cart Double-Add

## 1. Status

Prepared — awaiting explicit approval.

## 2. Purpose / Big Picture

A single click on "Add to Cart" currently adds **two** identical line items
to the Snipcart cart instead of one, but only when the customer reached the
product page via an in-app (Astro `ClientRouter`) navigation rather than a
fresh page load. This silently doubles the customer's order quantity and
charge for that click. After this change, one click adds exactly one item
on every navigation path, while genuine repeated clicks still add one item
each (no new debounce is introduced).

Full spec: [`spec.md`](./spec.md). Full plan: [`plan.md`](./plan.md). Task
breakdown: [`tasks.md`](./tasks.md). Root-cause investigation:
[`research.md`](./research.md). Verification procedure:
[`quickstart.md`](./quickstart.md).

## 3. User Contract

Acceptance criteria (from `spec.md`):

1. A single "Add to Cart" click on a product page reached via a fresh page
   load adds exactly one unit (already true today — must not regress).
2. A single "Add to Cart" click on a product page reached via an in-app
   (`ClientRouter`) navigation adds exactly one unit (currently broken —
   adds two).
3. Two deliberate, separated clicks (waiting for the first to finish) add
   two units total, not one and not four — the fix must not introduce a
   debounce/lockout that swallows a genuine second click.
4. Two rapid clicks (<200ms apart) still add exactly one unit — the
   already-shipped `cartToast.ts` capture-phase guard (commit `83ab38a`)
   must not be weakened by this change.
5. The sitewide cart badge/drawer must remain reachable from every page,
   including pages with no `AddToCartButton` (e.g. the homepage) — the fix
   must not make Snipcart loading depend on a product page's own script.

Constraints:

- Constitution Principle III (Third-Party Integration Fidelity): the
  vendor file `src/lib/snipcart/loader.ts`'s IIFE string and the
  CDN-hosted `snipcart.js` must not be hand-edited.
- Constitution Principle I (Single Source of Truth): exactly one call site
  should trigger Snipcart's load going forward, not several redundant ones.
- No new dependency, no new test runner (this repo has none — see
  `plan.md` Technical Context).

Exclusions: no product-catalog, routing, or Sanity-schema changes. No
change to what fields sync onto a cart line item, only to how many times
the add fires per click.

Assumption carried from `plan.md`/`research.md`: the fix is a change in
*when/how* Snipcart's SDK is triggered to load, not a change to click
handling in `cartSync.ts`/`cartToast.ts` beyond removing the now-redundant
trigger call.

## 4. Acceptance Coverage

| Criterion | File(s) | Plan step | Validation |
|---|---|---|---|
| 1 (fresh load, already-working) | `src/layouts/Layout.astro`, `src/lib/snipcart/cartSync.ts` | Milestone A | quickstart.md Scenario A |
| 2 (in-app nav, the bug) | `src/layouts/Layout.astro`, `src/lib/snipcart/cartSync.ts` | Milestone A | quickstart.md Scenario B |
| 3 (deliberate repeats) | none (verification only) | Milestone B | quickstart.md Scenario D |
| 4 (rapid double-click regression) | none (verification only) | Milestone B | quickstart.md Scenario C |
| 5 (sitewide cart access) | `src/layouts/Layout.astro` | Milestone A | manual homepage check (tasks.md T011) |

## 5. Context and Orientation

- `src/components/snipcart/Snipcart.astro` renders Snipcart's official
  loader `<script>` (built by `src/lib/snipcart/loader.ts`'s
  `buildLoaderScript`) into `<head>`. It accepts a `loadStrategy` prop
  (`"on-user-interaction" | "manual"`, per `SnipcartLoaderConfig` in
  `loader.ts`) and is consumed exactly once, from `src/layouts/Layout.astro`
  line 41 (confirmed: `grep -rln "components/snipcart/Snipcart" src` finds
  only `Layout.astro`).
- The loader's IIFE (verbatim vendor code, must not change) exposes
  `window.LoadSnipcart` — calling it starts the actual Snipcart SDK load;
  it is internally idempotent against being *called* twice (`if(c)return;
  c=!0;`), but `research.md` Finding 4 proved live, via Playwright against
  the real dev server, that Snipcart's own native
  `loadStrategy: "on-user-interaction"` auto-load path (five separate
  `document` interaction listeners — focus/mouseover/touchmove/scroll/
  keydown — plus a fallback timer, all wired inside that same loader
  script) is independently sufficient to make Snipcart's vendor SDK
  construct a second internal instance and bind a second `document`-level
  add-to-cart click listener after one Astro `ClientRouter` navigation —
  with zero help from this repo's own code (reproduced on `/products`, a
  page that never calls `LoadSnipcart()` itself).
- `src/lib/snipcart/cartSync.ts`'s `bindAddToCartSync()` (exported,
  invoked from `src/components/product/PersonalCakeProduct.astro` via
  `document.addEventListener("astro:page-load", bindAddToCartSync)`)
  currently also calls `window.LoadSnipcart?.()` unconditionally on every
  `astro:page-load` (line 37) — this call is *not* the cause of the bug
  (per the same reproduction), but per Constitution Principle I it becomes
  a redundant second trigger site once `Layout.astro` owns the single
  trigger, so it should be removed for clarity, not left as unreachable
  dead insurance.
- `src/layouts/Layout.astro` already has a layout-wide, always-present
  `astro:page-load` listener (lines 67-71) used for `syncDraftToCart` —
  this is the natural, already-existing single call site for the
  replacement trigger, since it runs on every page (not just product
  pages), preserving criterion 5.

## 6. Directory Map and Modification Table

| File | Action | Reason |
|---|---|---|
| `src/layouts/Layout.astro` | Modify | Switch `<Snipcart>` to `loadStrategy="manual"`; add the one guarded `LoadSnipcart()` trigger, layout-wide |
| `src/lib/snipcart/cartSync.ts` | Modify | Remove the now-redundant `LoadSnipcart()` call and its doc-comment paragraph from `bindAddToCartSync()` |

No files created, deleted, or moved.

## 7. Pattern Audit and Evidence Ledger

| Decision | Repository or explicit-user evidence | Constraint learned | Reuse or deviation |
|---|---|---|---|
| Single trigger site lives in `Layout.astro`, not `cartSync.ts` | `grep` confirms `Snipcart.astro` has exactly one consumer (`Layout.astro:41`); `Layout.astro:67-71` already has a page-wide `astro:page-load` listener firing on every page | A product-page-scoped trigger (staying in `cartSync.ts`) would break cart-badge access on pages with no `AddToCartButton` — confirmed by reading `Navbar.astro`'s cart badge and `CartToast.astro`, both present via `Layout.astro` on every page, independent of product pages | Reuse: extend the existing listener rather than add a new one (Constitution Principle I) |
| Guard is `window`-scoped, not `dataset`-scoped | `cartSync.ts`'s existing `dataset.syncBound` guard is per-button and reset whenever a new button node appears (correct for its own purpose: re-binding a *click handler* per new button); the load-trigger instead needs to survive across every navigation for the *entire page session*, since there is no per-navigation "new load" desired at all | A `dataset` flag on a page-specific element would reset on every product-page visit, re-triggering the redundant-load-path race; `window` is the right scope because it persists for the JS realm's lifetime across all `ClientRouter` transitions | Deviation from `cartSync.ts`'s own established `dataset.syncBound` pattern, justified because the two guards protect different lifetimes (per-button vs. per-page-session) |
| Change `loadStrategy` at the `Layout.astro` call site, not `Snipcart.astro`'s default | `grep -rln "components/snipcart/Snipcart" src` → only `Layout.astro` | Since there is exactly one consumer, changing the default inside `Snipcart.astro` and passing an explicit prop at the one call site are behaviorally identical | Chose the explicit call-site prop: keeps `Snipcart.astro`'s own default meaning intact for any future second consumer, and keeps the change visible at the one place it takes effect, matching this repo's existing convention of explicit props over implicit component defaults (e.g. `addProductBehavior="none"` is already passed explicitly at the same call site rather than relying on a default) |
| Vendor loader IIFE (`loader.ts`) is untouched | Constitution Principle III; `loader.ts`'s own header comment: "The IIFE must be copied verbatim" | Any fix must work through `loadStrategy`/`LoadSnipcart()`, both already-documented, official configuration surfaces of the verbatim script, never edits to the string itself | Reuse: no deviation, zero lines of `loader.ts` change |

No comparable "single guarded trigger replacing multiple native triggers"
precedent exists elsewhere in this codebase; the closest analogues are the
per-button `dataset.syncBound` / `_cartToastClickBound` idempotency guards
already in `cartSync.ts` and `cartToast.ts`, whose pattern (a flag checked
before an unconditional action) is reused here at `window` scope instead of
`dataset`/`document` scope, for the reason in the table above.

## 8. Interfaces and Dependencies

- `Snipcart.astro`'s `Props.loadStrategy` type
  (`'on-user-interaction' | 'manual'`) already includes `'manual'` — no
  type change needed, only the value passed at the one call site.
- `window.LoadSnipcart` is a pre-existing, already-typed-as-optional global
  (`(window as unknown as { LoadSnipcart?: () => void })`) in both touched
  files — no new global, no new type declaration.
- `bindAddToCartSync`'s exported signature (`(): void`) is unchanged; its
  only caller (`PersonalCakeProduct.astro`) needs no update.
- No package.json, schema, route, or API contract changes.

## 9. Plan of Work

### Milestone A — Single guarded trigger replaces the redundant native path

**Outcome**: `loadStrategy="manual"` on the one `<Snipcart>` call site;
exactly one `window`-guarded `LoadSnipcart()` call, in `Layout.astro`;
`cartSync.ts`'s redundant call removed.

**Edits**: `src/layouts/Layout.astro`, `src/lib/snipcart/cartSync.ts` (see
Exact File Changes below).

**Proof**: `git apply --check` on the combined patch (already run, see
Review Log); `npm run build` succeeds; quickstart.md Scenarios A, B, and
the manual homepage cart-badge check (tasks.md T009-T011).

### Milestone B — Regression/over-correction verification

**Outcome**: Confirm Milestone A doesn't regress the existing rapid-click
guard and doesn't over-correct into swallowing genuine repeated clicks.

**Edits**: none — verification only.

**Proof**: quickstart.md Scenarios C and D (tasks.md T012-T013).

Milestone B depends on Milestone A being complete; there is no code left
to write after Milestone A.

## 10. Exact File Changes

### `src/layouts/Layout.astro`
**Action:** Modify
**Why:** Stop relying on Snipcart's native `on-user-interaction` auto-load
path (proven independently sufficient to double-initialize the SDK after a
`ClientRouter` navigation — `research.md` Findings 3-4) and install the one
first-party, layout-wide, `window`-guarded replacement trigger.
**Impact:** Changes when/how Snipcart's script begins loading sitewide;
does not change any rendered markup, route, or other script's behavior.

```diff
diff --git a/src/layouts/Layout.astro b/src/layouts/Layout.astro
--- a/src/layouts/Layout.astro
+++ b/src/layouts/Layout.astro
@@ -38,7 +38,7 @@
     <link rel="stylesheet" href="https://use.typekit.net/ezr1eax.css" />
     <link rel="icon" href="/assets/cups-icon.svg" type="image/svg+xml" />
     <ClientRouter />
-    <Snipcart addProductBehavior="none" />
+    <Snipcart addProductBehavior="none" loadStrategy="manual" />
   </head>
   <body class="m-0 p-0 bg-white font-sans antialiased">
     <slot />
@@ -68,6 +68,28 @@
         if ((window as unknown as { Snipcart?: { api?: { cart?: unknown } } }).Snipcart?.api?.cart) {
           syncDraftToCart();
         }
+        // Snipcart's own loadStrategy:"on-user-interaction" registered five
+        // separate native document listeners (focus/mouseover/touchmove/
+        // scroll/keydown) plus a fallback timer, any of which independently
+        // called into its loader. That was proven (via live Playwright
+        // reproduction against the real dev server — see
+        // specs/001-snipcart-double-add/research.md) sufficient, entirely on
+        // its own, to make Snipcart's vendor SDK construct a second internal
+        // instance and bind a second document-level add-to-cart click
+        // listener after an Astro ClientRouter navigation, causing a single
+        // click to add two cart line items instead of one. Now that
+        // Snipcart.astro passes loadStrategy="manual", this is the one
+        // first-party call that starts loading it, guarded so it can only
+        // ever fire once per page session regardless of how many times
+        // astro:page-load re-fires or how many in-app navigations occur.
+        // Placed here (layout-wide) rather than only on product pages, so
+        // the cart badge/drawer stay reachable from any page, not just ones
+        // with an Add to Cart button.
+        const win = window as unknown as { LoadSnipcart?: () => void; __snipcartLoadTriggered?: boolean };
+        if (!win.__snipcartLoadTriggered) {
+          win.__snipcartLoadTriggered = true;
+          win.LoadSnipcart?.();
+        }
       });
     </script>
   </body>
```

#### Reasoning
- `<Snipcart>` at line 41 is this component's only consumer in the repo
  (`grep -rln "components/snipcart/Snipcart" src` → one match), so this is
  the one place `loadStrategy` needs to change.
- The new trigger is added inside the *existing* `astro:page-load`
  listener (not a new listener) at the same location the file already
  handles Snipcart-readiness concerns (`syncDraftToCart`), keeping one
  script block responsible for "things that happen on every page
  transition," per this file's own existing structure.
- `window`-scoped guard (`__snipcartLoadTriggered`), not `dataset`-scoped:
  this must fire once per page session, not once per element — see
  Pattern Audit row 2.

### `src/lib/snipcart/cartSync.ts`
**Action:** Modify
**Why:** Once `Layout.astro` owns the single load trigger, the call in
`bindAddToCartSync()` is redundant (Constitution Principle I: single
source of truth) — leaving it in place would mean two call sites again,
just with one now provably safe and one now pointless.
**Impact:** `bindAddToCartSync` no longer triggers Snipcart's load itself;
its per-button click-listener-binding behavior (the actual point of the
function) is completely unchanged. No caller update needed — the exported
signature is unchanged.

```diff
diff --git a/src/lib/snipcart/cartSync.ts b/src/lib/snipcart/cartSync.ts
--- a/src/lib/snipcart/cartSync.ts
+++ b/src/lib/snipcart/cartSync.ts
@@ -21,21 +21,14 @@
  * element, and a listener bound only once at parse time would be left
  * attached to the old, now-detached element.
  *
- * Also proactively kicks off Snipcart's own script load. Snipcart's
- * `loadStrategy: "on-user-interaction"` (site-wide default, see
- * Snipcart.astro) only treats focus/mouseover/touchmove/scroll/keydown as
- * "start loading" triggers — a plain `click` isn't one of them, and there's
- * a ~2.75s fallback timer otherwise. A customer whose very first
- * interaction with the page is clicking ADD TO CART can click before
- * Snipcart has loaded and attached its own handler, and that click is
- * lost — nothing happens. Calling the loader's exposed `LoadSnipcart()`
- * here starts loading the moment a page with a real add-to-cart button is
- * ready, well before any click can land, without forcing eager loading on
- * pages that never call this function.
+ * Does not itself trigger Snipcart's script load — Snipcart.astro now uses
+ * loadStrategy="manual" and Layout.astro's own astro:page-load listener is
+ * the single, window-guarded call site responsible for that (see
+ * specs/001-snipcart-double-add/research.md for why: Snipcart's own native
+ * on-user-interaction triggers were independently sufficient to double-
+ * initialize its SDK after a ClientRouter navigation).
  */
 export function bindAddToCartSync(): void {
-  (window as unknown as { LoadSnipcart?: () => void }).LoadSnipcart?.();
-
   document.querySelectorAll<HTMLButtonElement>('.snipcart-add-item').forEach((button) => {
     // `astro:page-load` is documented to fire twice on the initial page
     // load with Astro's ClientRouter. Without this guard, a second call
```

#### Reasoning
- The removed doc-comment paragraph described exactly the responsibility
  (kicking off Snipcart's load) that's moving to `Layout.astro`; leaving
  stale prose here would misdescribe what this function does post-fix.
- Everything below the removed call (`document.querySelectorAll(...)`
  through the end of the function) is untouched — this function's real
  job, binding the per-button click listener that syncs `data-item-*`
  attributes, is unrelated to the load-trigger bug (confirmed in
  `research.md` Finding 4: the double-init reproduces even on pages that
  never call this function at all).

## 11. Concrete Steps

Working directory for all commands: `/Users/dev/Projects/cupscakes-website`.

1. Apply the two diffs above (or have an implementer apply them mechanically).
2. `npm run build` — expected: succeeds, no TypeScript errors (the `win`
   local variable in `Layout.astro`'s inline script is typed inline, same
   pattern the file already uses one block above it for the `Snipcart` global).
3. `npm run dev` — expected: starts on `:4321` with no console errors on
   load.
4. Run quickstart.md Scenarios A, B, C, D in order (see that file for the
   exact Playwright harness setup) — expected results are stated in each
   scenario in quickstart.md.
5. Manually load `http://localhost:4321/` (homepage, no `AddToCartButton`)
   in a browser, wait a couple seconds, open the cart icon — expected: the
   Snipcart drawer opens (proves criterion 5, the sitewide trigger placement).

## 12. Validation and Acceptance

- **Behavior proof, not just compilation**: quickstart.md's four scenarios
  each assert on real network requests (`POST .../items` count) and real
  `window.Snipcart.store` cart state, captured via Playwright against the
  actual dev server and actual Snipcart sandbox — not a mock.
- **Success case**: Scenario B goes from 2 requests (documented bug,
  `research.md`) to 1.
- **Regression case**: Scenario A stays at 1 request; Scenario C stays at
  quantity 1 after rapid clicks (existing guard unaffected).
- **Boundary case**: Scenario D (two deliberate clicks) confirms no
  over-correction into a debounce.
- **Compatibility case**: Step 5 above confirms sitewide cart access
  survives moving off `on-user-interaction`.

## 13. Idempotence and Recovery

- Both diffs are plain file edits with no migration, generated artifact,
  or external state change — reverting is a plain `git checkout` of the
  two files if needed.
- The `window.__snipcartLoadTriggered` guard is itself idempotent by
  construction (checked-then-set, single-threaded JS) — re-running
  `astro:page-load` any number of times cannot re-trigger the load.
- No cleanup step needed beyond the verification harness teardown already
  described in `quickstart.md`/`tasks.md` T016 (outside this repo).

## 14. Risks and Decisions

| Date | Decision | Rationale |
|---|---|---|
| 2026-07-15 | Trigger lives in `Layout.astro`, not a new dedicated Snipcart-init module | Smallest change; reuses an existing, already-firing-on-every-page listener rather than adding a new script/module (Constitution: prefer the smallest repository-aligned change) |
| 2026-07-15 | Did not attempt to fully deobfuscate why Snipcart's vendor bundle double-initializes internally | Out of proportion for a bug fix and forbidden from being "fixed" directly anyway (Principle III); the black-box fix (stop sending it multiple native trigger signals) is sufficient per Milestone A's own verification gate — if quickstart.md Scenario B still fails after this change, that would falsify this plan's central assumption and require returning to `research.md`, not patching further inside this same plan blind |

**Risk**: if some other, not-yet-found trigger path also exists (i.e. the
five native listeners are not the *only* redundant path), Scenario B could
still fail after this change. Mitigation: Milestone A's proof step
explicitly re-runs Scenario B against the changed code before declaring
done — this is not assumed to work from static reasoning alone.

## 15. Review Log

**2026-07-15 — Scaffold pass**

- Read `spec.md`, `plan.md`, `research.md`, `data-model.md`,
  `quickstart.md`, `tasks.md` in full.
- Re-read current worktree content of `src/layouts/Layout.astro` (75
  lines) and `src/lib/snipcart/cartSync.ts` (315 lines) directly (not from
  memory) immediately before drafting diffs.
- Confirmed `Snipcart.astro` has exactly one consumer via
  `grep -rln "components/snipcart/Snipcart" src`.
- Generated both diffs via `scripts/make-diff.sh modify`, from scratch
  files written outside the repository
  (`/private/tmp/claude-501/.../scratchpad/Layout.astro.new` and
  `.../cartSync.ts.new`) — each individually passed the script's own
  `git apply --check` gate before being printed.
- Ran the required combined-patch check per the Review Gate: concatenated
  both diffs into one patch file and ran
  `git apply --check /private/tmp/.../scratchpad/combined.patch` from the
  repository root — **result: exit code 0, applies cleanly**.
- Verified every `diff --git a/<path> b/<path>` / `--- a/<path>` /
  `+++ b/<path>` line in both blocks above uses the same repo-relative
  path as that file's own section heading (`src/layouts/Layout.astro`,
  `src/lib/snipcart/cartSync.ts`).
- No material issue found on this pass; this is a first (scaffold) pass,
  not a correction of a prior draft.

**2026-07-15 — Review pass**

- Re-verified `bindAddToCartSync` has exactly one caller
  (`src/components/product/PersonalCakeProduct.astro:456`, via
  `document.addEventListener("astro:page-load", bindAddToCartSync)`) and
  its exported signature (`(): void`) is unchanged by this plan — no
  caller update needed. Confirmed via
  `grep -rn "bindAddToCartSync" src --include="*.astro" --include="*.ts"`.
- Confirmed the three remaining comment references to
  "bindAddToCartSync" elsewhere in `cartSync.ts` (lines 188, 243, 290,
  describing the shared double-fire-guard pattern) still apply correctly:
  they refer to `bindAddToCartSync`'s own `dataset.syncBound` guard, which
  this plan does not touch — only the `LoadSnipcart()` call and its
  doc-comment paragraph are removed.
- Confirmed the `(window as unknown as {...})` casting style added to
  `Layout.astro` matches the existing casting convention already used one
  block above it in the same script (the `Snipcart?.api?.cart` check) —
  no new pattern introduced.
- Confirmed no global type declaration for `window.LoadSnipcart` exists
  anywhere in the repo (`grep -rn "LoadSnipcart" src`, checked
  `src/env.d.ts` and searched for any `.d.ts` files) — the inline cast is
  this codebase's only convention for it, consistent with the one
  pre-existing call site being removed.
- Re-ran the Review Gate's required combined-patch check fresh on this
  pass (not inferred from the scaffold pass): `git apply --check
  /private/tmp/claude-501/-Users-dev-Projects/347bbf39-ee3b-4ac6-bf61-d21fc2b69809/scratchpad/combined.patch`
  from the repository root — **result: exit code 0**. Confirmed via
  `git status --short` on both target files that the worktree remains
  untouched (planning made no implementation-file edits).
- No material issue found. All Review Gate checks pass on this pass.

## 16. Approval

Implementation must not begin until this plan's `Status` reads `Prepared —
awaiting explicit approval` (not yet — see below) **and** a human has
explicitly approved it in conversation. `tasks.md` existing, or this
document existing, is not itself approval.

**Status: Implemented and verified — see Addendum below.**

## 17. Addendum (2026-07-15): this plan's Milestone A was implemented, its
## verification gate failed, and the actual fix differs from what's above

This plan's `loadStrategy="manual"` fix (Milestone A, sections 9–10 above)
was approved and implemented exactly as written. It did not fix the bug —
quickstart.md Scenario B still failed after implementation. Per this
document's own Risk note (section 14): *"if quickstart.md Scenario B still
fails after this change, that would falsify this plan's central assumption
and require returning to research.md, not patching further inside this
same plan blind."* That happened. See
[`research.md`'s Addendum](./research.md#addendum-2026-07-15-the-decision-above-was-implemented-and-its-central-assumption-was-falsified--corrected-root-cause-found)
for the full corrected root-cause finding (isolated via controlled live
testing: it was `swapGuard.ts` touching Snipcart's own injected `<script>`
tag, not the `#snipcart` div's handling that sections 5–10 above assumed).

**What actually shipped**, in addition to Milestone A's two files:

| File | Action | Reason |
|---|---|---|
| `src/lib/snipcart/swapGuard.ts` | Modify | Stop touching the live `<script src="snipcart.js">` tag during swaps (the actual cause); keep protecting the CSS `<link>`; delegate `#snipcart`'s persistence to Astro's native `swapBodyElement` instead of a hand-rolled body diff |
| `src/layouts/Layout.astro` | Modify (additional) | `#snipcart` div gets a real `transition:persist` attribute, consumed by `swapBodyElement` above |

This correction was done as live, isolated, evidence-first investigation
(the same methodology `research.md` itself established) directly in
conversation, then approved in conversation before being treated as final —
not re-run through `/speckit-plan`/`/speckit-tasks` from scratch, since the
feature scope, files touched, and constitution constraints are unchanged
from the original approval; only the specific mechanism inside
`swapGuard.ts` differs from what section 10 originally specified. All five
acceptance criteria from `spec.md` were re-verified against the corrected
code — see research.md's Addendum for the full results.
