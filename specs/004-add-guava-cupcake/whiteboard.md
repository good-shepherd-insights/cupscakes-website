# Whiteboard: Add Guava Cupcake

## 1. Status

Status: Prepared — awaiting explicit approval.

## 2. Purpose / Big Picture

CUP-66 adds Guava as the eighth cupcake flavor. Customers will see one Guava card on `/products`, follow it to `/products/cupcakes/guava`, see the supplied no-shadow image, and add a cart item whose existing shared checkout logic identifies it as `cupcakes-guava` / `Guava Cupcakes`. The implementation appends one option to the existing Sanity Cupcakes flavor group and one matching repository-backed catalog card; existing generic route generation and Snipcart JSON generation do the rest.

## 3. User Contract

1. The products page shows Guava exactly once with the verified client image, alt text, description, current cupcake price, and order link.
2. `/products/cupcakes/guava` exists, selects Guava, and displays the same verified image.
3. The Guava add-to-cart definition derives ID `cupcakes-guava`, name `Guava Cupcakes`, price `4`, Guava metadata, and the existing Quantity and Occasion fields.
4. `snipcart-products.json` contains exactly one Guava definition with the canonical Guava URL.
5. The existing seven flavors and the Cupcakes product's price, quantity, and occasion data remain unchanged.
6. The source asset is `C&C_GUAVA_CUPCAKE_002_NO_SHADOW.png`, Drive ID `1oh-BXK0I8lfgOSixk-qBCO0zDMiLGX3X`, SHA-256 `49016389bdd0ff1e6cfd4715e6d7d6c7d5ee8b3a4e094a7a34194d1577621bf6`.
7. The authenticated “Other Angles” folder and multi-image galleries are excluded; CUP-59 owns that work.
8. No dependency, environment variable, product schema, price, direct Snipcart API mutation, or vendor-code change is allowed.
9. Working catalog copy is “Tropical and fruity with a bright, sweet guava flavor.” Alt text is “Guava cupcake with pink frosting.”
10. The external Sanity upload and document patch must occur only after explicit approval of this Prepared plan.

## 4. Acceptance Coverage

| Criterion | Files / state | Plan milestone | Observable validation |
|---|---|---|---|
| 1 | `src/content/products/cupcakes.json`, `src/content.config.ts`, catalog component unions | Milestone 2 | Generated products HTML contains one Guava card and link |
| 2 | Sanity Flavor option; existing dynamic product route | Milestone 1 | `dist/products/cupcakes/guava/index.html` exists with Guava image |
| 3 | Sanity Flavor option; existing `buildProductCartAttributes` | Milestones 1 and 3 | Generated Guava HTML contains expected `data-item-*` values |
| 4 | Sanity Flavor option; existing `src/pages/snipcart-products.json.ts` | Milestones 1 and 3 | Generated JSON has exactly one `cupcakes-guava` object |
| 5 | Targeted append plus exact four-file diff | Milestone 3 | Before/after Sanity projection and final source diff preserve existing values |
| 6 | `/tmp/cup66-guava-no-shadow-source.png` | Milestone 1 | File size, dimensions, SHA-1, and SHA-256 match research |
| 7 | No gallery files or schema edits | Final scope review | Final diff contains no gallery work |
| 8 | Existing packages/config/vendor files | Final scope review | Lockfile, env config, vendor loader, and Snipcart API state unchanged |
| 9 | Sanity option image and catalog JSON | Milestones 1 and 2 | Public query and generated page show exact copy |
| 10 | `.specify/feature.json` approval gate | Approval gate | Check-approved script succeeds before implementation |

## 5. Context and Orientation

- `product-chocolate-cupcake` is the existing Sanity document for the aggregate “Cupcakes” product. Its `customOptions[_key == "flavor"]` group has `definesVariantRoute: true`; each option slug becomes a product page.
- `src/pages/products/[slug]/[...variant].astro:getStaticPaths` loads all Sanity products and expands the route-defining option group. Its selected option also supplies the variant image and alt text.
- `src/lib/snipcart/cartItem.ts:buildProductCartAttributes` owns checkout identity and metadata. Given `productSlug: "cupcakes"` and `currentVariantSlug: "guava"`, it derives `cupcakes-guava`, `Guava Cupcakes`, and Guava flavor metadata.
- `src/pages/snipcart-products.json.ts:GET` expands the same route options and calls the shared builder, so no Guava-specific Snipcart code is necessary.
- `src/content/products/cupcakes.json` separately supplies the products landing-page cards. `src/content.config.ts:productsCupcakeFlavorSchema` and the `FlavorKey` unions in `CupcakeGrid.astro` and `CupcakeFlavorCard.astro` are closed lists that must accept the new key.
- Sanity asset IDs are content-hash based. The verified PNG has SHA-1 `fa0b217d6dd22b1bc6c707290a7fe9ed35b7f148`, yielding the expected asset ID `image-fa0b217d6dd22b1bc6c707290a7fe9ed35b7f148-4000x4000-png` and CDN URL used in the exact repository diff.

## 6. Directory Map and Modification Table

| File | Action | Why |
|---|---|---|
| `src/content.config.ts` | Modify | Accept `guava` in the products content schema and correct the stale key comment |
| `src/components/product/CupcakeGrid.astro` | Modify | Accept `guava` in the grid's local flavor-key type |
| `src/components/product/CupcakeFlavorCard.astro` | Modify | Accept `guava` in the card's local flavor-key type |
| `src/content/products/cupcakes.json` | Modify | Add the Guava products-page card with the Sanity CDN image |

External state, not a repository file: upload/reuse one Sanity image asset and append one member to `product-chocolate-cupcake.customOptions[_key == "flavor"].options`.

No implementation file is created, moved, generated for commit, or deleted.

## 7. Pattern Audit and Evidence Ledger

| Decision | Repository or explicit-user evidence | Constraint learned | Reuse or deviation |
|---|---|---|---|
| Model Guava as a flavor option | Public query of `product-chocolate-cupcake`; `src/sanity/schemaTypes/product.ts` | Existing cupcakes share one parent product and one route-defining Flavor group | Reuse exactly; no new product document |
| Derive route and cart identity | `src/pages/products/[slug]/[...variant].astro`, `src/lib/snipcart/cartItem.ts` | Option slug and label already drive URL, ID, name, image, and metadata | Reuse exactly; no Guava branch |
| Derive Snipcart JSON | `src/pages/snipcart-products.json.ts` | The endpoint enumerates every route option and calls the shared cart builder | Reuse exactly; no direct Snipcart write |
| Add landing-page card separately | `src/lib/content/products.ts`, `src/content/products/cupcakes.json` | Products-page cards use the repository content collection rather than Sanity queries | Follow current architecture; do not broaden into a catalog refactor |
| Extend closed flavor keys | `src/content.config.ts:productsCupcakeFlavorSchema`; both component `FlavorKey` aliases | The current catalog contract rejects unknown keys at build/type time | Append `guava` to all three lists |
| Use one no-shadow image | CUP-66 description and public Drive folder | One primary asset is available and verified; other angles require auth | Use primary only; gallery excluded |
| Targeted external patch | Sanity patch docs; current `_rev` retrieved through authenticated CLI | Preserve concurrent/editorial data and fail on duplicate or revision drift | Use duplicate checks plus `ifRevisionId` and array insert |

## 8. Interfaces and Dependencies

- No package or lockfile changes.
- `productsCupcakeFlavorSchema.key` expands from seven literals to eight by adding `"guava"`.
- Both local `FlavorKey` aliases expand identically.
- Guava Sanity option shape:

```json
{
  "_key": "guava",
  "_type": "customOptionValue",
  "label": "Guava",
  "slug": { "_type": "slug", "current": "guava" },
  "image": {
    "_type": "image",
    "asset": {
      "_type": "reference",
      "_ref": "image-fa0b217d6dd22b1bc6c707290a7fe9ed35b7f148-4000x4000-png"
    },
    "alt": "Guava cupcake with pink frosting"
  }
}
```

- Expected derived checkout contract: ID `cupcakes-guava`, name `Guava Cupcakes`, numeric base price `4`, URL `https://cupscakes.com/products/cupcakes/guava`, and unchanged Quantity/Occasion fields.
- Existing CLI authentication supplies the write token only to the temporary `sanity exec --with-user-token` process. No token is written to the repository or output.

## 9. Plan of Work

### Milestone 1 — Verify and append Sanity data

Outcome: the verified Guava image exists in Sanity and Guava appears once at the end of the Flavor option array.

1. Revalidate the temporary PNG against the recorded dimensions and hashes.
2. Query `product-chocolate-cupcake`; abort if any option already has Guava's key, label, or slug.
3. Run the exact temporary script below through `npx --no-install sanity exec --with-user-token`.
4. Requery the document and verify the appended option while comparing the existing price, option groups, and seven flavor projections.

Proof: authenticated and public queries return one Guava option with the expected asset reference and unchanged existing values.

### Milestone 2 — Apply the four repository diffs

Outcome: the products content schema/types accept Guava and the products-page collection contains its card.

Apply the exact file diffs in section 10 without other source edits.

Proof: `git diff` matches section 10 and the content collection parses during build.

### Milestone 3 — Build and validate all derived surfaces

Outcome: the catalog card, Guava route, cart definition, and Snipcart JSON representation all exist exactly once.

Run the build and exact generated-output checks in sections 11 and 12. Compare Guava with Strawberry to prove shared fields and prices remain aligned.

Proof: build succeeds; route and JSON checks pass; variant IDs are unique; `git diff --check` passes.

## 10. Exact File Changes

### `src/content.config.ts`
**Action:** Modify
**Why:** Add Guava to the closed content key schema and replace a stale comment that claims the unused key maps to a Tailwind utility.
**Impact:** The products content loader accepts the Guava card; existing keys remain unchanged.

```diff
diff --git a/src/content.config.ts b/src/content.config.ts
--- a/src/content.config.ts
+++ b/src/content.config.ts
@@ -226,8 +226,8 @@
   personalCakesHref: z.string(),
 });

-// One flavor card on the products page. `key` must match a Tailwind
-// `bg-flavor-<key>` token declared in src/styles/global.css.
+// One flavor card on the products page. Keep this closed key list aligned
+// with the local FlavorKey unions in the cupcake catalog components.
 const productsCupcakeFlavorSchema = z.object({
   key: z.enum([
     "chocolate",
@@ -237,6 +237,7 @@
     "pumpkin",
     "lemon",
     "strawberry",
+    "guava",
   ]),
   name: z.string(),
   description: z.string(),
```

#### Reasoning

- The current schema is an explicit enum; leaving it unchanged makes the new JSON fail content validation.
- `CupcakeFlavorCard.astro` does not use `flavorKey` to construct a `bg-flavor-*` class, so the old comment describes a nonexistent runtime dependency. The replacement records the actual closed-list synchronization requirement.

### `src/components/product/CupcakeGrid.astro`
**Action:** Modify
**Why:** Extend the grid's local catalog key type.
**Impact:** The Guava object inferred from the content collection satisfies the component props.

```diff
diff --git a/src/components/product/CupcakeGrid.astro b/src/components/product/CupcakeGrid.astro
--- a/src/components/product/CupcakeGrid.astro
+++ b/src/components/product/CupcakeGrid.astro
@@ -16,7 +16,8 @@
   | "butter-pecan"
   | "pumpkin"
   | "lemon"
-  | "strawberry";
+  | "strawberry"
+  | "guava";

 interface Flavor {
   key: FlavorKey;
```

#### Reasoning

- The component locally duplicates the same seven-key union and receives the content collection's flavor objects. Appending one literal is the established pattern and changes no rendering logic.

### `src/components/product/CupcakeFlavorCard.astro`
**Action:** Modify
**Why:** Extend the card's local flavor key prop type.
**Impact:** `CupcakeGrid` can pass the Guava card without a type mismatch; card rendering remains generic.

```diff
diff --git a/src/components/product/CupcakeFlavorCard.astro b/src/components/product/CupcakeFlavorCard.astro
--- a/src/components/product/CupcakeFlavorCard.astro
+++ b/src/components/product/CupcakeFlavorCard.astro
@@ -13,7 +13,8 @@
   | "butter-pecan"
   | "pumpkin"
   | "lemon"
-  | "strawberry";
+  | "strawberry"
+  | "guava";

 interface Props {
   flavorKey: FlavorKey;
```

#### Reasoning

- The card's props preserve the closed key contract even though the current template does not use the value for styling. The exact addition mirrors the grid and schema lists.

### `src/content/products/cupcakes.json`
**Action:** Modify
**Why:** Add the Guava card to the products-page editorial collection.
**Impact:** Customers see and can navigate to Guava from `/products`; existing card order and data are preserved.

```diff
diff --git a/src/content/products/cupcakes.json b/src/content/products/cupcakes.json
--- a/src/content/products/cupcakes.json
+++ b/src/content/products/cupcakes.json
@@ -58,6 +58,14 @@
       "imageSrc": "https://cdn.sanity.io/images/9dxxafms/production/60eede0332a4e0202848778487f2015a00b74cdb-4000x4000.webp",
       "imageAlt": "Strawberry cupcake",
       "orderHref": "/products/cupcakes/strawberry"
+    },
+    {
+      "key": "guava",
+      "name": "Guava",
+      "description": "Tropical and fruity with a bright, sweet guava flavor.",
+      "imageSrc": "https://cdn.sanity.io/images/9dxxafms/production/fa0b217d6dd22b1bc6c707290a7fe9ed35b7f148-4000x4000.png",
+      "imageAlt": "Guava cupcake with pink frosting",
+      "orderHref": "/products/cupcakes/guava"
     }
   ]
 }
```

#### Reasoning

- Every existing products-page cupcake is represented by one object in this array; Guava follows the same six-field shape.
- The CDN URL is deterministic from the verified PNG's SHA-1, dimensions, and extension and will be checked against the actual upload response before this diff is applied.
- Appending after Strawberry changes no existing card order.

## 11. Concrete Steps

All commands run from `/Users/dev/Projects/cupscakes-website` unless stated otherwise.

1. Confirm approval and gate:

```sh
.specify/extensions/implementation-planning/scripts/bash/check-plan-approved.sh
```

Expected: exit 0 for `specs/004-add-guava-cupcake`.

2. Verify or redownload the asset:

```sh
curl -LsS --max-time 60 'https://drive.usercontent.google.com/download?id=1oh-BXK0I8lfgOSixk-qBCO0zDMiLGX3X&export=download&confirm=t' -o /tmp/cup66-guava-no-shadow-source.png
file /tmp/cup66-guava-no-shadow-source.png
shasum /tmp/cup66-guava-no-shadow-source.png
shasum -a 256 /tmp/cup66-guava-no-shadow-source.png
```

Expected: 4000×4000 RGBA PNG, recorded SHA-1 and SHA-256.

3. Create `/tmp/cup66-add-guava.ts` with this exact temporary script using the file-editing tool:

```ts
import {createReadStream} from 'node:fs'
import {getCliClient} from 'sanity/cli'

const documentId = 'product-chocolate-cupcake'
const sourcePath = '/tmp/cup66-guava-no-shadow-source.png'
const client = getCliClient({apiVersion: '2026-05-01'})

const document = await client.getDocument(documentId)
if (!document) throw new Error(`Missing Sanity document: ${documentId}`)

const flavorGroup = document.customOptions?.find(
  (group: {_key?: string}) => group._key === 'flavor',
)
if (!flavorGroup?.options) throw new Error('Missing Flavor option group')

const duplicate = flavorGroup.options.find(
  (option: {_key?: string; label?: string; slug?: {current?: string}}) =>
    option._key === 'guava' ||
    option.label?.trim().toLowerCase() === 'guava' ||
    option.slug?.current === 'guava',
)
if (duplicate) throw new Error('Guava already exists; refusing to append a duplicate')

const asset = await client.assets.upload('image', createReadStream(sourcePath), {
  filename: 'C&C_GUAVA_CUPCAKE_002_NO_SHADOW.png',
})

const expectedAssetId =
  'image-fa0b217d6dd22b1bc6c707290a7fe9ed35b7f148-4000x4000-png'
if (asset._id !== expectedAssetId) {
  throw new Error(`Unexpected uploaded asset ID: ${asset._id}`)
}

const guava = {
  _key: 'guava',
  _type: 'customOptionValue',
  label: 'Guava',
  slug: {_type: 'slug', current: 'guava'},
  image: {
    _type: 'image',
    asset: {_type: 'reference', _ref: asset._id},
    alt: 'Guava cupcake with pink frosting',
  },
}

const updated = await client
  .patch(documentId)
  .ifRevisionId(document._rev)
  .insert('after', 'customOptions[_key=="flavor"].options[-1]', [guava])
  .commit({returnDocuments: true})

console.log(JSON.stringify({assetId: asset._id, documentId: updated._id, rev: updated._rev}))
```

4. Execute the approved external mutation:

```sh
npx --no-install sanity exec /tmp/cup66-add-guava.ts --with-user-token
```

Expected: JSON naming the expected asset ID, document ID, and a new revision. No token output.

5. Apply the four section-10 diffs mechanically with the file-editing tool.

6. Query and build:

```sh
npx --no-install sanity documents get product-chocolate-cupcake
npm run build
```

Expected: one Guava option and a successful Astro build.

7. Run the generated-output checks described in section 12, then:

```sh
git diff --check
git diff -- src/content.config.ts src/components/product/CupcakeGrid.astro src/components/product/CupcakeFlavorCard.astro src/content/products/cupcakes.json
git status --short
```

Expected: no whitespace errors; only the approved source diffs plus Spec Kit artifacts and the preserved pre-existing untracked feedback file.

## 12. Validation and Acceptance

- **Source asset success**: `file`, byte count, and both hashes match the research ledger.
- **Duplicate boundary**: preflight query and script both reject an existing Guava key, label, or slug.
- **Concurrency failure**: `ifRevisionId` prevents overwriting any Sanity edit made after preflight; requery and review before retrying.
- **Sanity success**: project the Flavor array and assert eight unique keys/slugs, Guava count 1, Guava is last, image ref/alt match, and the prior seven projections are unchanged.
- **Build success**: `npm run build` exits 0; do not claim lint or test execution because those scripts do not exist.
- **Catalog success**: `dist/products/index.html` contains the Guava name, description, image URL, and link exactly once as a card.
- **Route success**: `dist/products/cupcakes/guava/index.html` exists and contains `cupcakes-guava`, `Guava Cupcakes`, price `4`, Guava metadata, and the verified CDN URL.
- **Snipcart success**: parse `dist/snipcart-products.json`; exactly one object has `id === "cupcakes-guava"`, `price === 4`, canonical URL, and Quantity/Occasion custom fields equal to Strawberry's.
- **Uniqueness**: the generated cupcake flavor definitions total eight with eight unique IDs and URLs.
- **Regression**: compare Strawberry and Guava's shared fields and confirm the final source/Sanity diff does not alter existing flavors, price, quantity, or occasion.
- **Scope**: no gallery, schema, dependency, lockfile, env, loader, or direct Snipcart API change.

## 13. Idempotence and Recovery

- Rerunning the temporary script after success fails before mutation because Guava already exists. Re-uploading identical bytes reuses the content-addressed Sanity asset.
- If the asset uploads but the revision-guarded document patch fails, requery the document. If Guava is still absent and the intervening edit is compatible, rerun; the upload is deduplicated.
- If repository editing fails before build, reapply only the exact approved diffs; JSON and type additions are deterministic.
- Rollback repository changes by reversing the four approved diffs, preserving all unrelated user changes.
- Rollback Sanity with a revision-guarded targeted unset of `customOptions[_key=="flavor"].options[_key=="guava"]`. Delete the image asset only after confirming no document references it; otherwise leave the deduplicated asset intact.
- Temporary files live only under `/tmp` and are not committed. The pre-existing untracked `2026-07-03-order-flow-feedback-action-items.md` remains untouched.

## 14. Risks and Decisions

### Risks

- **External state drift**: an editor may change the Cupcakes document between query and patch. Mitigation: revision guard and stop-on-conflict.
- **Partial external action**: asset upload can succeed before the document patch. Mitigation: content-addressed deduplication and safe retry.
- **Dual editorial sources**: the products card and Sanity flavor must agree. Mitigation: exact shared slug/image/alt values plus build and public-query checks.
- **Unverified gallery assets**: “Other Angles” requires authentication. Mitigation: explicit exclusion under CUP-59.
- **Copy assumption**: the ticket provides no Guava description. Mitigation: working copy is explicit in the spec and approval contract.

### Decision Log

- **2026-07-21**: Use one option on the existing Cupcakes product, not a new product document, because all existing flavors share parent pricing and customization.
- **2026-07-21**: Use the verified no-shadow PNG as the single primary image; exclude the authenticated gallery folder.
- **2026-07-21**: Preserve the existing repository-backed products grid rather than expanding CUP-66 into a Sanity catalog refactor.
- **2026-07-21**: Let existing route/cart/JSON generators derive Snipcart identity; do not call the Snipcart Products API.
- **2026-07-21**: Use a temporary authenticated CLI script with duplicate and revision guards rather than commit a one-use migration file.

## 15. Review Log

- **2026-07-21 — Scaffold pass**: Populated the mechanically supplied plan from `spec.md`, `plan.md`, `tasks.md`, current source, public Sanity data, authenticated CLI readback, verified Drive asset metadata, and official Sanity/Snipcart references. Produced four mechanically checked implementation diffs with the bundled `make-diff.sh`. Result: Scaffolded; an independent review pass is required before approval.
- **2026-07-21 — Independent review pass**: Re-read the complete whiteboard, original specification, technical plan, task list, current worktree, and all four implementation files. Reconfirmed the live Sanity document has seven non-Guava Flavor options, the authenticated CLI can read its current revision, the verified asset hashes match, every directory-map file appears exactly once in the modification table/milestones/exact-change section, and all diff header paths match their headings. Extracted every `diff` block in file order and ran `awk '/^```diff$/{inside=1;next} inside && /^```$/{inside=0;next} inside{print}' specs/004-add-guava-cupcake/whiteboard.md | git apply --check -`; exit `0`. Confirmed the four implementation files remain unmodified in the worktree and no unsupported source, dependency, schema, gallery, or Snipcart API change is hidden. No material issue found. Result: Prepared — awaiting explicit approval.

## 16. Approval

Implementation is blocked. After an independent review finds no material issue and changes the status to `Prepared — awaiting explicit approval`, the user must explicitly approve the current whiteboard. Only then may the approval script record `plan_approved: true` and implementation begin.
