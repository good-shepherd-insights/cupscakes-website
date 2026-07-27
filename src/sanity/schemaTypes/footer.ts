import { defineField, defineType } from 'sanity';

export const footer = defineType({
  name: 'footer',
  title: 'Footer',
  type: 'document',
  fields: [
    // TODO: plain strings, no format validation — see the same TODO on
    // navigation.ts's hrefs.
    defineField({ name: 'whoHref', title: 'Who We Are URL', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'orderHref', title: 'Order URL', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'topHref', title: 'Back To Top URL', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'copyright', title: 'Copyright', type: 'string', validation: (Rule) => Rule.required() }),
  ],
  preview: { prepare: () => ({ title: 'Footer' }) },
});
