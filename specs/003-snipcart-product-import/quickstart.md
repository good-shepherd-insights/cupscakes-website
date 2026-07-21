# Quickstart: Validate Snipcart Product Import

1. Run `npm run build`.
2. Confirm `dist/snipcart-products.json` exists and parses as a JSON array.
3. Count objects and compare with generated product variants; confirm IDs are unique.
4. Confirm every object contains `id`, numeric `price`, an absolute canonical `url`, and `customFields` matching checkout price modifiers.
5. Confirm the generated response contains no HTML.
6. Run `rg -n 'snipcart-products\\.json' src --glob '!src/pages/snipcart-products.json.ts'`; expect no links or references.
7. Run `git diff --check`.

After deployment, enter the absolute import URL in Snipcart's dashboard fetch action or send it as `fetchUrl` to the rate-limited `POST /products` API using a server-held secret key.
