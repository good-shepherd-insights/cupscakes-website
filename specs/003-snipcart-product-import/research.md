# Research: Snipcart Product Import

## Verified Snipcart behavior

- Snipcart products are defined on the merchant site; they cannot be directly created through the Products resource.
- `POST /products` accepts a `fetchUrl` pointing to either HTML or a JSON document.
- Snipcart's JSON crawler accepts a single product or an array; `id`, `price`, `url`, and `customFields` are the validation contract, and import documents may also supply `name`.
- The endpoint is rate-limited and should not be called in a tight loop.
- `data-item-url` remains the order-validation URL and must identify the real product definition.

Sources:

- https://docs.snipcart.com/v3/api-reference/products
- https://docs.snipcart.com/v3/setup/products
- https://docs.snipcart.com/v3/setup/order-validation

## Decision

Use an unlinked static JSON array rather than an HTML page or protected runtime endpoint. Translate the existing checkout attribute builder's output into the documented JSON fields, keep validation on existing product pages, and add no secret-bearing code.
