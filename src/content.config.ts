import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// --- products page (Figma 3311:2985) ---
const productsThanksBannerSchema = z.object({
  section: z.literal("thanks-banner"),
  headline: z.string(),
});

const productsCategoryHeaderSchema = z.object({
  section: z.literal("category-header"),
  cupcakesHeading: z.string(),
  cupcakesCaption: z.string(),
  cupcakesHref: z.string(),
  personalCakesHeading: z.string(),
  personalCakesCaption: z.string(),
  personalCakesHref: z.string(),
});

// One flavor card on the products page. Keep this closed key list aligned
// with the local FlavorKey unions in the cupcake catalog components.
const productsCupcakeFlavorSchema = z.object({
  key: z.enum([
    "chocolate",
    "vanilla",
    "carrot",
    "butter-pecan",
    "pumpkin",
    "lemon",
    "strawberry",
    "guava",
  ]),
  name: z.string(),
  description: z.string(),
  imageAlt: z.string(),
  orderHref: z.string(),
});

const productsCupcakesSchema = z.object({
  section: z.literal("cupcakes"),
  heading: z.string(),
  caption: z.string(),
  flavors: z.array(productsCupcakeFlavorSchema).min(1),
});

const productsPersonalCakeSchema = z.object({
  key: z.enum(["chocolate", "vanilla"]),
  name: z.string(),
  description: z.string(),
  imageSrc: z.string(),
  imageAlt: z.string(),
  orderHref: z.string(),
});

const productsPersonalCakesSchema = z.object({
  section: z.literal("personal-cakes"),
  heading: z.string(),
  caption: z.string(),
  items: z.array(productsPersonalCakeSchema).min(1),
});

const products = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/products" }),
  schema: z.discriminatedUnion("section", [
    productsThanksBannerSchema,
    productsCategoryHeaderSchema,
    productsCupcakesSchema,
    productsPersonalCakesSchema,
  ]),
});

export const collections = { products };
