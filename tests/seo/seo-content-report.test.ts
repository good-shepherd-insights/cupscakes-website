import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { classifyPath, isActiveIndexableKind, pathnameFromUrl } from './lib/contracts';
import { buildContentReport, pageContentReport, writeContentReport } from './lib/contentReport';
import { extractSeo } from './lib/extractSeo';
import { readHtmlForUrl, readSitemapUrls } from './lib/distReader';

describe('project SEO emitted content report', () => {
  it('writes the current rendered SEO and JSON-LD data for copy/content review', () => {
    const pages = readSitemapUrls()
      .filter((url) => isActiveIndexableKind(classifyPath(pathnameFromUrl(url))))
      .map((url) => pageContentReport(url, extractSeo(readHtmlForUrl(url))));

    const report = buildContentReport(pages);
    const outputPath = writeContentReport(report);

    expect(fs.existsSync(outputPath)).toBe(true);
    expect(report.pages.length).toBeGreaterThan(0);
    expect(report.pages.every((page) => page.title && page.canonical && page.robots)).toBe(true);
  });
});
