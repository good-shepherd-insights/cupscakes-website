# Feature Specification: Sanity-Backed Product Display Pricing

**Feature Branch**: `fix/sanity-single-source-pricing`

**Created**: 2026-07-21

**Status**: Draft

**Input**: User description: "Remove hardcoded cupcake and Personal Cake prices from every storefront surface so Sanity is the single source of truth for displayed product prices."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Consistent Product Pricing (Priority: P1)

As a customer, I see the current cupcake and Personal Cake prices consistently on the homepage, product listing, product detail pages, preview surface, and cart flow so I can make a purchase decision without encountering conflicting amounts.

**Why this priority**: Conflicting prices undermine customer trust and can cause abandoned or disputed orders.

**Independent Test**: Inspect every customer-facing product-price surface and confirm cupcakes and Personal Cakes derive their numeric amounts from their respective product catalog records with the intended presentation text.

**Acceptance Scenarios**:

1. **Given** a cupcake base price exists in the product catalog, **When** the storefront is generated, **Then** the homepage cupcake cards display that price followed by "each".
2. **Given** the same catalog price, **When** the storefront is generated, **Then** every cupcake card on the products page displays that price followed by "each".
3. **Given** a customer opens a cupcake product detail page, **When** its price is shown and used for ordering, **Then** it uses the same catalog base price as the marketing cards.
4. **Given** a Personal Cake base price exists in the product catalog, **When** the homepage, products page, preview, or product-detail surface renders it, **Then** each location displays that same catalog amount.

---

### User Story 2 - Update Price Once (Priority: P2)

As a catalog editor, I update either product's base price in one authoritative location so future storefront builds reflect the new amount without a matching source-code edit.

**Why this priority**: A single update path prevents stale marketing prices and reduces the operational risk of missed locations.

**Independent Test**: Verify repository content and components contain no fallback numeric price for either product and that every page entry point resolves the appropriate catalog price.

**Acceptance Scenarios**:

1. **Given** the storefront currently displays one cupcake price, **When** an editor changes only the catalog base price and the storefront is regenerated, **Then** all cupcake price displays reflect the new amount.
2. **Given** static marketing content defines cupcake names and descriptions, **When** the catalog price changes, **Then** those unrelated marketing fields remain unchanged.
3. **Given** the storefront currently displays one Personal Cake price, **When** an editor changes only that catalog base price and the storefront is regenerated, **Then** all Personal Cake price displays reflect the new amount.

### Edge Cases

- If either required catalog record or its valid base price is unavailable during generation, generation must fail clearly rather than publish a guessed or stale hardcoded price.
- Currency display must retain two decimal places, including whole-dollar prices.
- Quantity and occasion modifiers must remain independent of the base-price presentation change.
- Prices for products outside cupcakes and Personal Cakes must remain unchanged.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST use each product catalog record's base price as the numeric source for every customer-facing cupcake and Personal Cake price display.
- **FR-002**: The homepage cupcake cards MUST display the authoritative base price with two decimal places and the presentation suffix "each".
- **FR-003**: Every cupcake card on the products page MUST display the same authoritative base price with two decimal places and the presentation suffix "each".
- **FR-004**: Homepage, products-grid, preview, and product-detail Personal Cake displays MUST use the authoritative base price with two decimal places.
- **FR-005**: Repository-managed marketing content and components MUST NOT store duplicate numeric cupcake or Personal Cake prices.
- **FR-006**: Product detail and cart pricing behavior MUST continue to use authoritative catalog base prices and existing option modifiers.
- **FR-007**: Storefront generation MUST fail with a clear error when either required catalog record or a valid base price cannot be obtained.
- **FR-008**: The change MUST NOT alter product names, descriptions, images, links, product modifiers, or unrelated product pricing.

### Key Entities

- **Cupcake Product**: The catalog record identified by the cupcake product slug; contains the authoritative numeric base price and existing customization options.
- **Personal Cake Product**: The catalog record identified by the Personal Cake product slug; contains the authoritative numeric base price and existing customization options.
- **Cupcake Marketing Card**: A homepage or products-page presentation of a cupcake flavor; retains editorial copy and imagery but derives its displayed numeric price from the Cupcake Product.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of customer-facing cupcake and Personal Cake price locations derive their base amount from the matching catalog record.
- **SC-002**: A catalog-only base-price update can change every matching product display on the next successful storefront generation with zero source-code price edits.
- **SC-003**: Zero duplicate numeric cupcake or Personal Cake prices remain in repository-managed content or components.
- **SC-004**: Existing product pages and cart calculations retain their current base-price and modifier behavior after the change.

## Assumptions

- The cupcake product slug remains `cupcakes` and uniquely identifies the authoritative catalog record.
- The Personal Cake product slug remains `personal-cakes` and uniquely identifies its authoritative catalog record.
- The storefront remains statically generated, so catalog changes become visible after the normal rebuild/deployment process rather than instantly.
- The storefront continues to display United States dollar amounts with two decimal places.
- The word "each" is presentation copy and is not part of the numeric catalog value.
- Automated test and lint scripts do not currently exist; the production build remains the CI gate, while this implementation uses source-contract and diff checks because the user waived another local build.
