import { defineArrayMember, defineField, defineType } from 'sanity';
import { validateUniqueSlug } from '../lib/uniqueSlug';

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
      validation: (Rule) => Rule.required().custom(validateUniqueSlug('product')),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'productCategory' }],
      description: 'Which catalog grid this product appears in on /products.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: (Rule) => Rule.required().positive().precision(2),
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
      name: 'customOptions',
      title: 'Customization Options',
      type: 'array',
      description:
        'Each entry is one selection group on the product page (e.g. Flavor, Frosting Color, Quantity, Occasion). Add, remove, or reorder groups here — no code change needed.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'customOption',
          fields: [
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
              description: 'Shown to the customer as the group label, e.g. "Flavor".',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'inputType',
              title: 'Input Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Single choice (radio buttons)', value: 'radio' },
                  { title: 'Multiple choice (checkboxes)', value: 'checkbox' },
                ],
                layout: 'radio',
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'helperText',
              title: 'Helper Text',
              type: 'string',
              description: 'Optional clarifying text after the label, e.g. "(please choose up to 2 colors)".',
            }),
            defineField({
              name: 'options',
              title: 'Options',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'customOptionValue',
                  fields: [
                    defineField({
                      name: 'label',
                      title: 'Label',
                      type: 'string',
                      description: 'e.g. "Custom".',
                      validation: (Rule) => Rule.required(),
                    }),
                    defineField({
                      name: 'priceModifier',
                      title: 'Price Modifier',
                      type: 'number',
                      description: 'Added to the base price when this option is selected, e.g. 3 for +$3.00. Leave blank for no change.',
                      validation: (Rule) => Rule.precision(2),
                    }),
                  ],
                  preview: {
                    select: { title: 'label', subtitle: 'priceModifier' },
                  },
                }),
              ],
              validation: (Rule) =>
                Rule.required()
                  .min(1)
                  .custom((options) => {
                    if (!options) return true;
                    const labels = options
                      .map((o: { label?: string }) => o.label?.trim().toLowerCase())
                      .filter(Boolean);
                    const hasDuplicate = labels.length !== new Set(labels).size;
                    return hasDuplicate ? 'Option labels must be unique within a group.' : true;
                  }),
            }),
          ],
          preview: {
            select: { title: 'name', subtitle: 'inputType' },
          },
        }),
      ],
    }),
  ],
});
