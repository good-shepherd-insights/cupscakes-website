# UI Contract: Cupcake Price Display

## Input contract

- Marketing components receive finite, non-negative numeric cupcake and Personal Cake base prices resolved from their product catalog records.
- Repository marketing content does not supply a price field.

## Output contract

- Homepage cupcake cards display the catalog amount as United States dollars with exactly two decimal places followed by ` each`.
- All products-page cupcake flavor cards display the identical formatted value.
- A catalog value of `4` displays as `$4.00 each`.
- A catalog value of `4.5` displays as `$4.50 each`.
- Personal Cake displays use the shared currency format without `each`; a catalog value of `25` displays as `$25.00`.

## Failure contract

- Generation stops before deployment if either `cupcakes` or `personal-cakes` cannot supply a valid base price.
- No hardcoded or cached repository fallback price is rendered.

## Compatibility contract

- Product names, descriptions, images, alternate text, links, quantity modifiers, occasion modifiers, cart calculations, and non-cupcake prices are unchanged.
