# Data Model: Fix Add-to-Cart Double-Add

**Feature**: [spec.md](./spec.md) | **Date**: 2026-07-14

This fix does not introduce, remove, or change any persisted or modeled
entity. It corrects a client-side event-handling defect that causes an
existing entity to be created twice per intended action.

## Entities touched (unchanged shape)

### Cart line item (owned by Snipcart, not this codebase)

- **Fields**: `uniqueId`, `id` (product slug), `name`, `price`, `quantity`,
  `image`, `url`, custom field values (`data-item-customN-*`, synced by
  `syncCustomFields()` in `src/lib/snipcart/cartSync.ts`).
- **Source of truth**: Snipcart's own cart API
  (`app.snipcart.com/api/cart/{cartId}/items`); this project only supplies
  the initial `data-item-*` attributes read by Snipcart's client SDK.
- **Defect being fixed**: a single "Add to Cart" click, reached via an
  in-app (ClientRouter) navigation, currently causes Snipcart's own SDK to
  process the click twice, creating **two** line-item entities (distinct
  `uniqueId`s) for what should be one `POST .../items` call. See
  [research.md](./research.md) Finding 3.
- **No schema change**: the fix changes *how many times* an add request is
  sent, not the shape of the request or the resulting entity.

## State transitions

None introduced. The existing transition (`button click` → `one Snipcart
line item created or incremented`) is unchanged in kind; this fix restores
its cardinality to exactly one line-item-creation per click.
