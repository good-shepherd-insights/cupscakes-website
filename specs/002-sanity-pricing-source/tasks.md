---
description: "Implementation tasks for Sanity-backed product display pricing"
---

# Tasks: Sanity-Backed Product Display Pricing

**Input**: Design documents from `specs/002-sanity-pricing-source/`

**Tests**: No automated test or lint runner exists. The user explicitly waived another local build; verification uses source-contract searches and diff checks, with normal CI left to the PR workflow.

## Phase 1: Shared Pricing Foundation

- [x] T001 Map current catalog consumers and duplicate display locations in `src/`
- [x] T002 Add required numeric product-price lookup and validation in `src/lib/sanity/queries/products.ts`
- [x] T003 Add initial cupcake presentation formatter in `src/lib/format/productPrice.ts`

---

## Phase 2: User Story 1 - Consistent Cupcake Pricing (Priority: P1)

- [x] T004 [P] [US1] Fetch and pass cupcake price in `src/pages/index.astro`
- [x] T005 [US1] Render the shared cupcake price in `src/components/home/CupcakeCarousel.astro`
- [x] T006 [P] [US1] Fetch and pass cupcake price in `src/pages/products/index.astro`
- [x] T007 [US1] Render one shared cupcake price in `src/components/product/CupcakeGrid.astro`
- [x] T008 [P] [US1] Remove duplicate cupcake prices from `src/content/products/cupcakes.json`
- [x] T009 [US1] Remove the cupcake price field from `src/content.config.ts`

---

## Phase 3: User Story 1 - Consistent Personal Cake Pricing (Priority: P1)

- [x] T010 [US1] Extend `src/lib/format/productPrice.ts` with shared currency and per-item formatting
- [x] T011 [US1] Fetch and pass the Personal Cake catalog price in `src/pages/index.astro`
- [x] T012 [US1] Accept and format the numeric price in `src/components/home/PersonalCakes.astro`
- [x] T013 [US1] Fetch and pass the Personal Cake catalog price in `src/pages/products/index.astro`
- [x] T014 [US1] Accept one numeric price for all cards in `src/components/product/PersonalCakeGrid.astro`
- [x] T015 [US1] Replace the preview literal with a catalog price in `src/pages/products/preview-personal-cake.astro`

---

## Phase 4: User Story 2 - Update Either Product Once (Priority: P2)

- [x] T016 [US2] Remove the homepage Personal Cake price from `src/content/home/personal-cakes.json` and its schema field in `src/content.config.ts`
- [x] T017 [US2] Remove both products-grid Personal Cake prices from `src/content/products/personal-cakes.json` and their schema field in `src/content.config.ts`

---

## Phase 5: Source-Level Verification

- [x] T018 Confirm no hardcoded cupcake or Personal Cake numeric display price remains and run `git diff --check` using `specs/002-sanity-pricing-source/quickstart.md`

## Dependencies & Execution Order

- T010 precedes T012, T014, and T015.
- T011 and T012 form the homepage sequence.
- T013 and T014 form the products-grid sequence.
- T016 and T017 follow their matching component prop changes.
- T018 follows all implementation tasks.

## Parallel Opportunities

- After T010, the homepage, products-grid, and preview sequences touch disjoint component/page files.
- T016 and T017 are sequential because both update `src/content.config.ts`.

## Notes

- No new dependency, client-side fetch, runtime endpoint, catalog mutation, or unrelated content migration is in scope.
- Product detail and cart price paths already use Sanity and remain unchanged.
- No additional local build will be run per the user's instruction.
