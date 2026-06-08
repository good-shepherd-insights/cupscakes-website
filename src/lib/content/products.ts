import { getCollection } from "astro:content";

/**
 * Loads the `products` content collection. Throws if any required entry
 * is missing or if any entry's `section` field disagrees with its key.
 */
export async function loadProductsContent() {
  const entries = await getCollection("products");
  const bySection = new Map(entries.map((e) => [e.data.section, e]));

  function requireSection<S extends string>(section: S) {
    const entry = bySection.get(section);
    if (!entry) {
      throw new Error(
        `Missing products content entry for section "${section}". Add src/content/products/${section}.json.`,
      );
    }
    if (entry.data.section !== section) {
      throw new Error(
        `products content entry id mismatch: expected section "${section}" but got "${entry.data.section}".`,
      );
    }
    return entry.data as Extract<typeof entry.data, { section: S }>;
  }

  function stripSection<T extends { section: string }>(d: T): Omit<T, "section"> {
    const { section: _section, ...rest } = d;
    return rest;
  }

  return {
    thanksBanner: stripSection(requireSection("thanks-banner")),
    categoryHeader: stripSection(requireSection("category-header")),
    cupcakes: stripSection(requireSection("cupcakes")),
    personalCakes: stripSection(requireSection("personal-cakes")),
  };
}
