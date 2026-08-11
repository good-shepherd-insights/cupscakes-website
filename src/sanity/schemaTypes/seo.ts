import { defineArrayMember, defineField, defineType } from 'sanity';
import { SeoCharCountInput } from '../components/SeoCharCountInput';
import { imageField } from '../lib/imageField';

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fieldsets: [
    { name: 'metadata', title: 'Metadata', options: { collapsible: true, collapsed: false } },
    { name: 'openGraph', title: 'Open Graph / Social', options: { collapsible: true, collapsed: false } },
    { name: 'jsonLd', title: 'JSON-LD', options: { collapsible: true, collapsed: false } },
    { name: 'internal', title: 'Internal Notes', options: { collapsible: true, collapsed: true } },
  ],
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      description: 'HTML title source. Target 50-60 characters; max 70.',
      fieldset: 'metadata',
      validation: (Rule) => Rule.max(70),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
      description: 'Search/social/schema description. Target 150-160 characters; max 170.',
      components: { input: SeoCharCountInput },
      fieldset: 'metadata',
      validation: (Rule) =>
        Rule.min(70).max(170).error('Meta description must be between 70 and 170 characters.'),
    }),
    defineField({
      name: 'canonicalOverride',
      title: 'Canonical Override',
      type: 'url',
      description: 'Optional absolute preferred URL. Leave blank to use the generated canonical URL.',
      fieldset: 'metadata',
    }),
    defineField({
      name: 'robots',
      title: 'Robots',
      type: 'string',
      description: 'Indexing directive for pages that are eligible to be indexed. Cart, order, admin, API, and utility pages are controlled by route policy.',
      initialValue: 'index, follow',
      fieldset: 'metadata',
      options: {
        layout: 'radio',
        list: [
          { title: 'Index, follow', value: 'index, follow' },
          { title: 'Noindex, follow', value: 'noindex, follow' },
        ],
      },
    }),
    defineField({
      name: 'ogTitle',
      title: 'Open Graph Title',
      type: 'string',
      description: 'Optional social title override. Falls back to Meta Title.',
      fieldset: 'openGraph',
      validation: (Rule) => Rule.max(95),
    }),
    defineField({
      name: 'ogDescription',
      title: 'Open Graph Description',
      type: 'text',
      rows: 3,
      description: 'Optional social description override. Falls back to Meta Description.',
      fieldset: 'openGraph',
      validation: (Rule) => Rule.max(200),
    }),
    imageField('metaImage', 'Social/Meta Image', {
      description: 'Open Graph/Twitter image. Prefer a 1200x630 crop that still reads at small sizes.',
      fieldset: 'openGraph',
    }),
    defineField({
      name: 'metaImageAlt',
      title: 'Social/Meta Image Alt',
      type: 'string',
      description: 'Required for social image accessibility when Social/Meta Image is set.',
      fieldset: 'openGraph',
      validation: (Rule) => Rule.max(160),
    }),
    defineField({
      name: 'dateModified',
      title: 'Date Modified',
      type: 'datetime',
      description: 'Optional JSON-LD dateModified for materially updated page content. Leave blank for pages without a meaningful update date.',
      fieldset: 'jsonLd',
    }),
    defineField({
      name: 'keywords',
      title: 'Keywords',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      description: 'Optional schema keywords. Avoid keyword stuffing.',
      fieldset: 'jsonLd',
    }),
    defineField({
      name: 'about',
      title: 'About Entities',
      type: 'array',
      description: 'Primary real-world entities this page is about. Used in JSON-LD about[]. Add only verified names and URLs.',
      fieldset: 'jsonLd',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'seoThing',
          fields: [
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
              description: 'Entity name, e.g. Cupcakes, Personal Cakes, Puerto Rican Bakery.',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              description: 'Optional authoritative URL for the entity.',
            }),
          ],
          preview: { select: { title: 'name', subtitle: 'url' } },
        }),
      ],
    }),
    defineField({
      name: 'mentions',
      title: 'Mentioned Entities',
      type: 'array',
      description: 'Secondary entities referenced by this page. Used in JSON-LD mentions[]. Leave blank unless the page actually mentions them.',
      fieldset: 'jsonLd',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'seoThing',
          fields: [
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
              description: 'Entity name exactly as it should appear in structured data.',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              description: 'Optional authoritative URL for the entity.',
            }),
          ],
          preview: { select: { title: 'name', subtitle: 'url' } },
        }),
      ],
    }),
    defineField({
      name: 'snippetFocus',
      title: 'Snippet Focus',
      type: 'string',
      description: 'Internal note for the copywriter: target search intent or SERP angle. This is not emitted on the website.',
      fieldset: 'internal',
    }),
  ],
});
