import fs from 'node:fs';
import path from 'node:path';
import { normalizePathname, SITE_URL } from './contracts';

export const repoRoot = process.cwd();
export const distDir = path.join(repoRoot, 'dist');

export function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

export function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

export function readDistFile(relativePath: string): string {
  return fs.readFileSync(path.join(distDir, relativePath), 'utf8');
}

export function listDistHtmlFiles(dir = distDir): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listDistHtmlFiles(absolute));
    } else if (entry.name.endsWith('.html')) {
      files.push(path.relative(distDir, absolute));
    }
  }
  return files.sort();
}

function locs(xml: string): string[] {
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
}

export function readSitemapUrls(): string[] {
  const indexPath = path.join(distDir, 'sitemap-index.xml');
  if (!fs.existsSync(indexPath)) return [];

  const sitemapFiles = locs(fs.readFileSync(indexPath, 'utf8'))
    .map((url) => path.basename(new URL(url).pathname))
    .filter((filename) => filename.startsWith('sitemap-') && filename.endsWith('.xml'));

  const concreteFiles = sitemapFiles.length ? sitemapFiles : ['sitemap-0.xml'];
  return concreteFiles.flatMap((filename) => {
    const filePath = path.join(distDir, filename);
    return fs.existsSync(filePath) ? locs(fs.readFileSync(filePath, 'utf8')) : [];
  });
}

export function htmlFileForUrl(url: string): string {
  const pathname = normalizePathname(new URL(url).pathname);
  return pathname === '/' ? 'index.html' : path.join(pathname.slice(1), 'index.html');
}

export function htmlFileForPathname(pathname: string): string {
  const normalized = normalizePathname(pathname);
  return htmlFileForUrl(new URL(normalized, SITE_URL).toString());
}

export function readHtmlForUrl(url: string): string {
  return readDistFile(htmlFileForUrl(url));
}
