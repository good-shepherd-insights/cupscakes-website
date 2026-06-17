import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import { sanityClient } from './client';
import type { CustomOption } from '../../types/product';

const builder = imageUrlBuilder(sanityClient);

export const urlFor = (source: SanityImageSource) => builder.image(source);

/** Resolves each option's raw `image` to a URL string, leaving everything else untouched. */
export function resolveCustomOptionImages(customOptions: CustomOption[], width: number): CustomOption[] {
  return customOptions.map((group) => ({
    ...group,
    options: group.options.map((option) => ({
      ...option,
      image: option.image ? urlFor(option.image as SanityImageSource).width(width).url() : undefined,
    })),
  }));
}
