import { schemaTypes } from '../../../src/sanity/schemaTypes';

interface SanitySchemaNode {
  name?: string;
  fields?: SanitySchemaNode[];
  of?: SanitySchemaNode[];
}

function collectNames(node: SanitySchemaNode, names: Set<string>): void {
  if (node.name) names.add(node.name);
  for (const field of node.fields ?? []) collectNames(field, names);
  for (const item of node.of ?? []) collectNames(item, names);
}

export function collectSanitySchemaNames(): Set<string> {
  const names = new Set<string>();
  for (const schema of schemaTypes as SanitySchemaNode[]) {
    collectNames(schema, names);
  }
  return names;
}
