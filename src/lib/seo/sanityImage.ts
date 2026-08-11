import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import type { SanityImage } from '../../types/product';
import { urlFor } from '../sanity/image';

type ImageLike = SanityImage & {
  asset?: {
    _ref?: string;
    _type?: string;
    url?: string;
  };
};

export function toAbsoluteUrl(pathOrUrl: string, site: URL): string {
  return new URL(pathOrUrl, site).toString();
}

export function canonicalUrl(pathnameOrUrl: string, site: URL, override?: string): string {
  return toAbsoluteUrl(override || pathnameOrUrl, site);
}

export function sanityImageUrl(
  image: ImageLike | undefined,
  options?: { width?: number; height?: number },
): string | undefined {
  if (!image?.asset) return undefined;
  if (image.asset.url) return image.asset.url;
  if (!image.asset._ref) return undefined;

  let builder = urlFor(image as SanityImageSource);
  if (options?.width) builder = builder.width(options.width);
  if (options?.height) builder = builder.height(options.height);
  return builder.url();
}

export function imageUrlOrAbsolute(
  imageOrUrl: ImageLike | string | undefined,
  site: URL,
  options?: { width?: number; height?: number },
): string | undefined {
  if (!imageOrUrl) return undefined;
  if (typeof imageOrUrl === 'string') return toAbsoluteUrl(imageOrUrl, site);
  return sanityImageUrl(imageOrUrl, options);
}

