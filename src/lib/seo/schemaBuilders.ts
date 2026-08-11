import type {
  BreadcrumbList,
  CollectionPage,
  Graph,
  ItemList,
  ListItem,
  Organization,
  Product as SchemaProduct,
  Thing,
  WebPage,
  WebSite,
} from 'schema-dts';
import type { CustomOptionValue, Product } from '../../types/product';
import type { SanityBusinessIdentity, SchemaItem } from '../../types/seo';

function compact<T extends Record<string, unknown>>(value: T): T {
  const filtered = Object.fromEntries(
    Object.entries(value).flatMap(([key, item]) => {
      if (Array.isArray(item)) return item.length > 0 ? [[key, item]] : [];
      if (item && typeof item === 'object') {
        const nested = compact(item as Record<string, unknown>);
        return Object.keys(nested).length > 0 ? [[key, nested]] : [];
      }
      return item !== undefined && item !== null && item !== '' ? [[key, item]] : [];
    }),
  );
  return filtered as T;
}

function buildThings(items: { name?: string; url?: string }[] | undefined): Thing[] | undefined {
  const things =
    items
      ?.filter((item) => item.name?.trim())
      .map((item) =>
        compact({
          '@type': 'Thing',
          name: item.name,
          url: item.url,
        }),
      ) ?? [];
  return things.length ? (things as Thing[]) : undefined;
}

export function schemaGraph(nodes: SchemaItem[]): Graph {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes.filter(Boolean),
  } as Graph;
}

export function buildWebSite(siteUrl: string, siteName: string, publisherId?: string): WebSite {
  return compact({
    '@type': 'WebSite',
    '@id': `${siteUrl}#website`,
    url: siteUrl,
    name: siteName,
    publisher: publisherId ? { '@id': publisherId } : undefined,
  }) as WebSite;
}

export function buildBusiness(
  siteUrl: string,
  business: SanityBusinessIdentity | undefined,
  logoUrl?: string,
  imageUrl?: string,
): Organization | undefined {
  if (!business?.name || !business.url) return undefined;
  const hasAddress = Boolean(
    business.address?.streetAddress ||
      business.address?.addressLocality ||
      business.address?.addressRegion ||
      business.address?.postalCode ||
      business.address?.addressCountry,
  );
  const address = hasAddress
    ? compact({
        '@type': 'PostalAddress',
        streetAddress: business.address.streetAddress,
        addressLocality: business.address.addressLocality,
        addressRegion: business.address.addressRegion,
        postalCode: business.address.postalCode,
        addressCountry: business.address.addressCountry,
      })
    : undefined;
  const geo =
    typeof business.geo?.latitude === 'number' && typeof business.geo?.longitude === 'number'
      ? compact({
          '@type': 'GeoCoordinates',
          latitude: business.geo.latitude,
          longitude: business.geo.longitude,
        })
      : undefined;

  return compact({
    '@type': 'Bakery',
    '@id': `${siteUrl}#business`,
    name: business.name,
    alternateName: business.alternateName,
    legalName: business.legalName,
    description: business.description,
    url: business.url,
    logo: logoUrl,
    image: imageUrl,
    sameAs: business.sameAs,
    telephone: business.telephone,
    email: business.email,
    priceRange: business.priceRange,
    address,
    geo,
    hasMap: business.hasMap,
    areaServed: business.serviceArea,
    openingHours: business.openingHours,
    paymentAccepted: business.paymentAccepted,
    currenciesAccepted: business.currenciesAccepted,
  }) as Organization;
}

export function buildWebPage(input: {
  canonicalUrl: string;
  title: string;
  description?: string;
  siteUrl: string;
  breadcrumbId?: string;
  mainEntityId?: string;
  dateModified?: string;
  keywords?: string[];
  about?: { name?: string; url?: string }[];
  mentions?: { name?: string; url?: string }[];
}): WebPage {
  return compact({
    '@type': 'WebPage',
    '@id': `${input.canonicalUrl}#webpage`,
    url: input.canonicalUrl,
    name: input.title,
    description: input.description,
    isPartOf: { '@id': `${input.siteUrl}#website` },
    breadcrumb: input.breadcrumbId ? { '@id': input.breadcrumbId } : undefined,
    mainEntity: input.mainEntityId ? { '@id': input.mainEntityId } : undefined,
    dateModified: input.dateModified,
    keywords: input.keywords?.filter(Boolean),
    about: buildThings(input.about),
    mentions: buildThings(input.mentions),
  }) as WebPage;
}

export function buildBreadcrumbList(
  canonicalUrl: string,
  items: { name: string; url?: string }[],
): BreadcrumbList | undefined {
  if (items.length < 2) return undefined;
  return {
    '@type': 'BreadcrumbList',
    '@id': `${canonicalUrl}#breadcrumb`,
    itemListElement: items.map(
      (item, index) =>
        compact({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        }) as ListItem,
    ),
  };
}

export function buildCollectionPage(input: {
  canonicalUrl: string;
  title: string;
  description?: string;
  siteUrl: string;
  itemListId?: string;
  dateModified?: string;
  keywords?: string[];
  about?: { name?: string; url?: string }[];
  mentions?: { name?: string; url?: string }[];
}): CollectionPage {
  return compact({
    '@type': 'CollectionPage',
    '@id': `${input.canonicalUrl}#collection`,
    url: input.canonicalUrl,
    name: input.title,
    description: input.description,
    isPartOf: { '@id': `${input.siteUrl}#website` },
    mainEntity: input.itemListId ? { '@id': input.itemListId } : undefined,
    dateModified: input.dateModified,
    keywords: input.keywords?.filter(Boolean),
    about: buildThings(input.about),
    mentions: buildThings(input.mentions),
  }) as CollectionPage;
}

export function buildItemList(
  canonicalUrl: string,
  items: { name: string; url: string; image?: string; description?: string }[],
): ItemList | undefined {
  if (!items.length) return undefined;
  return {
    '@type': 'ItemList',
    '@id': `${canonicalUrl}#itemlist`,
    itemListElement: items.map((item, index) =>
      compact({
        '@type': 'ListItem',
        position: index + 1,
        url: item.url,
        item: compact({
          '@type': 'Product',
          name: item.name,
          url: item.url,
          image: item.image ? [item.image] : undefined,
          description: item.description,
        }),
      }),
    ),
  } as ItemList;
}

export function buildProduct(input: {
  canonicalUrl: string;
  siteUrl: string;
  product: Product;
  selectedOption?: CustomOptionValue;
  name: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  brandId?: string;
  sellerId?: string;
}): SchemaProduct {
  const productFacts = {
    ...input.product.structuredData,
    ...input.selectedOption?.structuredData,
  };
  return compact({
    '@type': 'Product',
    '@id': `${input.canonicalUrl}#product`,
    url: input.canonicalUrl,
    name: input.name,
    description: input.description,
    image: input.imageUrl ? [input.imageUrl] : undefined,
    brand: input.brandId ? { '@id': input.brandId } : undefined,
    category: input.category,
    sku: productFacts.sku,
    mpn: productFacts.mpn,
    gtin: productFacts.gtin,
    offers: compact({
      '@type': 'Offer',
      url: input.canonicalUrl,
      price: input.product.price,
      priceCurrency: 'USD',
      availability: productFacts.availability,
      itemCondition: productFacts.itemCondition,
      priceValidUntil: productFacts.priceValidUntil,
      seller: input.sellerId ? { '@id': input.sellerId } : undefined,
    }),
  }) as SchemaProduct;
}
