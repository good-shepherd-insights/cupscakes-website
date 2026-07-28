import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './src/sanity/schemaTypes';

const singletonTypes = new Set(['homePage', 'navigation', 'footer', 'siteSettings', 'orderFlow']);
const singletonListItem = (
  S: Parameters<NonNullable<Parameters<typeof structureTool>[0]>['structure']>[0],
  typeName: string,
  title: string,
) =>
  S.listItem()
    .title(title)
    .id(typeName)
    .schemaType(typeName)
    .child(S.document().schemaType(typeName).documentId(typeName));

export default defineConfig({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.PUBLIC_SANITY_DATASET ?? 'production',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            singletonListItem(S, 'siteSettings', 'Site Settings'),
            singletonListItem(S, 'homePage', 'Home Page'),
            singletonListItem(S, 'navigation', 'Navigation'),
            singletonListItem(S, 'footer', 'Footer'),
            singletonListItem(S, 'orderFlow', 'Order Flow'),
            S.divider(),
            ...S.documentTypeListItems().filter((item) => !singletonTypes.has(item.getId() ?? '')),
          ]),
    }),
  ],
  document: {
    newDocumentOptions: (previous) =>
      previous.filter((template) => !singletonTypes.has(template.templateId)),
    actions: (previous, context) =>
      singletonTypes.has(context.schemaType)
        ? previous.filter(({ action }) => action !== 'delete' && action !== 'duplicate')
        : previous,
  },
  schema: {
    types: schemaTypes,
  },
});
