import fs from 'node:fs';
import path from 'node:path';
import { classifyPath, type PageKind } from './contracts';
import type { ExtractedSeo } from './extractSeo';
import { firstNodeByType } from './schemaGraph';

export interface ContentGap {
  field: string;
  source: string;
  owner: 'copywriter' | 'business';
  note: string;
}

export interface PageContentReport {
  url: string;
  kind: PageKind;
  title?: string;
  titleLength: number;
  metaDescription?: string;
  metaDescriptionLength: number;
  canonical?: string;
  robots?: string;
  openGraph: ExtractedSeo['openGraph'];
  twitter: ExtractedSeo['twitter'];
  schemaTypes: string[];
  currentContentGaps: ContentGap[];
}

export interface SeoContentReport {
  generatedAt: string;
  scope: string;
  summary: {
    pages: number;
    pagesWithCurrentContentGaps: number;
    currentContentGaps: number;
  };
  pages: PageContentReport[];
}

function pageSeoSource(kind: PageKind): string {
  if (kind === 'home') return 'homePage.seo';
  if (kind === 'productsIndex') return 'siteSettings.productsSeo';
  if (kind === 'productVariant') return 'product option seo -> product.seo';
  return 'page seo';
}

function currentContentGaps(kind: PageKind, seo: ExtractedSeo): ContentGap[] {
  const gaps: ContentGap[] = [];
  const seoSource = pageSeoSource(kind);
  if (!seo.description) {
    gaps.push({
      field: 'metaDescription',
      source: `${seoSource}.metaDescription or siteSettings.defaultSeo.metaDescription`,
      owner: 'copywriter',
      note: 'Frontend can emit this field; current CMS/page data has no rendered value.',
    });
  }
  if (!seo.openGraph.image) {
    gaps.push({
      field: 'socialImage',
      source: `${seoSource}.metaImage or siteSettings.defaultSeo.metaImage`,
      owner: 'copywriter',
      note: 'Frontend can emit Open Graph/Twitter images; current CMS/page data has no rendered image.',
    });
  }
  if (seo.openGraph.image && !seo.openGraph.imageAlt) {
    gaps.push({
      field: 'socialImageAlt',
      source: `${seoSource}.metaImageAlt or rendered image alt fallback`,
      owner: 'copywriter',
      note: 'A social image is rendered, but no social image alt text is currently emitted.',
    });
  }
  if (!firstNodeByType(seo.jsonLd, 'Bakery')) {
    gaps.push({
      field: 'businessIdentity',
      source: 'siteSettings.businessIdentity',
      owner: 'business',
      note: 'Frontend can emit Bakery/LocalBusiness JSON-LD; current CMS data does not include required business identity facts.',
    });
  }
  return gaps;
}

export function pageContentReport(url: string, seo: ExtractedSeo): PageContentReport {
  const kind = classifyPath(new URL(url).pathname);
  return {
    url,
    kind,
    title: seo.title,
    titleLength: seo.title?.length ?? 0,
    metaDescription: seo.description,
    metaDescriptionLength: seo.description?.length ?? 0,
    canonical: seo.canonical,
    robots: seo.robots,
    openGraph: seo.openGraph,
    twitter: seo.twitter,
    schemaTypes: seo.schemaTypes,
    currentContentGaps: currentContentGaps(kind, seo),
  };
}

export function buildContentReport(pages: PageContentReport[]): SeoContentReport {
  const contentGaps = pages.reduce((total, page) => total + page.currentContentGaps.length, 0);
  return {
    generatedAt: new Date().toISOString(),
    scope:
      'Rendered SEO/JSON-LD values and CMS-owned content gaps. This report is not the infra gate and does not score copy quality.',
    summary: {
      pages: pages.length,
      pagesWithCurrentContentGaps: pages.filter((page) => page.currentContentGaps.length > 0).length,
      currentContentGaps: contentGaps,
    },
    pages,
  };
}

export function writeContentReport(report: SeoContentReport): string {
  const outputDir = path.join(process.cwd(), '.context', 'seo');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'emitted-report.json');
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  return outputPath;
}
