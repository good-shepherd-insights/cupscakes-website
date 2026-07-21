# Implementation Plan: Snipcart JSON Product Import Document

**Branch**: `feat/snipcart-product-import` | **Date**: 2026-07-21 | **Spec**: [spec.md](spec.md)

## Summary

Add one isolated static Astro endpoint at `/snipcart-products.json`. It queries existing Sanity products, expands route-defining variants, computes canonical absolute product URLs, calls `buildProductCartAttributes`, and translates the shared attribute map into Snipcart's documented JSON crawler representation. It produces no HTML or storefront UI.

## Technical Context

**Language/Version**: TypeScript 5.8, Astro 6.3
**Dependencies**: Existing Astro, Sanity, and Snipcart modules only
**Storage**: Existing Sanity product catalog
**Testing**: `npm run build`, generated-output inspection, source link search, and `git diff --check`
**Target**: Existing static Vercel deployment
**Scope**: One new endpoint and Spec Kit artifacts

## Constitution Check

- **Single Source of Truth**: PASS — uses `getAllProducts`, `routes`, and `buildProductCartAttributes`.
- **Editorial Data Drives Rendering**: PASS — variants and options come from Sanity.
- **Third-Party Fidelity**: PASS — no vendor code changes.
- **Spec Process**: PASS — feature artifacts precede implementation.
- **Honest CI**: PASS — build plus generated/source inspection; no test/lint claim.
- **Technology Constraints**: PASS — no dependency, adapter, secret, or environment change.

## Project Structure

```text
src/pages/snipcart-products.json.ts       # create
specs/003-snipcart-product-import/       # feature artifacts
```

## Design Decisions

- JSON import is chosen because Snipcart officially supports fetching an array of product objects from a JSON document.
- Existing canonical product pages remain validation URLs; the JSON endpoint is discovery only, not a replacement validation endpoint.
- The endpoint derives JSON from `buildProductCartAttributes` so existing ID, name, price, URL, and custom-field formatting remains authoritative.
- Invalid Sanity prices and missing required checkout attributes stop generation with descriptive errors instead of emitting malformed JSON.
- No route is added to navigation or content.
- Optional image data is omitted to avoid duplicating product-page image-selection rules.

## Source Contract

The new endpoint MUST:

1. Call `getAllProducts()`.
2. Emit each valid route variant, or one default definition when no route group exists.
3. Build absolute URLs through `routes` plus the endpoint's configured `site` context.
4. Call `buildProductCartAttributes()` for every emitted definition.
5. Return an `application/json` array containing documented Snipcart product fields.

No existing source file changes.
