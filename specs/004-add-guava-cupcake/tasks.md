# Tasks: Add Guava Cupcake

**Input**: Design documents from `/specs/004-add-guava-cupcake/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/guava-catalog.md, quickstart.md

**Tests**: The repository has no executable test or lint scripts. Verification uses the real production build, generated artifact inspection, public Sanity queries, and diff checks.

**Organization**: One P1 story covers the complete browse-to-cart Guava flow.

## Phase 1: Setup and Preconditions

**Purpose**: Verify the exact client asset and current external catalog state before any write.

- [X] T001 Verify `/tmp/cup66-guava-no-shadow-source.png` matches the size, dimensions, SHA-1, and SHA-256 recorded in `specs/004-add-guava-cupcake/research.md`; redownload from Drive file `1oh-BXK0I8lfgOSixk-qBCO0zDMiLGX3X` if needed
- [X] T002 Query Sanity document `product-chocolate-cupcake` and confirm `customOptions[_key == "flavor"].options` contains no Guava key, label, or slug before mutation

**Checkpoint**: The source asset is verified and the append is safe to perform.

---

## Phase 2: User Story 1 - Browse and Order Guava Cupcakes (Priority: P1) 🎯 MVP

**Goal**: Add Guava to the existing products grid, generated product route, cart identity, and Snipcart JSON catalog without altering existing cupcake behavior.

**Independent Test**: Build the site, open the generated Guava route, inspect its add-to-cart attributes, and compare its generated Snipcart object and shared option fields with an existing cupcake flavor.

- [X] T003 [US1] Upload `/tmp/cup66-guava-no-shadow-source.png` through the authenticated Sanity CLI context and revision-guard append the Guava object from `specs/004-add-guava-cupcake/data-model.md` to `product-chocolate-cupcake.customOptions[_key == "flavor"].options`
- [X] T004 [P] [US1] Add `guava` to `productsCupcakeFlavorSchema.key` in `src/content.config.ts`
- [X] T005 [P] [US1] Add `guava` to the `FlavorKey` unions in `src/components/product/CupcakeGrid.astro` and `src/components/product/CupcakeFlavorCard.astro`
- [X] T006 [US1] Append the Guava card after Strawberry in `src/content/products/cupcakes.json` using the uploaded Sanity CDN URL and the values in `specs/004-add-guava-cupcake/data-model.md` (depends on T003)

**Checkpoint**: Guava is represented in both established editorial sources and all generic route/cart/import derivation can run.

---

## Phase 3: Validation and Integrity

**Purpose**: Prove the complete story and confirm existing products remain unchanged.

- [X] T007 Run `npm run build` and validate the generated storefront route and Snipcart contract using `specs/004-add-guava-cupcake/quickstart.md`
- [X] T008 Re-query `product-chocolate-cupcake`, confirm Guava appears exactly once, compare all pre-existing flavor/price/customization data, run `git diff --check`, and review the final source diff

---

## Dependencies & Execution Order

- T001 and T002 are read-only preconditions and may be performed together.
- T003 depends on T001 and T002.
- T004 and T005 modify independent repository files and may run in parallel after plan approval.
- T006 depends on T003 because it must use the actual uploaded Sanity CDN URL.
- T007 depends on T003 through T006.
- T008 is the final integrity check after a successful build.

## Parallel Example: User Story 1

```text
Task: "Add guava to productsCupcakeFlavorSchema.key in src/content.config.ts"
Task: "Add guava to FlavorKey in src/components/product/CupcakeGrid.astro and src/components/product/CupcakeFlavorCard.astro"
```

## Implementation Strategy

1. Verify external inputs without writing.
2. Upload and revision-guard patch the single Sanity option.
3. Apply the three small repository data/type changes.
4. Build once and inspect every derived surface.
5. Compare external and repository state against the pre-change snapshot.

## Format Validation

- All tasks use checkbox, sequential task ID, optional parallel marker, story label where applicable, and an exact repository, temporary-file, or external data path.
- MVP scope is the single P1 user story; there are no lower-priority stories.
