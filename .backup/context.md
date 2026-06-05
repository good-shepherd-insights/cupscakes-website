# Cups & Cakes — Project Context

This document captures the workflow, conventions, and patterns used to convert the
Figma file **HOME PAGE – 4** (Figma node `3311:1429`, file key `QfJe3qKtxeGOelVBqyEl3L`)
into responsive HTML styled entirely with **Tailwind CSS v4 primitives**. Future
sections must follow these rules exactly so the page stays consistent across
viewports.

## 0. Core philosophy (read this first)

**Use Tailwind v4 primitives only. No CSS. No math. No `calc()`. No `style=""`.**

We are NOT trying to be mathematically pixel-perfect to Figma. We ARE trying to
be within a few pixels of Figma at desktop while using the Tailwind type and
spacing scales for everything. Figma values are a **reference**, not a target.

- If Figma says 46px text and Tailwind has `text-3xl` (30px) or `text-5xl`
  (48px), pick the nearest one — don't introduce `text-[46px]`.
- If Figma says the bar is 156px tall and Tailwind has `h-24` (96px) or
  `h-40` (160px), pick the nearest one — don't introduce `h-[156px]`.
- If Figma puts a logo at `left: 57.88px`, use `pl-10` or `pl-14` and a flex
  layout — don't introduce `left-[57.88px]`.
- **Smaller is better than larger** when picking between two adjacent steps.
- **Match painted (on-screen) size, not logical CSS size.** When comparing to
  a reference rendered inside a `transform: scale(s)` wrapper, multiply the
  reference's CSS sizes by `s` to get the painted size, and pick primitives
  that match the painted size at the target breakpoint.
- **Encapsulate every section as a Web Component** (custom element) — see
  section 8. Pages compose by declaring custom-element tags, not by
  inlining the section's markup. Tag names just need to contain a hyphen
  per the HTML spec (e.g. `<nav-bar>`, `<hero-section>`, `<small-banner>`);
  no project-wide prefix is required.
- **Use integer `aspect-[w/h]` ratios.** Figma often reports fractional sizes
  (e.g. `117.9 × 109.7`). Round to whole numbers (`aspect-[118/110]`). The
  visual difference is invisible at any breakpoint, and integers keep the
  markup readable. Only keep decimals when the original ratio is itself an
  exact decimal that rounds badly (rare).
- **Promote any color that appears more than once to a `@theme` token.**
  Never reach for default Tailwind palette utilities (`bg-pink-300`,
  `text-red-500`, etc.) for brand-coded values. Declare `--color-brand-<name>`
  in `@theme` and reference it as `bg-brand-<name>` / `text-brand-<name>`.
- **Inject user-supplied text via `textContent` after `innerHTML`**, never
  via template-literal interpolation. Inside `#render`, build the static
  shell with `this.innerHTML = \`...\``, then look up each `[data-role]`
  target and assign its `textContent`. This makes XSS impossible by
  construction — the browser escapes everything.

## 1. Source of truth

- Figma file: `https://www.figma.com/design/QfJe3qKtxeGOelVBqyEl3L/...`
- Target frame: **HOME PAGE – 4**, node `3311:1429`
- Frame dimensions in Figma: 1920 × 6978 px (reference only)
- Output file: `index.html` (single static page)
- Styling: **Tailwind CSS v4** browser build only — no custom CSS rules,
  no `style="..."` inline declarations on components, no `calc()`, no custom
  CSS variables for sizing. Only `@theme` (design tokens) and `@utility`
  (reusable utility groups) live in `<style type="text/tailwindcss">`.
- Typography: Inter (400 / 500 / 600) via Google Fonts

Figma values are a **reference** for picking the closest Tailwind primitive.
They are not values you copy verbatim into the markup.

## 2. Tooling — fetching design data

Always pull design data from the connected **Figma MCP** server before writing
markup. Two tools are used:

- `get_metadata` — overview of a node's structure (IDs, names, positions, sizes)
- `get_design_context` — full reference code + asset URLs + screenshot for a node

Inputs:
- `fileKey`: `QfJe3qKtxeGOelVBqyEl3L`
- `nodeId`: e.g. `3311:1429` for the whole frame, or any sub-node ID
- `clientFrameworks`: `html,css`
- `clientLanguages`: `html,css`

The MCP returns React + Tailwind reference code with hardcoded Figma px
(e.g. `text-[46px]`, `left-[57.88px]`, `h-[156px]`). **Do not ship that
React output as-is.** Read it as a *spec*: use the px values to pick the
closest Tailwind primitive (e.g. `text-3xl`, `pl-10`, `h-24`). Convert
absolute Figma positioning to a real responsive flow layout (flex/grid,
padding, gap). Asset URLs from the MCP are signed and valid for ~7 days; store
them as `@theme` `--background-image-*` tokens so they become Tailwind
utilities (see section 6).

## 3. Tailwind v4 setup

The project loads Tailwind v4 from the official browser CDN. There is no build
step, no PostCSS, no `tailwind.config.js`. All configuration lives in CSS via
the `@theme` directive inside `<style type="text/tailwindcss">`.

### 3.1 CDN

```html
<script src="https://unpkg.com/@tailwindcss/browser@4"></script>
```

### 3.2 `@theme` tokens

Every design token (color, font, asset, spacing) is declared once in `@theme`.
Tailwind v4 automatically generates utilities from these tokens:
- `--color-foo: ...` → `text-foo`, `bg-foo`, `border-foo`, etc.
- `--font-sans: ...` → `font-sans`
- `--background-image-foo: ...` → `bg-foo`

```html
<style type="text/tailwindcss">
  @theme {
    /* Brand palette */
    --color-brand-blue: #87cefa;
    --color-brand-blue-dark: #4aa6dc;
    --color-brand-border: #707070;

    /* Typography */
    --font-sans: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;

    /* Figma MCP asset URLs (signed, ~7-day expiry) */
    --background-image-cups-icon:   url("https://www.figma.com/api/mcp/asset/...");
    --background-image-heart-group: url("https://www.figma.com/api/mcp/asset/...");
    --background-image-cart-icon:   url("https://www.figma.com/api/mcp/asset/...");
  }
</style>
```

### 3.3 `@utility` custom utilities

For reusable groups of utilities (especially hover/focus clusters), use the v4
`@utility` directive. This is the canonical v4 way to extract repeated class
strings. The navbar uses this for `nav-link` and `nav-icon` (see section 7).

A `@utility` may use any standard Tailwind utility inside `@apply` — use
responsive primitives (`text-xs sm:text-sm md:text-base ...`) the same way you
would on an element. **No arbitrary values, no `calc()`, no CSS rules.**

```html
<style type="text/tailwindcss">
  @utility nav-link {
    @apply relative inline-block text-center font-medium text-brand-blue no-underline whitespace-nowrap;
    @apply text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl leading-none;
    @apply transition-[color,transform] duration-150 ease-out;
    @apply hover:text-brand-blue-dark hover:-translate-y-px;
    @apply focus-visible:text-brand-blue-dark focus-visible:-translate-y-px focus-visible:outline-hidden;
    @apply after:content-[''] after:absolute after:inset-x-[12%] after:-bottom-1 after:h-0.5 after:rounded-full after:bg-current after:origin-center after:scale-x-0 after:transition-transform after:duration-200 after:ease-out;
    @apply hover:after:scale-x-100 focus-visible:after:scale-x-100;
  }
</style>
```

### 3.4 v4 specifics to remember

- **`outline-hidden`**, not `outline-none`, when removing the focus outline
  while keeping a custom focus state (v4 renamed this utility).
- `border` already implies `border-style: solid` — do not add `border-solid`.
- `cursor-pointer` is unnecessary on `<a href>` (default).
- `inline-block` is unnecessary on `absolute`-positioned elements (they
  become block-level automatically).
- `role="img"` does not belong on `<a>` — anchors are links; use `aria-label` only.
- The only acceptable arbitrary value in this project is **`aspect-[w/h]`**
  for locking icon proportions when the Figma asset has a specific aspect
  ratio. Every other arbitrary value (`text-[46px]`, `left-[57.88px]`,
  `h-[156px]`, `tracking-[2.3px]`, etc.) is forbidden — pick the nearest
  primitive instead.

## 4. Per-component implementation rules

When converting a new Figma section to HTML:

1. Pull design data with `get_design_context` for the section's node ID. Read
   the Figma `x`, `y`, `width`, `height`, `font-size`, `letter-spacing`, etc.
   as a **spec**, not as values to copy verbatim.
2. Build the component as a **real responsive flow layout** — flex, grid,
   padding, gap. **No `absolute` + Figma px coordinates**, no fixed widths.
3. For every Figma px value, pick the nearest Tailwind primitive:
   - **Type scale**: `text-xs` (12) → `text-sm` (14) → `text-base` (16) →
     `text-lg` (18) → `text-xl` (20) → `text-2xl` (24) → `text-3xl` (30) →
     `text-4xl` (36) → `text-5xl` (48).
   - **Spacing scale** (`p-`, `m-`, `gap-`, `h-`, `w-`): `0.5` (2) → `1` (4)
     → `2` (8) → `3` (12) → `4` (16) → `5` (20) → `6` (24) → `8` (32) →
     `10` (40) → `12` (48) → `14` (56) → `16` (64) → `20` (80) → `24` (96)
     → `32` (128) → `40` (160).
   - **Tracking**: `tracking-tight`, `tracking-normal`, `tracking-wide`,
     `tracking-wider`, `tracking-widest`.
   - When two adjacent steps are both "close enough", pick the **smaller** one.
4. Use **breakpoints** for responsiveness: `text-lg sm:text-xl md:text-2xl
   lg:text-3xl`, `h-12 sm:h-14 md:h-16 lg:h-20 xl:h-24`, etc. Step typography
   and dimensions down at smaller breakpoints. Use the breakpoint order
   `sm` (640) → `md` (768) → `lg` (1024) → `xl` (1280) → `2xl` (1536).
5. Use **theme-token utilities** for design tokens that recur across the page
   (`text-brand-blue`, `bg-cups-icon`, `font-sans`, `border-brand-border`).
6. **No inline `style="..."`** on components. **No `calc()`. No CSS rules.**
   **No arbitrary values** except `aspect-[w/h]` to lock icon proportions.
7. Add `data-node-id="..."` and `data-name="..."` attributes from the Figma
   node so the markup is traceable back to the design.
8. Apply `whitespace-nowrap` to any nav/label text that must never wrap.
9. Hover/focus styles may change **color, transform (subtle), opacity, filter,
   brightness, underline** — they must NEVER change layout dimensions
   (width/height/padding/margin) or shift surrounding elements.
10. When a hover/focus utility cluster repeats across components, extract it
    into an `@utility` (see section 3.3).

## 5. Responsive model — breakpoint-driven flow layout

The page is a normal responsive flow layout. **No fixed canvas, no transform,
no JS scaler, no `vw`/`%` font sizing, no `calc()`.** Sections stack vertically;
each section's internals use flex/grid with Tailwind breakpoints to scale.

### 5.1 Page wrapper

```html
<body class="m-0 p-0 bg-white font-sans antialiased">
  <header class="sticky top-0 z-50 ...">...</header>
  <main id="top">
    <!-- sections render in flow, each is its own self-contained block -->
  </main>
</body>
```

### 5.2 Section pattern

Every section is its own `<section>` with breakpoint-driven sizing:

```html
<section
  class="w-full bg-white px-4 sm:px-6 md:px-10 lg:px-14 py-8 sm:py-12 md:py-16 lg:py-20"
  data-node-id="..."
  data-name="..."
>
  <div class="mx-auto max-w-screen-2xl flex flex-col items-center gap-6 sm:gap-8 md:gap-10">
    <!-- content here -->
  </div>
</section>
```

### 5.3 Why this works
- Every dimension uses Tailwind's spacing/type scale, so changes are made by
  picking the next step up or down, never by editing a px value.
- Breakpoints handle responsiveness directly; there is no transform layer to
  reason about.
- Hover/focus is local to each component and never touches layout.

## 6. Asset handling

Figma MCP asset URLs are signed (~7-day expiry). Declare them once in `@theme`
as `--background-image-*` tokens; Tailwind v4 turns them into `bg-*` utilities.

```css
@theme {
  --background-image-cups-icon: url("https://www.figma.com/api/mcp/asset/...");
}
```

Use them as one-class background-image utilities, paired with sizing/clipping
utilities:

```html
<div
  class="absolute left-[144.37px] top-[2.84px] w-[75.694px] h-[55.796px] bg-cups-icon bg-no-repeat bg-contain bg-center"
  data-node-id="3311:1568"
  data-name="Group 21"
  role="img"
  aria-label="Cups & Cakes cupcake mark"
></div>
```

- Use `bg-contain` for icon/logo glyphs.
- Use `object-cover` with a real `<img>` for photographic assets.
- Keep the container dimensions exactly as Figma reports.
- Add `role="img"` + `aria-label` when a non-link, non-image element carries
  visual meaning. Do NOT add `role="img"` to `<a>` — anchors should keep their
  link semantics; use `aria-label` only.

## 7. Reference: how the **navbar** was built (the canonical example)

The navbar is exposed to pages as the custom element `<nav-bar>` (see
section 8 for the component pattern). The markup below is what the component
renders into its Light DOM — it's the canonical shape every other section's
component must follow.

The navbar (Figma `3311:1430`, "Rectangle 1") is the model every other section
must follow.

### 7.1 Read the design as a spec

Figma values for HOME PAGE – 4 navbar (reference only — don't copy verbatim):
- Bar: ~156 px tall, white, 1px `#707070` border at top of page
- Logo lockup `CUPS [icon] CAKES`: Inter Medium ~46 px, `#87cefa`, tracking ~2.3 px
- Cupcake glyph aspect ratio ~ `75.694 / 55.796` (use `aspect-[w/h]`)
- Nav links "WHO WE ARE" / "ORDER NOW": Inter Medium ~28 px, `#87cefa`
- Heart cluster aspect ratio ~ `111.961 / 36`
- Cart icon aspect ratio ~ `41.479 / 46.541`

### 7.2 Pick the nearest Tailwind primitives (smaller-is-better)

Figma values are at full 1920px scale. The reference `index.html` paints them
inside a `transform: scale(0.625)` wrapper, so the painted nav text is ~17.5px,
not 28px. We pick primitives that match the **painted** size at the breakpoint.

Resolved scale (per breakpoint, smallest → largest):
- Bar: `h-14 sm:h-16 md:h-20 lg:h-24 xl:h-32` (56 → 64 → 80 → 96 → 128)
- Side padding: `px-3 sm:px-4 md:px-6 lg:px-10`
- Logo type: `text-base sm:text-lg md:text-xl lg:text-2xl xl:text-4xl`
  (16 → 18 → 20 → 24 → 36) — logo uses `leading-relaxed`, NOT `tracking-wider`.
- Nav link type (in `@utility nav-link`):
  `text-xs sm:text-sm md:text-base lg:text-lg xl:text-2xl leading-relaxed`
  (12 → 14 → 16 → 18 → 24)
- Nav cluster gap: `gap-3 sm:gap-4 md:gap-6 lg:gap-10`
- Heart cluster: `h-4 sm:h-5 md:h-5 lg:h-6`
- Cart icon: `h-5 sm:h-6 md:h-7 lg:h-8`
- Font weight: **`font-semibold`** (Inter 600), not `font-medium`. This
  compensates for the absence of the original's transform-induced visual
  thickening; same Inter family, same `letter-spacing: normal`.
- Border color: `--color-brand-border: #a0a0a0`, not `#707070`. The original's
  1px border is painted at ~0.625px after the transform and antialiases into a
  soft gray; a true 1px line at `#707070` reads almost black. `#a0a0a0`
  matches the painted softness.

### 7.3 Resulting structure

```html
<header
  class="sticky top-0 z-50 w-full bg-white border-b border-brand-border
         h-14 sm:h-16 md:h-20 lg:h-24 xl:h-32"
  data-node-id="3311:1430"
  data-name="Navbar / Rectangle 1"
>
  <div class="flex h-full w-full items-center justify-between px-3 sm:px-4 md:px-6 lg:px-10">
    <!-- Logo lockup -->
    <a href="#top"
       class="inline-flex items-center gap-1.5 sm:gap-2 md:gap-2.5
              font-semibold text-brand-blue no-underline whitespace-nowrap
              text-base sm:text-lg md:text-xl lg:text-2xl xl:text-4xl
              leading-relaxed
              transition-opacity duration-150 hover:opacity-90 focus-visible:opacity-90 focus-visible:outline-hidden"
       data-node-id="3311:1569"
       aria-label="Cups & Cakes — home">
      <span data-node-id="3311:1557">CUPS</span>
      <span
        class="inline-block bg-cups-icon bg-no-repeat bg-contain bg-center shrink-0
               h-[1.2em] aspect-[75.694/55.796]"
        data-node-id="3311:1568" role="img" aria-label=""></span>
      <span data-node-id="3311:1561">CAKES</span>
    </a>

    <!-- Right cluster -->
    <nav class="flex items-center gap-3 sm:gap-4 md:gap-6 lg:gap-10"
         aria-label="Primary">
      <a href="#who-we-are"
         class="nav-link hidden md:inline-block"
         data-node-id="3311:1674">WHO WE ARE</a>

      <a href="#order"
         class="nav-link hidden md:inline-block"
         data-node-id="3311:1678">ORDER NOW</a>

      <a href="#favorites"
         class="nav-icon bg-heart-group h-4 sm:h-5 md:h-5 lg:h-6 aspect-[111.961/36]"
         data-node-id="3311:1689" aria-label="Account / favorites"></a>

      <a href="#cart"
         class="nav-icon bg-cart-icon h-5 sm:h-6 md:h-7 lg:h-8 aspect-[41.479/46.541]"
         data-node-id="3311:1695" aria-label="Shopping cart"></a>
    </nav>
  </div>
</header>
```

Notes on what is and isn't allowed in that markup:
- Every dimension uses a Tailwind primitive (`h-12`, `gap-3`, `text-xl`, etc.).
- The cupcake glyph's `h-[1.2em]` is an arbitrary value but it's a **ratio to
  the surrounding font-size**, not a Figma px copy — still acceptable.
- `aspect-[w/h]` is the ONLY other arbitrary value used — it locks each icon
  to its native asset ratio so the background image isn't squished.
- Text links hide below `md` to keep the mobile bar uncluttered; a future
  hamburger menu can replace them.

### 7.4 Hover / focus states (no layout shift) — defined as `@utility`

```html
<style type="text/tailwindcss">
  @utility nav-link {
    @apply relative inline-block text-center font-semibold text-brand-blue no-underline whitespace-nowrap;
    @apply text-xs sm:text-sm md:text-base lg:text-lg xl:text-2xl leading-relaxed;
    @apply transition-[color,transform] duration-150 ease-out;
    @apply hover:text-brand-blue-dark hover:-translate-y-px;
    @apply focus-visible:text-brand-blue-dark focus-visible:-translate-y-px focus-visible:outline-hidden;
    @apply after:content-[''] after:absolute after:inset-x-[12%] after:-bottom-1 after:h-0.5 after:rounded-full after:bg-current after:origin-center after:scale-x-0 after:transition-transform after:duration-200 after:ease-out;
    @apply hover:after:scale-x-100 focus-visible:after:scale-x-100;
  }

  @utility nav-icon {
    @apply inline-block bg-no-repeat bg-contain bg-center;
    @apply transition-[transform,opacity,filter] duration-150 ease-out;
    @apply hover:scale-105 hover:brightness-90;
    @apply focus-visible:scale-105 focus-visible:brightness-90 focus-visible:outline-hidden;
  }
</style>
```

Notes:
- Hover/focus change only color/transform/filter — never width/height/padding.
- `focus-visible:` mirrors `hover:` for keyboard a11y.
- The underline is an `after:` pseudo with `scale-x-0` → `scale-x-100`, so it
  animates from collapsed to full width without affecting layout.
- `outline-hidden` is the v4 name for what was `outline-none` in v3.
- Hover scale uses `hover:scale-105` (a primitive), not `hover:scale-[1.08]`.
- `font-semibold` and `text-brand-blue` live on the element class string
  directly (not only inside `@utility`) so they out-rank UA `<a>` defaults.

## 8. Component pattern — every section is a Web Component

Each section of the page is a custom element (Web Component). Pages compose
by declaring tags; no inline section markup in `index.responsive.html`.

### 8.1 Rules

- **Tag name**: short, lowercase, and MUST contain a hyphen per the HTML
  spec — e.g. `<nav-bar>`, `<hero-section>`, `<small-banner>`. Bare
  one-word names like `<navbar>` throw `SyntaxError` in
  `customElements.define`. No project-wide prefix is required; pick the
  clearest hyphenated name for the component's role.
- **Class name**: matches the unprefixed concept — `Navbar`, `Hero`, `Footer`.
  No project prefix on the class.
- **Light DOM only.** Render via `this.innerHTML = ...` (or `append`) — NOT
  Shadow DOM. Tailwind v4's browser build only scans the document, so utility
  classes inside a shadow root are invisible to it.
- **Idempotent `connectedCallback`**: render only when `childElementCount`
  is 0. Moving the node in the DOM must not destroy its children.
- **Declarative configuration** via attributes only. Expose hrefs / labels /
  variants as kebab-case attributes (`home-href`, `order-href`, ...). Wire
  them through `static observedAttributes` + `attributeChangedCallback` so
  attribute mutations patch the rendered DOM.
- **Guard against double-definition**: `if (!customElements.get("my-tag"))`.
- **Private methods** (`#render`, `#attr`) for encapsulation.
- The class is defined inline at the bottom of `index.responsive.html` in a
  `<script>` block. No build step, no modules.

### 8.2 Canonical template

```html
<nav-bar
  home-href="#top"
  who-href="#who-we-are"
  order-href="#order"
  favorites-href="#favorites"
  cart-href="#cart"
></nav-bar>

<script>
  class Navbar extends HTMLElement {
    static get observedAttributes() {
      return ["home-href", "who-href", "order-href", "favorites-href", "cart-href"];
    }
    connectedCallback() {
      if (this.childElementCount === 0) this.#render();
    }
    attributeChangedCallback(name, _oldValue, newValue) {
      if (this.childElementCount === 0) return;
      const role = name.replace(/-href$/, "");
      const el = this.querySelector(`[data-role="${role}"]`);
      if (el) el.setAttribute("href", newValue || "#");
    }
    #attr(name, fallback) { return this.getAttribute(name) || fallback; }
    #render() {
      const home = this.#attr("home-href", "#top");
      // ...other hrefs...
      this.innerHTML = `
        <header class="sticky top-0 ...">...</header>
      `;
    }
  }
  if (!customElements.get("nav-bar")) {
    customElements.define("nav-bar", Navbar);
  }
</script>
```

Each interactive child carries a `data-role="<key>"` attribute so attribute
changes can patch it without re-rendering the whole component.

## 9. Workflow for adding the next section

1. Identify the Figma sub-node (e.g. hero `3311:1437`, story `3311:1645`,
   cupcakes `3311:1455`, footer `3311:1456`, etc.).
2. Call `get_design_context` on that node ID for fresh asset URLs and Figma
   measurements.
3. Add any new Figma MCP asset URLs to `@theme` as `--background-image-*`
   tokens.
4. Add any new colors that recur across the page to `@theme` as `--color-*`
   tokens. Don't promote one-off colors.
5. **Wrap the section in a Web Component** — a hyphenated tag (`<some-foo>`)
   with a `Foo` class. Follow section 8 exactly: Light DOM, idempotent
   render, observed attributes, double-definition guard.
6. Inside the component, render a `<section>` in flow (see section 5.2). Use
   flex / grid + `gap-*` + `p-*` for layout. **No absolute positioning to
   Figma coordinates. No fixed pixel widths.**
7. For each Figma px value, pick the nearest Tailwind primitive (see section
   4 step 3). Smaller is better when in doubt. Step values down at smaller
   breakpoints (`sm:`, `md:`, `lg:`, `xl:`).
8. Convert any React `<img src={...}>` to a `<div>` with a `bg-*` utility
   (for icons/glyphs) or an `<img>` with `object-cover` (for photos). Lock
   icon aspect ratios with `aspect-[w/h]`.
9. Add `data-node-id` / `data-name` attributes for traceability. Add
   `data-role="<key>"` to every element that an attribute will patch.
10. If hover/focus or any other utility cluster repeats across elements,
    extract it as `@utility`. Otherwise apply utilities inline.
11. Verify at multiple viewport widths (375, 768, 1024, 1440, 1920, 2560).
    The layout must work at every width with no horizontal scroll.

## 10. Don'ts (common mistakes to avoid)

- **Don't use `calc()`.** Anywhere. Pick a primitive instead.
- **Don't use `style="..."` on components.** Anywhere. No exceptions.
- **Don't use arbitrary values** (`text-[46px]`, `h-[156px]`, `left-[57.88px]`,
  `w-[1920px]`, `tracking-[2.3px]`, etc.). The only acceptable arbitrary
  values in this project are:
  - `aspect-[w/h]` for locking icon proportions.
  - `h-[1.2em]` and similar **em-relative** sizing within a text run.
- Don't use absolute positioning to Figma coordinates. Build flow layouts
  with flex/grid + padding + gap.
- Don't write a hand-authored `<style>` block with normal CSS rules. The only
  contents inside `<style type="text/tailwindcss">` are `@theme { ... }` and
  `@utility xxx { ... }` blocks.
- Don't introduce custom CSS variables for sizing (`--u`, `--scale`, etc.).
  Responsiveness comes from Tailwind breakpoints, not CSS variable math.
- Don't use a fixed 1920px canvas + transform-scale. Layout is normal flow.
- Don't use `vw`, `vh`, or raw `%` for sizing — use Tailwind primitives.
- Don't try to be mathematically pixel-perfect to Figma. Within a few px is
  fine. Smaller is better than larger when picking between two adjacent steps.
- Don't change a component's width/height/padding on hover; only color,
  transform (scale/translate), opacity, filter.
- Don't add `outline-none`; use `outline-hidden` (v4 rename).
- Don't add `border-solid` alongside `border` (redundant in v4).
- Don't add `cursor-pointer` on `<a href>` (default).
- Don't add `role="img"` on `<a>` elements — anchors are links; use
  `aria-label` only.
- Don't promote one-shot values into `@theme` tokens. `@theme` is only for
  truly reusable design tokens (brand colors, font family, asset URLs).
- Don't ship the React reference output from the MCP as-is — it's full of
  hardcoded Figma px arbitrary values which are forbidden here.
- Don't introduce build tooling (PostCSS, Vite, etc.). The project runs as a
  single static `index.html` with the Tailwind v4 browser CDN.

## 11. Don'ts — components

- **Don't use Shadow DOM.** Tailwind v4 won't see classes inside a shadow root.
- **Don't use a one-word tag name** like `<navbar>` — invalid per the HTML
  spec. Always include a hyphen; pick a natural hyphenated name that
  describes the component's role (`nav-bar`, `hero-section`, `small-banner`).
- **Don't prefix class names** with `Cc`/`X`/`App`. Just `Navbar`, `Hero`,
  `Footer`. The hyphen requirement is on the tag, not the class.
- **Don't re-render on every attribute change.** Patch the affected child via
  `data-role`.
- **Don't write to `this.innerHTML` outside `#render`.** All markup originates
  from one method.
- **Don't omit the double-definition guard** (`if (!customElements.get(...))`)
  — it makes the script safe to re-run.
- **Don't interpolate user-supplied text into the `#render` template string.**
  Use `textContent` injection on `[data-role]` targets *after* assigning
  `this.innerHTML`. Template-literal interpolation of attribute values can
  inject HTML; `textContent` cannot.
- **Don't reach for default Tailwind palette colors** (`bg-pink-300`,
  `text-red-500`, etc.) for anything brand-coded. If a color repeats, promote
  it to a `--color-brand-*` `@theme` token.
- **Don't use decimal `aspect-[w/h]` ratios** when integers convey the same
  shape. Round Figma's fractional sizes to whole numbers.

## 12. File map

- `index.html` — the canonical responsive output (currently: navbar only).
- `index.responsive.html` — working copy used during refactor experiments.
  Hosts the `<nav-bar>`, `<hero-section>`, and `<small-banner>`
  custom-element definitions. Each section is its own component so pages
  can compose them independently.
- `context.md` — this file: workflow, conventions, navbar reference pattern,
  component pattern.
