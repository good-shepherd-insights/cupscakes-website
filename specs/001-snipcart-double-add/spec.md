# Feature Specification: Fix Add-to-Cart Double-Add

**Feature Branch**: `fix/snipcart-double-add-on-click`

**Created**: 2026-07-14

**Status**: Draft

**Input**: User description: "Fix guaranteed bug: clicking Add to Cart once adds the item to the Snipcart cart twice"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Single click adds exactly one item (Priority: P1)

A customer on a product page selects their options and clicks "Add to Cart"
exactly once. They expect the cart to contain one of that item, at the
quantity and configuration they selected — not two.

**Why this priority**: This is the core purchase action for the entire
storefront. Every customer hits it, and a silent quantity/price doubling
directly costs customers money and erodes trust at the single most
revenue-critical moment in the site.

**Independent Test**: On any product page, make a valid selection, click
"Add to Cart" once, then open the cart. Can be fully tested by counting the
line-item quantity and cart total after one click, independent of any other
fix in this feature.

**Acceptance Scenarios**:

1. **Given** a product page with a valid (or no-selection-required) product,
   **When** the customer clicks "Add to Cart" once, **Then** the cart
   contains exactly one unit of that item at the correct configured price.
2. **Given** a product with required customization groups all satisfied,
   **When** the customer clicks "Add to Cart" once, **Then** the cart shows
   one line item whose custom field values match the customer's selections
   exactly once (not duplicated or concatenated).
3. **Given** the customer has just navigated to the product page via an
   in-app link (client-side route swap, not a full page load), **When** they
   click "Add to Cart" once, **Then** the cart still contains exactly one
   unit — the bug must not depend on how the page was reached.

---

### User Story 2 - Repeated intentional clicks still add one item each (Priority: P2)

A customer who wants two of an item clicks "Add to Cart" twice, deliberately.
Each click should add exactly one unit, so two clicks produce a quantity of
two — not four.

**Why this priority**: Confirms the fix addresses the per-click duplication
itself, rather than merely hiding it behind a debounce that would also
suppress legitimate repeated adds.

**Independent Test**: Click "Add to Cart" twice with a pause between clicks,
then verify the cart quantity is 2, not 4.

**Acceptance Scenarios**:

1. **Given** an empty cart, **When** the customer clicks "Add to Cart" once,
   waits for the cart to acknowledge the add, then clicks it again,
   **Then** the cart quantity for that item is 2.

---

### Edge Cases

- What happens on a rapid double-click (two clicks faster than the cart can
  visually confirm the first)? The system must still register this as two
  separate customer-initiated clicks and add two units total — not four,
  and not one (the fix must not turn a real double-click into a missed add).
- What happens if the customer clicks "Add to Cart" before the cart widget
  has finished loading in the background? The click must still result in
  exactly one item added once the cart is ready, not zero and not two.
- What happens on a product whose customization triggers an on-page price/
  message-field update (e.g., a "Custom" option revealing a message box)
  immediately before the click? The single click must still add exactly one
  item with the currently-selected configuration.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST add exactly one unit of an item to the cart
  per single customer click on "Add to Cart", regardless of which product
  page the click occurs on.
- **FR-002**: The system MUST NOT change how many units are added based on
  whether the product page was reached via a full page load or an in-app
  (client-side) navigation.
- **FR-003**: The system MUST continue to add one unit per click when the
  customer clicks "Add to Cart" multiple times in a row — N clicks MUST
  result in N units added, not more.
- **FR-004**: The added cart line item's configured options (flavor, size,
  frosting, custom message, etc.) MUST reflect the customer's on-page
  selection exactly once — not duplicated, blank, or merged from a prior
  selection.
- **FR-005**: The fix MUST NOT introduce a click debounce/lockout that
  causes a genuine second click (Story 2) to be silently dropped instead of
  adding a second unit.

### Key Entities

- **Cart line item**: One product configuration (flavor/size/frosting/etc.)
  and its quantity, as it appears in the customer-facing Snipcart cart after
  an "Add to Cart" click.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of single "Add to Cart" clicks, across every product page
  and every navigation path (fresh page load and in-app navigation), result
  in a cart quantity increase of exactly 1 for that item.
- **SC-002**: Zero customer-reported or QA-observed cases of cart quantity
  or total price silently doubling relative to the number of clicks made,
  verified across at least 3 consecutive manual test passes per navigation
  path.
- **SC-003**: N deliberate, separated clicks on "Add to Cart" continue to
  produce a cart quantity of exactly N (no regression from the fix toward
  under-counting).

## Assumptions

- "Add to Cart" refers to the storefront's single add-to-cart entry point —
  the `AddToCartButton` rendered on each product detail page — since that is
  the only such control in the codebase today.
- The bug is reproducible without any unusual network conditions (i.e. it is
  a client-side logic issue, not a flaky-network double-submit), since the
  user described it as a guaranteed, already-discovered issue rather than an
  intermittent one.
- "Called twice" means the customer-visible outcome (cart quantity/total)
  doubles for a single click; the underlying mechanism (duplicate event
  listener, duplicate API call, etc.) is a planning/implementation concern,
  not a spec concern.
- Fixing this does not require changing which fields sync to the cart item,
  only ensuring the add happens once per click.
