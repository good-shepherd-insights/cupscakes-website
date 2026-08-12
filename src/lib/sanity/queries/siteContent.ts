import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import type { SanityBusinessIdentity, SanitySeo } from '../../../types/seo';
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

type SanityPromoStripBlock = {
  _type: 'block';
  _key: string;
  style?: string;
  children: {
    _type: 'span';
    _key: string;
    text: string;
    marks?: string[];
  }[];
};

type SanityHomePage = {
  flavorBandAccessibleLabel?: string;
  promoStrip?: {
    richText?: SanityPromoStripBlock[];
    text?: string;
    accessibleLabel?: string;
  };
  hero?: {
    headline?: string;
    headlinePrefix?: string;
    headlineEmphasis?: string;
    headlineSuffix?: string;
    ctaLabel?: string;
    ctaAriaLabel?: string;
    orderHref?: string;
    backgroundImage?: SanityImage;
    logo?: SanityImage;
    puertoRicoIcon?: SanityImage;
    puertoRicoIconAccessibleLabel?: string;
    scrollIndicator?: SanityImage;
    scrollAriaLabel?: string;
  };
  intro?: {
    heading?: string;
    subheading?: string;
  };
  testimonial?: {
    accessibleHeading?: string;
    quote?: string;
    attribution?: string;
    avatar?: SanityImage;
    reviews?: {
      quote?: string;
      attribution?: string;
      avatar?: SanityImage;
    }[];
  };
  reviewCta?: {
    heading?: string;
    ctaLabel?: string;
    ctaHref?: string;
    ctaAriaLabel?: string;
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
  seo?: SanitySeo;
};

type SanityNavigation = {
  homeHref?: string;
  whoHref?: string;
  orderHref?: string;
  productsHref?: string;
  cartHref?: string;
  shopHref?: string;
  homeLabel?: string;
  productsLabel?: string;
  shopLabel?: string;
  logoTextBefore?: string;
  logoTextAfter?: string;
  openMenuLabel?: string;
  closeMenuLabel?: string;
  cupsIcon?: SanityImage;
  cartIcon?: SanityImage;
  mobileMenuLogo?: SanityImage;
};

type SanityFooter = {
  whoHref?: string;
  orderHref?: string;
  topHref?: string;
  topLabel?: string;
  copyright?: string;
};

type SanitySiteSettings = {
  siteName?: string;
  defaultSeo?: SanitySeo;
  productsSeo?: SanitySeo;
  businessIdentity?: SanityBusinessIdentity;
  favicon?: SanityImage;
  decorativeMarkLargeSrc?: string;
  decorativeMarkLargeAlt?: string;
  decorativeMarkSmallSrc?: string;
  decorativeMarkSmallAlt?: string;
  categoryHeaderAmpSrc?: string;
  categoryHeaderAmpAlt?: string;
  categoryHeaderAccessibleHeading?: string;
  addToCartLabel?: string;
  addingToCartMessage?: string;
  addedToCartMessage?: string;
  cartAccessibleLabel?: string;
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
  const resolvedReviews = nonEmpty(
    homePage?.testimonial?.reviews?.map((review) =>
      review?.quote && review.attribution
        ? {
            quote: review.quote,
            attribution: review.attribution,
            avatarSrc: optionalImageUrl(review.avatar),
          }
        : undefined,
    ) ?? [],
  );
  if (!resolvedReviews.length && homePage?.testimonial?.quote && homePage.testimonial.attribution) {
    resolvedReviews.push({
      quote: homePage.testimonial.quote,
      attribution: homePage.testimonial.attribution,
      avatarSrc: optionalImageUrl(homePage.testimonial.avatar),
    });
  }

  return deepStegaClean({
    siteName: siteSettings?.siteName ?? 'Cups & Cakes',
    businessIdentity: siteSettings?.businessIdentity,
    defaultSeo: siteSettings?.defaultSeo,
    productsSeo: siteSettings?.productsSeo,
    faviconUrl: optionalImageUrl(siteSettings?.favicon) ?? LOCAL_ASSETS.cupsIcon,
    addToCartLabel: siteSettings?.addToCartLabel,
    addingToCartMessage: siteSettings?.addingToCartMessage,
    addedToCartMessage: siteSettings?.addedToCartMessage,
    cartAccessibleLabel: siteSettings?.cartAccessibleLabel,
    seo: homePage?.seo,
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
      siteName: siteSettings?.siteName ?? 'Cups & Cakes',
      cartAccessibleLabel: siteSettings?.cartAccessibleLabel,
      homeHref: navigation?.homeHref,
      whoHref: navigation?.whoHref,
      orderHref: navigation?.orderHref,
      productsHref: navigation?.productsHref,
      cartHref: navigation?.cartHref,
      shopHref: navigation?.shopHref,
      whoLabel: homePage?.ourStory?.heading,
      orderLabel: homePage?.hero?.ctaLabel,
      homeLabel: navigation?.homeLabel,
      productsLabel: navigation?.productsLabel,
      shopLabel: navigation?.shopLabel,
      logoTextBefore: navigation?.logoTextBefore,
      logoTextAfter: navigation?.logoTextAfter,
      openMenuLabel: navigation?.openMenuLabel,
      closeMenuLabel: navigation?.closeMenuLabel,
      facebookHref: resolvedSocialLinks[0]?.href,
      instagramHref: resolvedSocialLinks[1]?.href,
      socialLinks: resolvedSocialLinks,
      mobileMenuLogoSrc: imageUrl(navigation?.mobileMenuLogo, LOCAL_ASSETS.orderLogoSmall),
    },
    decorativeMarks: {
      largeSrc: siteSettings?.decorativeMarkLargeSrc,
      largeAlt: siteSettings?.decorativeMarkLargeAlt,
      smallSrc: siteSettings?.decorativeMarkSmallSrc,
      smallAlt: siteSettings?.decorativeMarkSmallAlt,
      categoryHeaderAmpSrc: siteSettings?.categoryHeaderAmpSrc,
      categoryHeaderAmpAlt: siteSettings?.categoryHeaderAmpAlt,
      categoryHeaderAccessibleHeading: siteSettings?.categoryHeaderAccessibleHeading,
    },
    promoStrip: {
      richText: homePage?.promoStrip?.richText,
      text: homePage?.promoStrip?.text,
      accessibleLabel: homePage?.promoStrip?.accessibleLabel,
    },
    hero: {
      headline: homePage?.hero?.headline,
      headlinePrefix: homePage?.hero?.headlinePrefix,
      headlineEmphasis: homePage?.hero?.headlineEmphasis,
      headlineSuffix: homePage?.hero?.headlineSuffix,
      ctaLabel: homePage?.hero?.ctaLabel,
      ctaAriaLabel: homePage?.hero?.ctaAriaLabel,
      orderHref: homePage?.hero?.orderHref,
      puertoRicoIconSrc: optionalImageUrl(homePage?.hero?.puertoRicoIcon),
      puertoRicoIconAccessibleLabel: homePage?.hero?.puertoRicoIconAccessibleLabel,
      scrollAriaLabel: homePage?.hero?.scrollAriaLabel,
    },
    flavorBandAccessibleLabel: homePage?.flavorBandAccessibleLabel,
    intro: {
      heading: homePage?.intro?.heading,
      subheading: homePage?.intro?.subheading,
    },
    testimonial: {
      accessibleHeading: homePage?.testimonial?.accessibleHeading,
      reviews: resolvedReviews,
    },
    reviewCta: {
      heading: homePage?.reviewCta?.heading,
      ctaLabel: homePage?.reviewCta?.ctaLabel,
      ctaHref: homePage?.reviewCta?.ctaHref,
      ctaAriaLabel: homePage?.reviewCta?.ctaAriaLabel,
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
      whoLabel: homePage?.ourStory?.heading,
      orderLabel: homePage?.hero?.ctaLabel,
      topLabel: footer?.topLabel,
      copyright: footer?.copyright,
      facebookHref: resolvedSocialLinks[0]?.href,
      instagramHref: resolvedSocialLinks[1]?.href,
      socialLinks: resolvedSocialLinks,
    },
  });
}
