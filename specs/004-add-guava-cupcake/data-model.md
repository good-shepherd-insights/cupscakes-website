# Data Model: Add Guava Cupcake

## Guava Flavor Option

Nested under `Cupcakes.customOptions[_key == "flavor"].options`:

| Field | Value / rule |
|---|---|
| `_key` | `guava`, unique within the Flavor option array |
| `_type` | `customOptionValue` |
| `label` | `Guava` |
| `slug.current` | `guava`, unique route segment |
| `image.asset._ref` | Uploaded verified Guava `sanity.imageAsset` document |
| `image.alt` | `Guava cupcake with pink frosting` |

The option inherits the Cupcakes product's base price and the Quantity and Occasion groups. It has no flavor-specific price modifier.

## Guava Catalog Card

Appended to `src/content/products/cupcakes.json`:

| Field | Value / rule |
|---|---|
| `key` | `guava` |
| `name` | `Guava` |
| `description` | `Tropical and fruity with a bright, sweet guava flavor.` |
| `imageSrc` | CDN URL returned for the verified Sanity asset |
| `imageAlt` | `Guava cupcake with pink frosting` |
| `orderHref` | `/products/cupcakes/guava` |

## Derived Checkout Variant

No separately stored checkout record is introduced.

| Field | Derived value |
|---|---|
| ID | `cupcakes-guava` |
| Name | `Guava Cupcakes` |
| Price | Existing Cupcakes base price (`4`) |
| URL | `https://cupscakes.com/products/cupcakes/guava` |
| Metadata flavor | `Guava` |
| Custom fields | Existing Quantity and Occasion definitions |

## State and integrity rules

1. Precondition: no Flavor option has `_key == "guava"`, label `Guava`, or slug `guava`.
2. Upload/reuse the verified image asset.
3. Patch the current Cupcakes document revision with the Guava option.
4. Verify the public query returns Guava exactly once with the expected image reference.
5. Build the site and verify the derived route and checkout definition.
