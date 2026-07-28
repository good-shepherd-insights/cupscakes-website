import { defineArrayMember, defineField, defineType } from 'sanity';

const contactFieldSchema = () =>
  defineArrayMember({
    type: 'object',
    name: 'contactField',
    fields: [
      defineField({
        name: 'id',
        title: 'Field ID',
        type: 'string',
        options: { list: ['firstName', 'lastName', 'email', 'phone', 'street', 'apt', 'city', 'zipcode'] },
        validation: (R) => R.required(),
      }),
      defineField({ name: 'label', title: 'Label', type: 'string', validation: (R) => R.required() }),
      defineField({
        name: 'inputType',
        title: 'Input Type',
        type: 'string',
        options: { list: ['text', 'email', 'tel'] },
        initialValue: 'text',
      }),
      defineField({ name: 'required', title: 'Required', type: 'boolean', initialValue: false }),
      defineField({
        name: 'autocomplete',
        title: 'Autocomplete Token',
        type: 'string',
        description: 'Browser autofill hint, e.g. "given-name", "email", "tel". Leave blank if none applies.',
      }),
    ],
    preview: { select: { title: 'label', subtitle: 'id' } },
  });

export const orderFlow = defineType({
  name: 'orderFlow',
  title: 'Order Flow',
  type: 'document',
  fields: [
    defineField({
      name: 'pickupOrDelivery',
      title: 'Pickup or Delivery Choice',
      type: 'object',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({
          name: 'pageTitle',
          title: 'Browser Tab Title',
          type: 'string',
          description: 'e.g. "Order" — combined with the site name for the <title> tag.',
          validation: (R) => R.required(),
        }),
        defineField({ name: 'pickupHref', title: 'Pick-Up URL', type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'pickupLabel', title: 'Pick-Up Button Label', type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'pickupAriaLabel', title: 'Pick-Up Accessible Name', type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'deliveryHref', title: 'Delivery URL', type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'deliveryLabel', title: 'Delivery Button Label', type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'deliveryAriaLabel', title: 'Delivery Accessible Name', type: 'string', validation: (R) => R.required() }),
        // Logo marks moved to siteSettings.decorativeMarkLarge/SmallSrc —
        // they're reused across Loading, CategoryHeader, and 4 order pages,
        // not specific to this one screen.
      ],
    }),

    defineField({ name: 'changeLabel', title: 'Change Link Label', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'changeHref', title: 'Change Link URL', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'nextLabel', title: 'Next Button Label', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'contactHeading', title: 'Contact Section Heading', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'contactFields',
      title: 'Contact Fields',
      type: 'array',
      description: 'Shared by both the pick-up and delivery contact screens — identical today.',
      of: [contactFieldSchema()],
      validation: (R) => R.required().min(1),
    }),
    defineField({ name: 'schedulingNote', title: 'Scheduling Note', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'leadTimeNote', title: 'Lead Time Note', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'dateSelectionNextHref',
      title: 'Date Selection "Next" URL',
      type: 'string',
      description: 'Shared by both the pick-up-date and delivery-date screens — identical today ("/products").',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'dateSelectionLeadDays',
      title: 'Date Selection Lead Days',
      type: 'number',
      description: 'Minimum number of days from today before the earliest selectable date.',
      validation: (R) => R.required().integer().positive(),
    }),
    defineField({
      name: 'dateSelectionCount',
      title: 'Date Selection Option Count',
      type: 'number',
      description: 'Number of date pill options shown (plus one "Other Date" cell).',
      validation: (R) => R.required().integer().positive(),
    }),
    defineField({
      name: 'otherDateLabel',
      title: 'Other Date Pill Label',
      type: 'string',
      description: 'Screen-reader label for the "Other Date" pill on both the pick-up-date and delivery-date screens.',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'otherDateInputAriaLabel',
      title: 'Other Date Input Accessible Name',
      type: 'string',
      description: 'aria-label on the date `<input>` revealed by the "Other Date" pill.',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'otherDateRequiredMessage',
      title: 'Other Date Required Validation Message',
      type: 'string',
      description: 'Native browser validation message shown when the "Other Date" pill is selected but left blank.',
      validation: (R) => R.required(),
    }),

    defineField({
      name: 'pickup',
      title: 'Pick-Up Path',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'heading',
          title: 'Page Heading',
          type: 'string',
          description: 'Shown on both the contact-info screen and the date screen for this path.',
          validation: (R) => R.required(),
        }),
        defineField({
          name: 'contactInfo',
          title: 'Contact Info Screen',
          type: 'object',
          fields: [
            defineField({ name: 'accessibleHeading', title: 'Accessible Heading (sr-only)', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'dateFieldLabel', title: 'Date Field Label', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'timeFieldLabel', title: 'Time Field Label', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'nextHref', title: 'Next URL', type: 'string', validation: (R) => R.required() }),
          ],
        }),
        defineField({
          name: 'dateSelection',
          title: 'Date Selection Screen',
          type: 'object',
          fields: [
            defineField({ name: 'accessibleHeading', title: 'Accessible Heading (sr-only)', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'dateSectionHeading', title: 'Date Section Heading', type: 'string', validation: (R) => R.required() }),
          ],
        }),
      ],
    }),

    defineField({
      name: 'delivery',
      title: 'Delivery Path',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'heading', title: 'Page Heading', type: 'string', validation: (R) => R.required() }),
        defineField({
          name: 'contactInfo',
          title: 'Contact Info Screen',
          type: 'object',
          fields: [
            defineField({ name: 'accessibleHeading', title: 'Accessible Heading (sr-only)', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'addressHeading', title: 'Address Section Heading', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'dateFieldLabel', title: 'Date Field Label', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'timeFieldLabel', title: 'Time Field Label', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'deliveryNote', title: 'Delivery Area Note', type: 'string', validation: (R) => R.required() }),
            defineField({
              name: 'addressFields',
              title: 'Address Fields',
              type: 'array',
              of: [contactFieldSchema()],
              validation: (R) => R.required().min(1),
            }),
            defineField({ name: 'nextHref', title: 'Next URL', type: 'string', validation: (R) => R.required() }),
          ],
        }),
        defineField({
          name: 'dateSelection',
          title: 'Date Selection Screen',
          type: 'object',
          fields: [
            defineField({ name: 'accessibleHeading', title: 'Accessible Heading (sr-only)', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'dateSectionHeading', title: 'Date Section Heading', type: 'string', validation: (R) => R.required() }),
          ],
        }),
      ],
    }),

    defineField({
      name: 'fulfillmentConfig',
      title: 'Fulfillment Config',
      type: 'object',
      description: 'Lead time, business hours, and slot interval for the full scheduling system in src/lib/fulfillment.ts. Currently unused by any live page — see dateSelectionLeadDays/dateSelectionCount above for what actually drives /order/*/date today.',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'leadHours',
          title: 'Lead Hours',
          type: 'number',
          description: 'Minimum hours from now before the earliest fulfillment slot.',
          validation: (R) => R.required().integer().positive(),
        }),
        defineField({
          name: 'slotIntervalMinutes',
          title: 'Slot Interval (minutes)',
          type: 'number',
          validation: (R) => R.required().integer().positive(),
        }),
        defineField({
          name: 'businessHours',
          title: 'Business Hours',
          type: 'array',
          description: 'One entry per open day. A day with no entry is treated as closed.',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'businessDay',
              fields: [
                defineField({
                  name: 'day',
                  title: 'Day',
                  type: 'string',
                  options: { list: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
                  validation: (R) => R.required(),
                }),
                defineField({ name: 'open', title: 'Open Time (HH:MM)', type: 'string', validation: (R) => R.required() }),
                defineField({ name: 'close', title: 'Close Time (HH:MM)', type: 'string', validation: (R) => R.required() }),
              ],
              preview: { select: { title: 'day', subtitle: 'open' } },
            }),
          ],
          validation: (R) => R.required().min(1),
        }),
      ],
    }),

    defineField({
      name: 'loading',
      title: 'Loading Screen',
      type: 'object',
      description: 'WIP screen, not currently linked from production navigation — still made editable per instruction.',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'loadingLabel', title: 'Loading Label', type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'continueLabel', title: 'No-JS Continue Link Label', type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'redirectHref', title: 'Redirect URL', type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'redirectAfterMs', title: 'Redirect Delay (ms)', type: 'number', validation: (R) => R.required().positive() }),
      ],
    }),

    defineField({
      name: 'cart',
      title: 'Cart',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'heading', title: 'Page Heading', type: 'string', validation: (R) => R.required() }),
        defineField({
          name: 'tableHeadings',
          title: 'Table Column Headings',
          type: 'object',
          fields: [
            defineField({ name: 'productHeading', title: 'Product Column', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'flavorHeading', title: 'Flavor Column', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'occasionHeading', title: 'Occasion Column', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'priceHeading', title: 'Price Column', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'qtyHeading', title: 'Quantity Column', type: 'string', validation: (R) => R.required() }),
            defineField({
              name: 'quantityOptionLabel',
              title: 'Quantity Option Label',
              type: 'string',
              description: 'Label for a product\'s own selectable "Quantity" custom option (e.g. Half Dozen/Dozen) when editing a cart line — distinct from the Qty column above, which is the cart line\'s numeric count.',
              validation: (R) => R.required(),
            }),
          ],
        }),
        defineField({
          name: 'actions',
          title: 'Line Item Actions',
          type: 'object',
          fields: [
            defineField({ name: 'editLabel', title: 'Edit', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'saveLabel', title: 'Save', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'cancelLabel', title: 'Cancel', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'removeLabel', title: 'Remove', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'removingLabel', title: 'Removing (in progress)', type: 'string', validation: (R) => R.required() }),
          ],
        }),
        defineField({ name: 'subtotalLabel', title: 'Subtotal Label', type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'checkoutLabel', title: 'Checkout Button Label', type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'emptyMessage', title: 'Empty Cart Message', type: 'string', validation: (R) => R.required() }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Order Flow' }) },
});
