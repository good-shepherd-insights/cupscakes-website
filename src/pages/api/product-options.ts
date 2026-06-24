// Same-origin proxy for LiveCart.tsx's inline price-recalculation lookup.
// LiveCart.tsx is a `client:only` React island, so it can't read Sanity
// data through Astro frontmatter — and a direct browser fetch to Sanity's
// query API hits the project's CORS allowlist (which only covers the
// origins explicitly configured for it, not arbitrary dev/preview hosts).
// Routing through this same-origin endpoint, backed by the existing
// `sanityClient`, sidesteps that entirely.
import type { APIRoute } from 'astro';
import { stegaClean } from '@sanity/client/stega';
import { sanityClient } from '../../lib/sanity/client';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const slugsParam = url.searchParams.get('slugs') ?? '';
  const slugs = slugsParam.split(',').filter(Boolean);
  if (slugs.length === 0) {
    return new Response(JSON.stringify({}), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await sanityClient.fetch<
    { slug: string; price: number; groups?: { name: string; options?: { label: string; priceModifier?: number }[] }[] }[]
  >(
    `*[_type == "product" && slug.current in $slugs]{
      "slug": slug.current,
      price,
      "groups": customOptions[definesVariantRoute != true]{
        name,
        "options": options[]{ label, priceModifier }
      }
    }`,
    { slugs }
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
