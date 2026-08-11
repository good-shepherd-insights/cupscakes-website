import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  classifyPath,
  expectedSchemaTypes,
  isActiveIndexableKind,
  NOINDEX_HTML_PATHS,
  REQUIRED_SOURCE_FILES,
  RESOLVER_SCHEMA_WIRES,
  ROBOTS_DISALLOWS,
  SANITY_SEO_FIELDS,
  SEO_SOURCE_PAGES,
  SITE_URL,
  pathnameFromUrl,
} from './lib/contracts';
import {
  distDir,
  fileExists,
  htmlFileForPathname,
  htmlFileForUrl,
  listDistHtmlFiles,
  readDistFile,
  readHtmlForUrl,
  readProjectFile,
  readSitemapUrls,
} from './lib/distReader';
import { extractSeo } from './lib/extractSeo';
import { resetInfraReport, writeInfraReportSection } from './lib/infraReport';
import { collectSanitySchemaNames } from './lib/sanitySchema';
import { firstNodeByType, hasSchemaType, nodeId, productOffer, referenceId } from './lib/schemaGraph';

const HEAD_TAG_PATTERN = /<title>|rel=["']canonical["']|property=["']og:|name=["']twitter:|application\/ld\+json/;

function sourceIncludesAll(source: string, values: readonly string[]): string[] {
  return values.filter((value) => !source.includes(value));
}

function assertNoBlockers(blockers: string[]) {
  if (blockers.length > 0) {
    throw new Error(`SEO infrastructure blockers:\n${blockers.map((blocker) => `- ${blocker}`).join('\n')}`);
  }
  expect(blockers).toHaveLength(0);
}

describe('project SEO infrastructure contract', () => {
  beforeAll(() => {
    resetInfraReport();
  });

  it('keeps Cupscakes sitemap, canonical, robots, and JSON-LD output aligned', () => {
    const blockers: string[] = [];
    const sitemapUrls = readSitemapUrls();
    const sitemapSet = new Set(sitemapUrls);
    const builtHtml = listDistHtmlFiles();

    if (!fs.existsSync(path.join(distDir, 'sitemap-index.xml'))) {
      blockers.push('missing dist/sitemap-index.xml');
    }
    if (!fs.existsSync(path.join(distDir, 'sitemap-0.xml'))) {
      blockers.push('missing dist/sitemap-0.xml');
    }
    if (!fs.existsSync(path.join(distDir, 'robots.txt'))) {
      blockers.push('missing dist/robots.txt');
    }

    for (const required of [`${SITE_URL}/`, `${SITE_URL}/products`]) {
      if (!sitemapSet.has(required)) blockers.push(`sitemap missing ${required}`);
    }

    for (const url of sitemapUrls) {
      const kind = classifyPath(pathnameFromUrl(url));
      if (!isActiveIndexableKind(kind)) {
        blockers.push(`sitemap includes non-indexable project route ${url}`);
      }
    }

    for (const url of sitemapUrls) {
      const htmlFile = htmlFileForUrl(url);
      if (!builtHtml.includes(htmlFile)) {
        blockers.push(`${url}: sitemap URL has no built HTML file ${htmlFile}`);
        continue;
      }

      const seo = extractSeo(readHtmlForUrl(url));
      const kind = classifyPath(pathnameFromUrl(url));
      if (seo.counts.title !== 1) blockers.push(`${url}: expected exactly one title, found ${seo.counts.title}`);
      if (seo.counts.canonical !== 1) {
        blockers.push(`${url}: expected exactly one canonical, found ${seo.counts.canonical}`);
      }
      if (seo.counts.robots !== 1) blockers.push(`${url}: expected exactly one robots tag, found ${seo.counts.robots}`);
      if (!seo.title) blockers.push(`${url}: missing title`);
      if (seo.canonical !== url) blockers.push(`${url}: canonical ${seo.canonical} does not match sitemap URL`);
      if (seo.robots !== 'index, follow') blockers.push(`${url}: robots ${seo.robots}, expected index, follow`);
      if (!seo.twitter.card) blockers.push(`${url}: missing twitter:card`);
      if (seo.jsonLdParseErrors.length) {
        blockers.push(`${url}: invalid JSON-LD: ${seo.jsonLdParseErrors.join('; ')}`);
      }
      if (!seo.jsonLd.length) blockers.push(`${url}: missing JSON-LD`);

      for (const schemaType of expectedSchemaTypes(kind)) {
        if (!hasSchemaType(seo.jsonLd, schemaType)) {
          blockers.push(`${url}: missing ${schemaType} JSON-LD`);
        }
      }

      if (kind === 'productsIndex') {
        const collectionPage = firstNodeByType(seo.jsonLd, 'CollectionPage');
        const itemList = firstNodeByType(seo.jsonLd, 'ItemList');
        if (!itemList) blockers.push(`${url}: missing ItemList main entity`);
        if (collectionPage && itemList && referenceId(collectionPage.mainEntity) !== nodeId(itemList)) {
          blockers.push(`${url}: CollectionPage.mainEntity does not reference ItemList @id`);
        }
      }

      if (kind === 'productVariant') {
        if (seo.openGraph.type !== 'product') {
          blockers.push(`${url}: og:type ${seo.openGraph.type}, expected product`);
        }
        const webpage = firstNodeByType(seo.jsonLd, 'WebPage');
        const product = firstNodeByType(seo.jsonLd, 'Product');
        if (webpage && product && referenceId(webpage.mainEntity) !== nodeId(product)) {
          blockers.push(`${url}: WebPage.mainEntity does not reference Product @id`);
        }
        const offer = productOffer(seo.jsonLd);
        if (!offer) blockers.push(`${url}: Product missing Offer`);
        if (offer && offer.priceCurrency !== 'USD') {
          blockers.push(`${url}: Offer priceCurrency ${String(offer.priceCurrency)}, expected USD`);
        }
        if (offer && typeof offer.price !== 'number') {
          blockers.push(`${url}: Offer price is not numeric`);
        }
      }

      if (seo.openGraph.image) {
        if (!seo.openGraph.title) blockers.push(`${url}: has og:image but missing og:title`);
        if (!seo.openGraph.type) blockers.push(`${url}: has og:image but missing og:type`);
        if (seo.openGraph.url !== url) blockers.push(`${url}: og:url ${seo.openGraph.url} does not match canonical`);
      }
    }

    for (const pathname of NOINDEX_HTML_PATHS) {
      const htmlFile = htmlFileForPathname(pathname);
      if (!builtHtml.includes(htmlFile)) {
        blockers.push(`${pathname}: expected noindex HTML file ${htmlFile} is not built`);
        continue;
      }
      const seo = extractSeo(readDistFile(htmlFile));
      if (seo.robots !== 'noindex, follow') {
        blockers.push(`${pathname}: robots ${seo.robots}, expected noindex, follow`);
      }
      if (seo.counts.jsonLd !== 0) {
        blockers.push(`${pathname}: noindex page emitted ${seo.counts.jsonLd} JSON-LD scripts`);
      }
      if (sitemapSet.has(new URL(pathname, SITE_URL).toString())) {
        blockers.push(`${pathname}: noindex page appears in sitemap`);
      }
    }

    for (const htmlFile of builtHtml.filter((file) => /^products\/[^/]+\/index\.html$/.test(file))) {
      const productSlug = htmlFile.split('/')[1];
      const pathname = `/products/${productSlug}`;
      const seo = extractSeo(readDistFile(htmlFile));
      if (!seo.canonical?.startsWith(`${SITE_URL}/products/${productSlug}/`)) {
        blockers.push(`${pathname}: duplicate product route canonical ${seo.canonical} is not a variant URL`);
      }
      if (sitemapSet.has(new URL(pathname, SITE_URL).toString())) {
        blockers.push(`${pathname}: duplicate product route appears in sitemap`);
      }
    }

    const robots = readDistFile('robots.txt');
    for (const disallow of ROBOTS_DISALLOWS) {
      if (!robots.includes(`Disallow: ${disallow}`)) {
        blockers.push(`robots.txt missing Disallow: ${disallow}`);
      }
    }
    if (!robots.includes(`Sitemap: ${SITE_URL}/sitemap-index.xml`)) {
      blockers.push('robots.txt missing sitemap URL');
    }

    writeInfraReportSection({
      name: 'rendered-output',
      infraBlockers: blockers.length,
      blockers,
    });
    assertNoBlockers(blockers);
  });

  it('keeps SEO rendering centralized and Sanity-backed', () => {
    const blockers: string[] = [];

    for (const file of REQUIRED_SOURCE_FILES) {
      if (!fileExists(file)) blockers.push(`missing source file ${file}`);
    }

    const packageJson = JSON.parse(readProjectFile('package.json')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    for (const dependency of ['astro-seo', 'astro-seo-schema', 'schema-dts', '@astrojs/sitemap']) {
      if (!packageJson.dependencies?.[dependency] && !packageJson.devDependencies?.[dependency]) {
        blockers.push(`missing package dependency ${dependency}`);
      }
    }

    const layout = readProjectFile('src/layouts/Layout.astro');
    if (!layout.includes('<SeoHead seo={seo} />')) {
      blockers.push('Layout does not render centralized SeoHead');
    }
    if (HEAD_TAG_PATTERN.test(layout)) {
      blockers.push('Layout contains handrolled SEO/head JSON-LD tags');
    }

    const seoHead = readProjectFile('src/components/seo/SeoHead.astro');
    if (!seoHead.includes("from 'astro-seo'")) blockers.push('SeoHead does not use astro-seo');
    if (!seoHead.includes("from 'astro-seo-schema'")) blockers.push('SeoHead does not use astro-seo-schema');

    for (const file of SEO_SOURCE_PAGES) {
      const source = readProjectFile(file);
      if (!source.includes('resolveSeo(')) blockers.push(`${file}: does not call resolveSeo`);
      if (!source.includes('seo={resolvedSeo}')) blockers.push(`${file}: does not pass resolvedSeo to Layout`);
      if (HEAD_TAG_PATTERN.test(source)) blockers.push(`${file}: contains handrolled SEO/head JSON-LD tags`);
    }

    const sanitySchemaNames = collectSanitySchemaNames();
    for (const field of SANITY_SEO_FIELDS) {
      if (!sanitySchemaNames.has(field)) {
        blockers.push(`Sanity schema missing SEO field ${field}`);
      }
    }

    const resolverSource = [
      'src/lib/seo/resolveSeo.ts',
      'src/lib/seo/schemaBuilders.ts',
    ].map(readProjectFile).join('\n');
    for (const missing of sourceIncludesAll(resolverSource, RESOLVER_SCHEMA_WIRES)) {
      blockers.push(`SEO resolver/schema builders are not wired for ${missing}`);
    }

    writeInfraReportSection({
      name: 'source-plumbing',
      infraBlockers: blockers.length,
      blockers,
    });
    assertNoBlockers(blockers);
  });
});
