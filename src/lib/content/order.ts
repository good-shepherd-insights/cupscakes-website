import { getCollection } from "astro:content";

/**
 * Loads the `order` content collection. Throws if any required entry is
 * missing or if any entry's `section` field disagrees with its key.
 */
export async function loadOrderContent() {
  const entries = await getCollection("order");
  const bySection = new Map(entries.map((e) => [e.data.section, e]));

  function requireSection<S extends string>(section: S) {
    const entry = bySection.get(section);
    if (!entry) {
      throw new Error(
        `Missing order content entry for section "${section}". Add src/content/order/${section}.json.`,
      );
    }
    if (entry.data.section !== section) {
      throw new Error(
        `order content entry id mismatch: expected section "${section}" but got "${entry.data.section}".`,
      );
    }
    return entry.data as Extract<typeof entry.data, { section: S }>;
  }

  function stripSection<T extends { section: string }>(d: T): Omit<T, "section"> {
    const { section: _section, ...rest } = d;
    return rest;
  }

  return {
    pickupOrDelivery: stripSection(requireSection("order-pickup-or-delivery")),
  };
}
