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
    imageField('cupsIcon', 'Cups Icon', { required: true }),
    imageField('cartIcon', 'Cart Icon', { required: true }),
    imageField('mobileMenuLogo', 'Mobile Menu Logo', { required: true }),
  ],
  preview: { prepare: () => ({ title: 'Navigation' }) },
});
