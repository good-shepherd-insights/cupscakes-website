import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/plugins';
import { schemaTypes } from './src/sanity/schemaTypes';

export default defineConfig({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID!,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET ?? 'production',
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
});
