import type { SEOProps } from 'astro-seo';
import type { Graph, Thing, WithContext } from 'schema-dts';
import type { SanityImage } from './product';

export type SeoPageKind =
  | 'home'
  | 'productsIndex'
  | 'product'
  | 'cart'
  | 'order'
  | 'orderStep'
  | 'admin'
  | 'api'
  | 'feed'
  | 'utility';

export type SchemaItem = Graph | WithContext<Thing>;

export interface SanitySeoThing {
  name?: string;
  url?: string;
}

export interface SanitySeo {
  metaTitle?: string;
  metaDescription?: string;
  canonicalOverride?: string;
  robots?: 'index, follow' | 'noindex, follow';
  ogTitle?: string;
  ogDescription?: string;
  metaImage?: SanityImage;
  metaImageAlt?: string;
  dateModified?: string;
  keywords?: string[];
  about?: SanitySeoThing[];
  mentions?: SanitySeoThing[];
  snippetFocus?: string;
}

export interface SanityBusinessAddress {
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
}

export interface SanityBusinessIdentity {
  name?: string;
  alternateName?: string;
  legalName?: string;
  description?: string;
  url?: string;
  logo?: SanityImage;
  image?: SanityImage;
  telephone?: string;
  email?: string;
  priceRange?: string;
  sameAs?: string[];
  address?: SanityBusinessAddress;
  geo?: {
    latitude?: number;
    longitude?: number;
  };
  hasMap?: string;
  serviceArea?: string[];
  openingHours?: string[];
  paymentAccepted?: string[];
  currenciesAccepted?: string[];
}

export interface ResolvedSeo {
  pageKind: SeoPageKind;
  canonicalUrl: string;
  indexable: boolean;
  meta: SEOProps;
  schema: SchemaItem[];
  sitemap: {
    include: boolean;
    canonicalUrl?: string;
  };
  diagnostics: {
    missingRequiredSanityFields: string[];
    omittedSchemaFields: string[];
    hardFailures: string[];
  };
}
