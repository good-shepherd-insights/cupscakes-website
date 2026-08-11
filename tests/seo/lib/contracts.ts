export const SITE_URL = 'https://cupscakes.com';

export type PageKind =
  | 'home'
  | 'productsIndex'
  | 'productVariant'
  | 'productDuplicate'
  | 'noindexFlow'
  | 'previewUtility'
  | 'admin'
  | 'api'
  | 'json'
  | 'unknown';

export const NOINDEX_HTML_PATHS = [
  '/cart',
  '/order',
  '/order/pickup',
  '/order/delivery',
  '/order/pickup/date',
  '/order/delivery/date',
  '/order/loading',
  '/products/preview-personal-cake',
] as const;

export const ROBOTS_DISALLOWS = ['/admin', '/api', '/snipcart-products.json'] as const;

export const SEO_SOURCE_PAGES = [
  'src/pages/index.astro',
  'src/pages/products/index.astro',
  'src/pages/products/[slug]/[...variant].astro',
  'src/pages/cart.astro',
  'src/pages/order.astro',
  'src/pages/order/pickup.astro',
  'src/pages/order/delivery.astro',
  'src/pages/order/pickup/date.astro',
  'src/pages/order/delivery/date.astro',
  'src/pages/order/loading.astro',
  'src/pages/products/preview-personal-cake.astro',
] as const;

export const REQUIRED_SOURCE_FILES = [
  'src/lib/seo/routePolicy.ts',
  'src/lib/seo/resolveSeo.ts',
  'src/lib/seo/sitemapCms.ts',
  'src/lib/seo/schemaBuilders.ts',
  'src/lib/seo/sanityImage.ts',
  'src/components/seo/SeoHead.astro',
  'src/sanity/schemaTypes/seo.ts',
  'src/sanity/schemaTypes/businessIdentity.ts',
  'src/sanity/schemaTypes/productStructuredData.ts',
  'src/pages/robots.txt.ts',
] as const;

export const SANITY_SEO_FIELDS = [
  'metaTitle',
  'metaDescription',
  'canonicalOverride',
  'robots',
  'ogTitle',
  'ogDescription',
  'metaImage',
  'metaImageAlt',
  'dateModified',
  'keywords',
  'about',
  'mentions',
  'snippetFocus',
  'businessIdentity',
  'productsSeo',
  'structuredData',
  'sku',
  'availability',
  'priceValidUntil',
] as const;

export const RESOLVER_SCHEMA_WIRES = [
  'dateModified',
  'keywords',
  'about',
  'mentions',
  'availability',
  'itemCondition',
  'priceValidUntil',
  'sku',
  'mpn',
  'gtin',
  'paymentAccepted',
  'currenciesAccepted',
  'geo',
  'hasMap',
] as const;

export function normalizePathname(pathname: string): string {
  if (pathname === '/') return pathname;
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function pathnameFromUrl(url: string): string {
  return normalizePathname(new URL(url).pathname);
}

export function classifyPath(pathname: string): PageKind {
  const normalized = normalizePathname(pathname);
  if (normalized === '/') return 'home';
  if (normalized === '/products') return 'productsIndex';
  if (normalized === '/admin') return 'admin';
  if (normalized.startsWith('/api')) return 'api';
  if (normalized === '/snipcart-products.json') return 'json';
  if (normalized === '/products/preview-personal-cake') return 'previewUtility';
  if (NOINDEX_HTML_PATHS.includes(normalized as (typeof NOINDEX_HTML_PATHS)[number])) {
    return 'noindexFlow';
  }
  if (normalized.startsWith('/products/')) {
    const depth = normalized.split('/').filter(Boolean).length;
    if (depth === 2) return 'productDuplicate';
    if (depth >= 3) return 'productVariant';
  }
  return 'unknown';
}

export function isActiveIndexableKind(kind: PageKind): boolean {
  return kind === 'home' || kind === 'productsIndex' || kind === 'productVariant';
}

export function expectedSchemaTypes(kind: PageKind): string[] {
  if (kind === 'home') return ['WebSite', 'WebPage'];
  if (kind === 'productsIndex') return ['WebSite', 'CollectionPage', 'ItemList'];
  if (kind === 'productVariant') return ['WebSite', 'WebPage', 'BreadcrumbList', 'Product'];
  return [];
}
