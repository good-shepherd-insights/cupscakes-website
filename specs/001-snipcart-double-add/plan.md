# Implementation Plan: Fix Add-to-Cart Double-Add

**Branch**: `fix/snipcart-double-add-on-click` | **Date**: 2026-07-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-snipcart-double-add/spec.md`

## Summary

A single click on "Add to Cart", when the product page was reached via an
in-app (Astro `ClientRouter`) navigation rather than a fresh page load,
causes Snipcart's own vendor SDK to construct a second internal instance
and bind a second `document`-level click listener for `.snipcart-add-item`
— so one click is processed twice, creating two distinct cart line-item
entities. Confirmed via live reproduction (Playwright against the real dev
server and real Snipcart sandbox), not static reading — see
[research.md](./research.md). The fix direction is to stop relying on
Snipcart's native multi-trigger `loadStrategy: "on-user-interaction"`
auto-load path (proven sufficient by itself to reproduce the double-init,
independent of this repo's own code) and instead drive Snipcart's load with
exactly one first-party, `window`-scoped-idempotent call, installed
layout-wide so cart access is not lost on pages without an
`AddToCartButton`.

## Technical Context

**Language/Version**: TypeScript (Astro 6 `.astro` components + `.ts`
modules), targeting evergreen browsers via Vite/esbuild's default targets.

**Primary Dependencies**: Astro 6 (`ClientRouter` for client-side
navigation), Snipcart v3.7.2 (loaded via `src/lib/snipcart/loader.ts`'s
official installation snippet), no new dependencies introduced.

**Storage**: N/A — this fix is entirely client-side event-handling; cart
state is owned by Snipcart's hosted API, not this project.

**Testing**: No automated test runner exists in this repo (`lint`/`test`
are declared in `.github/workflows/ci.yml` but have no npm scripts — see
Constitution Principle V). Verification is the scripted Playwright
reproduction in [quickstart.md](./quickstart.md), run manually against the
dev server before merge.

**Target Platform**: Web (Astro-rendered storefront, static hosting +
client-side hydration/`ClientRouter` transitions).

**Project Type**: Web application (single Astro project, no
frontend/backend split).

**Performance Goals**: No new performance target — must not change
Snipcart's currently-deferred loading behavior for pages that never
interact with the cart (i.e., must not force-eager-load Snipcart
sitewide as a side effect of the fix).

**Constraints**: Must not touch `snipcart.js` (vendor file, loaded from
Snipcart's CDN, not vendored in-repo) per Constitution Principle III. Must
not weaken the already-shipped rapid-double-click guard in `cartToast.ts`
(commit `83ab38a`) per Constitution Principle I (single source of truth —
that guard stays the one place rapid-double-click is handled; this fix
addresses a different, orthogonal failure mode).

**Scale/Scope**: Single fix, scoped to `src/layouts/Layout.astro` and/or
`src/components/snipcart/Snipcart.astro` / `src/lib/snipcart/cartSync.ts`
(exact file(s) TBD in tasks.md based on where the single guarded trigger is
most naturally installed). No product-catalog, routing, or Sanity-schema
changes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design below.*

Checked against `.specify/memory/constitution.md` v1.0.0:

- **I. Single Source of Truth for Cross-Cutting Concerns** — PASS. The fix
  adds one new single-purpose trigger call site for `LoadSnipcart()`,
  replacing five redundant native trigger paths; it does not duplicate
  Snipcart-attribute-building logic, which stays solely in
  `buildItemAttributes`.
- **II. Editorial Data Drives Rendering, Not Code Branches** — N/A, no
  Sanity-modeled content is touched.
- **III. Third-Party Integration Fidelity** — PASS by construction: the fix
  works entirely through Snipcart's own documented, public configuration
  surface (`loadStrategy`, `LoadSnipcart()`), never edits
  `src/lib/snipcart/loader.ts`'s verbatim vendor IIFE string, and does not
  patch `snipcart.js` itself (impossible anyway — it's CDN-hosted, not
  vendored).
- **IV. Spec-Driven Change Process** — PASS (this plan is itself the
  artifact this principle requires).
- **V. CI Must Stay Green, Honestly** — PASS. No test/lint claims are made;
  [quickstart.md](./quickstart.md) is explicit that verification is
  manual/scripted, not automated, and the plan does not overclaim coverage.

No violations. **Complexity Tracking is not needed.**

## Project Structure

### Documentation (this feature)

```text
specs/001-snipcart-double-add/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output (no schema change; documents why)
├── quickstart.md         # Phase 1 output — the manual/scripted verification gate
└── tasks.md              # Phase 2 output (/speckit-tasks — not created by this command)
```

No `contracts/` directory: this fix changes no request/response shape on
any interface this project exposes or calls (see data-model.md) — it only
corrects how many times an unchanged request is sent. Per the plan
template's own guidance ("skip if project is purely internal" / no new
interface), an empty `contracts/` would just be noise.

### Source Code (repository root)

This is a single-project Astro web application (no `frontend`/`backend`
split, no `tests/` directory — see Technical Context: no test runner
exists yet). The fix is scoped to the existing Snipcart integration layer:

```text
src/
├── layouts/
│   └── Layout.astro           # site-wide: <Snipcart /> + <ClientRouter /> wired here;
│                               # likely home for the single guarded load-trigger call
├── components/
│   └── snipcart/
│       ├── Snipcart.astro     # renders the loader <script>; loadStrategy config lives here
│       └── AddToCartButton.astro
└── lib/
    └── snipcart/
        ├── loader.ts          # builds the vendor loader script; SnipcartLoaderConfig type
        ├── cartSync.ts        # bindAddToCartSync() currently calls window.LoadSnipcart()
        │                      # on every astro:page-load — candidate site for the guard,
        │                      # or for removing this call if the trigger moves to Layout.astro
        └── cartToast.ts       # unrelated rapid-double-click guard — must not be weakened
```

**Structure Decision**: No new files or directories. The fix is a targeted
change within the existing `src/lib/snipcart/` + `src/layouts/Layout.astro`
/ `src/components/snipcart/Snipcart.astro` integration layer already
described in this repo's `CLAUDE.md` Architecture section. Exact line-level
placement of the single guarded trigger (Layout.astro vs. cartSync.ts) is
left to tasks.md, since it depends on confirming — during implementation,
via quickstart.md's Scenario B — that moving the trigger there actually
collapses the duplicate SDK init on the in-app-navigation path.

## Complexity Tracking

Not applicable — Constitution Check above reports no violations.
