import type { SchemaItem } from '../../types/seo';

export function serializeJsonLd(item: SchemaItem): string {
  return JSON.stringify(item)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
