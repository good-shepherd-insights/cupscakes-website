# Implementation Plan: Sanity-Backed Product Display Pricing

**Branch**: `fix/sanity-single-source-pricing` | **Date**: 2026-07-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-sanity-pricing-source/spec.md`

## Summary

Make each Sanity product's numeric base price authoritative across cupcake and Personal Cake homepage, products-grid, preview, product-detail, and cart surfaces. Reuse one required-price query and shared currency formatters, pass fetched numbers into the existing marketing components, and remove duplicate numeric price strings from repository content and preview code. Missing or invalid catalog pricing fails static generation explicitly.

## Technical Context

**Language/Version**: TypeScript 5.8, Astro 6.3

**Primary Dependencies**: `@sanity/astro` 3.1, `@sanity/client` 7.22, React 19.2, Tailwind CSS 4.3

**Storage**: Sanity `production` dataset for product catalog data; Astro JSON content collections for non-price marketing content

**Testing**: No executable test or lint scripts exist; the user waived another local build, so this implementation uses repository searches and diff checks while normal PR CI retains the build gate

**Target Platform**: Statically generated website deployed through the existing Vercel workflow

**Project Type**: Astro web application with embedded Sanity Studio and a client-side cart island

**Performance Goals**: No client-side price fetch or visual loading state; prices are resolved during the existing static generation pass

**Constraints**: Preserve current routes, card content, modifiers, checkout calculations, and non-cupcake pricing; add no dependency or environment variable

**Scale/Scope**: Two catalog records, two homepage sections, nine products-grid flavor cards, one preview route, and existing generated product-detail variants

## Constitution Check

*GATE: Passed before research and re-checked after design.*

- **I. Single Source of Truth**: PASS. Numeric cupcake and Personal Cake base prices are removed from marketing code/content and read from the catalog through one query function; display formatting lives in one formatter module.
- **II. Editorial Data Drives Rendering**: PASS. The existing Sanity product record drives the numeric price while static content continues to drive unrelated marketing copy.
- **III. Third-Party Integration Fidelity**: PASS. No vendor-provided code changes.
- **IV. Spec-Driven Change Process**: PASS. Artifacts are generated under `specs/002-sanity-pricing-source/` before implementation.
- **V. CI Must Stay Green, Honestly**: PASS. Verification uses the real build target and explicitly records that no test or lint runner exists.
- **Technology Constraints**: PASS. Existing Astro, Sanity, and Snipcart integrations are reused with no new dependency or environment variable.

Post-design re-check: PASS. The interface and data model preserve these outcomes with no exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/002-sanity-pricing-source/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── pricing-display.md
├── tasks.md
└── whiteboard.md
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── home/CupcakeCarousel.astro
│   ├── home/PersonalCakes.astro
│   ├── product/CupcakeGrid.astro
│   └── product/PersonalCakeGrid.astro
├── content/home/personal-cakes.json
├── content/products/cupcakes.json
├── content/products/personal-cakes.json
├── content.config.ts
├── lib/
│   ├── format/productPrice.ts
│   └── sanity/queries/products.ts
└── pages/
    ├── index.astro
    ├── products/index.astro
    └── products/preview-personal-cake.astro
```

**Structure Decision**: Keep the existing single Astro application. Extend its Sanity query layer and introduce one small shared formatter under `src/lib/format/`; feed the result through existing page/component boundaries rather than adding runtime infrastructure.

## Complexity Tracking

No constitution violations require justification.
