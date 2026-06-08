import { getCollection } from "astro:content";

/**
 * Loads the `home` content collection. Throws if any required entry
 * is missing or if any entry's `section` field disagrees with its key.
 */
export async function loadHomeContent() {
  const entries = await getCollection("home");
  const bySection = new Map(entries.map((e) => [e.data.section, e]));

  function requireSection<S extends string>(section: S) {
    const entry = bySection.get(section);
    if (!entry) {
      throw new Error(
        `Missing home content entry for section "${section}". Add src/content/home/${section}.json.`,
      );
    }
    if (entry.data.section !== section) {
      throw new Error(
        `home content entry id mismatch: expected section "${section}" but got "${entry.data.section}".`,
      );
    }
    return entry.data as Extract<typeof entry.data, { section: S }>;
  }

  function stripSection<T extends { section: string }>(d: T): Omit<T, "section"> {
    const { section: _section, ...rest } = d;
    return rest;
  }

  return {
    navbar: stripSection(requireSection("navbar")),
    hero: stripSection(requireSection("hero")),
    ourStory: stripSection(requireSection("our-story")),
    cupcakesBanner: stripSection(requireSection("cupcakes-banner")),
    cupcakeCarousel: stripSection(requireSection("cupcake-carousel")),
    personalCakes: stripSection(requireSection("personal-cakes")),
    followUs: stripSection(requireSection("follow-us")),
    footer: stripSection(requireSection("footer")),
  };
}
