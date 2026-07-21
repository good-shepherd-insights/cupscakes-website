# Feature Specification: Snipcart JSON Product Import Document

**Feature Branch**: `feat/snipcart-product-import`

**Created**: 2026-07-21

**Status**: Draft

**Input**: User description: "Create a Snipcart JSON product-import document that ordinary users do not encounter and that does not affect existing storefront pages."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import the Catalog from One URL (Priority: P1)

As a store administrator, I can give Snipcart one stable URL that exposes every current purchasable product variant with the same IDs, base prices, validation URLs, and price-affecting options used by checkout.

**Why this priority**: A single import document makes initial inventory/catalog synchronization reliable without manually fetching every product page.

**Independent Test**: Fetch the import URL, confirm it contains one Snipcart product definition for every Sanity product variant, and compare its product attributes with the existing product-page attribute builder.

**Acceptance Scenarios**:

1. **Given** products and routed variants exist in Sanity, **When** the import document is generated, **Then** it contains one JSON object per variant.
2. **Given** a product has no route-defining variants, **When** the document is generated, **Then** it contains one default product definition.
3. **Given** a custom field is required or changes price, **When** Snipcart crawls the document, **Then** the field definition matches the existing checkout attributes.

---

### User Story 2 - Keep the Import Surface Out of the Storefront (Priority: P2)

As a customer, I do not see or navigate to the administrative import document during normal storefront use.

**Why this priority**: The import surface is machine-oriented and must not change the shopping experience.

**Independent Test**: Confirm the route returns only JSON, has no page/layout/navigation, and no internal links point to it.

**Acceptance Scenarios**:

1. **Given** a customer uses any existing page, **When** they browse the site, **Then** no link or visible UI exposes the import document.
2. **Given** someone directly visits the import URL, **When** the response loads, **Then** it contains machine-readable JSON rather than storefront UI.
3. **Given** Snipcart fetches the import URL, **When** it examines the response, **Then** the content type is `application/json`.

### Edge Cases

- Products without valid slugs are excluded consistently with existing product-page generation.
- Route-defining options without slugs are not emitted as importable variants.
- A missing configured site origin stops generation rather than producing relative validation URLs.
- A missing or invalid required Snipcart attribute stops generation with a descriptive error rather than emitting malformed JSON.
- A Sanity product with a missing, non-numeric, infinite, or negative price stops generation with a descriptive product-specific error.
- The document is unlinked, but because it contains public catalog data on a static site it remains technically retrievable by someone who already knows the URL.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose one stable product-import URL containing every current purchasable product variant.
- **FR-002**: Every imported product MUST reuse the existing Snipcart attribute-building logic.
- **FR-003**: Product IDs, names, base prices, validation URLs, and custom-field modifiers MUST match existing checkout definitions.
- **FR-004**: Validation URLs MUST remain the canonical existing product or product-variant pages.
- **FR-005**: The import document MUST return a JSON array with an `application/json` content type and render no storefront page.
- **FR-006**: No existing page, navigation component, content entry, route builder, or sitemap MUST link to the import document.
- **FR-007**: Every JSON product MUST include Snipcart's required `id`, `price`, `url`, and `customFields` fields plus its checkout-derived name.
- **FR-008**: The change MUST NOT add a client-side request, dependency, environment variable, runtime server, or Snipcart secret.

### Key Entities

- **Import Document**: The isolated static JSON route fetched by Snipcart.
- **Import Product Definition**: A JSON object built from an existing product/variant and its canonical validation URL.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of current Sanity product variants with valid slugs appear exactly once in the import document.
- **SC-002**: 100% of imported product attributes are produced by the existing checkout attribute builder rather than duplicated formatting logic.
- **SC-003**: Zero existing storefront files require modification.
- **SC-004**: Zero internal links expose the import route, and the route contains no HTML UI.

## Assumptions

- Product data is public storefront information rather than sensitive data.
- “Users should not access it” means the route is an unlinked machine-readable endpoint; strict request-level access control would require runtime infrastructure outside the current static architecture.
- Snipcart is triggered manually through its dashboard or rate-limited Products API after deployment.
