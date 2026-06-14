export const routes = {
  order: "/order",
  orderPickup: "/order/pickup",
  orderPickupDate: "/order/pickup/date",
  orderDelivery: "/order/delivery",
  orderDeliveryDate: "/order/delivery/date",
  orderLoading: "/order/loading",
  cart: "/cart",
  product: (slug: string) => `/products/${slug}`,
};
