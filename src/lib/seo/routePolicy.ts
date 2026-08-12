import type { SeoPageKind } from '../../types/seo';

export interface RoutePolicy {
  pageKind: SeoPageKind;
  indexable: boolean;
  nofollow: boolean;
  sitemap: boolean;
  allowSchema: boolean;
}

const INDEXABLE_PAGE_KINDS = new Set<SeoPageKind>(['home', 'productsIndex', 'product']);

export function getRoutePolicy(pageKind: SeoPageKind): RoutePolicy {
  const indexable = INDEXABLE_PAGE_KINDS.has(pageKind);
  return {
    pageKind,
    indexable,
    nofollow: false,
    sitemap: indexable,
    allowSchema: indexable,
  };
}

export function shouldIncludeInSitemap(url: string): boolean {
  const rawPathname = new URL(url).pathname;
  const pathname =
    rawPathname !== '/' && rawPathname.endsWith('/') ? rawPathname.slice(0, -1) : rawPathname;
  if (pathname === '/') return true;
  if (pathname === '/products') return true;
  if (pathname.startsWith('/products/preview-personal-cake')) return false;
  if (pathname.startsWith('/products/')) {
    return pathname.split('/').filter(Boolean).length >= 3;
  }
  return false;
}
