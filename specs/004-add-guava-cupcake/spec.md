# Feature Specification: Add Guava Cupcake

**Feature Branch**: `feature/cup-66`

**Created**: 2026-07-21

**Status**: Draft

**Input**: User description: "Do CUP-66 by adding Guava to Snipcart correctly and following the same patterns as the other cupcakes."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and Order Guava Cupcakes (Priority: P1)

As a customer, I can find Guava alongside the existing cupcake flavors, open its order page, and add a correctly identified Guava cupcake selection to my cart.

**Why this priority**: The ticket's value is complete only when Guava is both visible in the catalog and orderable through the same flow as every existing cupcake flavor.

**Independent Test**: Visit the cupcake catalog, select Guava, confirm the Guava product view and image, add the default order to the cart, and verify that the cart identifies the item as Guava Cupcakes at the standard cupcake price and quantity rules.

**Acceptance Scenarios**:

1. **Given** the customer is viewing the cupcake catalog, **When** the catalog loads, **Then** a Guava card appears with the supplied no-shadow product image, descriptive text, the current cupcake price, and an order action.
2. **Given** the customer selects the Guava order action, **When** the product page loads, **Then** Guava is the active flavor and the supplied Guava image is displayed.
3. **Given** the customer is on the Guava product page, **When** they add a valid cupcake configuration to the cart, **Then** the cart item is uniquely identified as Guava Cupcakes and uses the same pricing and customization rules as other cupcake flavors.
4. **Given** the checkout catalog is refreshed, **When** orderable cupcake variants are enumerated, **Then** Guava is included once with a canonical Guava product URL.

### Edge Cases

- The inaccessible "Other Angles" asset folder does not block the single primary image required for this ticket.
- Guava must not duplicate an existing flavor key, route, cart identifier, or checkout-catalog entry.
- If the supplied primary image cannot be stored or resolved, the Guava flavor must not be published with a broken image reference.
- Existing cupcake flavors, prices, quantities, occasions, and cart behavior must remain unchanged.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The cupcake catalog MUST include exactly one Guava flavor card.
- **FR-002**: The Guava card and Guava order view MUST use the supplied no-shadow Guava image and meaningful alternative text.
- **FR-003**: Customers MUST be able to navigate directly to a stable Guava cupcake order URL.
- **FR-004**: Guava MUST participate in the existing cupcake price, quantity, occasion, and cart rules without flavor-specific checkout logic.
- **FR-005**: A Guava cart item MUST retain Guava as its flavor identity and MUST use a unique, stable item identifier.
- **FR-006**: The checkout catalog MUST expose one valid Guava cupcake variant using its canonical order URL.
- **FR-007**: Existing cupcake flavor records and ordering behavior MUST remain unchanged.
- **FR-008**: Additional Guava gallery images MUST remain outside this ticket; they are covered by the separate flavor-gallery work.

### Key Entities *(include if feature involves data)*

- **Cupcake Flavor**: An orderable flavor with a unique key, display name, description, route segment, primary image, and alternative text.
- **Checkout Variant**: The orderable representation of a cupcake flavor, identified by its stable product identifier and canonical product URL while sharing the parent cupcake product's price and customization rules.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Guava appears exactly once in the cupcake catalog and exactly once in the generated checkout catalog.
- **SC-002**: A customer can reach the Guava order view from the catalog and add a Guava item to the cart without encountering a broken link or missing image.
- **SC-003**: The cart displays Guava as the selected flavor and calculates the same total as another cupcake flavor with the same quantity and occasion selections.
- **SC-004**: All existing build validation completes successfully with no changes to the rendered or orderable behavior of the seven existing cupcake flavors.

## Assumptions

- The publicly accessible `C&C_GUAVA_CUPCAKE_002_NO_SHADOW.png` asset is the primary Guava image for this ticket.
- The authenticated "Other Angles" folder is reserved for CUP-59's multi-image gallery scope and is not required here.
- Guava uses the current Cupcakes product price and all existing Cupcakes customization groups.
- Guava catalog copy follows the tone of existing flavor descriptions; the working description is "Tropical and fruity with a bright, sweet guava flavor."
- The existing Cupcakes product and category remain the authoritative parent records; Guava is a new flavor option, not a separate top-level product.
