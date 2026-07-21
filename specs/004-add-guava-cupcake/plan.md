# Implementation Plan: Add Guava Cupcake

**Branch**: `feature/cup-66` | **Date**: 2026-07-21 | **Spec**: [spec.md](spec.md)

## Summary

Add Guava as one option in the existing Sanity Cupcakes flavor group, using the client-supplied 4000×4000 no-shadow PNG, and add its matching card to the products content collection. Existing route generation, checkout attribute generation, and the Snipcart JSON import endpoint then produce `/products/cupcakes/guava`, `cupcakes-guava`, and the Guava import definition without flavor-specific checkout code.

## Technical Context

**Language/Version**: TypeScript 5.8, Astro 6.3, Sanity Studio 5.26

**Primary Dependencies**: Existing Astro content collections, Sanity client/CLI, Snipcart integration helpers

**Storage**: Sanity `production` dataset plus the repository-backed products content collection

**Testing**: `npm run build`, generated HTML/JSON inspection, public Sanity query verification, and `git diff --check`; the repository has no executable test or lint scripts

**Target Platform**: Existing static Vercel site with Sanity Content Lake and Snipcart v3

**Project Type**: Static web application with CMS-managed product data

**Performance Goals**: No new runtime request or client bundle; one additional statically generated product route and catalog card

**Constraints**: Preserve all existing cupcake data and option ordering; no dependency, schema, pricing, gallery, or vendor-code changes; authenticated Sanity write is an external action gated by plan approval

**Scale/Scope**: One flavor, one image asset, four source typing/content edits, one targeted Sanity document patch, and Spec Kit artifacts

## Constitution Check

- **Single Source of Truth for Cross-Cutting Concerns**: PASS — route, cart identifier, metadata, and Snipcart fields continue to come from `routes` and `buildProductCartAttributes`; no checkout strings are reconstructed.
- **Editorial Data Drives Rendering**: PASS — Guava becomes data in the existing Sanity Flavor option group and uses the existing generic product template. The products landing page retains its existing repository-backed editorial collection; this change only appends the matching card required by that established architecture.
- **Third-Party Integration Fidelity**: PASS — no Snipcart or other vendor code is edited.
- **Spec-Driven Change Process**: PASS — specification, clarification scan, plan, tasks, routed plan, approval, implementation, and analysis are required in order.
- **CI Must Stay Green, Honestly**: PASS — verification uses the real build plus generated-output inspection; no test or lint coverage is claimed.
- **Technology Constraints**: PASS — existing Astro, Sanity, and Snipcart integrations are reused with no new dependency or environment variable.

The same checks remain satisfied after Phase 1 design. No constitution exception is required.

## Project Structure

### Documentation (this feature)

```text
specs/004-add-guava-cupcake/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── guava-catalog.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── content.config.ts                         # extend catalog flavor key validation
├── content/products/cupcakes.json            # append Guava catalog card
└── components/product/
    ├── CupcakeGrid.astro                     # extend catalog flavor key type
    └── CupcakeFlavorCard.astro               # extend card flavor key type

Sanity production dataset:
├── image-fa0b217d6dd22b1bc6c707290a7fe9ed35b7f148-4000x4000-png
└── product-chocolate-cupcake                  # append Guava to Flavor.options
```

**Structure Decision**: Keep the current dual editorial surfaces intact: Sanity remains authoritative for product routes and checkout behavior, while `src/content/products/cupcakes.json` remains the established products-page card source. Do not refactor the catalog architecture as part of this content addition.

## Design Decisions

- Download the public Drive asset identified by file ID `1oh-BXK0I8lfgOSixk-qBCO0zDMiLGX3X`; verify it is a 5,736,619-byte 4000×4000 RGBA PNG with SHA-256 `49016389bdd0ff1e6cfd4715e6d7d6c7d5ee8b3a4e094a7a34194d1577621bf6` before upload.
- Upload through the authenticated Sanity CLI/client context, which deduplicates identical assets by content hash, and record meaningful alt text on the Guava option image.
- Patch only `customOptions[_key == "flavor"].options`, using `_key: "guava"`, label `Guava`, slug `guava`, and the uploaded asset reference. Guard against an existing Guava entry and use the current document revision to avoid overwriting concurrent editorial changes.
- Append Guava after Strawberry in the products grid to preserve all existing flavor order.
- Use the working catalog description from the approved specification: “Tropical and fruity with a bright, sweet guava flavor.”
- Make no direct Snipcart API write. The existing product page and `/snipcart-products.json` are the merchant-owned product definitions; adding the Sanity route option causes both to expose the unique `cupcakes-guava` product definition.
- Keep the authenticated “Other Angles” folder out of scope; CUP-59 owns multi-image gallery behavior.

## Complexity Tracking

No constitution violations require justification.
