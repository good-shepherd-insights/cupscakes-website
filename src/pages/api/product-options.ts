// Same-origin proxy for LiveCart.tsx's inline price-recalculation lookup.
// LiveCart.tsx is a `client:only` React island, so it can't read Sanity
// data through Astro frontmatter — and a direct browser fetch to Sanity's
// query API hits the project's CORS allowlist (which only covers the
// origins explicitly configured for it, not arbitrary dev/preview hosts).
// Routing through this same-origin endpoint, backed by the existing
// `sanityClient`, sidesteps that entirely.
//
// Statically prerendered (the project default — no SSR adapter is
// configured) rather than per-request: this is small, slow-changing
// catalog data (Quantity/Occasion price modifiers), so it returns every
// product's options in one build-time JSON file instead of taking a
// `slugs` query param. The client just looks up what it needs from the
// full map.
import type { APIRoute } from 'astro';
import { stegaClean } from '@sanity/client/stega';
import { sanityClient } from '../../lib/sanity/client';

export const GET: APIRoute = async () => {
  const result = await sanityClient.fetch<
    { slug: string; price: number; groups?: { name: string; options?: { label: string; priceModifier?: number }[] }[] }[]
  >(
    `*[_type == "product" && defined(slug.current)]{
      "slug": slug.current,
      price,
      "groups": customOptions[definesVariantRoute != true]{
        name,
        "options": options[]{ label, priceModifier }
      }
    }`
  );

  const map: Record<string, { basePrice: number; groups: { name: string; options: { label: string; priceModifier: number }[] }[] }> = {};
  for (const doc of result) {
    map[doc.slug] = {
      basePrice: doc.price,
      groups: (doc.groups ?? []).map((g) => ({
        name: stegaClean(g.name),
        options: (g.options ?? []).map((o) => ({
          label: stegaClean(o.label),
          priceModifier: o.priceModifier ?? 0,
        })),
      })),
    };
  }

  return new Response(JSON.stringify(map), {
    headers: { 'Content-Type': 'application/json' },
  });
};
