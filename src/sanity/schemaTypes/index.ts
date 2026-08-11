import { product } from './product';
import { productCategory } from './productCategory';
import { homePage } from './homePage';
import { navigation } from './navigation';
import { footer } from './footer';
import { siteSettings } from './siteSettings';
import { orderFlow } from './orderFlow';
import { seo } from './seo';
import { businessIdentity } from './businessIdentity';
import { productStructuredData } from './productStructuredData';

export const schemaTypes = [
  seo,
  businessIdentity,
  productStructuredData,
  product,
  productCategory,
  homePage,
  navigation,
  footer,
  siteSettings,
  orderFlow,
];
