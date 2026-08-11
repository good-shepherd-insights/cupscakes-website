import { defineField } from 'sanity';

/**
 * Shared decorative-image field: these all render as CSS backgrounds/masks,
 * never an `<img alt>`, so there's no alt sub-field.
 */
export const imageField = (
  name: string,
  title: string,
  opts?: { required?: boolean; description?: string; fieldset?: string },
) =>
  defineField({
    name,
    title,
    type: 'image',
    description: opts?.description,
    fieldset: opts?.fieldset,
    options: { hotspot: true },
    validation: opts?.required ? (Rule) => Rule.required().assetRequired() : undefined,
  });
