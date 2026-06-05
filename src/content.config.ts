import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// One entry per section file under src/content/home/<id>.json.
// `section` is the discriminator and must equal the file basename
// (without extension) so the schema variant matches the entry's id.
//
// Field names and defaults mirror each ported component's `Props`
// exactly, so a page can spread an entry's `.data` straight into the
// component (e.g. `<Hero {...hero.data} />`) without remapping.
const navbarSchema = z.object({
  section: z.literal("navbar"),
  homeHref: z.string(),
  whoHref: z.string(),
  orderHref: z.string(),
  favoritesHref: z.string(),
  cartHref: z.string(),
});

const heroSchema = z.object({
  section: z.literal("hero"),
  headline: z.string(),
  ctaLabel: z.string(),
  orderHref: z.string(),
});

const ourStorySchema = z.object({
  section: z.literal("our-story"),
  heading: z.string(),
  paragraph1: z.string(),
  paragraph2: z.string(),
  paragraph3: z.string(),
});

const cupcakesBannerSchema = z.object({
  section: z.literal("cupcakes-banner"),
  headline: z.string(),
});

const cupcakeCarouselSchema = z.object({
  section: z.literal("cupcake-carousel"),
  caption: z.string(),
  orderHref: z.string(),
  otherOptionsHref: z.string(),
  otherOptionsLabel: z.string(),
});

const personalCakesSchema = z.object({
  section: z.literal("personal-cakes"),
  heading: z.string(),
  caption: z.string(),
  flavorHeadline: z.string(),
  price: z.string(),
  chocolateHref: z.string(),
  chocolateLabel: z.string(),
  vanillaHref: z.string(),
  vanillaLabel: z.string(),
});

const followUsSchema = z.object({
  section: z.literal("follow-us"),
  heading: z.string(),
  facebookHref: z.string(),
  instagramHref: z.string(),
});

const footerSchema = z.object({
  section: z.literal("footer"),
  whoHref: z.string(),
  orderHref: z.string(),
  topHref: z.string(),
  copyright: z.string(),
});

const home = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/home" }),
  schema: z.discriminatedUnion("section", [
    navbarSchema,
    heroSchema,
    ourStorySchema,
    cupcakesBannerSchema,
    cupcakeCarouselSchema,
    personalCakesSchema,
    followUsSchema,
    footerSchema,
  ]),
});

export const collections = { home };
