import fs from 'node:fs';
import path from 'node:path';

export interface InfraReportSection {
  name: string;
  infraBlockers: number;
  blockers: string[];
}

export interface SeoInfraReport {
  generatedAt: string;
  scope: string;
  summary: {
    infraBlockers: number;
    sections: number;
  };
  sections: InfraReportSection[];
}

const outputPath = path.join(process.cwd(), '.context', 'seo', 'infra-report.json');

export function resetInfraReport(): void {
  if (fs.existsSync(outputPath)) fs.rmSync(outputPath);
}

function readExistingReport(): SeoInfraReport | undefined {
  if (!fs.existsSync(outputPath)) return undefined;
  return JSON.parse(fs.readFileSync(outputPath, 'utf8')) as SeoInfraReport;
}

export function writeInfraReportSection(section: InfraReportSection): string {
  const existing = readExistingReport();
  const sections = [
    ...(existing?.sections.filter((item) => item.name !== section.name) ?? []),
    section,
  ].sort((a, b) => a.name.localeCompare(b.name));
  const infraBlockers = sections.reduce((total, item) => total + item.infraBlockers, 0);
  const report: SeoInfraReport = {
    generatedAt: new Date().toISOString(),
    scope:
      'Project-specific SEO infrastructure gate. Content quality and missing CMS values are reported separately in emitted-report.json.',
    summary: {
      infraBlockers,
      sections: sections.length,
    },
    sections,
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  return outputPath;
}
