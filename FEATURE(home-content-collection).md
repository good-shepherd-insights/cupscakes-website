# FEATURE(home-content-collection)
## Request
Wire an Astro Content Collection named `home` that carries the homepage marketing copy. Define a Zod schema per section (mirroring each ported component's `Props`), seed eight JSON entries (one per content-bearing section) with the **exact default copy already encoded in the component frontmatter**, and stop there. This whiteboard does NOT modify `src/pages/index.astro` — that change is the next whiteboard so the page can swap from component defaults to collection-driven content in a clean, reviewable step.
## Directory Map
New files:
- `src/content.config.ts` — Astro 5+ canonical content config location (replaces deprecated `src/content/config.ts`). Defines a single `home` collection with a discriminated union schema per section.
- `src/content/home/navbar.json` — link hrefs for the Navbar component.
- `src/content/home/hero.json` — headline, CTA label, and order href for the Hero component.
- `src/content/home/our-story.json` — heading + three paragraphs for the OurStory component.
- `src/content/home/cupcakes-banner.json` — headline for the CupcakesBanner component.
- `src/content/home/cupcake-carousel.json` — caption, order href, other-options href + label for the CupcakeCarousel component.
- `src/content/home/personal-cakes.json` — heading, caption, flavor headline, price, two pill labels + hrefs for the PersonalCakes component.
- `src/content/home/follow-us.json` — heading + two social hrefs for the FollowUs component.
- `src/content/home/footer.json` — three nav hrefs + copyright text for the Footer component.
Notes:
- `SmallBanner` has no `Props` (purely decorative 9-glyph band) and therefore no JSON entry. The collection has 8 entries, not 9.
- The base `src/content/` directory will be created as a side effect of writing the eight JSON files.
- No existing files are modified by this whiteboard.
## Modification Table
- `src/content.config.ts` — CREATE. Zod schema for `home` collection with one variant per section ID.
- `src/content/home/navbar.json` — CREATE. Seeds Navbar.astro defaults.
- `src/content/home/hero.json` — CREATE. Seeds Hero.astro defaults.
- `src/content/home/our-story.json` — CREATE. Seeds OurStory.astro defaults.
- `src/content/home/cupcakes-banner.json` — CREATE. Seeds CupcakesBanner.astro defaults.
- `src/content/home/cupcake-carousel.json` — CREATE. Seeds CupcakeCarousel.astro defaults.
- `src/content/home/personal-cakes.json` — CREATE. Seeds PersonalCakes.astro defaults.
- `src/content/home/follow-us.json` — CREATE. Seeds FollowUs.astro defaults.
- `src/content/home/footer.json` — CREATE. Seeds Footer.astro defaults.
## Existing Pattern Audit
- The project is Astro 6 (`package.json` declares `astro@^6.3.6`). Astro 5 deprecated `src/content/config.ts` in favor of `src/content.config.ts`; the v5+ canonical location is the only one I will use.
- The project does not currently have a content collection. The Sanity client (`src/lib/sanity/queries/products.ts`) handles the product catalog; per the prior topic decision, Sanity owns products and Astro Content Collections own marketing copy. There is therefore no existing collection schema or loader convention to extend — this whiteboard establishes the convention.
- Each ported component in `src/components/home/*.astro` already encodes its defaults in the `const { ... } = Astro.props` block. The schema field names and JSON values seeded here must match those defaults byte-for-byte; the next whiteboard (page composition) will pass the collection entries into the components as props.
- The components use camelCased prop names (`homeHref`, `chocolateLabel`, `paragraph1`, etc.). The JSON keys mirror this exactly so a page can do `<Hero {...hero.data} />` cleanly without remapping.
- Astro's content loader API (v5+) uses `defineCollection` + `glob` for JSON/MDX or the `file` loader for a single multi-entry file. For per-section JSON entries the `glob` loader is correct: `loader: glob({ pattern: "*.json", base: "./src/content/home" })`. Each file becomes one entry whose `id` is the basename without extension.
## Execution Plan
1. Create `src/content.config.ts` defining the `home` collection. Use Zod's `z.discriminatedUnion` keyed on a literal `section` field so each entry validates against its own variant. The variant shapes mirror each component's `Props`.
2. Create the directory `src/content/home/` implicitly by writing the JSON files.
3. Write the eight JSON entries. Each carries a `section` discriminator equal to its file basename (e.g. `navbar.json` → `"section": "navbar"`) plus the component's exact default values.
4. Run `npm run build` to verify Astro's `astro:content` virtual module type-generates without schema errors and all eight entries validate.
5. (Whiteboard scope ends here. Consuming the collection from `src/pages/index.astro` is the next whiteboard.)
## File-by-File Changes
### src/content.config.ts
#### Before
File does not exist.
#### After
```ts
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
```
#### Reasoning
Uses Astro 5+'s canonical `src/content.config.ts` location (the older `src/content/config.ts` is deprecated). `glob` loader picks up every `.json` file under `src/content/home/` and assigns its basename as the entry `id`. `z.discriminatedUnion("section", [...])` lets a single collection hold heterogeneous shapes while still giving each variant precise type inference — consumers can narrow by `entry.data.section === "hero"` and TypeScript will know the rest of the fields. Field names use camelCase to match each component's `Props` so `<Hero {...hero.data} />` works without remapping; `section` is the only extra field and is stripped by spread → Astro components tolerate unknown props.
### src/content/home/navbar.json
#### Before
File does not exist.
#### After
```json
{
  "section": "navbar",
  "homeHref": "#top",
  "whoHref": "#who-we-are",
  "orderHref": "#order",
  "favoritesHref": "#favorites",
  "cartHref": "#cart"
}
```
#### Reasoning
Values copied verbatim from `src/components/home/Navbar.astro` frontmatter destructuring defaults. Spreading this `.data` into `<Navbar />` produces the same DOM as `<Navbar />` with no props.
### src/content/home/hero.json
#### Before
File does not exist.
#### After
```json
{
  "section": "hero",
  "headline": "FRESH. SIMPLE. WHOLE.",
  "ctaLabel": "ORDER NOW",
  "orderHref": "#order"
}
```
#### Reasoning
Values copied verbatim from `src/components/home/Hero.astro` frontmatter defaults.
### src/content/home/our-story.json
#### Before
File does not exist.
#### After
```json
{
  "section": "our-story",
  "heading": "OUR STORY",
  "paragraph1": "After more than four decades as a registered nurse, during one quiet afternoon, a few baking videos on YouTube opened the door to something new.",
  "paragraph2": "What began as a simple interest soon became a passion she poured herself into—learning, practicing, and perfecting her craft. Her eye for detail, shaped by years of knitting and sewing, naturally found its place in every swirl of frosting and every finished cupcake.",
  "paragraph3": "Today, she blends that lifelong craftsmanship with her love for baking, creating something truly special to share with others."
}
```
#### Reasoning
Values copied from `src/components/home/OurStory.astro`. The em-dash in `paragraph2` is the literal U+2014 character (`—`), not the `\u2014` JS escape, because JSON does not support `\u`-escape outside of `\uXXXX` form and the literal character is the canonical encoding. The rendered DOM matches the component default exactly because TypeScript decodes `\u2014` to U+2014 at compile time — the on-the-wire output is the same.
### src/content/home/cupcakes-banner.json
#### Before
File does not exist.
#### After
```json
{
  "section": "cupcakes-banner",
  "headline": "CUPCAKES"
}
```
#### Reasoning
Value copied verbatim from `src/components/home/CupcakesBanner.astro` frontmatter default.
### src/content/home/cupcake-carousel.json
#### Before
File does not exist.
#### After
```json
{
  "section": "cupcake-carousel",
  "caption": "Soft, sweet, and baked to delicate perfection!",
  "orderHref": "#order",
  "otherOptionsHref": "#cupcakes",
  "otherOptionsLabel": "OTHER OPTIONS"
}
```
#### Reasoning
Values copied verbatim from `src/components/home/CupcakeCarousel.astro` frontmatter defaults. The three flavors and their hardcoded copy (`description`, `price`, `orderLabel`, the `flavors` array entries) are NOT exposed via the collection — they remain inlined in the component because they are structural product data, not editorial copy. Treating the flavor array as content would force a schema for nested cards, which is out of scope for the homepage copy collection (Sanity owns product data per the prior topic decision).
### src/content/home/personal-cakes.json
#### Before
File does not exist.
#### After
```json
{
  "section": "personal-cakes",
  "heading": "PERSONAL CAKES",
  "caption": "Small in size but big in bringing joy to each bite!",
  "flavorHeadline": "Choose your flavor!",
  "price": "$25",
  "chocolateHref": "#order",
  "chocolateLabel": "Chocolate",
  "vanillaHref": "#order",
  "vanillaLabel": "Vanilla"
}
```
#### Reasoning
Values copied verbatim from `src/components/home/PersonalCakes.astro` frontmatter defaults.
### src/content/home/follow-us.json
#### Before
File does not exist.
#### After
```json
{
  "section": "follow-us",
  "heading": "FOLLOW US:",
  "facebookHref": "#",
  "instagramHref": "#"
}
```
#### Reasoning
Values copied verbatim from `src/components/home/FollowUs.astro` frontmatter defaults. The two hrefs are placeholders (`#`) — when the real social URLs are known, only this JSON file changes; no component touch required.
### src/content/home/footer.json
#### Before
File does not exist.
#### After
```json
{
  "section": "footer",
  "whoHref": "#who-we-are",
  "orderHref": "#order",
  "topHref": "#top",
  "copyright": "Copyright @cups&cakes. All Rights Reserved."
}
```
#### Reasoning
Values copied verbatim from `src/components/home/Footer.astro` frontmatter defaults.
## Validation Plan
1. `cd /Users/dev/.warp/worktrees/cupscakes-website/pictograph-granite && npm run build` — must exit 0. Astro's content layer type-generates from `src/content.config.ts` during build; a malformed schema or a JSON entry that fails Zod validation will produce a build error pointing at the offending file.
2. Inspect the auto-generated types: after a successful build, `.astro/types.d.ts` should declare the `home` collection. (No assertion required; build success implies generation.)
3. Defer rendered-page validation to the next whiteboard. The composition whiteboard will call `getCollection("home")`, fan the entries to their components via spread, and we will re-screenshot the homepage to confirm byte-equivalent DOM (which it must be, since the seeded values match the component defaults verbatim).
## Risk Notes
- **Em-dash encoding (`OurStory.paragraph2`)**: JSON requires the literal `—` character, not the `\u2014` JS escape used in the component default. The two encode to the same UTF-8 byte sequence at render time, so output is byte-equivalent. If a downstream editor "auto-corrects" the em-dash to a hyphen-minus, the JSON will silently drift from the component default; this is an editorial risk, not a build risk.
- **Discriminated union vs separate collections**: I chose one `home` collection with a discriminated union over eight tiny collections because: (a) consumers can do `getCollection("home")` once and iterate, (b) the section list is closed and small, (c) it keeps `src/content.config.ts` co-located. The downside is each entry must carry a `section` field that duplicates the file basename. If the section list grows past ~12 or sections need independent listing/sorting, splitting into separate collections becomes worth it; that refactor is straightforward (one collection per file pattern, drop the discriminator).
- **`SmallBanner` has no entry**: it takes no props, so seeding an empty JSON adds noise without value. The composition whiteboard will reference this asymmetry explicitly.
- **`section` field in spread**: when the page spreads `entry.data` into a component (e.g. `<Hero {...heroEntry.data} />`), the `section` literal is passed in alongside the named props. None of the nine ported components spread `Astro.props` onto a rendered element — they only emit the specific destructured fields they expect — so the extra `section` key is dropped at the component boundary and never reaches the DOM. (Destructuring with defaults does not strip the key from the props object; what matters is that no component forwards `Astro.props` to an element with `{...Astro.props}`.) No render impact.
- **Field-rename drift risk**: if a component renames a prop later, the schema and JSON must be updated in lockstep. The schema's strict object shape will fail the build the moment a renamed component is wired without an updated JSON, which is the desired safety net.
- **Hardcoded carousel/flavor data stays in the component**: the three flavors in `CupcakeCarousel.astro` are not exposed via the collection. If product copy needs to be editable later, those fields move to Sanity (product catalog) rather than into `home`. This boundary is deliberate per the earlier "Sanity owns products, Astro owns marketing copy" decision.
## Approval
Status: Awaiting explicit user approval. Do not implement yet.
