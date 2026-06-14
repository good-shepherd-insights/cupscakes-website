import { getCollection } from "astro:content";

/**
 * Loads the `cart` content collection. Throws if the required entry is
 * missing or if its `section` field disagrees with the key.
 */
export async function loadCartContent() {
  const entries = await getCollection("cart");
  const bySection = new Map(entries.map((e) => [e.data.section, e]));

  function requireSection<S extends string>(section: S) {
    const entry = bySection.get(section);
    if (!entry) {
      throw new Error(
        `Missing cart content entry for section "${section}". Add src/content/cart/${section}.json.`,
      );
    }
    if (entry.data.section !== section) {
      throw new Error(
        `cart content entry id mismatch: expected section "${section}" but got "${entry.data.section}".`,
      );
    }
    return entry.data as Extract<typeof entry.data, { section: S }>;
  }

  function stripSection<T extends { section: string }>(d: T): Omit<T, "section"> {
    const { section: _section, ...rest } = d;
    return rest;
  }

  return {
    cart: stripSection(requireSection("shopping-cart")),
  };
}
