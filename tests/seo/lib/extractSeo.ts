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

export function extractSeo(html: string): ExtractedSeo {
  const $ = cheerio.load(html);
  const jsonLd: JsonLdNode[] = [];
  const jsonLdParseErrors: string[] = [];

  $('script[type="application/ld+json"]').each((index, element) => {
    const raw = $(element).html();
    if (!raw?.trim()) return;
    try {
      jsonLd.push(JSON.parse(raw) as JsonLdNode);
    } catch (error) {
      jsonLdParseErrors.push(`script ${index}: ${(error as Error).message}`);
    }
  });

  const schemaTypes = jsonLd.flatMap((schema) => {
    const graph = schema['@graph'];
    if (Array.isArray(graph)) {
      return graph.map((node) =>
        typeof node === 'object' && node ? String((node as JsonLdNode)['@type']) : undefined,
      );
    }
    return typeof schema['@type'] === 'string' ? schema['@type'] : undefined;
  }).filter((value): value is string => Boolean(value));

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
