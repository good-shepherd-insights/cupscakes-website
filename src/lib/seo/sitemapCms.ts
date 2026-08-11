import { createClient } from '@sanity/client';

interface SitemapOptionSeo {
  slug?: string;
  robots?: string;
}

interface SitemapRouteGroup {
  definesVariantRoute?: boolean;
  options?: SitemapOptionSeo[];
}

interface SitemapProductSeo {
  slug?: string;
  robots?: string;
  customOptions?: SitemapRouteGroup[];
}

interface SitemapSeoPayload {
  homeRobots?: string;
  productsRobots?: string;
  products?: SitemapProductSeo[];
}

export interface CmsNoindexPathnameOptions {
  projectId?: string;
  dataset?: string;
  apiVersion: string;
}

const SITEMAP_SEO_QUERY = `{
  "homeRobots": *[_type == "homePage"][0].seo.robots,
  "productsRobots": *[_type == "siteSettings"][0].productsSeo.robots,
  "products": *[_type == "product" && defined(slug.current)]{
    "slug": slug.current,
    "robots": seo.robots,
    customOptions[]{
      definesVariantRoute,
      options[]{
        "slug": slug.current,
        "robots": seo.robots
      }
    }
  }
}`;

function isNoindex(robots: string | undefined): boolean {
  return robots?.includes('noindex') ?? false;
}

function normalizePathname(pathname: string): string {
  if (pathname === '/') return pathname;
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function sitemapPathname(url: string): string {
  return normalizePathname(new URL(url).pathname);
}

export async function loadCmsNoindexPathnames(
  options: CmsNoindexPathnameOptions,
): Promise<Set<string>> {
  if (!options.projectId || !options.dataset) return new Set();

  const client = createClient({
    projectId: options.projectId,
    dataset: options.dataset,
    apiVersion: options.apiVersion,
    useCdn: false,
  });
  const data = await client.fetch<SitemapSeoPayload>(SITEMAP_SEO_QUERY);
  const noindexPathnames = new Set<string>();

  if (isNoindex(data.homeRobots)) noindexPathnames.add('/');
  if (isNoindex(data.productsRobots)) noindexPathnames.add('/products');

  for (const product of data.products ?? []) {
    if (!product.slug) continue;
    const routeGroup = product.customOptions?.find((group) => group.definesVariantRoute);
    for (const option of routeGroup?.options ?? []) {
      if (!option.slug) continue;
      if (isNoindex(option.robots ?? product.robots)) {
        noindexPathnames.add(`/products/${product.slug}/${option.slug}`);
      }
    }
  }

  return noindexPathnames;
}
