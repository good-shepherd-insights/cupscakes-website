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
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description:
            'Descriptive alt text for SEO and accessibility, e.g. "Carrot cupcake with cream cheese frosting". Falls back to a generated label if left blank.',
        }),
      ],
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
    defineField({ name: 'seo', title: 'SEO', type: 'seo', options: { collapsible: true, collapsed: true } }),
    defineField({
      name: 'structuredData',
      title: 'Product JSON-LD',
      type: 'productStructuredData',
      description: 'Optional product/offer facts for schema.org Product JSON-LD. Leave fields blank unless they are real product facts.',
      options: { collapsible: true, collapsed: true },
    }),
    defineField({
      name: 'customOptions',
      title: 'Customization Options',
      type: 'array',
      description:
        'Each entry is one selection group on the product page (e.g. Flavor, Frosting Color, Quantity, Occasion). Add, remove, or reorder groups here — no code change needed.',
      validation: (Rule) =>
        Rule.custom((groups) => {
          if (!groups) return true;
          const optionGroups = Array.isArray(groups)
            ? (groups as { definesVariantRoute?: boolean; name?: string }[])
            : [];
          const routeGroups = optionGroups.filter((g) => g.definesVariantRoute);
          if (routeGroups.length > 1) {
            return 'Only one group may be used as the shareable variant URL.';
          }
          const names = optionGroups
            .map((g) => g.name?.trim().toLowerCase())
            .filter(Boolean);
          const hasDuplicate = names.length !== new Set(names).size;
          return hasDuplicate ? 'Group names must be unique within a product.' : true;
        }),
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
              name: 'definesVariantRoute',
              title: 'Use as shareable variant URL',
              type: 'boolean',
              description: 'At most one group per product. Each option becomes its own URL (e.g. /products/cupcakes/vanilla) with its own image and link preview.',
              initialValue: false,
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
                      name: 'description',
                      title: 'Description',
                      type: 'text',
                      description: 'e.g. "Rich and indulgent with a smooth, chocolatey finish." Shown on the /products grid card for this option.',
                    }),
                    defineField({
                      name: 'priceModifier',
                      title: 'Price Modifier',
                      type: 'number',
                      description: 'Added to the base price when this option is selected, e.g. 3 for +$3.00. Leave blank for no change.',
                      validation: (Rule) => Rule.precision(2),
                    }),
                    defineField({
                      name: 'slug',
                      title: 'Slug',
                      type: 'slug',
                      description: 'URL segment when this option is part of a shareable variant link, e.g. "vanilla".',
                      options: { source: 'label', maxLength: 96 },
                    }),
                    defineField({
                      name: 'image',
                      title: 'Image',
                      type: 'image',
                      options: { hotspot: true },
                      description: 'Optional photo for this specific option. Falls back to the product image if blank.',
                      fields: [
                        defineField({
                          name: 'alt',
                          title: 'Alt Text',
                          type: 'string',
                          description:
                            'Descriptive alt text for SEO and accessibility, e.g. "Carrot cupcake with cream cheese frosting". Falls back to a generated label if left blank.',
                        }),
                      ],
                    }),
                    defineField({
                      name: 'seo',
                      title: 'Variant SEO',
                      type: 'seo',
                      options: { collapsible: true, collapsed: true },
                      description: 'Optional SEO override for this shareable variant URL.',
                    }),
                    defineField({
                      name: 'structuredData',
                      title: 'Variant JSON-LD',
                      type: 'productStructuredData',
                      options: { collapsible: true, collapsed: true },
                      description: 'Optional Product/Offer JSON-LD overrides for this variant URL, such as a variant SKU or availability.',
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
                    const optionValues = Array.isArray(options)
                      ? (options as { label?: string }[])
                      : [];
                    const labels = optionValues
                      .map((o) => o.label?.trim().toLowerCase())
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
