import { useEffect, useMemo, useState } from 'react';
import { fetchProductOptionsBySlug, type ProductOptionsMeta } from '../../lib/sanity/publicProductOptions';

interface SnipcartCustomField {
  name: string;
  value: string;
}

interface SnipcartCartItem {
  id: string;
  uniqueId: string;
  name: string;
  price: number;
  // Snipcart's CartItem also exposes basePrice (unit price before custom
  // field modifiers) and unitPrice (after). Used to show the correct line
  // total now that option modifiers are applied by Snipcart, not baked in.
  basePrice?: number;
  unitPrice?: number;
  quantity: number;
  image?: string;
  url?: string;
  customFields?: SnipcartCustomField[];
  // Deliberately untyped here — could be the parsed object or the raw
  // JSON string Snipcart was sent, depending on this project's pinned
  // version. parseMetadata() below normalizes either shape.
  metadata?: unknown;
}

interface DisplayItem {
  id: string;
  uniqueId: string;
  rawName: string;
  rawUrl: string;
  rawImage: string;
  rawMetadata: Record<string, string>;
  rawQuantity: number;
  productSlug: string;
  customFields: SnipcartCustomField[];
  product: string;
  flavor: string;
  quantityValue: string;
  occasionValue: string;
  otherFields: SnipcartCustomField[];
  price: string;
  lineTotal: number;
  imageSrc: string;
  imageAlt: string;
  accent: 'blue' | 'pink';
}

type ItemMetadata = { product?: string; flavor?: string; category?: string };

// buildItemAttributes() sends metadata as a JSON *string*
// (data-item-metadata="{...}", see attributes.ts). Whether Snipcart's
// store then exposes item.metadata as an already-parsed object or
// leaves it as that raw string is unverified for this project's pinned
// version — and getting it wrong here is a *silent* failure (optional
// chaining on a string just returns undefined, so `product` quietly
// falls back to the combined name, `flavor` goes blank, and accent
// colors go uniformly wrong with no error to notice). Handling both
// shapes removes the risk instead of just documenting it.
function parseMetadata(raw: unknown): ItemMetadata {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as ItemMetadata;
    } catch {
      return {};
    }
  }
  return raw as ItemMetadata;
}

function toDisplayItem(item: SnipcartCartItem): DisplayItem {
  const metadata = parseMetadata(item.metadata);
  const customFields = item.customFields ?? [];
  const quantityField = customFields.find((f) => f.name === 'Quantity');
  const occasionField = customFields.find((f) => f.name === 'Occasion');
  // Empty-valued fields are display noise, not information — e.g. the
  // "Quantity Message" / "Occasion Message" / "Frosting Color Message"
  // textarea fields (cartItem.ts) are sent on every add but usually blank,
  // and were rendering as empty columns. A field reappears the moment it
  // actually carries a value.
  const otherFields = customFields.filter(
    (f) => f.name !== 'Quantity' && f.name !== 'Occasion' && f.value.trim() !== ''
  );
  // Snipcart now owns price math (option modifiers are declared natively, not
  // baked into data-item-price), so the unit price must come from Snipcart's
  // post-modifier figure. unitPrice includes custom field modifiers; fall back
  // through basePrice and the legacy `price` field for early store snapshots.
  // (Which field carries base+modifier at runtime is confirmed empirically —
  // see FIX(snipcart-native-price-modifiers).md, Docs Compliance Audit #2.)
  const unitPrice = item.unitPrice ?? item.basePrice ?? item.price;
  const lineTotal = unitPrice * item.quantity;
  return {
    id: item.id,
    uniqueId: item.uniqueId,
    rawName: item.name,
    rawUrl: item.url ?? '',
    rawImage: item.image ?? '',
    rawMetadata: metadata as Record<string, string>,
    rawQuantity: item.quantity,
    productSlug: metadata.category ?? '',
    customFields,
    product: metadata.product ?? item.name,
    flavor: metadata.flavor ?? '',
    quantityValue: quantityField?.value ?? '',
    occasionValue: occasionField?.value ?? '',
    otherFields,
    price: `$${lineTotal.toFixed(2)}`,
    lineTotal,
    imageSrc: item.image ?? '',
    imageAlt: item.name,
    accent: metadata.category === 'personal-cakes' ? 'blue' : 'pink',
  };
}

/** Recomputes an item's price from its base price plus every selected
 * option's priceModifier — same math as cartSync.ts's syncPrice(), driven
 * by the live Sanity option data instead of DOM inputs. */
function computeItemPrice(meta: ProductOptionsMeta, customFields: SnipcartCustomField[]): number {
  let total = meta.basePrice;
  for (const field of customFields) {
    const group = meta.groups.find((g) => g.name === field.name);
    if (!group) continue;
    const selectedLabels = field.value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    for (const label of selectedLabels) {
      const option = group.options.find((o) => o.label === label);
      if (option) total += option.priceModifier;
    }
  }
  return total;
}

interface Props {
  heading: string;
  productHeading: string;
  flavorHeading: string;
  occasionHeading: string;
  priceHeading: string;
  qtyHeading: string;
  editLabel: string;
  saveLabel: string;
  cancelLabel: string;
  removeLabel: string;
  subtotalLabel: string;
  checkoutLabel: string;
  emptyMessage: string;
}

export default function LiveCart({
  heading,
  productHeading,
  flavorHeading,
  occasionHeading,
  priceHeading,
  qtyHeading,
  editLabel,
  saveLabel,
  cancelLabel,
  removeLabel,
  subtotalLabel,
  checkoutLabel,
  emptyMessage,
}: Props) {
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [total, setTotal] = useState(0);
  const [ready, setReady] = useState(false);
  const [productOptions, setProductOptions] = useState<Record<string, ProductOptionsMeta>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (window as unknown as { LoadSnipcart?: () => void }).LoadSnipcart?.();

    function readState() {
      const snipcart = (window as unknown as { Snipcart?: any }).Snipcart;
      const cart = snipcart?.store?.getState?.()?.cart;
      if (!cart || cancelled) return;
      // Snipcart's store can emit an early snapshot (e.g. mid-hydration on
      // initial load, or mid-flight during saveEdit()'s remove()-then-add()
      // pair) where an item's uniqueId isn't assigned yet. Such an item
      // can't be used as a React key or as a target for further edits, so
      // it's filtered out rather than rendered; the next store emission
      // (always close behind) carries the real uniqueId.
      const seen = new Set<string>();
      const displayItems = (cart.items?.items ?? [])
        .map(toDisplayItem)
        .filter((item: DisplayItem) => {
          if (!item.uniqueId || seen.has(item.uniqueId)) return false;
          seen.add(item.uniqueId);
          return true;
        });
      setItems(displayItems);
      setTotal(displayItems.reduce((sum: number, item: DisplayItem) => sum + item.lineTotal, 0));
      setReady(true);
    }

    let unsubscribe: (() => void) | undefined;
    function trySubscribe() {
      if (cancelled) return;
      const snipcart = (window as unknown as { Snipcart?: any }).Snipcart;
      if (snipcart?.store?.subscribe) {
        readState();
        unsubscribe = snipcart.store.subscribe(readState);
      } else {
        setTimeout(trySubscribe, 200);
      }
    }
    trySubscribe();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  // Fetch Quantity/Occasion option + price-modifier data for every product
  // slug currently in the cart, once per slug — needed to recompute price
  // when an inline edit changes the selection.
  useEffect(() => {
    const missingSlugs = Array.from(new Set(items.map((item) => item.productSlug))).filter(
      (slug) => slug && !(slug in productOptions)
    );
    if (missingSlugs.length === 0) return;
    let cancelled = false;
    fetchProductOptionsBySlug(missingSlugs).then((fetched) => {
      if (cancelled) return;
      setProductOptions((prev) => ({ ...prev, ...fetched }));
    });
    return () => {
      cancelled = true;
    };
  }, [items, productOptions]);

  // Group items by product (e.g. "Cupcakes" vs "Personal Cakes") in the
  // order each group first appears in the cart, so each section stacks
  // its own items vertically with the other product type kept separate.
  const groups = useMemo(() => {
    const order: string[] = [];
    const bySection = new Map<string, DisplayItem[]>();
    for (const item of items) {
      if (!bySection.has(item.product)) {
        bySection.set(item.product, []);
        order.push(item.product);
      }
      bySection.get(item.product)!.push(item);
    }
    return order.map((name) => ({ name, items: bySection.get(name)! }));
  }, [items]);

  async function removeItem(uniqueId: string) {
    const snipcart = (window as unknown as { Snipcart?: any }).Snipcart;
    if (!snipcart?.api?.cart?.items) return;
    setRemoving((prev) => new Set(prev).add(uniqueId));
    try {
      await snipcart.api.cart.items.remove(uniqueId);
    } finally {
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(uniqueId);
        return next;
      });
    }
  }

  function startEdit(item: DisplayItem) {
    setEditingId(item.uniqueId);
    setDraftValues({ Quantity: item.quantityValue, Occasion: item.occasionValue });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftValues({});
  }

  async function saveEdit(item: DisplayItem) {
    const meta = productOptions[item.productSlug];
    if (!meta) return;

    const updatedFields = meta.groups.map((group) => {
      const existing = item.customFields.find((f) => f.name === group.name);
      const value =
        group.name in draftValues ? draftValues[group.name] : existing?.value ?? '';
      return {
        name: group.name,
        type: 'dropdown',
        options: group.options.map((o) => o.label).join('|'),
        value,
      };
    });
    const newPrice = computeItemPrice(meta, updatedFields);

    const snipcart = (window as unknown as { Snipcart?: any }).Snipcart;
    if (!snipcart?.api?.cart?.items) return;
    await snipcart.api.cart.items.remove(item.uniqueId);
    await snipcart.api.cart.items.add({
      id: item.id,
      name: item.rawName,
      price: newPrice,
      url: item.rawUrl,
      image: item.rawImage,
      quantity: item.rawQuantity,
      customFields: updatedFields,
      metadata: item.rawMetadata,
    });

    setEditingId(null);
    setDraftValues({});
  }

  const accentBlue = 'bg-brand-blue';
  const accentPink = 'bg-brand-pink';
  const labelClass =
    'block font-medium text-black leading-[normal] ' +
    'text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl';
  const valueClass =
    'block font-normal text-black leading-[normal] ' +
    'text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl';
  const selectClass =
    'block font-normal text-black leading-[normal] border border-brand-border bg-white ' +
    'text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl';
  const actionBtnClass =
    'inline-flex items-center justify-center text-center ' +
    'font-medium text-brand-blue no-underline ' +
    'bg-white border border-brand-border ' +
    'h-10 sm:h-11 md:h-12 lg:h-12 xl:h-14 ' +
    'w-32 sm:w-36 md:w-40 lg:w-44 xl:w-52 ' +
    'text-sm sm:text-base md:text-base lg:text-lg xl:text-xl ' +
    'transition-[transform,filter] duration-150 ease-out ' +
    'hover:brightness-95 hover:-translate-y-px ' +
    'focus-visible:brightness-95 focus-visible:-translate-y-px focus-visible:outline-hidden ' +
    'cursor-pointer';

  if (!ready) return null;

  return (
    <section className="relative w-full bg-white" data-name="Shopping Cart">
      <div
        className="mx-auto w-full max-w-screen-2xl
               px-5 sm:px-8 md:px-12 lg:px-16 xl:px-[85px]
               pt-8 sm:pt-12 md:pt-16 lg:pt-20 xl:pt-24
               pb-12 sm:pb-16 md:pb-20 lg:pb-24 xl:pb-28"
      >
        <h1
          className="m-0 font-medium text-black leading-[normal]
               text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl
               mb-8 sm:mb-10 md:mb-12 lg:mb-14 xl:mb-16"
        >
          {heading}
        </h1>

        {items.length === 0 ? (
          <p
            className="m-0 font-medium text-black leading-[normal]
               text-xl sm:text-2xl md:text-3xl"
          >
            {emptyMessage}
          </p>
        ) : (
          <>
            {groups.map((group, groupIndex) => (
              <section
                key={group.name}
                className={groupIndex > 0 ? 'mt-12 sm:mt-14 md:mt-16 lg:mt-20 xl:mt-24' : ''}
                data-name={`Cart section: ${group.name}`}
              >
                <h2
                  className="m-0 font-medium text-black leading-[normal]
                     text-xl sm:text-2xl md:text-3xl lg:text-4xl
                     mb-4 sm:mb-5 md:mb-6"
                >
                  {group.name}
                </h2>

                <ul className="list-none m-0 p-0 flex flex-col">
                  {group.items.map((item, i) => {
                    const isEditing = editingId === item.uniqueId;
                    const meta = productOptions[item.productSlug];
                    const quantityGroup = meta?.groups.find((g) => g.name === 'Quantity');
                    const occasionGroup = meta?.groups.find((g) => g.name === 'Occasion');

                    return (
                      <li
                        key={item.uniqueId}
                        className={`block ${i > 0 ? 'mt-8 sm:mt-10 md:mt-12 lg:mt-14 xl:mt-16' : ''}`}
                        data-name={`Cart row ${i + 1}`}
                      >
                        <div
                          className="relative grid items-center gap-x-4 sm:gap-x-5 md:gap-x-6 lg:gap-x-8
                         grid-cols-[auto_auto_minmax(0,1fr)]
                         border-t border-b border-black py-4 sm:py-5 md:py-6 lg:py-7 xl:py-8"
                        >
                          <span
                            className={`block self-stretch w-2 sm:w-2.5 md:w-3 lg:w-3.5 xl:w-4
                            border border-brand-border
                            ${item.accent === 'blue' ? accentBlue : accentPink}`}
                            aria-hidden="true"
                          ></span>

                          <img
                            src={item.imageSrc}
                            alt={item.imageAlt}
                            className="block object-contain
                           h-14 sm:h-16 md:h-20 lg:h-24 xl:h-28
                           w-auto"
                            loading="lazy"
                            decoding="async"
                          />

                          <div className="flex flex-col gap-3 sm:gap-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-2 md:gap-y-3">
                              <div>
                                <span className={labelClass}>{productHeading}</span>
                                <span className={valueClass}>{item.product}</span>
                              </div>
                              <div>
                                <span className={labelClass}>{flavorHeading}</span>
                                <span className={valueClass}>{item.flavor}</span>
                              </div>

                              {item.otherFields.map((field) => (
                                <div key={field.name}>
                                  <span className={labelClass}>{field.name}</span>
                                  <span className={valueClass}>{field.value}</span>
                                </div>
                              ))}

                              {item.quantityValue && (
                                <div>
                                  <span className={labelClass}>Quantity</span>
                                  {isEditing && quantityGroup ? (
                                    <select
                                      className={selectClass}
                                      value={draftValues.Quantity ?? item.quantityValue}
                                      onChange={(e) =>
                                        setDraftValues((prev) => ({ ...prev, Quantity: e.target.value }))
                                      }
                                    >
                                      {quantityGroup.options.map((o) => (
                                        <option key={o.label} value={o.label}>
                                          {o.label}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span className={valueClass}>{item.quantityValue}</span>
                                  )}
                                </div>
                              )}

                              <div>
                                <span className={labelClass}>{occasionHeading}</span>
                                {isEditing && occasionGroup ? (
                                  <select
                                    className={selectClass}
                                    value={draftValues.Occasion ?? item.occasionValue}
                                    onChange={(e) =>
                                      setDraftValues((prev) => ({ ...prev, Occasion: e.target.value }))
                                    }
                                  >
                                    {occasionGroup.options.map((o) => (
                                      <option key={o.label} value={o.label}>
                                        {o.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className={valueClass}>{item.occasionValue}</span>
                                )}
                              </div>

                              <div>
                                <span className={labelClass}>{priceHeading}</span>
                                <span className={valueClass}>{item.price}</span>
                              </div>

                              {/* Snipcart line quantity (how many of this
                                  exact configuration, bumped by repeat
                                  adds) — distinct from the "Quantity"
                                  custom field above (e.g. "1 Dozen").
                                  item.price is already the line total
                                  (unitPrice × this figure). */}
                              <div>
                                <span className={labelClass}>{qtyHeading}</span>
                                <span className={valueClass}>{item.rawQuantity}</span>
                              </div>
                            </div>

                            <div className="flex gap-2 sm:gap-3">
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => saveEdit(item)}
                                    className={`${actionBtnClass} bg-brand-pink! text-white!`}
                                  >
                                    {saveLabel}
                                  </button>
                                  <button type="button" onClick={cancelEdit} className={actionBtnClass}>
                                    {cancelLabel}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => startEdit(item)}
                                    className={actionBtnClass}
                                  >
                                    {editLabel}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeItem(item.uniqueId)}
                                    disabled={removing.has(item.uniqueId)}
                                    className={actionBtnClass}
                                  >
                                    {removing.has(item.uniqueId) ? '...' : removeLabel}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}

            <div className="mt-8 sm:mt-10 md:mt-12 lg:mt-14 xl:mt-16 flex flex-col items-end gap-1 sm:gap-2 text-right">
              <p className="m-0 font-medium text-black leading-[normal] text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
                {subtotalLabel}
              </p>
              <p className="m-0 font-medium text-black leading-[normal] text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
                ${total.toFixed(2)}
              </p>
            </div>

            <div className="mt-8 sm:mt-10 md:mt-12 lg:mt-14 xl:mt-16 flex justify-center">
              <button
                type="button"
                className="snipcart-checkout inline-flex items-center justify-center text-center no-underline
               bg-brand-blue text-white font-medium
               border border-brand-border
               h-14 sm:h-16 md:h-20 lg:h-24 xl:h-28
               w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl
               text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl
               px-8
               transition-[transform,filter] duration-150 ease-out
               hover:brightness-95 hover:-translate-y-px
               focus-visible:brightness-95 focus-visible:-translate-y-px focus-visible:outline-hidden"
              >
                {checkoutLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
