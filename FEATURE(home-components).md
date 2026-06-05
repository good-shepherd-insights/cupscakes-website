# FEATURE(home-components)
## Request
Port all nine prototype web components from `prototype:index.html` into Astro components under `src/components/home/`, producing **byte-equivalent class strings** to the prototype `#render()` output. Each Astro component is a Light-DOM-equivalent template with `interface Props`, default values matching the prototype's `#attr(name, fallback)` second arguments, and `{}` interpolation in place of `${attr}` / `textContent` injections.
Pixel-perfect parity with the prototype is non-negotiable.
This whiteboard does NOT compose the components into a page (that is the next whiteboard) and does NOT seed Astro Content Collections (that whiteboard is separate). It only creates the nine `.astro` files.
## Directory Map
New files (one per prototype web component):
- `src/components/home/Navbar.astro` — port of prototype `Navbar` class (`<nav-bar>`), lines 317–432 of `/tmp/proto.html`.
- `src/components/home/Hero.astro` — port of prototype `Hero` class (`<hero-section>`), lines 449–564.
- `src/components/home/SmallBanner.astro` — port of prototype `SmallBanner` class (`<small-banner>`), lines 578–606.
- `src/components/home/OurStory.astro` — port of prototype `OurStory` class (`<our-story>`), lines 627–772.
- `src/components/home/CupcakesBanner.astro` — port of prototype `CupcakesBanner` class (`<cupcakes-banner>`), lines 790–894.
- `src/components/home/CupcakeCarousel.astro` — port of prototype `CupcakeCarousel` class (`<cupcake-carousel>`), lines 915–1135.
- `src/components/home/PersonalCakes.astro` — port of prototype `PersonalCakes` class (`<personal-cakes>`), lines 1155–1397.
- `src/components/home/FollowUs.astro` — port of prototype `FollowUs` class (`<follow-us>`), lines 1416–1531.
- `src/components/home/Footer.astro` — port of prototype `Footer` class (`<page-footer>`), lines 1551–1689. Renders as `<footer>` since Astro components are not custom-element-name-constrained.
No existing files are modified by this whiteboard.
## Modification Table
- `src/components/home/Navbar.astro` — CREATE. Source: `/tmp/proto.html` lines 317–432.
- `src/components/home/Hero.astro` — CREATE. Source: `/tmp/proto.html` lines 449–564.
- `src/components/home/SmallBanner.astro` — CREATE. Source: `/tmp/proto.html` lines 578–606.
- `src/components/home/OurStory.astro` — CREATE. Source: `/tmp/proto.html` lines 627–772.
- `src/components/home/CupcakesBanner.astro` — CREATE. Source: `/tmp/proto.html` lines 790–894.
- `src/components/home/CupcakeCarousel.astro` — CREATE. Source: `/tmp/proto.html` lines 915–1135.
- `src/components/home/PersonalCakes.astro` — CREATE. Source: `/tmp/proto.html` lines 1155–1397.
- `src/components/home/FollowUs.astro` — CREATE. Source: `/tmp/proto.html` lines 1416–1531.
- `src/components/home/Footer.astro` — CREATE. Source: `/tmp/proto.html` lines 1551–1689.
## Existing Pattern Audit
- The Astro 6 project already uses `.astro` single-file components with a frontmatter fence followed by template HTML. Reference: existing `src/layouts/Layout.astro` in the worktree, which uses an `interface Props` + `Astro.props` destructuring + `{}` interpolation pattern.
- Tailwind v4 is wired via `@tailwindcss/vite` in `astro.config.mjs`. The theme + utilities (`@theme`, `@utility nav-link`, `@utility nav-icon`, `@utility cupcake-cta`, `@utility cupcake-other-options`, `.story-photo`, `.cupcake-photo`) are defined in `src/styles/global.css`, which is imported once by `src/layouts/Layout.astro`. Therefore the ported components consume Tailwind classes (including the four `@utility` shorthands and the two mask-escape-hatch classes) without any per-component `<style>` blocks.
- All 22 prototype assets exist under `public/assets/` in this worktree (copied from the `prototype` branch). Astro serves `public/` at the site root, so the prototype's `src="public/assets/<name>.<ext>"` working-dir-relative paths must be rewritten to root-relative `src="/assets/<name>.<ext>"` in every ported component. Tailwind theme tokens like `bg-flavor`, `bg-cups-icon`, `bg-cart-icon`, `bg-heart-group`, `bg-hero-cupcakes`, `bg-hero-logo`, `bg-hero-scroll`, `bg-banner-amp-big`, `bg-banner-amp-small`, `bg-flavor-chocolate`, `bg-flavor-butter-pecan`, and `bg-flavor-carrot` already point at `/assets/...` in `global.css`, so no per-component override is needed for those.
- The prototype attribute API (`observedAttributes` + `#attr(name, fallback)`) maps 1:1 to an Astro `interface Props` with optional fields and destructuring defaults. The prototype's two-phase render (innerHTML template → `textContent` injection for safety) collapses to a single `{textVariable}` interpolation in Astro because Astro auto-escapes interpolated expressions.
## Execution Plan
1. Create directory `src/components/home/`.
2. Create the nine `.astro` files in any order; they have no inter-component dependencies.
3. Run `npm run build` to verify all nine components parse and the project still builds clean.
4. (Whiteboard scope ends here. Composition into `src/pages/index.astro` is the next whiteboard.)
## File-by-File Changes
### src/components/home/Navbar.astro
#### Before
File does not exist.
#### After
```astro
---
interface Props {
  homeHref?: string;
  whoHref?: string;
  orderHref?: string;
  favoritesHref?: string;
  cartHref?: string;
}

const {
  homeHref = "#top",
  whoHref = "#who-we-are",
  orderHref = "#order",
  favoritesHref = "#favorites",
  cartHref = "#cart",
} = Astro.props;
---

<header
  class="sticky top-0 z-50 w-full bg-white border-b border-brand-border
         h-14 sm:h-16 md:h-20 lg:h-24 xl:h-32"
  data-node-id="3311:1430"
  data-name="Navbar / Rectangle 1"
>
  <div class="flex h-full w-full items-center justify-between px-3 sm:px-4 md:px-6 lg:px-10">
    <a
      href={homeHref}
      class="inline-flex items-center gap-1.5 sm:gap-2 md:gap-2.5
             font-semibold text-brand-blue no-underline whitespace-nowrap
             text-base sm:text-lg md:text-xl lg:text-2xl xl:text-4xl
             leading-relaxed
             transition-opacity duration-150 hover:opacity-90 focus-visible:opacity-90 focus-visible:outline-hidden"
      data-node-id="3311:1569"
      data-name="CUPS_&_CAKES_LOGO_2026_UPDATE_13-17"
      aria-label="Cups & Cakes — home"
    >
      <span data-node-id="3311:1557">CUPS</span>
      <span
        class="inline-block bg-cups-icon bg-no-repeat bg-contain bg-center shrink-0
               h-[1.2em] aspect-[75.694/55.796]"
        data-node-id="3311:1568"
        data-name="Group 21"
        role="img"
        aria-label=""
      ></span>
      <span data-node-id="3311:1561">CAKES</span>
    </a>

    <nav
      class="flex items-center gap-3 sm:gap-4 md:gap-6 lg:gap-10"
      aria-label="Primary"
    >
      <a
        href={whoHref}
        class="nav-link hidden md:inline-block"
        data-node-id="3311:1674"
      >WHO WE ARE</a>

      <a
        href={orderHref}
        class="nav-link hidden md:inline-block"
        data-node-id="3311:1678"
      >ORDER NOW</a>

      <a
        href={favoritesHref}
        class="nav-icon bg-heart-group h-4 sm:h-5 md:h-5 lg:h-6 aspect-[111.961/36]"
        data-node-id="3311:1689"
        data-name="Group 49"
        aria-label="Account / favorites"
      ></a>

      <a
        href={cartHref}
        class="nav-icon bg-cart-icon h-5 sm:h-6 md:h-7 lg:h-8 aspect-[41.479/46.541]"
        data-node-id="3311:1695"
        data-name="C&C_CART_ICON"
        aria-label="Shopping cart"
      ></a>
    </nav>
  </div>
</header>
```
#### Reasoning
Direct port of prototype `Navbar.#render()` (`/tmp/proto.html` lines 351–431). The five `observedAttributes` become `Props` with the same default values (`#top`, `#who-we-are`, `#order`, `#favorites`, `#cart`). `data-role="..."` attributes are dropped because Astro does not patch DOM by data-role; the values are baked at render time. The class strings, `data-node-id`, `data-name`, `aria-label`, and structural ordering are byte-equivalent to the prototype output.
### src/components/home/Hero.astro
#### Before
File does not exist.
#### After
```astro
---
interface Props {
  headline?: string;
  ctaLabel?: string;
  orderHref?: string;
}

const {
  headline = "FRESH. SIMPLE. WHOLE.",
  ctaLabel = "ORDER NOW",
  orderHref = "#order",
} = Astro.props;
---

<section
  class="relative w-full bg-hero-cupcakes bg-cover bg-center aspect-[1920/960]
         flex flex-col items-center justify-center"
  data-node-id="3311:1437"
  data-name="Mask Group 1"
>
  <div
    class="absolute inset-0 bg-brand-pink/20 pointer-events-none"
    data-node-id="3311:1445"
    data-name="Rectangle 4 (tint)"
    aria-hidden="true"
  ></div>

  <span
    class="relative bg-hero-logo bg-no-repeat bg-contain bg-center
           h-10 sm:h-12 md:h-14 lg:h-16 xl:h-20 aspect-[117/86]
           mb-4 sm:mb-5 md:mb-6 drop-shadow-md"
    data-node-id="3311:1460"
    data-name="CUPS_&_CAKES_LOGO_2026_UPDATE_14"
    role="img"
    aria-label="Cups & Cakes"
  ></span>

  <h1
    class="relative text-white font-medium text-center
           text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl
           leading-tight drop-shadow-md
           m-0 px-4"
    data-node-id="3311:1446"
  >{headline}</h1>

  <a
    href={orderHref}
    class="relative mt-6 sm:mt-8 md:mt-10 lg:mt-12
           inline-flex items-center justify-center
           bg-brand-blue text-white font-medium no-underline
           border border-brand-border
           h-10 sm:h-12 md:h-14 lg:h-16 xl:h-20
           w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80
           text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl
           transition-[transform,filter] duration-150 ease-out
           hover:brightness-110 hover:-translate-y-px
           focus-visible:brightness-110 focus-visible:-translate-y-px focus-visible:outline-hidden"
    data-node-id="3311:1450"
    data-name="Rectangle 5 + ORDER NOW"
    aria-label="Order cupcakes now"
  ><span>{ctaLabel}</span></a>

  <span
    class="absolute bottom-3 sm:bottom-4 md:bottom-5 lg:bottom-6
           left-1/2 -translate-x-1/2
           bg-hero-scroll bg-no-repeat bg-contain bg-center
           w-20 sm:w-24 md:w-28 lg:w-32 aspect-[137/18]
           opacity-90"
    data-node-id="3311:1444"
    data-name="Group 3"
    role="img"
    aria-label="Scroll for more"
  ></span>
</section>
```
#### Reasoning
Port of `Hero.#render()` (`/tmp/proto.html` lines 476–563). Defaults match `#attr(...)` second args verbatim: `"FRESH. SIMPLE. WHOLE."`, `"ORDER NOW"`, `"#order"`. Headline and CTA text use `{headline}` / `{ctaLabel}` interpolation (Astro auto-escapes). All Tailwind utility classes, `data-node-id`s, ARIA attributes, and aspect ratios are byte-equivalent.
### src/components/home/SmallBanner.astro
#### Before
File does not exist.
#### After
```astro
---
const flavors = [1, 2, 3, 4, 5, 6, 7, 8, 9];
---

<section
  class="w-full bg-brand-blue border-y border-brand-border
         h-16 sm:h-20 md:h-24 lg:h-28 xl:h-32
         flex items-center justify-between
         px-3 sm:px-4 md:px-6 lg:px-10"
  data-node-id="3311:1431"
  data-name="Rectangle 1 (flavor band)"
  aria-label="Cupcake flavors"
>
  {flavors.map((n) => (
    <span
      class="bg-flavor bg-no-repeat bg-contain bg-center h-10 sm:h-12 md:h-14 lg:h-16 xl:h-20 aspect-[118/110] shrink-0"
      data-flavor={n}
      role="img"
      aria-label={`Cupcake flavor ${n}`}
    ></span>
  ))}
</section>
```
#### Reasoning
Port of `SmallBanner.#render()` (`/tmp/proto.html` lines 583–605). The prototype generates nine identical glyphs via `Array.from({ length: 9 }, ...)`; the Astro equivalent is a literal `[1..9]` array `.map()` rendered inline. No `observedAttributes` in prototype, so `Props` is empty. Class strings, aspect ratio, and per-icon `data-flavor` + `aria-label` are byte-equivalent.
### src/components/home/OurStory.astro
#### Before
File does not exist.
#### After
```astro
---
interface Props {
  heading?: string;
  paragraph1?: string;
  paragraph2?: string;
  paragraph3?: string;
}

const {
  heading = "OUR STORY",
  paragraph1 = "After more than four decades as a registered nurse, during one quiet afternoon, a few baking videos on YouTube opened the door to something new.",
  paragraph2 = "What began as a simple interest soon became a passion she poured herself into\u2014learning, practicing, and perfecting her craft. Her eye for detail, shaped by years of knitting and sewing, naturally found its place in every swirl of frosting and every finished cupcake.",
  paragraph3 = "Today, she blends that lifelong craftsmanship with her love for baking, creating something truly special to share with others.",
} = Astro.props;
---

<section
  id="who-we-are"
  aria-labelledby="our-story-heading"
  class="relative w-full overflow-hidden
         px-4 sm:px-6 md:px-10 lg:px-14
         py-16 sm:py-20 md:py-28 lg:py-36 xl:py-44"
  data-node-id="3311:1652"
  data-name="Mask Group 15"
>
  <div
    class="absolute inset-0 -z-30"
    aria-hidden="true"
    data-node-id="3311:1645"
    data-name="Path 19"
  >
    <img
      alt=""
      aria-hidden="true"
      class="block size-full object-cover"
      src="/assets/path-19.svg"
    />
  </div>

  <div
    class="story-photo absolute inset-0 -z-20 opacity-5 pointer-events-none"
    aria-hidden="true"
    data-node-id="3311:1650"
    data-name="2025_HOLIDAY_CUPCAKES_002"
  >
    <img
      alt=""
      aria-hidden="true"
      class="block size-full object-cover pointer-events-none"
      src="/assets/story-photo.jpg"
    />
  </div>

  <img
    alt=""
    aria-hidden="true"
    src="/assets/story-logo.svg"
    class="absolute inset-0 m-auto -z-10
           w-2/3 max-w-3xl aspect-[929/864]
           object-contain pointer-events-none opacity-90"
    data-node-id="3311:1661"
    data-name="CUPS_&_CAKES_LOGO_2026_UPDATE_16"
  />

  <div
    class="relative mx-auto max-w-3xl flex flex-col items-center
           gap-6 sm:gap-8 md:gap-10 lg:gap-12"
  >
    <h2
      id="our-story-heading"
      class="m-0 text-center text-white font-normal leading-normal
             text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl
             drop-shadow-lg"
      data-node-id="3311:1653"
    >{heading}</h2>

    <div
      class="text-center text-white font-normal leading-snug drop-shadow-md
             text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl
             flex flex-col gap-4 sm:gap-6 md:gap-8 lg:gap-10"
      data-node-id="3311:1657"
    >
      <p class="m-0">{paragraph1}</p>
      <p class="m-0">{paragraph2}</p>
      <p class="m-0">{paragraph3}</p>
    </div>
  </div>
</section>
```
#### Reasoning
Port of `OurStory.#render()` (`/tmp/proto.html` lines 652–771). The four `observedAttributes` (`heading`, `paragraph-1/2/3`) become camelCased `Props` (`heading`, `paragraph1/2/3`). The default strings are copied verbatim from the prototype — including the `\u2014` em-dash escape (which Astro/JS unescapes to U+2014 at runtime; the rendered DOM matches the prototype). Asset paths `public/assets/path-19.svg`, `public/assets/story-photo.jpg`, `public/assets/story-logo.svg` are rewritten to `/assets/...` (root-relative). All class strings, `id`, `aria-*`, `data-node-id`, `data-name` attributes are byte-equivalent.
### src/components/home/CupcakesBanner.astro
#### Before
File does not exist.
#### After
```astro
---
interface Props {
  headline?: string;
}

const { headline = "CUPCAKES" } = Astro.props;
---

<section
  class="w-full bg-brand-blue border-y border-brand-border
         h-16 sm:h-20 md:h-24 lg:h-28 xl:h-32
         flex items-center justify-center
         gap-3 sm:gap-4 md:gap-6 lg:gap-10
         px-3 sm:px-4 md:px-6 lg:px-10"
  aria-label="Cupcakes"
  data-node-id="3311:1455"
  data-name="Rectangle 2"
>
  <span
    aria-hidden="true"
    class="bg-banner-amp-big bg-no-repeat bg-contain bg-center
           h-full aspect-[241/224] shrink-0 pointer-events-none"
    data-node-id="3311:1473"
    data-name="CUPS_&_CAKES_LOGO_2026_UPDATE_16 (left)"
  ></span>

  <span
    aria-hidden="true"
    class="bg-banner-amp-small bg-no-repeat bg-contain bg-center
           h-1/3 aspect-[117/86] shrink-0 pointer-events-none"
    data-node-id="3311:1472"
    data-name="CUPS_&_CAKES_LOGO_2026_UPDATE_15 (left)"
  ></span>

  <h2
    class="flex-1 min-w-0 m-0 text-center text-white font-normal
           leading-none whitespace-nowrap drop-shadow-lg
           text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl"
    data-node-id="3311:1461"
  >{headline}</h2>

  <span
    aria-hidden="true"
    class="bg-banner-amp-small bg-no-repeat bg-contain bg-center
           h-1/3 aspect-[117/86] shrink-0 pointer-events-none"
    data-node-id="3311:1468"
    data-name="CUPS_&_CAKES_LOGO_2026_UPDATE_15 (right)"
  ></span>

  <span
    aria-hidden="true"
    class="bg-banner-amp-big bg-no-repeat bg-contain bg-center
           h-full aspect-[241/224] shrink-0 pointer-events-none"
    data-node-id="3311:1474"
    data-name="CUPS_&_CAKES_LOGO_2026_UPDATE_16 (right)"
  ></span>
</section>
```
#### Reasoning
Port of `CupcakesBanner.#render()` (`/tmp/proto.html` lines 811–893). Single `observedAttribute` `"headline"` → `Props.headline` defaulting to `"CUPCAKES"` (matches `#attr("headline", "CUPCAKES")`). Class strings, `data-node-id`s, `data-name`s, `aria-*`, and aspect ratios are byte-equivalent.
### src/components/home/CupcakeCarousel.astro
#### Before
File does not exist.
#### After
```astro
---
interface Props {
  caption?: string;
  orderHref?: string;
  otherOptionsHref?: string;
  otherOptionsLabel?: string;
}

const {
  caption = "Soft, sweet, and baked to delicate perfection!",
  orderHref = "#order",
  otherOptionsHref = "#cupcakes",
  otherOptionsLabel = "OTHER OPTIONS",
} = Astro.props;

// Each card's full class string is a literal so Tailwind's content
// scanner can statically see `bg-flavor-chocolate`,
// `bg-flavor-butter-pecan`, and `bg-flavor-carrot` and emit them into
// the production CSS. Concatenating the bg token at runtime would risk
// the class being purged.
const CARD_CLASS_BASE = `flex flex-col items-center text-center text-white
                        border border-brand-border
                        rounded-2xl sm:rounded-3xl
                        p-6 sm:p-8 md:p-10
                        gap-4 sm:gap-5 md:gap-6 lg:gap-8 xl:gap-10`;

const flavors = [
  {
    key: "chocolate",
    name: "Chocolate",
    cardClass: `bg-flavor-chocolate ${CARD_CLASS_BASE}`,
    nodeCard: "3311:1477",
    nodePhoto: "3311:1521",
    photoSrc: "/assets/cupcake-photo.png",
  },
  {
    key: "butter-pecan",
    name: "Butter Pecan",
    cardClass: `bg-flavor-butter-pecan ${CARD_CLASS_BASE}`,
    nodeCard: "3311:1476",
    nodePhoto: "3311:1517",
    photoSrc: "/assets/cupcake-photo.png",
  },
  {
    key: "carrot",
    name: "Carrot",
    cardClass: `bg-flavor-carrot ${CARD_CLASS_BASE}`,
    nodeCard: "3311:1475",
    nodePhoto: "3311:1513",
    photoSrc: "/assets/cupcake-photo.png",
  },
];

const description = "Sweetened just right and topped with cream cheese frosting.";
const price = "$3.25 each";
const orderLabel = "ORDER NOW";
---

<section
  id="order"
  aria-labelledby="cupcake-carousel-caption"
  class="w-full bg-white
         px-4 sm:px-6 md:px-10 lg:px-14
         py-8 sm:py-12 md:py-16 lg:py-20"
  data-name="Cupcake carousel"
>
  <div class="mx-auto max-w-screen-2xl flex flex-col items-center
              gap-8 sm:gap-10 md:gap-12 lg:gap-16">
    <h2
      id="cupcake-carousel-caption"
      class="m-0 text-center text-brand-pink font-medium leading-tight
             text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl"
      data-node-id="3311:1479"
    >{caption}</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
                gap-6 sm:gap-8 md:gap-10 w-full">
      {flavors.map((f) => (
        <article
          class={f.cardClass}
          data-node-id={f.nodeCard}
          data-flavor={f.key}
        >
          <div
            class="w-full max-w-xs aspect-[7/6]"
            aria-hidden="true"
            data-node-id={f.nodePhoto}
          >
            <img
              class="cupcake-photo"
              alt=""
              aria-hidden="true"
              src={f.photoSrc}
            />
          </div>

          <h3
            class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl
                   drop-shadow-md font-medium leading-none m-0
                   whitespace-nowrap"
          >{f.name}</h3>

          <p
            class="text-sm sm:text-base md:text-lg lg:text-xl
                   font-medium leading-snug max-w-sm m-0"
          >{description}</p>

          <p
            class="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl
                   font-medium leading-none drop-shadow-sm m-0"
          >{price}</p>

          <a
            href={orderHref}
            class="cupcake-cta"
            aria-label={`Order ${f.name} cupcakes now`}
          ><span>{orderLabel}</span></a>
        </article>
      ))}
    </div>

    <a
      href={otherOptionsHref}
      class="cupcake-other-options"
      data-node-id="3311:1612"
      data-name="OTHER OPTIONS button"
    ><span>{otherOptionsLabel}</span></a>
  </div>
</section>
```
#### Reasoning
Port of `CupcakeCarousel.#render()` (`/tmp/proto.html` lines 953–1134). Four `observedAttributes` → camelCased `Props`. The `flavors` array is preserved from the prototype (keys, names, `nodeCard`, `nodePhoto`, `photoSrc` rewritten to `/assets/cupcake-photo.png`). Shared copy (`description`, `price`, `orderLabel`) preserved verbatim. The template uses `.map()` to emit three `<article>` cards; class strings, ordering, `data-node-id`, `data-flavor`, `aria-label`, and `aspect-[7/6]` are byte-equivalent. **Tailwind-safety fix**: instead of concatenating `${f.bg}` at runtime, the per-card class string is pre-built in the frontmatter so each `bg-flavor-chocolate` / `bg-flavor-butter-pecan` / `bg-flavor-carrot` token appears as a literal string Tailwind's content scanner can detect. The rendered class string is identical to the prototype (token order: `bg-flavor-* flex flex-col ... border border-brand-border ...`).
### src/components/home/PersonalCakes.astro
#### Before
File does not exist.
#### After
```astro
---
interface Props {
  heading?: string;
  caption?: string;
  flavorHeadline?: string;
  price?: string;
  chocolateHref?: string;
  chocolateLabel?: string;
  vanillaHref?: string;
  vanillaLabel?: string;
}

const {
  heading = "PERSONAL CAKES",
  caption = "Small in size but big in bringing joy to each bite!",
  flavorHeadline = "Choose your flavor!",
  price = "$25",
  chocolateHref = "#order",
  chocolateLabel = "Chocolate",
  vanillaHref = "#order",
  vanillaLabel = "Vanilla",
} = Astro.props;
---

<section
  id="personal-cakes"
  aria-labelledby="personal-cakes-heading"
  class="w-full bg-white
         px-4 sm:px-6 md:px-10 lg:px-14
         py-8 sm:py-12 md:py-16 lg:py-20"
  data-node-id="3311:1456"
  data-name="Personal cakes"
>
  <div class="mx-auto max-w-screen-2xl flex flex-col items-center
              gap-8 sm:gap-10 md:gap-12 lg:gap-16">
    <div class="flex items-center justify-center
                gap-3 sm:gap-4 md:gap-6 lg:gap-10 w-full">
      <img
        alt=""
        aria-hidden="true"
        src="/assets/personal-cakes-amp.svg"
        class="h-6 sm:h-8 md:h-10 lg:h-12 xl:h-14 aspect-[55/51]
               object-contain shrink-0 pointer-events-none"
        data-node-id="3311:1617"
        data-name="CUPS_&_CAKES_LOGO_2026_UPDATE_15 (left)"
      />
      <h2
        id="personal-cakes-heading"
        class="m-0 text-center text-brand-blue font-normal
               leading-none whitespace-nowrap
               text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl"
        data-node-id="3311:1613"
      >{heading}</h2>
      <img
        alt=""
        aria-hidden="true"
        src="/assets/personal-cakes-amp.svg"
        class="h-6 sm:h-8 md:h-10 lg:h-12 xl:h-14 aspect-[55/51]
               object-contain shrink-0 pointer-events-none"
        data-node-id="3311:1618"
        data-name="CUPS_&_CAKES_LOGO_2026_UPDATE_15 (right)"
      />
    </div>

    <p
      class="m-0 text-center text-brand-pink font-medium leading-tight
             text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl"
      data-node-id="3311:1483"
    >{caption}</p>

    <div
      class="relative w-full bg-brand-blue border border-brand-border
             rounded-2xl sm:rounded-3xl overflow-hidden
             px-6 sm:px-10 md:px-14 lg:px-20
             py-10 sm:py-12 md:py-16 lg:py-20"
      data-node-id="3311:1478"
      data-name="Personal cakes card"
    >
      <img
        alt=""
        aria-hidden="true"
        src="/assets/personal-cakes-logo.svg"
        class="absolute inset-0 m-auto -z-0
               w-3/4 max-w-3xl aspect-[1100/1023]
               object-contain pointer-events-none opacity-90"
        data-node-id="3311:1703"
        data-name="CUPS_&_CAKES_LOGO_2026_UPDATE_15 (decorative)"
      />

      <div
        class="relative grid grid-cols-1 md:grid-cols-3
               gap-6 sm:gap-8 md:gap-10 lg:gap-12
               items-center"
      >
        <h3
          class="md:col-span-3 order-1
                 m-0 text-center text-white font-medium
                 leading-none drop-shadow-md
                 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl"
          data-node-id="3311:1704"
        >{flavorHeadline}</h3>

        <a
          href={chocolateHref}
          class="order-3 md:order-2
                 inline-flex items-center justify-center
                 w-full max-w-xs mx-auto md:mx-0
                 py-3 sm:py-4 md:py-5 lg:py-6
                 px-6 sm:px-8 md:px-10
                 bg-white text-flavor-chocolate font-medium no-underline text-center
                 border border-brand-border rounded-md
                 text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl
                 transition-[transform,filter] duration-150 ease-out
                 hover:brightness-95 hover:-translate-y-px
                 focus-visible:brightness-95 focus-visible:-translate-y-px focus-visible:outline-hidden"
          data-node-id="3311:1702"
          data-name="Chocolate flavor pill"
        ><span>{chocolateLabel}</span></a>

        <div class="order-2 md:order-3 flex flex-col items-center
                    gap-4 sm:gap-6 md:gap-8">
          <img
            alt=""
            aria-hidden="true"
            src="/assets/personal-cake.png"
            class="w-full max-w-md aspect-[815/638]
                   object-contain drop-shadow-lg pointer-events-none"
            data-node-id="3311:1715"
            data-name="C&C_PERSONAL_CAKE_PINK_003"
          />
          <p
            class="m-0 text-center text-white font-normal leading-none drop-shadow-md
                   text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl"
            data-node-id="3311:1716"
          >{price}</p>
        </div>

        <a
          href={vanillaHref}
          class="order-4
                 inline-flex items-center justify-center
                 w-full max-w-xs mx-auto md:mx-0
                 py-3 sm:py-4 md:py-5 lg:py-6
                 px-6 sm:px-8 md:px-10
                 bg-white text-brand-pink font-medium no-underline text-center
                 border border-brand-border rounded-md
                 text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl
                 transition-[transform,filter] duration-150 ease-out
                 hover:brightness-95 hover:-translate-y-px
                 focus-visible:brightness-95 focus-visible:-translate-y-px focus-visible:outline-hidden"
          data-node-id="3311:1714"
          data-name="Vanilla flavor pill"
        ><span>{vanillaLabel}</span></a>
      </div>
    </div>
  </div>
</section>
```
#### Reasoning
Port of `PersonalCakes.#render()` (`/tmp/proto.html` lines 1200–1396). Eight `observedAttributes` → camelCased `Props` with defaults matching `#attr(...)` verbatim. Three asset references rewritten from `public/assets/...` to `/assets/...`. Card-card class string, `order-*` utilities, `md:col-span-3`, aspect ratios, and the relative/absolute layering (decorative ampersand at `-z-0` behind the foreground grid) are byte-equivalent to the prototype output.
### src/components/home/FollowUs.astro
#### Before
File does not exist.
#### After
```astro
---
interface Props {
  heading?: string;
  facebookHref?: string;
  instagramHref?: string;
}

const {
  heading = "FOLLOW US:",
  facebookHref = "#",
  instagramHref = "#",
} = Astro.props;
---

<section
  aria-labelledby="follow-us-heading"
  class="w-full bg-white
         px-4 sm:px-6 md:px-10 lg:px-14
         py-10 sm:py-14 md:py-20 lg:py-24"
  data-node-id="3311:1627"
  data-name="Follow us"
>
  <div class="mx-auto max-w-screen-2xl flex flex-col items-center
              gap-8 sm:gap-10 md:gap-12 lg:gap-16">
    <h2
      id="follow-us-heading"
      class="m-0 text-center text-brand-pink font-normal
             leading-none whitespace-nowrap
             text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl"
      data-node-id="3311:1627"
    >{heading}</h2>

    <div
      class="flex items-center justify-center
             gap-10 sm:gap-12 md:gap-16 lg:gap-20"
      data-node-id="3311:1626"
      data-name="Group 47"
    >
      <a
        href={facebookHref}
        class="inline-flex items-center justify-center shrink-0
               h-16 sm:h-20 md:h-24 lg:h-28 xl:h-32 aspect-square
               transition-[transform,filter] duration-150 ease-out
               hover:scale-105 hover:brightness-90
               focus-visible:scale-105 focus-visible:brightness-90 focus-visible:outline-hidden"
        aria-label="Follow us on Facebook"
        target="_blank"
        rel="noopener noreferrer"
        data-node-id="3311:1625"
        data-name="Path 18 (Facebook)"
      >
        <img
          alt=""
          aria-hidden="true"
          class="block size-full object-contain pointer-events-none"
          src="/assets/facebook.svg"
        />
      </a>
      <a
        href={instagramHref}
        class="inline-flex items-center justify-center shrink-0
               h-16 sm:h-20 md:h-24 lg:h-28 xl:h-32 aspect-square
               transition-[transform,filter] duration-150 ease-out
               hover:scale-105 hover:brightness-90
               focus-visible:scale-105 focus-visible:brightness-90 focus-visible:outline-hidden"
        aria-label="Follow us on Instagram"
        target="_blank"
        rel="noopener noreferrer"
        data-node-id="3311:1624"
        data-name="Group 46 (Instagram)"
      >
        <img
          alt=""
          aria-hidden="true"
          class="block size-full object-contain pointer-events-none"
          src="/assets/instagram.svg"
        />
      </a>
    </div>
  </div>
</section>
```
#### Reasoning
Port of `FollowUs.#render()` (`/tmp/proto.html` lines 1443–1530). Three `observedAttributes` → `Props` with defaults `"FOLLOW US:"`, `"#"`, `"#"`. Asset srcs rewritten to `/assets/facebook.svg` and `/assets/instagram.svg`. All class strings, `aria-*`, `target`, `rel`, and `data-*` attributes are byte-equivalent.
### src/components/home/Footer.astro
#### Before
File does not exist.
#### After
```astro
---
interface Props {
  whoHref?: string;
  orderHref?: string;
  topHref?: string;
  copyright?: string;
}

const {
  whoHref = "#who-we-are",
  orderHref = "#order",
  topHref = "#top",
  copyright = "Copyright @cups&cakes. All Rights Reserved.",
} = Astro.props;
---

<footer
  class="relative w-full bg-brand-blue border-t border-brand-border
         min-h-32 sm:min-h-36 md:min-h-40 lg:min-h-44 xl:min-h-48
         flex flex-col items-center justify-center
         gap-3 sm:gap-4 md:gap-5 lg:gap-6
         px-4 sm:px-6 md:px-10 lg:px-14
         py-6 sm:py-8 md:py-10 lg:py-12"
  data-node-id="3311:1456"
  data-name="Rectangle 37 (footer)"
  aria-label="Site footer"
>
  <nav
    class="flex items-center justify-center
           gap-4 sm:gap-6 md:gap-8 lg:gap-12"
    aria-label="Footer"
  >
    <a
      href={whoHref}
      class="text-white font-medium no-underline whitespace-nowrap
             text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl
             transition-[transform,filter] duration-150 ease-out
             hover:brightness-90 hover:-translate-y-px
             focus-visible:brightness-90 focus-visible:-translate-y-px focus-visible:outline-hidden"
      data-node-id="3311:1635"
    >WHO WE ARE</a>
    <span
      aria-hidden="true"
      class="inline-block bg-white shrink-0 w-px sm:w-0.5
             h-5 sm:h-6 md:h-8 lg:h-10 xl:h-12
             rounded-full"
      data-node-id="3311:1643"
      data-name="Rectangle 38 (divider)"
    ></span>
    <a
      href={orderHref}
      class="text-white font-medium no-underline whitespace-nowrap
             text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl
             transition-[transform,filter] duration-150 ease-out
             hover:brightness-90 hover:-translate-y-px
             focus-visible:brightness-90 focus-visible:-translate-y-px focus-visible:outline-hidden"
      data-node-id="3311:1631"
    >ORDER NOW</a>
    <span
      aria-hidden="true"
      class="inline-block bg-white shrink-0 w-px sm:w-0.5
             h-5 sm:h-6 md:h-8 lg:h-10 xl:h-12
             rounded-full"
      data-node-id="3311:1644"
      data-name="Rectangle 39 (divider)"
    ></span>
    <a
      href={topHref}
      class="text-white font-medium no-underline whitespace-nowrap
             text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl
             transition-[transform,filter] duration-150 ease-out
             hover:brightness-90 hover:-translate-y-px
             focus-visible:brightness-90 focus-visible:-translate-y-px focus-visible:outline-hidden"
      data-node-id="3311:1639"
    >BACK TO TOP</a>
  </nav>

  <p
    class="m-0 text-center text-white font-normal
           text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl"
    data-node-id="3311:1670"
  >{copyright}</p>

  <img
    alt=""
    aria-hidden="true"
    src="/assets/footer-mark.svg"
    class="absolute right-4 sm:right-6 md:right-10 lg:right-14
           bottom-3 sm:bottom-4 md:bottom-5 lg:bottom-6
           h-6 sm:h-8 md:h-10 lg:h-12 xl:h-14
           aspect-[161/50] object-contain pointer-events-none
           opacity-90"
    data-node-id="3311:1669"
    data-name="CUPS_&_CAKES_LOGO_2026_UPDATE_17 (footer mark)"
  />
</footer>
```
#### Reasoning
Port of `Footer.#render()` (`/tmp/proto.html` lines 1580–1688). Four `observedAttributes` → `Props` with defaults `"#who-we-are"`, `"#order"`, `"#top"`, `"Copyright @cups&cakes. All Rights Reserved."`. The prototype's `<page-footer>` custom-element wrapper is dropped — Astro components are not subject to the custom-element naming rule that forced the `page-footer` alias, so the file renders the semantic `<footer>` directly. Asset `public/assets/footer-mark.svg` rewritten to `/assets/footer-mark.svg`. All class strings, dividers, `aria-*`, `data-*`, and aspect ratios are byte-equivalent.
## Validation Plan
1. `cd /Users/dev/.warp/worktrees/cupscakes-website/pictograph-granite && npm run build` — must exit 0. Build will compile all nine `.astro` files even though they are not yet imported by any page; Astro lints `interface Props` and template syntax during compile.
2. `node -e "const fs=require('fs');['Navbar','Hero','SmallBanner','OurStory','CupcakesBanner','CupcakeCarousel','PersonalCakes','FollowUs','Footer'].forEach(n=>{if(!fs.existsSync('src/components/home/'+n+'.astro'))throw new Error(n+' missing');});console.log('ok')"` — confirm all nine files exist.
3. Visual parity check is deferred to the composition whiteboard (a page must import the components to render them in the browser). At that point, render the prototype `index.html` (from the `prototype` branch) side-by-side with `npm run dev` and diff at every Tailwind breakpoint (`sm`, `md`, `lg`, `xl`, `2xl`).
## Risk Notes
- **Tailwind content scanner + dynamic class names**: Tailwind v4 scans source files for literal class-name strings to decide which utilities to emit. If the three `bg-flavor-*` tokens were concatenated at runtime (e.g. `${f.bg}` inside a template literal that the scanner can't statically resolve), they could be purged from production CSS and the cards would render with no background color. The After block sidesteps this by composing each card's full class string in the frontmatter, so `bg-flavor-chocolate`, `bg-flavor-butter-pecan`, and `bg-flavor-carrot` all appear as literal substrings of source code.
- **Asset path rewrite**: every `src="public/assets/..."` in the prototype is rewritten to `src="/assets/..."` in the ported components. If any rewrite is missed, the asset 404s. The Validation Plan's build step does not catch missing assets at the file-level (`public/` is served, not imported), so a runtime visual check during composition is the safety net.
- **`@apply` reference rule**: Tailwind v4 inside Astro scoped `<style>` blocks requires `@reference "../styles/global.css";` at the top of the block to resolve `@apply` against the project's `@theme`. None of the ported components in this whiteboard use a scoped `<style>` block (all styling is utility classes plus the four `@utility` shorthands defined globally), so no `@reference` directive is needed. If a future component adds a `<style>` block with `@apply`, this rule must be honored.
- **`data-role` attributes dropped**: the prototype used `data-role="..."` for runtime DOM patching by `attributeChangedCallback`. Astro components have no runtime patching loop — the attribute values are baked at SSR. Anyone wiring runtime mutations later will need a different hook (e.g. a small client script). For pixel-perfect SSR parity this is irrelevant.
- **`<page-footer>` → `<footer>`**: the prototype's footer is registered as the custom element `<page-footer>` because `<footer>` is a built-in HTML tag and cannot be used as a custom-element tag. Astro components are file-name-addressed and do not register custom elements, so `Footer.astro` renders the native `<footer>` directly. No behavior change.
- **Em-dash escape in `OurStory` default**: the prototype default uses the JS escape `\u2014`. Astro evaluates the frontmatter as TypeScript, so `\u2014` decodes to U+2014 at render time and is emitted to HTML as the literal `—`. The rendered DOM matches the prototype's `textContent` injection (which also decodes the escape).
## Approval
Status: Awaiting explicit user approval. Do not implement yet.
