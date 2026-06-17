/**
 * Snipcart data-attribute builder.
 *
 * Consuming pages call `buildItemAttributes()` with typed input and
 * spread the result onto `<AddToCartButton>`. The button component
 * itself does zero attribute logic — single responsibility.
 */

export interface CustomField {
  name: string;
  options?: string[];
  type?: string;
  required?: boolean;
  placeholder?: string;
  value?: string;
}

export interface ItemAttributesInput {
  id: string;
  name: string;
  price: number;
  url: string;
  description?: string;
  image?: string;
  customFields?: CustomField[];
  categories?: string[];
  metadata?: Record<string, string>;
  shippable?: boolean;
  quantity?: number;
}

/**
 * Builds the full Snipcart `data-item-*` attribute map from typed input.
 *
 * Returns a flat `Record<string, string>` safe to spread onto a
 * `<button>` element in Astro via `{...attrs}`.
 */
export function buildItemAttributes(input: ItemAttributesInput): Record<string, string> {
  const attrs: Record<string, string> = {
    'data-item-id': input.id,
    'data-item-price': String(input.price),
    'data-item-url': input.url,
    'data-item-name': input.name,
  };

  if (input.description) attrs['data-item-description'] = input.description;
  if (input.image) attrs['data-item-image'] = input.image;
  if (input.categories) attrs['data-item-categories'] = input.categories.join('|');
  if (input.metadata) attrs['data-item-metadata'] = JSON.stringify(input.metadata);
  if (input.shippable !== undefined) attrs['data-item-shippable'] = String(input.shippable);
  if (input.quantity !== undefined) attrs['data-item-quantity'] = String(input.quantity);

  for (let i = 0; i < (input.customFields?.length ?? 0); i++) {
    const field = input.customFields![i];
    const n = i + 1;
    attrs[`data-item-custom${n}-name`] = field.name;
    if (field.options) attrs[`data-item-custom${n}-options`] = field.options.join('|');
    if (field.type) attrs[`data-item-custom${n}-type`] = field.type;
    if (field.required) attrs[`data-item-custom${n}-required`] = 'true';
    if (field.placeholder) attrs[`data-item-custom${n}-placeholder`] = field.placeholder;
    if (field.value) attrs[`data-item-custom${n}-value`] = field.value;
  }

  return attrs;
}