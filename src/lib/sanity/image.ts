import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import { sanityClient } from './client';
import type { CustomOption, Product } from '../../types/product';

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

/** Builds the required variant image URL for every canonical option slug. */
export function resolveRequiredVariantImageUrls(
  product: Product,
  width: number,
): ReadonlyMap<string, string> {
  if (!Number.isFinite(width) || width <= 0) {
    throw new Error('Variant image width must be a positive number.');
  }

  const variantGroup = product.customOptions?.find((group) => group.definesVariantRoute);
  if (!variantGroup) {
    throw new Error(`Product "${product.slug.current}" is missing a variant option group.`);
  }

  const images = new Map<string, string>();
  for (const option of variantGroup.options) {
    const slug = option.slug?.current;
    if (!slug) {
      throw new Error(`A variant on product "${product.slug.current}" is missing its slug.`);
    }
    if (images.has(slug)) {
      throw new Error(`Product "${product.slug.current}" has duplicate variant slug "${slug}".`);
    }
    if (!option.image?.asset?._ref) {
      throw new Error(`Variant "${slug}" on product "${product.slug.current}" is missing its image.`);
    }

    images.set(slug, urlFor(option.image as SanityImageSource).width(width).url());
  }

  return images;
}
