// Per-tab persistent draft for the multi-step order flow — the single source
// of truth for everything entered across /order/*. Captured incrementally (see
// bindOrderCapture) and pushed to an external sink (see draftSink), never via a
// form POST. sessionStorage: survives step nav/reload, cleared on tab close.
export type OrderDraft = Record<string, string>;

const KEY = 'cupscakes.orderDraft';

export function getDraft(): OrderDraft {
  if (typeof sessionStorage === 'undefined') return {};
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as OrderDraft;
  } catch {
    return {};
  }
}

export function updateDraft(patch: OrderDraft): OrderDraft {
  const next = { ...getDraft(), ...patch };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* best-effort: never throw on a capture */
  }
  return next;
}

export function clearDraft(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

/** pickup/delivery derived from an /order/* path, so the branch chosen by a
 *  link on /order is recorded in the draft too. */
export function fulfillmentFromPath(pathname: string): 'pickup' | 'delivery' | undefined {
  if (pathname.includes('/pickup')) return 'pickup';
  if (pathname.includes('/delivery')) return 'delivery';
  return undefined;
}

/** Records which product/variant a customer started the order flow from
 *  (e.g. clicking "Order Now" on a specific flavor card), so the end of the
 *  flow can redirect back to that product page instead of the generic
 *  fallback destination. */
export function recordProductSelection(productSlug: string, variantSlug?: string): void {
  updateDraft(variantSlug ? { productSlug, variantSlug } : { productSlug });
}

/** Reads back a product/variant recorded by `recordProductSelection`, if any. */
export function getProductSelection(): { productSlug: string; variantSlug?: string } | undefined {
  const draft = getDraft();
  if (!draft.productSlug) return undefined;
  return { productSlug: draft.productSlug, variantSlug: draft.variantSlug };
}
