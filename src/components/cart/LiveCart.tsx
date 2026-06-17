import { useEffect, useState } from 'react';

interface SnipcartCustomField {
  name: string;
  value: string;
}

interface SnipcartCartItem {
  id: string;
  name: string;
  price: number;
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
  product: string;
  flavor: string;
  variantLabel: string;
  variantValue: string;
  occasion: string;
  price: string;
  lineTotal: number;
  imageSrc: string;
  imageAlt: string;
  accent: 'blue' | 'pink';
  editHref: string;
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
  const [variantField, occasionField] = item.customFields ?? [];
  const lineTotal = item.price * item.quantity;
  return {
    id: item.id,
    product: metadata.product ?? item.name,
    flavor: metadata.flavor ?? '',
    variantLabel: variantField?.name ?? '',
    variantValue: variantField?.value ?? '',
    occasion: occasionField?.value ?? '',
    price: `$${lineTotal.toFixed(2)}`,
    lineTotal,
    imageSrc: item.image ?? '',
    imageAlt: item.name,
    accent: metadata.category === 'personal-cakes' ? 'blue' : 'pink',
    editHref: item.url ?? '/products',
  };
}

interface Props {
  heading: string;
  productHeading: string;
  flavorHeading: string;
  occasionHeading: string;
  priceHeading: string;
  editLabel: string;
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
  editLabel,
  subtotalLabel,
  checkoutLabel,
  emptyMessage,
}: Props) {
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [total, setTotal] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (window as unknown as { LoadSnipcart?: () => void }).LoadSnipcart?.();

    function readState() {
      const snipcart = (window as unknown as { Snipcart?: any }).Snipcart;
      const cart = snipcart?.store?.getState?.()?.cart;
      if (!cart || cancelled) return;
      const displayItems = (cart.items?.items ?? []).map(toDisplayItem);
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

  const accentBlue = 'bg-brand-blue';
  const accentPink = 'bg-brand-pink';
  const labelClass =
    'block font-medium text-black leading-[normal] ' +
    'text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl';
  const valueClass =
    'block font-normal text-black leading-[normal] ' +
    'text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl';

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
            <ul className="list-none m-0 p-0 flex flex-col">
              {items.map((item, i) => (
                <li
                  key={item.id}
                  className={`block ${i > 0 ? 'mt-8 sm:mt-10 md:mt-12 lg:mt-14 xl:mt-16' : ''}`}
                  data-name={`Cart row ${i + 1}`}
                >
                  <div className="flex justify-end mb-4 sm:mb-5 md:mb-6">
                    <a
                      href={item.editHref}
                      className="inline-flex items-center justify-center text-center
                     font-medium text-brand-blue no-underline
                     bg-white border border-brand-border
                     h-10 sm:h-11 md:h-12 lg:h-12 xl:h-14
                     w-32 sm:w-36 md:w-40 lg:w-44 xl:w-52
                     text-sm sm:text-base md:text-base lg:text-lg xl:text-xl
                     transition-[transform,filter] duration-150 ease-out
                     hover:brightness-95 hover:-translate-y-px
                     focus-visible:brightness-95 focus-visible:-translate-y-px focus-visible:outline-hidden"
                    >
                      {editLabel}
                    </a>
                  </div>

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

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-2 md:gap-y-3">
                      <div>
                        <span className={labelClass}>{productHeading}</span>
                        <span className={valueClass}>{item.product}</span>
                      </div>
                      <div>
                        <span className={labelClass}>{flavorHeading}</span>
                        <span className={valueClass}>{item.flavor}</span>
                      </div>
                      <div>
                        <span className={labelClass}>{item.variantLabel}</span>
                        <span className={valueClass}>{item.variantValue}</span>
                      </div>
                      <div>
                        <span className={labelClass}>{occasionHeading}</span>
                        <span className={valueClass}>{item.occasion}</span>
                      </div>
                      <div>
                        <span className={labelClass}>{priceHeading}</span>
                        <span className={valueClass}>{item.price}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

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
