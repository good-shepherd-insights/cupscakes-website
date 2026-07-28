import { defineField, defineType } from 'sanity';
import { imageField } from '../lib/imageField';

export const navigation = defineType({
  name: 'navigation',
  title: 'Navigation',
  type: 'document',
  fields: [
    // TODO: these are plain strings with no format validation, so a typo
    // (e.g. missing "/" or "#") won't be caught here. Consider a custom
    // validator requiring the value start with "/" or "#" once the content
    // model has settled.
    defineField({ name: 'homeHref', title: 'Home URL', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'whoHref', title: 'Who We Are URL', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'orderHref', title: 'Order URL', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'productsHref', title: 'Products URL', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'cartHref', title: 'Cart URL', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'shopHref', title: 'Shop URL', type: 'string', validation: (Rule) => Rule.required() }),
    // whoLabel/orderLabel deliberately absent — Navbar/Footer reuse
    // homePage.ourStory.heading / homePage.hero.ctaLabel for those, since
    // it's the exact same text ("WHO WE ARE" / "ORDER NOW") duplicated
    // rather than independent content.
    defineField({ name: 'homeLabel', title: 'Home Breadcrumb Label', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'productsLabel', title: 'Products Link Label', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'shopLabel', title: 'Shop Link Label', type: 'string', validation: (Rule) => Rule.required() }),
    // Logo lockup text either side of cupsIcon, e.g. "CUPS" [icon] "CAKES".
    defineField({ name: 'logoTextBefore', title: 'Logo Text (Before Icon)', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'logoTextAfter', title: 'Logo Text (After Icon)', type: 'string', validation: (Rule) => Rule.required() }),
    // Mobile menu toggle button accessible name — swaps between these two as the menu opens/closes.
    defineField({ name: 'openMenuLabel', title: 'Open Menu Accessible Name', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'closeMenuLabel', title: 'Close Menu Accessible Name', type: 'string', validation: (Rule) => Rule.required() }),
    imageField('cupsIcon', 'Cups Icon', { required: true }),
    imageField('cartIcon', 'Cart Icon', { required: true }),
    imageField('mobileMenuLogo', 'Mobile Menu Logo', { required: true }),
  ],
  preview: { prepare: () => ({ title: 'Navigation' }) },
});
