# Data Model: Sanity-Backed Display Pricing

## Product Price

The authoritative catalog value used by ordering and marketing displays.

| Field | Type | Rules |
|---|---|---|
| `slug` | string | Must equal the requested product slug; `cupcakes` or `personal-cakes` for this feature |
| `price` | number | Required, finite, and non-negative; represents the base per-cupcake amount before option modifiers |

### Relationships

- Each Product Price supplies every matching marketing and preview display.
- Existing quantity and occasion option modifiers remain attached to the product catalog record and are not altered by this feature.

### Failure behavior

- No matching product: static generation fails with a message identifying the missing slug.
- Missing, non-numeric, non-finite, or negative price: static generation fails with a message identifying the invalid product price.

## Cupcake Marketing Card

An existing presentation entity retained in repository content.

| Field | Type | Source |
|---|---|---|
| `key` | flavor identifier | Repository marketing content |
| `name` | string | Repository marketing content |
| `description` | string | Repository marketing content |
| `imageSrc` | URL/string | Repository marketing content |
| `imageAlt` | string | Repository marketing content |
| `orderHref` | path | Repository marketing content |
| displayed price | formatted string | Derived at generation time from Cupcake Product Price |

The card no longer stores a numeric or formatted price in repository content.

## Personal Cake Marketing Card

The homepage and products-page Personal Cake presentations retain editorial content while deriving their displayed price from the `personal-cakes` Product Price. Their repository content no longer stores a numeric or formatted price.

## State Transitions

There is no application-managed state transition. An editor changes the catalog price, and the next successful storefront generation derives updated static output from that value.
