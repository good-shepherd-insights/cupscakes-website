import { defineArrayMember, defineField, defineType } from 'sanity';
import { SeoCharCountInput } from '../components/SeoCharCountInput';
import { imageField } from '../lib/imageField';

// Favicon/meta image use the shared decorative imageField (no alt — they
// render as a <link>/og:image, never an <img alt>). Social icons DO need
// alt (used as iconAlt on an <img>), so that field is defined inline below.

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'siteName', title: 'Site Name', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'defaultSeo',
      title: 'Default SEO',
      type: 'object',
      fields: [
        defineField({ name: 'metaTitle', title: 'Meta Title', type: 'string' }),
        defineField({
          name: 'metaDescription',
          title: 'Meta Description',
          type: 'text',
          rows: 3,
          components: { input: SeoCharCountInput },
          validation: (Rule) =>
            Rule.min(70).max(160).error('Meta description must be between 70 and 160 characters.'),
        }),
        imageField('metaImage', 'Meta Image'),
      ],
    }),
    imageField('favicon', 'Favicon'),
    // Site-wide social links — shared by Navbar, Footer, and the Follow Us
    // section, so they live here rather than nested in a single homepage
    // section.
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'socialLink',
          fields: [
            defineField({
              name: 'platform',
              title: 'Platform',
              type: 'string',
              description: 'e.g. Facebook, Instagram, TikTok',
              validation: (Rule) => Rule.required(),
            }),
            defineField({ name: 'href', title: 'URL', type: 'url', validation: (Rule) => Rule.required() }),
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'image',
              options: { hotspot: true },
              fields: [
                defineField({
                  name: 'alt',
                  title: 'Alt Text',
                  type: 'string',
                  description: 'Descriptive alt text for this platform\'s icon.',
                }),
              ],
              validation: (Rule) => Rule.required().assetRequired(),
            }),
          ],
          preview: { select: { title: 'platform', subtitle: 'href' } },
        }),
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: { prepare: () => ({ title: 'Site Settings' }) },
});
