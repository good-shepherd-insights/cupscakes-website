import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import { urlFor } from '../image';
import { sanityClient } from '../client';
import { deepStegaClean } from '../stega';

type SanityImage = SanityImageSource & {
  alt?: string;
  asset?: { _ref?: string; url?: string };
};

type SanitySocialLink = {
  platform?: string;
  href?: string;
  icon?: SanityImage;
};

type SanityHomePage = {
  hero?: {
    headline?: string;
    ctaLabel?: string;
    orderHref?: string;
    backgroundImage?: SanityImage;
    logo?: SanityImage;
    scrollIndicator?: SanityImage;
  };
  ourStory?: {
    heading?: string;
    paragraphs?: string[];
    photo?: SanityImage;
    logo?: SanityImage;
    photoMask?: {
      primary?: SanityImage;
      secondary?: SanityImage;
    };
  };
  cupcakesBanner?: {
    headline?: string;
    ampImageLarge?: SanityImage;
    ampImageSmall?: SanityImage;
  };
  cupcakeCarousel?: {
    caption?: string;
    otherOptionsLabel?: string;
    otherOptionsHref?: string;
    cupcakeMask?: SanityImage;
  };
  personalCakes?: {
    heading?: string;
    caption?: string;
    flavorHeadline?: string;
    photo?: SanityImage;
    logo?: SanityImage;
    ampImage?: SanityImage;
    flavorLinks?: { label?: string; href?: string }[];
  };
  followUs?: {
    heading?: string;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaImage?: SanityImage;
  };
};

type SanityNavigation = {
  homeHref?: string;
  whoHref?: string;
  orderHref?: string;
  productsHref?: string;
  cartHref?: string;
  shopHref?: string;
  cupsIcon?: SanityImage;
  cartIcon?: SanityImage;
  mobileMenuLogo?: SanityImage;
};

type SanityFooter = {
  whoHref?: string;
  orderHref?: string;
  topHref?: string;
  copyright?: string;
};

type SanitySiteSettings = {
  siteName?: string;
  defaultSeo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaImage?: SanityImage;
  };
  favicon?: SanityImage;
  socialLinks?: SanitySocialLink[];
};

export type SocialLink = {
  platform: string;
  href: string;
  iconUrl: string;
  iconAlt?: string;
};

const LOCAL_ASSETS = {
  cupsIcon: '/assets/cups-icon.svg',
  cartIcon: '/assets/cart-icon.svg',
  facebookIcon: '/assets/facebook.svg',
  instagramIcon: '/assets/instagram.svg',
  heroCupcakes: '/assets/hero-cupcakes.jpg',
  heroScroll: '/assets/hero-scroll.svg',
  heroLogo: '/assets/hero-logo.svg',
  storyPhoto: '/assets/story-photo.jpg',
  storyMaskPrimary: '/assets/story-mask-1.svg',
  storyMaskSecondary: '/assets/story-mask-2.svg',
  storyLogo: '/assets/story-logo.svg',
  cupcakeMask: '/assets/cupcake-mask.svg',
  personalCake: '/assets/personal-cake.png',
  personalCakesLogo: '/assets/personal-cakes-logo.svg',
  personalCakesAmp: '/assets/personal-cakes-amp.svg',
  bannerAmpBig: '/assets/banner-amp-big.svg',
  bannerAmpSmall: '/assets/banner-amp-small.svg',
  orderLogoSmall: '/assets/order-logo-small.svg',
} as const;

function imageUrl(image: SanityImage | undefined, fallback: string): string {
  if (!image?.asset) return fallback;
  return urlFor(image).url();
}

function optionalImageUrl(image: SanityImage | undefined): string | undefined {
  if (!image?.asset) return undefined;
  return urlFor(image).url();
}

function cssUrl(url: string): string {
  return `url("${url.replace(/["\\]/g, '\\$&')}")`;
}

function nonEmpty<T>(items: (T | undefined)[]): T[] {
  return items.filter((item): item is T => Boolean(item));
}

function socialIconFallback(platform: string): string {
  const key = platform.trim().toLowerCase();
  if (key === 'facebook') return LOCAL_ASSETS.facebookIcon;
  if (key === 'instagram') return LOCAL_ASSETS.instagramIcon;
  return LOCAL_ASSETS.cupsIcon;
}

const HOME_PAGE_QUERY = `*[_type == "homePage"][0]`;
const NAVIGATION_QUERY = `*[_type == "navigation"][0]`;
const FOOTER_QUERY = `*[_type == "footer"][0]`;
const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]`;

export async function loadHomePageContent() {
  const [homePage, navigation, footer, siteSettings] = await Promise.all([
    sanityClient.fetch<SanityHomePage | null>(HOME_PAGE_QUERY),
    sanityClient.fetch<SanityNavigation | null>(NAVIGATION_QUERY),
    sanityClient.fetch<SanityFooter | null>(FOOTER_QUERY),
    sanityClient.fetch<SanitySiteSettings | null>(SITE_SETTINGS_QUERY),
  ]);

  const resolvedSocialLinks = nonEmpty<SocialLink>(
    siteSettings?.socialLinks?.map((link) => {
      if (!link?.platform || !link.href) return undefined;
      return {
        platform: link.platform,
        href: link.href,
        iconUrl: imageUrl(link.icon, socialIconFallback(link.platform)),
        iconAlt: link.icon?.alt,
      };
    }) ?? [],
  );

  const resolvedFlavorLinks = nonEmpty(
    homePage?.personalCakes?.flavorLinks?.map((link) =>
      link?.label && link.href ? { label: link.label, href: link.href } : undefined,
    ) ?? [],
  );

  const metaTitle =
    homePage?.seo?.metaTitle ??
    siteSettings?.defaultSeo?.metaTitle ??
    siteSettings?.siteName ??
    'Cups & Cakes';
  const metaDescription =
    homePage?.seo?.metaDescription ?? siteSettings?.defaultSeo?.metaDescription;
  const metaImage =
    optionalImageUrl(homePage?.seo?.metaImage) ?? optionalImageUrl(siteSettings?.defaultSeo?.metaImage);

  return deepStegaClean({
    siteName: siteSettings?.siteName ?? 'Cups & Cakes',
    faviconUrl: optionalImageUrl(siteSettings?.favicon) ?? LOCAL_ASSETS.cupsIcon,
    seo: {
      metaTitle,
      metaDescription,
      metaImage,
    },
    cssImageVars: {
      '--background-image-cups-icon': cssUrl(imageUrl(navigation?.cupsIcon, LOCAL_ASSETS.cupsIcon)),
      '--background-image-cart-icon': cssUrl(imageUrl(navigation?.cartIcon, LOCAL_ASSETS.cartIcon)),
      '--background-image-facebook-icon': cssUrl(resolvedSocialLinks[0]?.iconUrl ?? LOCAL_ASSETS.facebookIcon),
      '--background-image-instagram-icon': cssUrl(resolvedSocialLinks[1]?.iconUrl ?? LOCAL_ASSETS.instagramIcon),
      '--background-image-hero-cupcakes': cssUrl(imageUrl(homePage?.hero?.backgroundImage, LOCAL_ASSETS.heroCupcakes)),
      '--background-image-hero-scroll': cssUrl(imageUrl(homePage?.hero?.scrollIndicator, LOCAL_ASSETS.heroScroll)),
      '--background-image-hero-logo': cssUrl(imageUrl(homePage?.hero?.logo, LOCAL_ASSETS.heroLogo)),
      '--background-image-story-photo': cssUrl(imageUrl(homePage?.ourStory?.photo, LOCAL_ASSETS.storyPhoto)),
      '--background-image-story-mask-primary': cssUrl(imageUrl(homePage?.ourStory?.photoMask?.primary, LOCAL_ASSETS.storyMaskPrimary)),
      '--background-image-story-mask-secondary': cssUrl(imageUrl(homePage?.ourStory?.photoMask?.secondary, LOCAL_ASSETS.storyMaskSecondary)),
      '--background-image-story-logo': cssUrl(imageUrl(homePage?.ourStory?.logo, LOCAL_ASSETS.storyLogo)),
      '--background-image-cupcake-mask': cssUrl(imageUrl(homePage?.cupcakeCarousel?.cupcakeMask, LOCAL_ASSETS.cupcakeMask)),
      '--background-image-personal-cake': cssUrl(imageUrl(homePage?.personalCakes?.photo, LOCAL_ASSETS.personalCake)),
      '--background-image-personal-cakes-logo': cssUrl(imageUrl(homePage?.personalCakes?.logo, LOCAL_ASSETS.personalCakesLogo)),
      '--background-image-personal-cakes-amp': cssUrl(imageUrl(homePage?.personalCakes?.ampImage, LOCAL_ASSETS.personalCakesAmp)),
      '--background-image-banner-amp-big': cssUrl(imageUrl(homePage?.cupcakesBanner?.ampImageLarge, LOCAL_ASSETS.bannerAmpBig)),
      '--background-image-banner-amp-small': cssUrl(imageUrl(homePage?.cupcakesBanner?.ampImageSmall, LOCAL_ASSETS.bannerAmpSmall)),
    },
    navbar: {
      homeHref: navigation?.homeHref,
      whoHref: navigation?.whoHref,
      orderHref: navigation?.orderHref,
      productsHref: navigation?.productsHref,
      cartHref: navigation?.cartHref,
      shopHref: navigation?.shopHref,
      facebookHref: resolvedSocialLinks[0]?.href,
      instagramHref: resolvedSocialLinks[1]?.href,
      socialLinks: resolvedSocialLinks,
      mobileMenuLogoSrc: imageUrl(navigation?.mobileMenuLogo, LOCAL_ASSETS.orderLogoSmall),
    },
    hero: {
      headline: homePage?.hero?.headline,
      ctaLabel: homePage?.hero?.ctaLabel,
      orderHref: homePage?.hero?.orderHref,
    },
    ourStory: {
      heading: homePage?.ourStory?.heading,
      paragraphs: homePage?.ourStory?.paragraphs ?? [],
      photoSrc: imageUrl(homePage?.ourStory?.photo, LOCAL_ASSETS.storyPhoto),
      logoSrc: imageUrl(homePage?.ourStory?.logo, LOCAL_ASSETS.storyLogo),
    },
    cupcakesBanner: {
      headline: homePage?.cupcakesBanner?.headline,
    },
    cupcakeCarousel: {
      caption: homePage?.cupcakeCarousel?.caption,
      otherOptionsHref: homePage?.cupcakeCarousel?.otherOptionsHref,
      otherOptionsLabel: homePage?.cupcakeCarousel?.otherOptionsLabel,
    },
    personalCakes: {
      heading: homePage?.personalCakes?.heading,
      caption: homePage?.personalCakes?.caption,
      flavorHeadline: homePage?.personalCakes?.flavorHeadline,
      chocolateHref: resolvedFlavorLinks[0]?.href,
      chocolateLabel: resolvedFlavorLinks[0]?.label,
      vanillaHref: resolvedFlavorLinks[1]?.href,
      vanillaLabel: resolvedFlavorLinks[1]?.label,
      flavorLinks: resolvedFlavorLinks,
      ampImageSrc: imageUrl(homePage?.personalCakes?.ampImage, LOCAL_ASSETS.personalCakesAmp),
      logoSrc: imageUrl(homePage?.personalCakes?.logo, LOCAL_ASSETS.personalCakesLogo),
      photoSrc: imageUrl(homePage?.personalCakes?.photo, LOCAL_ASSETS.personalCake),
    },
    followUs: {
      heading: homePage?.followUs?.heading,
      facebookHref: resolvedSocialLinks[0]?.href,
      instagramHref: resolvedSocialLinks[1]?.href,
      socialLinks: resolvedSocialLinks,
    },
    footer: {
      whoHref: footer?.whoHref,
      orderHref: footer?.orderHref,
      topHref: footer?.topHref,
      copyright: footer?.copyright,
      facebookHref: resolvedSocialLinks[0]?.href,
      instagramHref: resolvedSocialLinks[1]?.href,
      socialLinks: resolvedSocialLinks,
    },
  });
}
