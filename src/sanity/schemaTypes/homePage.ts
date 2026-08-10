import { defineArrayMember, defineField, defineType } from 'sanity';
import { SeoCharCountInput } from '../components/SeoCharCountInput';
import { imageField } from '../lib/imageField';

export const homePage = defineType({
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  fields: [
    // sr-only accessible label on the flavor-icon band (SmallBanner.astro),
    // not tied to any other section on the page.
    defineField({ name: 'flavorBandAccessibleLabel', title: 'Flavor Band Accessible Label', type: 'string', validation: (R) => R.required() }),

    // ---------- PROMO STRIP ----------
    defineField({
      name: 'promoStrip',
      title: 'Promo Strip',
      type: 'object',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({ name: 'text', title: 'Text', type: 'string', validation: (R) => R.required() }),
        defineField({
          name: 'accessibleLabel',
          title: 'Accessible Label',
          type: 'string',
          description: 'Optional screen-reader label when the visible strip text is highly promotional.',
        }),
      ],
    }),

    // ---------- HERO ----------
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({ name: 'headline', title: 'Headline', type: 'string', validation: (R) => R.required() }),
        defineField({
          name: 'headlinePrefix',
          title: 'Headline Prefix',
          type: 'string',
          description: 'Small text before the emphasized phrase.',
        }),
        defineField({
          name: 'headlineEmphasis',
          title: 'Headline Emphasis',
          type: 'string',
          description: 'Large emphasized phrase.',
        }),
        defineField({
          name: 'headlineSuffix',
          title: 'Headline Suffix',
          type: 'string',
          description: 'Small text after the emphasized phrase.',
        }),
        defineField({ name: 'ctaLabel', title: 'CTA Label', type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'ctaAriaLabel', title: 'CTA Accessible Name', type: 'string', validation: (R) => R.required() }),
        // TODO: plain string, no format validation — see the same TODO on
        // navigation.ts's hrefs.
        defineField({ name: 'orderHref', title: 'CTA URL', type: 'string', validation: (R) => R.required() }),
        imageField('backgroundImage', 'Background Image', { required: true }),
        imageField('logo', 'Logo', { required: true }),
        imageField('puertoRicoIcon', 'Puerto Rico Icon'),
        defineField({
          name: 'puertoRicoIconAccessibleLabel',
          title: 'Puerto Rico Icon Accessible Label',
          type: 'string',
          description: 'Optional label for the Puerto Rico icon. Leave blank if decorative.',
        }),
        imageField('scrollIndicator', 'Scroll Indicator'),
        defineField({ name: 'scrollAriaLabel', title: 'Scroll Indicator Accessible Name', type: 'string', validation: (R) => R.required() }),
      ],
    }),

    // ---------- INTRO ----------
    defineField({
      name: 'intro',
      title: 'Intro',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'subheading', title: 'Subheading', type: 'string', validation: (R) => R.required() }),
      ],
    }),

    // ---------- TESTIMONIAL ----------
    defineField({
      name: 'testimonial',
      title: 'Testimonial',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'accessibleHeading', title: 'Accessible Heading', type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'quote', title: 'Quote', type: 'text', rows: 2, validation: (R) => R.required() }),
        defineField({ name: 'attribution', title: 'Attribution', type: 'string', validation: (R) => R.required() }),
        imageField('avatar', 'Avatar'),
      ],
    }),

    // ---------- REVIEW CTA ----------
    defineField({
      name: 'reviewCta',
      title: 'Review CTA',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'ctaLabel', title: 'CTA Label', type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'ctaHref', title: 'CTA URL', type: 'url', validation: (R) => R.required() }),
        defineField({ name: 'ctaAriaLabel', title: 'CTA Accessible Name', type: 'string', validation: (R) => R.required() }),
      ],
    }),

    // ---------- OUR STORY ----------
    defineField({
      name: 'ourStory',
      title: 'Our Story',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (R) => R.required() }),
        defineField({
          name: 'paragraphs',
          title: 'Paragraphs',
          type: 'array',
          of: [defineArrayMember({ type: 'text' })],
          validation: (R) => R.required().min(1),
        }),
        imageField('photo', 'Photo', { required: true }),
        imageField('logo', 'Logo'),
        defineField({
          name: 'photoMask',
          title: 'Photo Mask',
          type: 'object',
          description:
            'Two CSS mask layers composited together over the story photo (see .story-photo in global.css). Order matters: primary composites first, secondary second.',
          fields: [
            imageField('primary', 'Primary Mask'),
            imageField('secondary', 'Secondary Mask'),
          ],
        }),
      ],
    }),

    // ---------- CUPCAKES BANNER ----------
    defineField({
      name: 'cupcakesBanner',
      title: 'Cupcakes Banner',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'headline', title: 'Headline', type: 'string', validation: (R) => R.required() }),
        imageField('ampImageLarge', 'Large Ampersand Image'),
        imageField('ampImageSmall', 'Small Ampersand Image'),
      ],
    }),

    // ---------- CUPCAKE CAROUSEL ----------
    defineField({
      name: 'cupcakeCarousel',
      title: 'Cupcake Carousel',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'caption', title: 'Caption', type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'otherOptionsLabel', title: 'Other Options Label', type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'otherOptionsHref', title: 'Other Options URL', type: 'string', validation: (R) => R.required() }),
        imageField('cupcakeMask', 'Cupcake Mask'),
      ],
    }),

    // ---------- PERSONAL CAKES ----------
    defineField({
      name: 'personalCakes',
      title: 'Personal Cakes',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'caption', title: 'Caption', type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'flavorHeadline', title: 'Flavor Headline', type: 'string', validation: (R) => R.required() }),
        imageField('photo', 'Photo', { required: true }),
        imageField('logo', 'Background Logo'),
        imageField('ampImage', 'Ampersand Image'),
        defineField({
          name: 'flavorLinks',
          title: 'Flavor Links',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'flavorLink',
              fields: [
                defineField({ name: 'label', title: 'Label', type: 'string', validation: (R) => R.required() }),
                defineField({ name: 'href', title: 'URL', type: 'string', validation: (R) => R.required() }),
              ],
              preview: { select: { title: 'label', subtitle: 'href' } },
            }),
          ],
          validation: (R) => R.required().min(1),
        }),
      ],
    }),

    // ---------- FOLLOW US ----------
    // Social links themselves live on `siteSettings` — they're a site-wide
    // concern (nav, footer, and this section all need them), not specific
    // to the home page.
    defineField({
      name: 'followUs',
      title: 'Follow Us',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (R) => R.required() }),
      ],
    }),

    // ---------- SEO ----------
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'metaTitle',
          title: 'Meta Title',
          type: 'string',
          description: 'Optional. Falls back to site name.',
        }),
        defineField({
          name: 'metaDescription',
          title: 'Meta Description',
          type: 'text',
          rows: 3,
          description: 'Required, 70–160 characters.',
          components: { input: SeoCharCountInput },
          validation: (R) =>
            R.required().min(70).max(160).error('Meta description must be between 70 and 160 characters.'),
        }),
        imageField('metaImage', 'Meta Image'),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Home Page' }) },
});
