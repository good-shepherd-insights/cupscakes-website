# Data Model: Snipcart Import Document

## Import Product Definition

| Field | Source |
|---|---|
| ID | Existing `buildProductCartAttributes` product/variant convention |
| Name | Sanity product name plus selected variant label |
| Base price | Sanity product price |
| URL | Absolute canonical existing product or variant route |
| Custom fields | Sanity non-route option groups transformed by existing builder |
| Custom field options/type/required | Existing flattened checkout attribute map |

Route-defining options create individual import definitions. A product without such a group creates one `default` definition.
