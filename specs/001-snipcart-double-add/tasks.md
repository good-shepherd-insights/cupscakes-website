# Tasks: Fix Add-to-Cart Double-Add

**Input**: Design documents from `/specs/001-snipcart-double-add/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md)

**Tests**: No automated test runner exists in this repo (Constitution
Principle V). Verification is the scripted Playwright reproduction from
`quickstart.md`, run manually against the dev server — not committed to
the repo (Playwright is not a project dependency; per plan.md's Technical
Context, adding one is out of scope for this fix). Tasks below reference
"run quickstart.md Scenario X" as the verification step in place of a
committed test suite.

**Organization**: Tasks are grouped by the two user stories in spec.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

## Path Conventions

Single Astro project — all paths relative to
`/Users/dev/Projects/cupscakes-website`.

---

## Phase 1: Setup (Shared Verification Harness)

**Purpose**: Stand up the reproduction/verification tooling from
quickstart.md and confirm the bug is real and reproducible *before*
touching any source file — this repo has no test runner, so this scripted
repro is the only "red" signal available, and both user stories are
verified through it.

- [ ] T001 In a scratch directory outside the repo (e.g. `/tmp/snipcart-verify`), run `npm init -y && npm install playwright && npx playwright install chromium --with-deps` per quickstart.md Prerequisites
- [ ] T002 Start the dev server (`npm run dev` from the repo root) and confirm it serves on `:4321`
- [ ] T003 Write a Playwright script implementing quickstart.md Scenario A (fresh load, single click) and Scenario B (in-app nav, single click), asserting on `POST .../items` request counts
- [ ] T004 Run the Scenario A/B script against the current (unfixed) code and confirm: Scenario A passes (1 request), Scenario B fails (2 requests) — this is the baseline proving the bug before any fix

**Checkpoint**: Bug is confirmed reproducible on demand; harness is ready to validate every subsequent change.

---

## Phase 2: Foundational

Not needed for this fix. The entire change is scoped to the Snipcart
loading trigger (see plan.md Project Structure) — there is no shared
model/service layer to stand up before User Story 1 can start; Phase 1's
harness is the only prerequisite.

---

## Phase 3: User Story 1 - Single click adds exactly one item (Priority: P1) 🎯 MVP

**Goal**: A single "Add to Cart" click adds exactly one unit, whether the
product page was reached via a fresh load or an in-app navigation.

**Independent Test**: quickstart.md Scenario B — in-app nav to a product
page, one click, exactly one `POST .../items` request and cart quantity 1.

### Implementation for User Story 1

- [X] T005 [US1] In `src/layouts/Layout.astro` line 41, change `<Snipcart addProductBehavior="none" />` to also pass `loadStrategy="manual"` (Snipcart.astro is only ever consumed here — see confirmed single usage site — so this is the one place `on-user-interaction` needs to stop being used; per research.md Decision, Snipcart's own native multi-trigger auto-load path is what double-initializes, independent of this repo's code)
- [X] T006 [US1] In `src/layouts/Layout.astro`, in the existing second inline `<script>` block (lines 61-72), add a call to `window.LoadSnipcart?.()` inside the `astro:page-load` listener at lines 67-71 — guarded by a `window`-scoped flag (e.g. `if (!window.__snipcartLoadTriggered) { window.__snipcartLoadTriggered = true; window.LoadSnipcart?.(); }`) — so it fires exactly once per page session regardless of how many times `astro:page-load` re-fires or how many in-app navigations occur; this replaces the five native interaction listeners as the sole load trigger, sitewide (not just on product pages, so the cart badge/drawer stay reachable from every page)
- [X] T007 [US1] In `src/lib/snipcart/cartSync.ts`, remove the `window.LoadSnipcart?.()` call from `bindAddToCartSync()` (now redundant with T006's layout-wide trigger) and update the function's doc comment to stop describing it as responsible for kicking off the load — keep the per-button `dataset.syncBound` click-listener-binding logic unchanged
- [X] T008 [US1] ~~Add a code comment...~~ Superseded: T005/T006 alone did not fix the bug (see research.md Addendum). The comment now explains the corrected mechanism instead, and lives in `src/lib/snipcart/swapGuard.ts` (not listed in this original task breakdown — added because the real cause was `swapGuard.ts` touching Snipcart's injected `<script>` tag, not the load-trigger strategy)
- [X] T009 [US1] Run quickstart.md Scenario A against the changed code — confirm still exactly 1 request, cart quantity 1 (no regression on the already-working fresh-load path)
- [X] T010 [US1] Run quickstart.md Scenario B against the changed code — confirm exactly 1 request, cart quantity 1 (the bug is fixed). First pass with only T005-T007 still showed 2 requests (research.md Addendum); fixed after also correcting `swapGuard.ts`
- [X] T011 [US1] Manually verify the sitewide cart badge/drawer still opens correctly from a page with no `AddToCartButton` (e.g. the homepage), confirming T006's layout-wide placement preserves cart access outside product pages

**Checkpoint**: User Story 1 is fully fixed and independently verified via T009-T011.

---

## Phase 4: User Story 2 - Repeated intentional clicks still add one item each (Priority: P2)

**Goal**: Confirm the fix addresses the per-click duplication itself,
without introducing a debounce that would also suppress legitimate
repeated adds, and without weakening the already-shipped rapid-double-click
guard.

**Independent Test**: quickstart.md Scenario D — two deliberate, separated
clicks produce cart quantity 2.

### Verification for User Story 2

No additional code changes are needed for this story — it verifies that
User Story 1's fix doesn't over-correct. (If either check below fails, the
fix from Phase 3 is too broad and T006's guard needs to be scoped to
one-time SDK loading only, not click handling — return to Phase 3.)

- [X] T012 [US2] Run quickstart.md Scenario D — two deliberate clicks, ~4s apart, on the same product; confirm cart quantity ends at 2, not 1 or 4
- [X] T013 [US2] Run quickstart.md Scenario C — two rapid clicks (<200ms apart); confirm cart quantity ends at 1, verifying the existing `cartToast.ts` capture-phase guard (commit `83ab38a`) is unaffected by the Phase 3 changes

**Checkpoint**: Both user stories independently verified; no known regressions.

---

## Phase 5: Polish

- [X] T014 Run the full quickstart.md validation sequence (Scenarios A-D) once more end-to-end as the final pre-merge gate
- [X] T015 `git status` review: confirm only the intended files are modified — no unrelated files staged. Updated from the original wording: `src/layouts/Layout.astro`, `src/lib/snipcart/cartSync.ts`, **and** `src/lib/snipcart/swapGuard.ts` (see research.md Addendum for why a third file was needed)
- [X] T016 Stop the dev server and remove the scratch verification directory (outside the repo — nothing to clean up in-repo)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Skipped (not needed — see above).
- **User Story 1 (Phase 3)**: Depends on Phase 1 (needs the harness to
  confirm the baseline bug and later the fix). This is the only phase with
  real implementation tasks.
- **User Story 2 (Phase 4)**: Depends on Phase 3 being complete (it
  verifies Phase 3's fix; there is nothing to test yet without it).
- **Polish (Phase 5)**: Depends on Phases 3 and 4 both passing.

### Within Phase 3

T005 and T006 can happen in either order but both must land before T007
(removing the redundant call in `cartSync.ts` only makes sense once the
layout-wide trigger in T006 exists) — do not mark T005/T006/T007 `[P]`,
they touch the same feature and must be validated together via T009-T010
before moving on. T008 (comment) can follow immediately after T006.

### Parallel Opportunities

Limited — this is a small, sequential fix. T005 and T006 touch different
files and have no code dependency on each other, so they could be done in
either order, but neither is meaningfully parallelizable with a second
person given the fix's small size.

---

## Implementation Strategy

### MVP = User Story 1

Phase 3 (T005-T011) is the entire fix. Phase 4 is verification-only and
confirms no over-correction. Phase 5 is the final honest verification pass
required before calling this done, per Constitution Principle V (no
claiming the fix works without actually re-running the reproduction).

### Incremental Delivery

1. Phase 1 → confirms the bug, on demand, before any code changes.
2. Phase 3 → the fix, verified against both the bug (Scenario B) and the
   already-working path (Scenario A).
3. Phase 4 → confirms no regression on the two already-shipped
   double-add-adjacent fixes (Scenario C) and no over-correction
   (Scenario D).
4. Phase 5 → final full-suite re-run, then ready for commit/PR.

---

## Notes

- No `[P]` markers are used in Phase 3 — the three implementation tasks
  are small, touch related concerns, and are cheaper to verify as one
  sequential unit than to parallelize.
- Commit after Phase 3's checkpoint (T011 passes) and again after Phase 5,
  or as a single commit at the end — user's call at implementation time;
  this repo's convention (per git log) is one commit per shipped fix.
