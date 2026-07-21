export function formatProductPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function formatProductPriceEach(price: number): string {
  return `${formatProductPrice(price)} each`;
}
