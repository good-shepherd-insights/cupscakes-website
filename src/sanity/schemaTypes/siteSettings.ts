import { defineArrayMember, defineField, defineType } from 'sanity';
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
      type: 'seo',
      description: 'Fallback SEO values used when a specific indexable page has no SEO override.',
    }),
    defineField({
      name: 'productsSeo',
      title: 'Products Page SEO',
      type: 'seo',
      description: 'SEO and JSON-LD entity fields for the /products collection page.',
    }),
    defineField({
      name: 'businessIdentity',
      title: 'Business Identity',
      type: 'businessIdentity',
      description: 'Verified business facts used for Bakery/LocalBusiness JSON-LD. Empty fields are not emitted.',
    }),
    imageField('favicon', 'Favicon'),
    // Reused as decorative background marks across Loading, the products
    // CategoryHeader, PickupOrDelivery, and all 4 order sub-pages — one
    // site-wide home instead of a copy on each consuming page/component.
    defineField({ name: 'decorativeMarkLargeSrc', title: 'Large Decorative Mark URL', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'decorativeMarkLargeAlt', title: 'Large Decorative Mark Alt Text', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'decorativeMarkSmallSrc', title: 'Small Decorative Mark URL', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'decorativeMarkSmallAlt', title: 'Small Decorative Mark Alt Text', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'categoryHeaderAmpSrc', title: 'Category Header Ampersand URL', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'categoryHeaderAmpAlt', title: 'Category Header Ampersand Alt Text', type: 'string', validation: (Rule) => Rule.required() }),
    // sr-only <h2> on the /products CategoryHeader section (not visible, but read by screen readers).
    defineField({ name: 'categoryHeaderAccessibleHeading', title: 'Category Header Accessible Heading', type: 'string', validation: (Rule) => Rule.required() }),
    // Same label on every product's detail page — one site-wide value
    // rather than per-product content.
    defineField({ name: 'addToCartLabel', title: 'Add To Cart Button Label', type: 'string', validation: (Rule) => Rule.required() }),
    // Transient label shown on the Add to Cart button while the request is in flight.
    defineField({ name: 'addingToCartMessage', title: 'Adding To Cart Button Label (in progress)', type: 'string', validation: (Rule) => Rule.required() }),
    // Shown in the confirmation toast on every page (via Layout.astro),
    // not just the product/cart pages.
    defineField({ name: 'addedToCartMessage', title: 'Added To Cart Toast Message', type: 'string', validation: (Rule) => Rule.required() }),
    // Base accessible name for the cart icon/link (Navbar). Item-count
    // pluralization ("(3 items)") stays in code — this is just the noun phrase.
    defineField({ name: 'cartAccessibleLabel', title: 'Cart Icon Accessible Label', type: 'string', validation: (Rule) => Rule.required() }),
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
