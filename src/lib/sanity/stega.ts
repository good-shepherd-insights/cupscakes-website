import { stegaClean } from '@sanity/client/stega';

/**
 * Sanity's stega visual-editing encoding injects invisible Unicode into
 * every GROQ string value. Harmless for plain display text, but fatal for
 * anything used functionally — an href like "#who-we-are" carrying hidden
 * characters no longer exact-matches the target element's id. Any loader
 * returning Sanity content that might end up in an href/id-sensitive spot
 * should clean its entire returned tree before it goes out.
 */
export function deepStegaClean<T>(value: T): T {
  if (typeof value === 'string') return stegaClean(value) as T;
  if (Array.isArray(value)) return value.map((item) => deepStegaClean(item)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, deepStegaClean(val)]),
    ) as T;
  }
  return value;
}
