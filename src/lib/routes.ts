export const routes = {
  order: "/order",
  orderPickup: "/order/pickup",
  orderDelivery: "/order/delivery",
  product: (slug: string) => `/products/${slug}`,
};
