import { getDraft } from '../order/draftStore';

interface CartApi {
  update(payload: Record<string, unknown>): Promise<void>;
}

interface OrderCustomField {
  name: string;
  value: string;
  type: 'textbox' | 'hidden';
}

function getPickupDate(draft: Record<string, string>): string | undefined {
  if (draft.fulfillment !== 'pickup') return undefined;
  return draft.date === 'other' ? draft.otherDate : draft.date;
}

export function syncDraftToCart(): void {
  try {
    const api = (window as unknown as { Snipcart?: { api?: { cart?: CartApi } } }).Snipcart?.api?.cart;
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

    const customFields: OrderCustomField[] = [];

    const pickupDate = getPickupDate(draft);
    if (pickupDate) {
      customFields.push({
        name: 'pickupDate',
        value: pickupDate,
        type: 'hidden',
      });
    }

    // Keep pickup date as an order custom field. Phone is intentionally not
    // included here: the checkout template uses Snipcart's native `phone`
    // billing field, which persists to billingAddress.phone.
    payload.customFields = customFields;

    if (Object.keys(payload).length === 0) return;

    if (import.meta.env.DEV) console.debug('[syncDraftToCart] sending:', payload);

    void api.update(payload).catch((err: unknown) => {
      if (import.meta.env.DEV) console.warn('[syncDraftToCart] failed:', err);
    });
  } catch (err: unknown) {
    if (import.meta.env.DEV) console.warn('[syncDraftToCart] unexpected error:', err);
  }
}
