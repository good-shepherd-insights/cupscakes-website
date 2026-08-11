import type { JsonLdNode } from './extractSeo';

export function graphNodes(jsonLd: JsonLdNode[]): JsonLdNode[] {
  return jsonLd.flatMap((schema) => {
    const graph = schema['@graph'];
    return Array.isArray(graph) ? graph.filter(isJsonLdNode) : [schema];
  });
}

export function isJsonLdNode(value: unknown): value is JsonLdNode {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function nodesByType(jsonLd: JsonLdNode[], type: string): JsonLdNode[] {
  return graphNodes(jsonLd).filter((node) => node['@type'] === type);
}

export function firstNodeByType(jsonLd: JsonLdNode[], type: string): JsonLdNode | undefined {
  return nodesByType(jsonLd, type)[0];
}

export function hasSchemaType(jsonLd: JsonLdNode[], type: string): boolean {
  return Boolean(firstNodeByType(jsonLd, type));
}

export function productOffer(jsonLd: JsonLdNode[]): JsonLdNode | undefined {
  const product = firstNodeByType(jsonLd, 'Product');
  const offers = product?.offers;
  if (Array.isArray(offers)) return offers.find(isJsonLdNode);
  return isJsonLdNode(offers) ? offers : undefined;
}

export function nodeId(node: JsonLdNode | undefined): string | undefined {
  return typeof node?.['@id'] === 'string' ? node['@id'] : undefined;
}

export function referenceId(value: unknown): string | undefined {
  return isJsonLdNode(value) && typeof value['@id'] === 'string' ? value['@id'] : undefined;
}
