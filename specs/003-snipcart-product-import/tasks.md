# Tasks: Snipcart JSON Product Import Document

## Phase 1: Import Document

- [x] T001 [US1] Create the Sanity-backed variant expansion and shared Snipcart attribute generation in `src/pages/snipcart-products.json.ts`
- [x] T002 [US2] Translate checkout attributes into documented Snipcart JSON product objects and return an unlinked `application/json` response

## Phase 2: Verification

- [x] T003 Build and inspect `dist/snipcart-products.json` using `specs/003-snipcart-product-import/quickstart.md`
- [x] T004 Confirm no existing source file links to the import route and run `git diff --check`

## Phase 3: Review Remediation

- [x] T005 Validate required Snipcart attributes before constructing each JSON product
- [x] T006 Validate Sanity prices before formatting them for the shared checkout builder
- [x] T007 Rebuild and revalidate the generated JSON import document

## Dependencies

- T001 and T002 are sequential because they modify the same endpoint.
- T003 and T004 follow the complete endpoint.
- T005 and T006 address independent validation boundaries in the same endpoint and are implemented together.
- T007 follows T005 and T006.
