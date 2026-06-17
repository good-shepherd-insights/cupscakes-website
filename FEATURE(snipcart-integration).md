# FEATURE(snipcart-integration)

## Directory Map

```
src/
  components/
    snipcart/
      Snipcart.astro          ← MODIFY (rewrite: clean head component, script delegated to helper)
      AddToCartButton.astro   ← MODIFY (pure button — accepts pre-built attrs, spreads them, slot)
      CartButton.astro        ← MODIFY (enhance: slot support)
  lib/
    snipcart/
      loader.ts               ← CREATE (IIFE loader script builder, SnipcartSettings defaults)
      attributes.ts           ← CREATE (Snipcart data-attribute builder — custom fields, optional attrs)
  layouts/
    Layout.astro              ← MODIFY (move Snipcart from body → head)
  styles/
    snipcart-overrides.css    ← CREATE (brand-token CSS overrides)
```

## Modification Table

| File | Change | Reason |
|---|---|---|
| `src/components/snipcart/Snipcart.astro` | Rewrite | Clean head-only component; script markup delegated to `lib/snipcart/loader.ts` |
|| `src/lib/snipcart/loader.ts` | Create | Extracts the ugly IIFE loader script into a typed helper; component stays clean |
|| `src/lib/snipcart/attributes.ts` | Create | Builds Snipcart `data-item-*` attribute map from typed input; no attribute logic in the button |
|| `src/components/snipcart/AddToCartButton.astro` | Modify | Pure presentational button — receives pre-built attrs, spreads them, slot |
| `src/components/snipcart/CartButton.astro` | Enhance | Slot support so navbar cart icon can wrap |
| `src/layouts/Layout.astro` | Modify | Move `<Snipcart />` from body to head; import overrides CSS |
| `src/styles/snipcart-overrides.css` | Create | Brand-token CSS overrides for Snipcart cart UI |

---

## 1. `src/lib/snipcart/loader.ts` — CREATE

**Why**: The Snipcart v3.4+ IIFE loader is a 500+ character minified script that should not live inline in a component template. Extracting it into a utility keeps `Snipcart.astro` clean and makes the loader configurable/inspectable in one place.

```ts
/**
 * Snipcart v3.4+ loader script builder.
 *
 * Generates the `window.SnipcartSettings` config and the official
 * IIFE loader script that Snipcart documents at:
 *   https://docs.snipcart.com/v3/setup/installation
 *
 * The IIFE must be copied verbatim — all customization goes through
 * `window.SnipcartSettings`. This helper builds that config and
 * injects it into a single `<script>` tag string that the
 * Snipcart.astro component drops into `<head>`.
 */

export interface SnipcartLoaderConfig {
  publicApiKey: string;
  /** Pin a Snipcart version (recommended when using CSS overrides). */
  version?: string;
  /** Default currency. Defaults to "usd". */
  currency?: string;
  /** Cart modal style: "side" (drawer) or full-page (omit). */
  modalStyle?: "side";
  /** "none" = don't auto-open cart when product is added. */
  addProductBehavior?: "none";
  /** "on-user-interaction" (deferred), "manual", or immediate (omit). */
  loadStrategy?: "on-user-interaction" | "manual";
}

/**
 * Returns the complete inline `<script>` tag content (everything
 * between the tags) for the Snipcart v3.4+ loader.
 *
 * Usage in Snipcart.astro:
 *   const scriptContent = buildLoaderScript({ publicApiKey, ... });
 *   // then: <script is:inline set:html={scriptContent} />
 */
export function buildLoaderScript(config: SnipcartLoaderConfig): string {
  const settings: Record<string, unknown> = {
    publicApiKey: config.publicApiKey,
    version: config.version ?? "3.7.2",
    currency: config.currency ?? "usd",
    loadStrategy: config.loadStrategy ?? "on-user-interaction",
  };

  if (config.modalStyle) settings.modalStyle = config.modalStyle;
  if (config.addProductBehavior) settings.addProductBehavior = config.addProductBehavior;

  // The IIFE below is copied verbatim from Snipcart's official installation
  // docs (docs.snipcart.com/v3/setup/installation). One known fix applied:
  // the original uses `src[src^=...]` (matches any element with a `src`
  // attr) instead of `script[src^=...]` — corrected per community reports.
  const iife = `(()=>{var a,d;(d=(a=window.SnipcartSettings).version)!=null||(a.version="3.0");var s,S;(S=(s=window.SnipcartSettings).currency)!=null||(s.currency="usd");var l,p;(p=(l=window.SnipcartSettings).timeoutDuration)!=null||(l.timeoutDuration=2750);var w,u;(u=(w=window.SnipcartSettings).domain)!=null||(w.domain="cdn.snipcart.com");var m,g;(g=(m=window.SnipcartSettings).protocol)!=null||(m.protocol="https");var y=window.SnipcartSettings.version.includes("v3.0.0-ci")||window.SnipcartSettings.version!="3.0"&&window.SnipcartSettings.version.localeCompare("3.4.0",void 0,{numeric:!0,sensitivity:"base"})===-1,f=["focus","mouseover","touchmove","scroll","keydown"];window.LoadSnipcart=o;document.readyState==="loading"?document.addEventListener("DOMContentLoaded",r):r();function r(){window.SnipcartSettings.loadStrategy?window.SnipcartSettings.loadStrategy==="on-user-interaction"&&(f.forEach(t=>document.addEventListener(t,o)),setTimeout(o,window.SnipcartSettings.timeoutDuration)):o()}var c=!1;function o(){if(c)return;c=!0;let t=document.getElementsByTagName("head")[0],e=document.querySelector("#snipcart"),i=document.querySelector('script[src^="'+window.SnipcartSettings.protocol+"://"+window.SnipcartSettings.domain+'"][src$="snipcart.js"]'),n=document.querySelector('link[href^="'+window.SnipcartSettings.protocol+"://"+window.SnipcartSettings.domain+'"][href$="snipcart.css"]');e||(e=document.createElement("div"),e.id="snipcart",e.setAttribute("hidden","true"),document.body.appendChild(e)),h(e),i||(i=document.createElement("script"),i.src=window.SnipcartSettings.protocol+"://"+window.SnipcartSettings.domain+"/themes/v"+window.SnipcartSettings.version+"/default/snipcart.js",i.async=!0,t.appendChild(i)),n||(n=document.createElement("link"),n.rel="stylesheet",n.type="text/css",n.href=window.SnipcartSettings.protocol+"://"+window.SnipcartSettings.domain+"/themes/v"+window.SnipcartSettings.version+"/default/snipcart.css",t.prepend(n)),f.forEach(v=>document.removeEventListener(v,o))}function h(t){!y||(t.dataset.apiKey=window.SnipcartSettings.publicApiKey,window.SnipcartSettings.addProductBehavior&&(t.dataset.configAddProductBehavior=window.SnipcartSettings.addProductBehavior),window.SnipcartSettings.modalStyle&&(t.dataset.configModalStyle=window.SnipcartSettings.modalStyle),window.SnipcartSettings.currency&&(t.dataset.currency=window.SnipcartSettings.currency),window.SnipcartSettings.templatesUrl&&(t.dataset.templatesUrl=window.SnipcartSettings.templatesUrl))}})();`;

  return `window.SnipcartSettings=${JSON.stringify(settings)};${iife}`;
}
```

**Reasoning**:
- `buildLoaderScript()` takes a typed config, serializes it into `window.SnipcartSettings`, and appends the verbatim IIFE.
- The IIFE string is stored as a single const — not pretty, but it's a black-box vendor script.
- The component now just calls this function and injects the result. No minified mess in the template.
- `SnipcartLoaderConfig` is the single source of truth for all Snipcart settings.

---

## 2. `src/components/snipcart/Snipcart.astro` — REWRITE

**Why**: Move from body to head. Replace the legacy v3.0 pattern with the v3.4+ loader. Keep the component itself clean — all script logic lives in `lib/snipcart/loader.ts`.

**Before**:

```astro
---
import { PUBLIC_SNIPCART_API_KEY } from 'astro:env/client';
---
<link rel="preconnect" href="https://app.snipcart.com" />
<link rel="preconnect" href="https://cdn.snipcart.com" />
<link rel="stylesheet" href="https://cdn.snipcart.com/themes/v3.0/default/snipcart.css" />
<div hidden id="snipcart" data-api-key={PUBLIC_SNIPCART_API_KEY} transition:persist></div>
<script async src="https://cdn.snipcart.com/themes/v3.0/default/snipcart.js"></script>
```

**After**:

```astro
---
import { PUBLIC_SNIPCART_API_KEY } from 'astro:env/client';
import { buildLoaderScript } from '../../lib/snipcart/loader';

interface Props {
  version?: string;
  currency?: string;
  modalStyle?: 'side';
  addProductBehavior?: 'none';
  loadStrategy?: 'on-user-interaction' | 'manual';
}

const {
  version,
  currency,
  modalStyle = 'side',
  addProductBehavior = 'none',
  loadStrategy = 'on-user-interaction',
} = Astro.props;

const loaderScript = buildLoaderScript({
  publicApiKey: PUBLIC_SNIPCART_API_KEY,
  version,
  currency,
  modalStyle,
  addProductBehavior,
  loadStrategy,
});
---
<link rel="preconnect" href="https://app.snipcart.com" />
<link rel="preconnect" href="https://cdn.snipcart.com" />
<script is:inline set:html={loaderScript} />
```

**Reasoning**:
- Component is now 3 lines of markup (2 preconnects + 1 script). Clean.
- All the ugly IIFE lives in `loader.ts`. The component just calls `buildLoaderScript()` and injects the result.
- `is:inline` prevents Astro from bundling/processing the script.
- `set:html` injects the built script content directly.
- No `transition:persist` div — the IIFE creates `#snipcart` dynamically.
- Preconnect hints kept for early connection.

---

## 3. `src/layouts/Layout.astro` — MODIFY

**Why**: Snipcart must render in `<head>`. Import brand overrides CSS.

**Before**:

```astro
---
import { ClientRouter } from 'astro:transitions';
import Snipcart from '../components/snipcart/Snipcart.astro';
import '../styles/global.css';

interface Props {
  title?: string;
}
const { title = 'Cupcakes' } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <ClientRouter />
  </head>
  <body class="m-0 p-0 bg-white font-sans antialiased">
    <slot />
    <Snipcart />
  </body>
</html>
```

**After**:

```astro
---
import { ClientRouter } from 'astro:transitions';
import Snipcart from '../components/snipcart/Snipcart.astro';
import '../styles/global.css';
import '../styles/snipcart-overrides.css';

interface Props {
  title?: string;
}
const { title = 'Cupcakes' } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <ClientRouter />
    <Snipcart />
  </head>
  <body class="m-0 p-0 bg-white font-sans antialiased">
    <slot />
  </body>
</html>
```

---

## 4. `src/lib/snipcart/attributes.ts` — CREATE

**Why**: The `customFieldAttrs` / `optionalAttrs` building logic was inline in `AddToCartButton.astro` — a presentational component doing data-attribute assembly. That's not a button's job. This helper owns all Snipcart `data-item-*` attribute construction so the button stays a pure element.

```ts
/**
 * Snipcart data-attribute builder.
 *
 * Consuming pages call `buildItemAttributes()` with typed input and
 * spread the result onto `<AddToCartButton>`. The button component
 * itself does zero attribute logic — single responsibility.
 */

export interface CustomField {
  name: string;
  options?: string[];
  type?: string;
  required?: boolean;
  placeholder?: string;
  value?: string;
}

export interface ItemAttributesInput {
  id: string;
  name: string;
  price: number;
  url: string;
  description?: string;
  image?: string;
  customFields?: CustomField[];
  categories?: string[];
  metadata?: Record<string, string>;
  shippable?: boolean;
  quantity?: number;
}

/**
 * Builds the full Snipcart `data-item-*` attribute map from typed input.
 *
 * Returns a flat `Record<string, string>` safe to spread onto a
 * `<button>` element in Astro via `{...attrs}`.
 */
export function buildItemAttributes(input: ItemAttributesInput): Record<string, string> {
  const attrs: Record<string, string> = {
    'data-item-id': input.id,
    'data-item-price': String(input.price),
    'data-item-url': input.url,
    'data-item-name': input.name,
  };

  if (input.description) attrs['data-item-description'] = input.description;
  if (input.image) attrs['data-item-image'] = input.image;
  if (input.categories) attrs['data-item-categories'] = input.categories.join('|');
  if (input.metadata) attrs['data-item-metadata'] = JSON.stringify(input.metadata);
  if (input.shippable !== undefined) attrs['data-item-shippable'] = String(input.shippable);
  if (input.quantity !== undefined) attrs['data-item-quantity'] = String(input.quantity);

  for (let i = 0; i < (input.customFields?.length ?? 0); i++) {
    const field = input.customFields![i];
    const n = i + 1;
    attrs[`data-item-custom${n}-name`] = field.name;
    if (field.options) attrs[`data-item-custom${n}-options`] = field.options.join('|');
    if (field.type) attrs[`data-item-custom${n}-type`] = field.type;
    if (field.required) attrs[`data-item-custom${n}-required`] = 'true';
    if (field.placeholder) attrs[`data-item-custom${n}-placeholder`] = field.placeholder;
    if (field.value) attrs[`data-item-custom${n}-value`] = field.value;
  }

  return attrs;
}
```

**Reasoning**:
- `buildItemAttributes()` is the single source of truth for Snipcart `data-item-*` attribute construction.
- All values are coerced to `string` — Astro spreads require string values for HTML attributes.
- `CustomField` and `ItemAttributesInput` types are exported for consuming pages to import.
- The button component is now completely decoupled from attribute logic.

---

## 5. `src/components/snipcart/AddToCartButton.astro` — MODIFY

**Why**: Pure presentational component. Receives pre-built attributes from `buildItemAttributes()`, spreads them, renders a button with a slot. Zero logic, zero attribute assembly — single responsibility.

**Before**:

```astro
---
interface Props {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  productUrl: string;
}

const { id, name, price, description, imageUrl, productUrl } = Astro.props;
---
<button
  class="snipcart-add-item"
  data-item-id={id}
  data-item-price={price}
  data-item-url={productUrl}
  data-item-name={name}
  data-item-description={description}
  data-item-image={imageUrl}
>
  Add to Cart
</button>
```

**After**:

```astro
---
interface Props {
  /** Pre-built Snipcart data-item-* attributes from buildItemAttributes(). */
  attrs: Record<string, string>;
}

const { attrs } = Astro.props;
---
<button class="snipcart-add-item" {...attrs}>
  <slot>Add to Cart</slot>
</button>
```

**Usage in a product page**:

```astro
---
import AddToCartButton from '../components/snipcart/AddToCartButton.astro';
import { buildItemAttributes } from '../lib/snipcart/attributes';

const attrs = buildItemAttributes({
  id: 'red-velvet-cake',
  name: 'Red Velvet Cake',
  price: 35,
  url: '/products/red-velvet-cake',
  customFields: [
    { name: 'Size', options: ['6"', '8"', '10"'], required: true },
    { name: 'Inscription', type: 'textarea', placeholder: 'Happy Birthday!' },
  ],
});
---
<AddToCartButton {attrs} />
```

---

## 6. `src/components/snipcart/CartButton.astro` — ENHANCE

**Before**:

```astro
<button class="snipcart-checkout" aria-label="Open cart">
  Cart (<span class="snipcart-items-count">0</span>)
</button>
```

**After**:

```astro
---
interface Props {
  label?: string;
}
const { label = 'Open cart' } = Astro.props;
---
<button class="snipcart-checkout" aria-label={label}>
  <slot>
    Cart (<span class="snipcart-items-count">0</span>)
  </slot>
</button>
```

---

## 7. `src/styles/snipcart-overrides.css` — CREATE

```css
/*
 * Snipcart brand overrides for Cups & Cakes.
 *
 * Snipcart loads its own CSS from cdn.snipcart.com; this file is imported
 * in Layout.astro so it appears in the document <head> AFTER the
 * Snipcart CSS (which the IIFE prepends). Our rules override the
 * defaults to match C&C brand tokens.
 *
 * Brand tokens (from tailwind @theme):
 *   --color-brand-blue: #87CEFA
 *   --color-brand-pink: #EB9CF9
 *   --color-brand-border: #A0A0A0
 *   Font family: Inter
 */

/* Primary accent — buttons, links, highlights */
.snipcart__actions--link,
.snipcart-cart-button--highlight,
.snipcart-button--highlight {
  background-color: #87CEFA !important;
  border-color: #A0A0A0 !important;
  color: white !important;
  font-family: 'Inter', sans-serif !important;
}

.snipcart__actions--link:hover,
.snipcart-cart-button--highlight:hover {
  background-color: #6BB8E8 !important;
}

/* Close/cancel/secondary buttons */
.snipcart-cart-button,
.snipcart-button {
  border-color: #A0A0A0 !important;
  font-family: 'Inter', sans-serif !important;
}

/* Typography — match C&C's Inter font stack */
.snipcart * {
  font-family: 'Inter', sans-serif !important;
}

/* Cart header */
.snipcart-cart-header {
  font-family: 'Inter', sans-serif !important;
}

/* Price styling */
.snipcart-cart-summary-fees__item-price,
.snipcart-cart-summary-fees__item-label,
.snipcart-item-price {
  font-family: 'Inter', sans-serif !important;
}

/* Item quantity controls */
.snipcart-item-quantity {
  font-family: 'Inter', sans-serif !important;
}

/* Discount box */
.snipcart-discount-box {
  font-family: 'Inter', sans-serif !important;
}

/* Form inputs */
.snipcart-form__input,
.snipcart-form__select,
.snipcart-input {
  font-family: 'Inter', sans-serif !important;
  border-color: #A0A0A0 !important;
}

/* Error messages */
.snipcart-error-message {
  font-family: 'Inter', sans-serif !important;
}
```

---

## Important considerations

1. **Order validation**: Snipcart crawls `data-item-url` at checkout to verify product definitions. For static Astro sites, the product page must be deployed and accessible. Test mode relaxes this for local dev.

2. **View Transitions**: The old `transition:persist` div is gone. The IIFE creates `#snipcart` dynamically and reuses it if present. `ClientRouter` re-runs the script on navigations; the IIFE checks for existing `#snipcart` first.

3. **IIFE in loader.ts**: The minified IIFE is a vendor black box stored as a string constant in `loader.ts`. It should not be reformatted or modified — only updated when Snipcart publishes a new version of the loader.

4. **Version pinning**: `3.7.2` default. Recommended by Snipcart when using CSS overrides to avoid breaking changes.

5. **No `@lloydjatkinson/astro-snipcart`**: Direct implementation for full control and minimal dependencies.

---

**Awaiting approval before implementation.**