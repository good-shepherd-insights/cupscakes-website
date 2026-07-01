import { getDraft } from '../order/draftStore';

// Maps the order draft (captured during /order/* flow) into the Snipcart cart,
// pre-populating the customer's email and billing address in Snipcart's own
// checkout form so they don't have to type it again.
//
// Billing address: Snipcart requires all fields at once — no partial update.
// Only sent when name + address1 + city + postalCode are all present (delivery
// orders). Pickup orders get at least the email synced.
export function syncDraftToCart(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const api = (window as any).Snipcart?.api?.cart;
  if (!api?.update) return;

  const draft = getDraft();
  const payload: Record<string, unknown> = {};

  if (draft.email) payload.email = draft.email;

  const name = [draft.firstName, draft.lastName].filter(Boolean).join(' ');
  if (name && draft.street && draft.city && draft.zipcode) {
    payload.billingAddress = {
      name,
      address1: draft.street,
      city: draft.city,
      country: 'US',
      postalCode: draft.zipcode,
      ...(draft.apt ? { address2: draft.apt } : {}),
      ...(draft.phone ? { phone: draft.phone } : {}),
    };
  }

  if (Object.keys(payload).length === 0) return;

  void api.update(payload).catch(() => {/* best-effort */});
}
