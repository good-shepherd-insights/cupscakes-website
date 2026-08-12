import * as cheerio from 'cheerio';

export type JsonLdNode = Record<string, unknown>;

export interface ExtractedSeo {
  counts: {
    title: number;
    canonical: number;
    robots: number;
    jsonLd: number;
  };
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  openGraph: {
    title?: string;
    description?: string;
    type?: string;
    url?: string;
    image?: string;
    imageAlt?: string;
  };
  twitter: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
    imageAlt?: string;
  };
  jsonLd: JsonLdNode[];
  jsonLdParseErrors: string[];
  schemaTypes: string[];
}

function content($: cheerio.CheerioAPI, selector: string): string | undefined {
  return $(selector).attr('content')?.trim() || undefined;
}

function isJsonLdNode(value: unknown): value is JsonLdNode {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function jsonLdNodes(value: unknown): JsonLdNode[] {
  if (Array.isArray(value)) return value.filter(isJsonLdNode);
  return isJsonLdNode(value) ? [value] : [];
}

function schemaTypeValues(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  return [];
}

export function extractSeo(html: string): ExtractedSeo {
  const $ = cheerio.load(html);
  const jsonLd: JsonLdNode[] = [];
  const jsonLdParseErrors: string[] = [];

  $('script[type="application/ld+json"]').each((index, element) => {
    const raw = $(element).html();
    if (!raw?.trim()) return;
    try {
      const nodes = jsonLdNodes(JSON.parse(raw));
      if (nodes.length) {
        jsonLd.push(...nodes);
      } else {
        jsonLdParseErrors.push(`script ${index}: JSON-LD root must be an object or array of objects`);
      }
    } catch (error) {
      jsonLdParseErrors.push(`script ${index}: ${(error as Error).message}`);
    }
  });

  const schemaTypes = jsonLd.flatMap((schema) => {
    const graph = schema['@graph'];
    if (Array.isArray(graph)) {
      return graph.filter(isJsonLdNode).flatMap((node) => schemaTypeValues(node['@type']));
    }
    return schemaTypeValues(schema['@type']);
  });

  return {
    counts: {
      title: $('title').length,
      canonical: $('link[rel="canonical"]').length,
      robots: $('meta[name="robots"]').length,
      jsonLd: $('script[type="application/ld+json"]').length,
    },
    title: $('title').first().text().trim() || undefined,
    description: content($, 'meta[name="description"]'),
    canonical: $('link[rel="canonical"]').attr('href')?.trim() || undefined,
    robots: content($, 'meta[name="robots"]'),
    openGraph: {
      title: content($, 'meta[property="og:title"]'),
      description: content($, 'meta[property="og:description"]'),
      type: content($, 'meta[property="og:type"]'),
      url: content($, 'meta[property="og:url"]'),
      image: content($, 'meta[property="og:image"]'),
      imageAlt: content($, 'meta[property="og:image:alt"]'),
    },
    twitter: {
      card: content($, 'meta[name="twitter:card"]'),
      title: content($, 'meta[name="twitter:title"]'),
      description: content($, 'meta[name="twitter:description"]'),
      image: content($, 'meta[name="twitter:image"]'),
      imageAlt: content($, 'meta[name="twitter:image:alt"]'),
    },
    jsonLd,
    jsonLdParseErrors,
    schemaTypes,
  };
}
