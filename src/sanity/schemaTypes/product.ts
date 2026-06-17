import { defineField, defineType } from 'sanity';

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      description: 'Medium-weight line displayed below the product title.',
    }),
    defineField({
      name: 'servingInfo',
      title: 'Serving Info',
      type: 'string',
      description: 'Italic line below subtitle, e.g. "Serves 3-4 people." Leave blank for cupcakes.',
    }),
    defineField({
      name: 'flavors',
      title: 'Flavors',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Flavor options shown as radio buttons, e.g. ["Chocolate", "Vanilla"].',
    }),
    defineField({
      name: 'frostingColors',
      title: 'Frosting Colors',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Frosting color options shown as checkboxes. Leave blank to hide the section (e.g. cupcakes).',
    }),
    defineField({
      name: 'quantities',
      title: 'Quantities',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Quantity options shown as radio buttons. Leave blank to hide the section (e.g. personal cakes).',
    }),
    defineField({
      name: 'occasions',
      title: 'Occasions',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Occasion options. Defaults to Regular/Birthday/Wedding/Holiday/Other when left blank.',
    }),
  ],
});
