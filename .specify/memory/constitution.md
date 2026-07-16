<!--
Sync Impact Report
- Version change: none → 1.0.0 (initial ratification)
- Modified principles: n/a (first version)
- Added sections: Core Principles (I-V), Technology Constraints, Development Workflow, Governance
- Removed sections: none
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ generic, no repo-specific reference to fix
  - .specify/templates/spec-template.md ✅ generic, no repo-specific reference to fix
  - .specify/templates/tasks-template.md ✅ generic, no repo-specific reference to fix
  - .claude/skills/speckit-*/SKILL.md ✅ generic, agent-agnostic, no fix needed
  - CLAUDE.md ⚠ pending — still documents the pre-spec-kit "whiteboarding" planning
    convention as authoritative; Principle IV below supersedes it. Left as-is here
    because CLAUDE.md is user-managed documentation, not a spec-kit artifact; a
    human should update it to point at spec-kit when convenient.
- Follow-up TODOs: none
-->

# Cupscakes Website Constitution

## Core Principles

### I. Single Source of Truth for Cross-Cutting Concerns
Logic that multiple components would otherwise duplicate MUST live in exactly
one place: Snipcart `data-item-*` attributes are built only by
`buildItemAttributes` in `src/lib/snipcart/attributes.ts`; page routes are
built only through the typed builders in `src/lib/routes.ts`; Sanity image
URLs are built only through `src/lib/sanity/image.ts`. Components MUST call
these, never reconstruct the underlying strings/attributes themselves.
Rationale: this codebase has already been bitten by drift when the same
concern was encoded in more than one place (see `FEATURE(snipcart-integration).md`
history); a single call site makes the concern auditable and fixable in one
edit.

### II. Editorial Data Drives Rendering, Not Code Branches
Where content is modeled in Sanity (e.g. a product's `customOptions`), the
presence or absence of data — not a per-field code toggle — determines what
renders. `PersonalCakeProduct.astro` renders one fieldset per `customOptions`
entry; adding a new customization group must not require a code change.
Rationale: keeps the one canonical product template correct for every
product without special-casing (see `FEATURE(product-catalog-extensibility).md`,
`REFACTOR(product-order-page-dynamic).md`).

### III. Third-Party Integration Fidelity
Vendor-provided code (the Snipcart loader IIFE in `src/lib/snipcart/loader.ts`,
and any future embedded third-party script) MUST be kept verbatim against the
vendor's published source. A deviation from verbatim MUST be recorded as an
inline comment explaining exactly what was changed and why. Silent hand-edits
to vendor code are prohibited.
Rationale: vendor scripts are opaque; undocumented edits are unreviewable and
untraceable when the vendor ships an update.

### IV. Spec-Driven Change Process (NON-NEGOTIABLE)
Every feature, fix, or refactor to repository code MUST go through the Spec
Kit workflow — constitution → specify → clarify → plan → tasks → analyze →
implement — before code is written. This supersedes this repository's prior
`CLAUDE.md`-documented convention of ad hoc `whiteboarding`-skill plan files
(`FEATURE(*).md` / `REFACTOR(*).md` in the repo root); those files remain as
historical record but are no longer how new plans are produced.
Rationale: mandated globally for this developer's projects; the prior
convention produced good artifacts but had no enforced phase gates
(clarify, analyze) and no machine-checkable link from spec to tasks.

### V. CI Must Stay Green, Honestly
`npx nx affected -t lint test build` runs on every push to `main` and every
pull request. `build` is the only target with a real implementation today;
`lint` and `test` are declared in CI but have no corresponding npm scripts
yet. Work MUST NOT claim test or lint coverage that does not exist — if a
plan or task references "tests," it MUST either point at real, executable
tests it is adding, or explicitly state that verification is manual (e.g.
via browser check) because no test runner exists yet.
Rationale: `build` failing has historically been the only automatic signal;
overclaiming coverage in specs/plans would give false confidence.

## Technology Constraints

- Stack is fixed: Astro 6 + React (islands) + Tailwind v4, Sanity (embedded
  Studio at `/admin` via `@sanity/astro`), Snipcart v3 for cart/checkout.
  Introducing a competing library for any of these (a second cart SDK, a
  second CMS, a second component framework) requires a constitution
  amendment, not a plan-level decision.
- This is an Nx workspace (single project, no `project.json`).
- Environment variables (`PUBLIC_SANITY_PROJECT_ID`, `PUBLIC_SANITY_DATASET`,
  `PUBLIC_SNIPCART_API_KEY`) are validated through Astro's `env.schema` in
  `astro.config.mjs` — new required env vars MUST be added there, not read
  ad hoc from `import.meta.env`.

## Development Workflow

- Branch naming follows the prefixes already established in this repo's
  history: `feat/`, `fix/`, `refactor/`, `chore/`, `release/`. A bug fix
  branch is named `fix/<short-slug>`.
- "Done" on a tracked issue means merged into `main` — not merely PR-opened,
  and not gated on a production release (a same-pass production release is
  noted separately but doesn't change when Done is set).
- CI (`.github/workflows/ci.yml`) runs `nx affected -t lint test build` on
  push to `main` and on every PR; a change MUST NOT be merged with a failing
  `build`.

## Governance

This constitution supersedes prior informal conventions, including the
`CLAUDE.md`-documented `whiteboarding` planning process (see Principle IV).
Amendments are made via the `speckit-constitution` workflow: propose the
change, update this file, bump the version per semantic versioning (MAJOR =
backward-incompatible principle removal/redefinition, MINOR = new principle
or materially expanded guidance, PATCH = wording/clarification), and update
the Sync Impact Report at the top of this file. Every `plan.md` produced by
the `speckit-plan` phase MUST include a Constitution Check against the
principles above, or record an explicit, justified exception.

**Version**: 1.0.0 | **Ratified**: 2026-07-14 | **Last Amended**: 2026-07-14
