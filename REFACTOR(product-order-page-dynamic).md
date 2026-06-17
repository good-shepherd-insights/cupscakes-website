# REFACTOR(product-order-page-dynamic)

## Request
`PersonalCakeProduct.astro` is the correct design for all product order pages. It hardcodes its data. Fix:

1. Move hardcoded option arrays to props.
2. Delete `personal-cake.astro` and the AI-slop `[slug].astro`. Replace `[slug].astro` with a page that uses `PersonalCakeProduct` wired to Sanity — so `/products/<slug>` renders the real design for any product.

**Zero design changes.**

---

## Directory Map
```text
src/
├── components/product/
│   └── PersonalCakeProduct.astro           ← MODIFY (widen props interface)
├── lib/sanity/queries/
│   └── products.ts                         ← MODIFY (add customization fields to GROQ)
├── pages/products/
│   ├── personal-cake.astro                 ← DELETE ([slug].astro takes over)
│   └── [slug].astro                        ← DELETE + CREATE (real design, Sanity data)
└── types/
    └── product.ts                          ← MODIFY (extend Product with customization fields)
```

---

## Modification Table
| File | Action | Why |
|---|---|---|
| `PersonalCakeProduct.astro` | Modify | Move hardcoded arrays to props; gate frosting/quantity sections on prop presence |
| `types/product.ts` | Modify | Add fields Sanity will supply per product type |
| `lib/sanity/queries/products.ts` | Modify | Fetch the new fields in GROQ |
| `pages/products/personal-cake.astro` | Delete | Replaced entirely by `[slug].astro` |
| `pages/products/[slug].astro` | Delete + Create | Replace no-design slop with `PersonalCakeProduct`-backed page |

---

## File-by-File Changes

---

### `src/components/product/PersonalCakeProduct.astro`

**Only the frontmatter changes.** Every class, element, pixel value, data-node-id, and Figma comment is untouched.

#### Before — Props + destructure + const arrays (lines 74–122)
```ts
interface Props {
  breadcrumbHrefHome: string;
  breadcrumbHrefOrder: string;
  imageSrc?: string;
  imageAlt?: string;
  addToCartHref?: string;
}

const {
  breadcrumbHrefHome,
  breadcrumbHrefOrder,
  imageSrc = "/assets/personal-cake-product.png",
  imageAlt = "Personal cake with pink frosting",
  addToCartHref = "#",
} = Astro.props;

/* ... selectionBtn unchanged ... */

const flavors = ["Chocolate", "Vanilla"] as const;
const frostingColors = ["Red","Blue","Green","Yellow","Purple","Pink","White","Custom"] as const;
const occasions = ["Regular","Birthday","Wedding","Holiday","Other"] as const;
```

#### After — Props + destructure (const arrays removed, come from props)
```ts
interface Props {
  breadcrumbHrefHome: string;
  breadcrumbHrefOrder: string;
  breadcrumbLabel: string;
  imageSrc?: string;
  imageAlt?: string;
  addToCartHref?: string;
  flavors: string[];
  /** Omit to hide the Frosting Color section. */
  frostingColors?: string[];
  /** Omit to hide the Quantity section. */
  quantities?: string[];
  occasions: string[];
}

const {
  breadcrumbHrefHome,
  breadcrumbHrefOrder,
  breadcrumbLabel,
  imageSrc = "/assets/personal-cake-product.png",
  imageAlt = "Personal cake with pink frosting",
  addToCartHref = "#",
  flavors,
  frostingColors,
  quantities,
  occasions,
} = Astro.props;

/* selectionBtn unchanged */
```

---

#### Before — Breadcrumb (hardcoded label)
```astro
<Breadcrumb
  items={[
    { label: "Home", href: breadcrumbHrefHome },
    { label: "Order Now", href: breadcrumbHrefOrder },
    { label: "Personal Cakes" },
  ]}
  class="mb-6 sm:mb-8 md:mb-10 lg:mb-12 xl:mb-[81px]"
/>
```

#### After — Breadcrumb (dynamic label)
```astro
<Breadcrumb
  items={[
    { label: "Home", href: breadcrumbHrefHome },
    { label: "Order Now", href: breadcrumbHrefOrder },
    { label: breadcrumbLabel },
  ]}
  class="mb-6 sm:mb-8 md:mb-10 lg:mb-12 xl:mb-[81px]"
/>
```

---

#### Before — Frosting fieldset (always renders)
```astro
<fieldset
  class="m-0 p-0 border-0 mt-8 sm:mt-10 md:mt-12 lg:mt-14 xl:mt-[78px]"
  data-node-id="3311:2320"
>
  ...
</fieldset>
```

#### After — Frosting fieldset (gated on prop)
```astro
{frostingColors && (
  <fieldset
    class="m-0 p-0 border-0 mt-8 sm:mt-10 md:mt-12 lg:mt-14 xl:mt-[78px]"
    data-node-id="3311:2320"
  >
    ...unchanged interior...
  </fieldset>
)}
```

---

#### New — Quantity fieldset (between Frosting and Occasion, same classes as Occasion)
```astro
{quantities && (
  <fieldset
    class="m-0 p-0 border-0
           mt-8 sm:mt-10 md:mt-12 lg:mt-14 xl:mt-[78px]"
  >
    <legend
      class="p-0 m-0 text-black font-light leading-[1]
             text-[15px] sm:text-[18px] md:text-[22px] lg:text-[28px] xl:text-[35px]"
    >Quantity:</legend>
    <div
      class="grid grid-cols-2 sm:grid-cols-3
             gap-x-3 sm:gap-x-4 md:gap-x-5 lg:gap-x-6 xl:gap-x-[46px]
             gap-y-3 sm:gap-y-4 md:gap-y-5 lg:gap-y-6 xl:gap-y-[49px]
             mt-4 sm:mt-5 md:mt-6 lg:mt-8 xl:mt-[60px]
             max-w-[810px]"
    >
      {quantities.map((label) => (
        <label class={selectionBtn}>
          <input type="radio" name="quantity" value={label} class="sr-only peer" />
          <span class="peer-checked:underline">{label}</span>
        </label>
      ))}
    </div>
  </fieldset>
)}
```

---

### `src/types/product.ts`

**Action:** Modify

#### Before
```ts
export interface Product {
  _id: string;
  name: string;
  price: number;
  slug: { current: string };
  image: unknown;
  description?: string;
}
```

#### After
```ts
export interface Product {
  _id: string;
  name: string;
  price: number;
  slug: { current: string };
  image: unknown;
  description?: string;
  flavors?: string[];
  /** Frosting Color options. Absence hides the section. */
  frostingColors?: string[];
  /** Quantity options. Absence hides the section. */
  quantities?: string[];
  occasions?: string[];
}
```

---

### `src/lib/sanity/queries/products.ts`

**Action:** Modify — add new fields to `PRODUCT_FIELDS`.

#### Before
```ts
const PRODUCT_FIELDS = `
  _id,
  name,
  price,
  slug,
  image,
  description
`;
```

#### After
```ts
const PRODUCT_FIELDS = `
  _id,
  name,
  price,
  slug,
  image,
  description,
  flavors,
  frostingColors,
  quantities,
  occasions
`;
```

---

### `src/pages/products/personal-cake.astro`

**Action:** Delete. `[slug].astro` serves this route via the `personal-cake` Sanity slug.

---

### `src/pages/products/[slug].astro`

**Action:** Delete current file. Create new.

#### Before (current — bare article, no design, missing Navbar/Footer)
```astro
---
import Layout from '../../layouts/Layout.astro';
import AddToCartButton from '../../components/snipcart/AddToCartButton.astro';
import { buildItemAttributes } from '../../lib/snipcart/attributes';
import { getAllProductSlugs, getProductBySlug } from '../../lib/sanity/queries/products';
import { urlFor } from '../../lib/sanity/image';
import { IMAGE_WIDTHS } from '../../lib/constants';
import { routes } from '../../lib/routes';

export async function getStaticPaths() {
  const slugs = await getAllProductSlugs();
  return slugs.map((p) => ({ params: { slug: p.slug.current } }));
}

const { slug } = Astro.params;
const product = await getProductBySlug(slug!);
if (!product) return Astro.redirect('/404');

const imageUrl = product.image ? urlFor(product.image as any).width(IMAGE_WIDTHS.detail).url() : undefined;
const productUrl = routes.product(slug!);
const cartAttrs = buildItemAttributes({ ... });
---
<Layout title={product.name}>
  <article>
    {imageUrl && <img src={imageUrl} alt={product.name} />}
    <h1>{product.name}</h1>
    <p>{product.price}</p>
    {product.description && <p>{product.description}</p>}
    <AddToCartButton {cartAttrs} />
  </article>
</Layout>
```

#### After (real design, Sanity-driven)
```astro
---
import Layout from '../../layouts/Layout.astro';
import Navbar from '../../components/home/Navbar.astro';
import Footer from '../../components/home/Footer.astro';
import PersonalCakeProduct from '../../components/product/PersonalCakeProduct.astro';
import { loadHomeContent } from '../../lib/content/home';
import { getAllProductSlugs, getProductBySlug } from '../../lib/sanity/queries/products';
import { urlFor } from '../../lib/sanity/image';
import { IMAGE_WIDTHS } from '../../lib/constants';

const DEFAULT_OCCASIONS = ["Regular", "Birthday", "Wedding", "Holiday", "Other"];

export async function getStaticPaths() {
  const slugs = await getAllProductSlugs();
  return slugs.map((p) => ({ params: { slug: p.slug.current } }));
}

const { slug } = Astro.params;
const [{ navbar, footer }, product] = await Promise.all([
  loadHomeContent(),
  getProductBySlug(slug!),
]);

if (!product) return Astro.redirect('/404');

const imageUrl = product.image
  ? urlFor(product.image as any).width(IMAGE_WIDTHS.detail).url()
  : undefined;
---

<Layout title={`${product.name} — Cups & Cakes`}>
  <div class="flex min-h-dvh flex-col">
    <Navbar {...navbar} />
    <PersonalCakeProduct
      breadcrumbHrefHome={navbar.homeHref}
      breadcrumbHrefOrder={navbar.orderHref}
      breadcrumbLabel={product.name}
      imageSrc={imageUrl}
      imageAlt={product.name}
      flavors={product.flavors ?? []}
      frostingColors={product.frostingColors}
      quantities={product.quantities}
      occasions={product.occasions ?? DEFAULT_OCCASIONS}
    />
    <Footer {...footer} />
  </div>
</Layout>
```

---

## Validation
```bash
npx astro check
npx astro dev
# /products/<sanity-slug> — real design, sections driven by Sanity data
```

---

## Approval
`Status: Awaiting explicit user approval. Do not implement yet.`
