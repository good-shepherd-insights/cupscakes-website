# Contract: Snipcart Product Import Document

- Route: `GET /snipcart-products.json`
- Representation: static JSON array with `Content-Type: application/json`
- Visibility: no page, layout, UI, or internal links
- Machine contract: one object per valid product variant with `id`, `name`, `price`, `url`, and `customFields`
- Validation contract: every `url` points to the existing absolute canonical product page
- Security contract: contains public catalog information and no API secret
