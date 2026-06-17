# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Planning convention

Before implementing any non-trivial change, use the `whiteboarding` skill (`~/.agents/skills/whiteboarding`) to produce a file-by-file, before/after execution plan in the repo root following its `TYPE(target).md` naming convention (e.g. `FEATURE(...)`, `REFACTOR(...)`). Get user approval on the plan before editing code. The existing `FEATURE(*).md` / `REFACTOR(*).md` files in the repo root are examples of this convention in practice.

## Commands

- `npm run dev` — start the Astro dev server (also serves the Sanity Studio at `/admin`).
- `npm run build` — production build.
- `npm run preview` — preview the production build.
- This is an Nx workspace (single project, no `project.json`). CI runs `npx nx affected -t lint test build`, but no `lint` or `test` npm scripts currently exist — only `build` is real today.
- Env vars (`.env`, see `.env.example`): `PUBLIC_SANITY_PROJECT_ID`, `PUBLIC_SANITY_DATASET` (defaults to `production`), `PUBLIC_SNIPCART_API_KEY`. These are validated through Astro's `env.schema` in `astro.config.mjs`.

## Architecture

**Stack:** Astro 6 + React (islands) + Tailwind v4, Sanity (embedded Studio at `/admin` via `@sanity/astro`), Snipcart v3 for cart/checkout.

**Two content sources — don't confuse them:**
- `src/content/**/*.json` — Astro content collections for static page copy/UI strings (home sections, order flow strings, product page chrome like `category-header.json`, `thanks-banner.json`). Loaded via `getCollection()` wrappers in `src/lib/content/*.ts` (e.g. `loadProductsContent()` in `src/lib/content/products.ts`), which assert that every expected `section` entry exists and throw early if one is missing — keeps pages from silently rendering with missing copy.
- Sanity (`src/sanity/schemaTypes/product.ts`) — the actual product catalog (name, price, slug, image, description, and a generic `customOptions` array of selection groups, each with a `name`, `inputType` (`radio`/`checkbox`), optional `helperText`, and reorderable `options`). Fetched through GROQ queries in `src/lib/sanity/queries/products.ts`, typed by `src/types/product.ts`.

**Product page is data-driven, not per-template.** `src/pages/products/[slug].astro` fetches a single Sanity product by slug and renders it through `PersonalCakeProduct.astro` — there is one canonical product detail design, and `PersonalCakeProduct.astro` renders one fieldset per entry in `customOptions`, so which groups appear is determined editorially (by presence/absence of a group in that array) rather than by per-field code toggles (see `FEATURE(product-catalog-extensibility).md` and `REFACTOR(product-order-page-dynamic).md` for the rationale/history). Adding a new customization group needs no schema or code change — add it via Sanity Studio.

**Snipcart integration is attribute-driven, not SDK-driven.** `src/lib/snipcart/attributes.ts` (`buildItemAttributes`) is the single place that builds `data-item-*` DOM attributes for `<AddToCartButton>` — components never construct these attributes themselves. `src/lib/snipcart/loader.ts` builds the official Snipcart loader `<script>` content; the minified IIFE inside it is copied verbatim from Snipcart's docs (one corrected bug noted in a comment) and must not be hand-edited.

**Order flow** (`src/pages/order*`) is a multi-step static flow (pickup-or-delivery → date selection → loading → cart), each step its own route under `src/pages/order/`, with shared step components in `src/components/order/`.

**Routes** are centralized as typed builders in `src/lib/routes.ts` (e.g. `routes.product(slug)`) — prefer these over hand-built path strings.

**Image handling:** Sanity images go through `src/lib/sanity/image.ts`; `src/lib/constants.ts` (`IMAGE_WIDTHS`) defines the two standard render widths (`card`, `detail`) used when building image URLs.

There is no `README.md`; root-level `FEATURE(*).md` / `REFACTOR(*).md` files document the intent and before/after diffs of major past changes and are useful history when touching the areas they describe.
