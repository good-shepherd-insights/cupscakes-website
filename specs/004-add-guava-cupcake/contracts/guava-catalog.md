# Contract: Guava Catalog and Checkout Representation

## Storefront contract

- The products page contains one Guava card linking to `/products/cupcakes/guava`.
- The Guava route renders the verified no-shadow image and marks Guava as the active flavor.
- The Guava Add to Cart element carries the existing shared Cupcakes price and custom fields.

## Checkout identity contract

The existing shared checkout builder must derive:

```json
{
  "id": "cupcakes-guava",
  "name": "Guava Cupcakes",
  "price": 4,
  "url": "https://cupscakes.com/products/cupcakes/guava"
}
```

The generated Snipcart JSON object must also contain the existing Quantity and Occasion `customFields`. No direct Snipcart-specific product record or Guava-only checkout branch is allowed.

## Compatibility contract

- Existing seven flavor IDs, routes, labels, images, order, and checkout definitions are unchanged.
- The Cupcakes product price and non-flavor option groups are unchanged.
- The generated catalog contains eight unique cupcake flavor routes after the addition.
