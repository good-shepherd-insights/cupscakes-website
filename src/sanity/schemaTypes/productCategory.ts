import { defineField, defineType } from 'sanity';
import { validateUniqueSlug } from '../lib/uniqueSlug';

export const productCategory = defineType({
  name: 'productCategory',
  title: 'Product Category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Editorial name, e.g. "Cupcakes". Used as the /products grid heading unless overridden below.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required().custom(validateUniqueSlug('productCategory')),
    }),
    defineField({
      name: 'heading',
      title: 'Grid Heading Override',
      type: 'string',
      description: 'Overrides Title on the /products grid heading, if set.',
    }),
    defineField({
      name: 'caption',
      title: 'Grid Caption',
      type: 'string',
      description: 'Tagline shown next to the heading on /products.',
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers render first on /products. Leave blank to sort last.',
    }),
  ],
});
