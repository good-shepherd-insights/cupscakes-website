export const routes = {
  order: "/order",
  orderPickup: "/order/pickup",
  orderPickupDate: "/order/pickup/date",
  orderDelivery: "/order/delivery",
  orderDeliveryDate: "/order/delivery/date",
  orderLoading: "/order/loading",
  cart: "/cart",
  products: "/products",
  product: (slug: string) => `/products/${slug}`,
  productVariant: (slug: string, variantSlug: string) => `/products/${slug}/${variantSlug}`,
};
