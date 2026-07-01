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
  productsHref: z.string(),
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

const orderPickupOrDeliverySchema = z.object({
  section: z.literal("order-pickup-or-delivery"),
  logoLargeSrc: z.string(),
  logoLargeAlt: z.string(),
  logoSmallSrc: z.string(),
  logoSmallAlt: z.string(),
  pickupHref: z.string(),
  pickupLabel: z.string(),
  deliveryHref: z.string(),
  deliveryLabel: z.string(),
  pickupAriaName: z.string(),
  deliveryAriaName: z.string(),
});

// Order → Delivery page (Figma 3311:6318). One typed input per Figma
// rectangle so the page renders deterministically from JSON. Field
// order mirrors the visual reading order in the Figma frame.
const orderDeliveryFieldSchema = z.object({
  id: z.enum([
    "firstName",
    "lastName",
    "email",
    "phone",
    "street",
    "apt",
    "city",
    "zipcode",
  ]),
  label: z.string(),
  type: z.enum(["text", "email", "tel"]).default("text"),
  required: z.boolean().default(false),
  autocomplete: z.string().optional(),
});

const orderDeliverySchema = z.object({
  section: z.literal("order-delivery"),
  heading: z.string(),
  changeLabel: z.string(),
  changeHref: z.string(),
  contactHeading: z.string(),
  addressHeading: z.string(),
  contactFields: z.array(orderDeliveryFieldSchema).min(1),
  addressFields: z.array(orderDeliveryFieldSchema).min(1),
  dateLabel: z.string().optional(),
  timeLabel: z.string().optional(),
  schedulingNote: z.string().optional(),
  nextLabel: z.string(),
  nextHref: z.string(),
});

// Order → Pick-Up page (Figma 3311:6803). Same form structure as the
// delivery page minus the Home Address section.
const orderPickupSchema = z.object({
  section: z.literal("order-pickup"),
  heading: z.string(),
  changeLabel: z.string(),
  changeHref: z.string(),
  contactHeading: z.string(),
  contactFields: z.array(orderDeliveryFieldSchema).min(1),
  dateLabel: z.string().optional(),
  timeLabel: z.string().optional(),
  schedulingNote: z.string().optional(),
  nextLabel: z.string(),
  nextHref: z.string(),
});

// Order → Loading page (Figma 3311:5499). Brand-blue band with the
// centered C&C ampersand, "LOADING" text + animated dots, and the
// repeating decorative stripe pattern (Group 85 — saved as
// /assets/loading-stripe.svg).
const orderLoadingSchema = z.object({
  section: z.literal("order-loading"),
  loadingLabel: z.string(),
  redirectHref: z.string(),
  /** Auto-redirect after this many milliseconds. Defaults to 2500. */
  redirectAfterMs: z.number().int().positive().default(2500),
});

// Order → Date selection (Figma 3311:6708 PICK-UP DATE / 3311:6423
// DELIVERY DATE). The two pages share an identical layout and
// component; only the heading + section label + final NEXT route
// differ. Up to 6 rounded-pill options laid out in a 2-column grid;
// the last cell is reserved for "Other Date".
const orderDateOptionSchema = z.object({
  /** Visible label on the pill (e.g. "Thurs. May 21"). */
  label: z.string(),
  /** Submitted form value when the option is chosen. */
  value: z.string(),
  /** When true, the option is rendered as the special "Other Date" cell. */
  other: z.boolean().default(false),
});

const orderPickupDateSchema = z.object({
  section: z.literal("order-pickup-date"),
  heading: z.string(),
  changeLabel: z.string(),
  changeHref: z.string(),
  dateHeading: z.string(),
  helperNote: z.string(),
  options: z.array(orderDateOptionSchema).max(6).optional(),
  nextLabel: z.string(),
  nextHref: z.string(),
});

const orderDeliveryDateSchema = z.object({
  section: z.literal("order-delivery-date"),
  heading: z.string(),
  changeLabel: z.string(),
  changeHref: z.string(),
  dateHeading: z.string(),
  helperNote: z.string(),
  options: z.array(orderDateOptionSchema).max(6).optional(),
  nextLabel: z.string(),
  nextHref: z.string(),
});


// --- Shopping cart (Figma 3311:4172) ---
// Items, subtotal, and checkout are all sourced live from Snipcart's own
// cart state at runtime (see components/cart/LiveCart.tsx) — this schema
// only covers the page's static heading/label copy.
const cartSchema = z.object({
  section: z.literal("shopping-cart"),
  heading: z.string(),
  productHeading: z.string(),
  flavorHeading: z.string(),
  occasionHeading: z.string(),
  priceHeading: z.string(),
  editLabel: z.string(),
  saveLabel: z.string(),
  cancelLabel: z.string(),
  subtotalLabel: z.string(),
  checkoutLabel: z.string(),
  emptyMessage: z.string(),
});

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

// One flavor card on the products page. `key` must match a Tailwind
// `bg-flavor-<key>` token declared in src/styles/global.css.
const productsCupcakeFlavorSchema = z.object({
  key: z.enum([
    "chocolate",
    "vanilla",
    "carrot",
    "butter-pecan",
    "pumpkin",
    "lemon",
    "strawberry",
  ]),
  name: z.string(),
  description: z.string(),
  price: z.string(),
  imageSrc: z.string(),
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
  price: z.string(),
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

const order = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/order" }),
  schema: z.discriminatedUnion("section", [
    orderPickupOrDeliverySchema,
    orderDeliverySchema,
    orderPickupSchema,
    orderLoadingSchema,
    orderPickupDateSchema,
    orderDeliveryDateSchema,
  ]),
});

const cart = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/cart" }),
  schema: z.discriminatedUnion("section", [cartSchema]),
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

export const collections = { home, order, cart, products };
