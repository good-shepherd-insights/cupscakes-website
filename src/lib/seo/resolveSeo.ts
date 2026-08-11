import type { SEOProps } from 'astro-seo';
import type { CustomOptionValue, Product } from '../../types/product';
import type {
  ResolvedSeo,
  SanityBusinessIdentity,
  SanitySeo,
  SchemaItem,
  SeoPageKind,
} from '../../types/seo';
import { IMAGE_WIDTHS } from '../constants';
import { getRoutePolicy } from './routePolicy';
import { canonicalUrl, imageUrlOrAbsolute, sanityImageUrl } from './sanityImage';
import {
  buildBreadcrumbList,
  buildBusiness,
  buildCollectionPage,
  buildItemList,
  buildProduct,
  buildWebPage,
  buildWebSite,
  schemaGraph,
} from './schemaBuilders';

export interface ResolveSeoInput {
  pageKind: SeoPageKind;
  site?: URL;
  pathname: string;
  siteName: string;
  pageSeo?: SanitySeo;
  defaultSeo?: SanitySeo;
  fallbackTitle: string;
  fallbackDescription?: string;
  fallbackImage?: Parameters<typeof imageUrlOrAbsolute>[0];
  fallbackImageAlt?: string;
  businessIdentity?: SanityBusinessIdentity;
  breadcrumbs?: { name: string; url?: string }[];
  collectionItems?: { name: string; url: string; image?: string; description?: string }[];
  productContext?: {
    product: Product;
    selectedOption?: CustomOptionValue;
    imageUrl?: string;
    category?: string;
  };
}

function firstText(...values: (string | undefined | null)[]): string | undefined {
  return values.map((value) => value?.trim()).find(Boolean);
}

function siteOrigin(site: URL): string {
  return site.toString().replace(/\/$/, '/');
}

function absoluteBreadcrumbs(site: URL, breadcrumbs?: { name: string; url?: string }[]) {
  return breadcrumbs?.map((item) => ({
    name: item.name,
    url: item.url ? canonicalUrl(item.url, site) : undefined,
  }));
}

export function resolveSeo(input: ResolveSeoInput): ResolvedSeo {
  const site = input.site ?? new URL('https://cupscakes.com');
  const siteUrl = siteOrigin(site);
  const policy = getRoutePolicy(input.pageKind);
  const seo = input.pageSeo;
  const defaultSeo = input.defaultSeo;

  const title = firstText(seo?.metaTitle, input.fallbackTitle, defaultSeo?.metaTitle, input.siteName) ?? input.siteName;
  const description = firstText(
    seo?.metaDescription,
    input.fallbackDescription,
    defaultSeo?.metaDescription,
  );
  const canonical = canonicalUrl(input.pathname, site, seo?.canonicalOverride);
  const socialTitle = firstText(seo?.ogTitle, defaultSeo?.ogTitle, title) ?? title;
  const socialDescription = firstText(seo?.ogDescription, defaultSeo?.ogDescription, description);
  const socialImage =
    sanityImageUrl(seo?.metaImage, { width: 1200, height: 630 }) ??
    imageUrlOrAbsolute(input.fallbackImage, site, { width: IMAGE_WIDTHS.detail }) ??
    sanityImageUrl(defaultSeo?.metaImage, { width: 1200, height: 630 });
  const socialImageAlt = firstText(seo?.metaImageAlt, input.fallbackImageAlt, defaultSeo?.metaImageAlt);
  const robots = seo?.robots ?? (policy.indexable ? 'index, follow' : 'noindex, follow');
  const dateModified = firstText(seo?.dateModified, defaultSeo?.dateModified);
  const keywords = seo?.keywords?.length ? seo.keywords : defaultSeo?.keywords;
  const about = seo?.about?.length ? seo.about : defaultSeo?.about;
  const mentions = seo?.mentions?.length ? seo.mentions : defaultSeo?.mentions;

  const diagnostics: ResolvedSeo['diagnostics'] = {
    missingRequiredSanityFields: [],
    omittedSchemaFields: [],
    hardFailures: [],
  };

  if (policy.indexable) {
    if (!description) diagnostics.missingRequiredSanityFields.push(`${input.pageKind}.seo.metaDescription`);
    if (socialImage && !socialImageAlt) diagnostics.missingRequiredSanityFields.push(`${input.pageKind}.seo.metaImageAlt`);
  }

  const meta: SEOProps = {
    title,
    description,
    canonical,
    noindex: robots.includes('noindex'),
    nofollow: robots.includes('nofollow') || policy.nofollow,
    openGraph: socialImage
      ? {
          basic: {
            title: socialTitle,
            type: input.productContext ? 'product' : 'website',
            image: socialImage,
            url: canonical,
          },
          optional: {
            description: socialDescription,
            locale: 'en_US',
            siteName: input.siteName,
          },
          image: {
            width: seo?.metaImage || defaultSeo?.metaImage ? 1200 : undefined,
            height: seo?.metaImage || defaultSeo?.metaImage ? 630 : undefined,
            alt: socialImageAlt,
          },
        }
      : undefined,
    twitter: {
      card: socialImage ? 'summary_large_image' : 'summary',
      title: socialTitle,
      description: socialDescription,
      image: socialImage,
      imageAlt: socialImageAlt,
    },
  };

  const schema: SchemaItem[] = [];
  if (policy.allowSchema) {
    const logoUrl = sanityImageUrl(input.businessIdentity?.logo, { width: 512 });
    const businessImageUrl = sanityImageUrl(input.businessIdentity?.image, { width: 1200 });
    const business = buildBusiness(siteUrl, input.businessIdentity, logoUrl, businessImageUrl);
    if (!business) diagnostics.omittedSchemaFields.push('siteSettings.businessIdentity');

    const breadcrumb = buildBreadcrumbList(canonical, absoluteBreadcrumbs(site, input.breadcrumbs) ?? []);
    const product = input.productContext
      ? buildProduct({
          canonicalUrl: canonical,
          siteUrl,
          product: input.productContext.product,
          selectedOption: input.productContext.selectedOption,
          name: input.productContext.selectedOption
            ? `${input.productContext.selectedOption.label} ${input.productContext.product.name}`
            : input.productContext.product.name,
          description,
          imageUrl: input.productContext.imageUrl,
          category: input.productContext.category,
          brandId: business ? `${siteUrl}#business` : undefined,
          sellerId: business ? `${siteUrl}#business` : undefined,
        })
      : undefined;
    const collectionItems = input.collectionItems?.map((item) => ({
      ...item,
      url: canonicalUrl(item.url, site),
    }));
    const itemList = collectionItems ? buildItemList(canonical, collectionItems) : undefined;
    const collectionPage =
      input.pageKind === 'productsIndex'
        ? buildCollectionPage({
            canonicalUrl: canonical,
            title,
            description,
            siteUrl,
            itemListId: itemList ? `${canonical}#itemlist` : undefined,
            dateModified,
            keywords,
            about,
            mentions,
          })
        : undefined;
    const webpage =
      input.pageKind !== 'productsIndex'
        ? buildWebPage({
            canonicalUrl: canonical,
            title,
            description,
            siteUrl,
            breadcrumbId: breadcrumb ? `${canonical}#breadcrumb` : undefined,
            mainEntityId: product ? `${canonical}#product` : undefined,
            dateModified,
            keywords,
            about,
            mentions,
          })
        : undefined;

    schema.push(
      schemaGraph([
        buildWebSite(siteUrl, input.siteName, business ? `${siteUrl}#business` : undefined),
        business,
        webpage,
        collectionPage,
        itemList,
        breadcrumb,
        product,
      ].filter(Boolean) as SchemaItem[]),
    );
  }

  return {
    pageKind: input.pageKind,
    canonicalUrl: canonical,
    indexable: policy.indexable,
    meta,
    schema,
    sitemap: {
      include: policy.sitemap,
      canonicalUrl: policy.sitemap ? canonical : undefined,
    },
    diagnostics,
  };
}
