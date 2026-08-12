import { defineField, defineType } from 'sanity';

export const productStructuredData = defineType({
  name: 'productStructuredData',
  title: 'Product Structured Data',
  type: 'object',
  fields: [
    defineField({
      name: 'sku',
      title: 'SKU',
      type: 'string',
      description: 'Optional merchant SKU for this product or variant. Leave blank if there is no real SKU.',
    }),
    defineField({
      name: 'mpn',
      title: 'MPN',
      type: 'string',
      description: 'Optional manufacturer part number. Usually blank for house-made bakery products.',
    }),
    defineField({
      name: 'gtin',
      title: 'GTIN',
      type: 'string',
      description: 'Optional UPC/EAN/GTIN identifier. Leave blank unless the product has a real registered code.',
    }),
    defineField({
      name: 'availability',
      title: 'Availability',
      type: 'string',
      description: 'Optional schema.org Offer availability. Leave blank unless inventory status is intentionally published.',
      options: {
        layout: 'dropdown',
        list: [
          { title: 'In stock', value: 'https://schema.org/InStock' },
          { title: 'Limited availability', value: 'https://schema.org/LimitedAvailability' },
          { title: 'Out of stock', value: 'https://schema.org/OutOfStock' },
          { title: 'Pre-order', value: 'https://schema.org/PreOrder' },
          { title: 'Sold out', value: 'https://schema.org/SoldOut' },
        ],
      },
    }),
    defineField({
      name: 'itemCondition',
      title: 'Item Condition',
      type: 'string',
      description: 'Optional schema.org item condition for the Offer. Usually NewCondition for food products, but leave blank unless confirmed.',
      options: {
        layout: 'dropdown',
        list: [
          { title: 'New', value: 'https://schema.org/NewCondition' },
          { title: 'Used', value: 'https://schema.org/UsedCondition' },
          { title: 'Refurbished', value: 'https://schema.org/RefurbishedCondition' },
          { title: 'Damaged', value: 'https://schema.org/DamagedCondition' },
        ],
      },
    }),
    defineField({
      name: 'priceValidUntil',
      title: 'Price Valid Until',
      type: 'date',
      description: 'Optional Offer price validity date. Leave blank unless pricing has a real published expiration date.',
    }),
  ],
});
