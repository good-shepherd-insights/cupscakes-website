import { sanityClient } from '../client';
import { deepStegaClean } from '../stega';

type SanityContactField = {
  id?: string;
  label?: string;
  inputType?: 'text' | 'email' | 'tel';
  required?: boolean;
  autocomplete?: string;
};

type SanityOrderFlow = {
  pickupOrDelivery?: {
    pageTitle?: string;
    pickupHref?: string;
    pickupLabel?: string;
    pickupAriaLabel?: string;
    deliveryHref?: string;
    deliveryLabel?: string;
    deliveryAriaLabel?: string;
  };
  changeLabel?: string;
  changeHref?: string;
  nextLabel?: string;
  contactHeading?: string;
  contactFields?: SanityContactField[];
  schedulingNote?: string;
  leadTimeNote?: string;
  dateSelectionNextHref?: string;
  dateSelectionLeadDays?: number;
  dateSelectionCount?: number;
  otherDateLabel?: string;
  otherDateInputAriaLabel?: string;
  otherDateRequiredMessage?: string;
  pickup?: {
    heading?: string;
    contactInfo?: { accessibleHeading?: string; dateFieldLabel?: string; timeFieldLabel?: string; nextHref?: string };
    dateSelection?: { accessibleHeading?: string; dateSectionHeading?: string };
  };
  delivery?: {
    heading?: string;
    contactInfo?: {
      accessibleHeading?: string;
      addressHeading?: string;
      dateFieldLabel?: string;
      timeFieldLabel?: string;
      deliveryNote?: string;
      addressFields?: SanityContactField[];
      nextHref?: string;
    };
    dateSelection?: { accessibleHeading?: string; dateSectionHeading?: string };
  };
  loading?: {
    loadingLabel?: string;
    continueLabel?: string;
    redirectHref?: string;
    redirectAfterMs?: number;
  };
  cart?: {
    heading?: string;
    tableHeadings?: {
      productHeading?: string;
      flavorHeading?: string;
      occasionHeading?: string;
      priceHeading?: string;
      qtyHeading?: string;
      quantityOptionLabel?: string;
    };
    actions?: {
      editLabel?: string;
      saveLabel?: string;
      cancelLabel?: string;
      removeLabel?: string;
      removingLabel?: string;
    };
    subtotalLabel?: string;
    checkoutLabel?: string;
    emptyMessage?: string;
  };
};

const ORDER_FLOW_QUERY = `*[_type == "orderFlow"][0]`;

function toComponentField(field: SanityContactField) {
  return {
    id: field.id,
    label: field.label,
    type: field.inputType,
    required: field.required,
    autocomplete: field.autocomplete,
  };
}

export async function loadOrderFlowContent() {
  const orderFlow = await sanityClient.fetch<SanityOrderFlow | null>(ORDER_FLOW_QUERY);

  const changeLabel = orderFlow?.changeLabel;
  const changeHref = orderFlow?.changeHref;
  const nextLabel = orderFlow?.nextLabel;
  const contactFields = (orderFlow?.contactFields ?? []).map(toComponentField);

  return deepStegaClean({
    pickupOrDelivery: {
      pageTitle: orderFlow?.pickupOrDelivery?.pageTitle,
      pickupHref: orderFlow?.pickupOrDelivery?.pickupHref,
      pickupLabel: orderFlow?.pickupOrDelivery?.pickupLabel,
      deliveryHref: orderFlow?.pickupOrDelivery?.deliveryHref,
      deliveryLabel: orderFlow?.pickupOrDelivery?.deliveryLabel,
      pickupAriaName: orderFlow?.pickupOrDelivery?.pickupAriaLabel,
      deliveryAriaName: orderFlow?.pickupOrDelivery?.deliveryAriaLabel,
    },
    pickup: {
      heading: orderFlow?.pickup?.heading,
      accessibleHeading: orderFlow?.pickup?.contactInfo?.accessibleHeading,
      changeLabel,
      changeHref,
      contactHeading: orderFlow?.contactHeading,
      contactFields,
      dateLabel: orderFlow?.pickup?.contactInfo?.dateFieldLabel,
      timeLabel: orderFlow?.pickup?.contactInfo?.timeFieldLabel,
      schedulingNote: orderFlow?.schedulingNote,
      nextLabel,
      nextHref: orderFlow?.pickup?.contactInfo?.nextHref,
    },
    delivery: {
      heading: orderFlow?.delivery?.heading,
      accessibleHeading: orderFlow?.delivery?.contactInfo?.accessibleHeading,
      changeLabel,
      changeHref,
      contactHeading: orderFlow?.contactHeading,
      addressHeading: orderFlow?.delivery?.contactInfo?.addressHeading,
      contactFields,
      addressFields: (orderFlow?.delivery?.contactInfo?.addressFields ?? []).map(toComponentField),
      dateLabel: orderFlow?.delivery?.contactInfo?.dateFieldLabel,
      timeLabel: orderFlow?.delivery?.contactInfo?.timeFieldLabel,
      schedulingNote: orderFlow?.schedulingNote,
      deliveryNote: orderFlow?.delivery?.contactInfo?.deliveryNote,
      nextLabel,
      nextHref: orderFlow?.delivery?.contactInfo?.nextHref,
    },
    pickupDate: {
      heading: orderFlow?.pickup?.heading,
      accessibleHeading: orderFlow?.pickup?.dateSelection?.accessibleHeading,
      changeLabel,
      changeHref,
      dateHeading: orderFlow?.pickup?.dateSelection?.dateSectionHeading,
      helperNote: orderFlow?.leadTimeNote,
      nextLabel,
      nextHref: orderFlow?.dateSelectionNextHref,
      leadDays: orderFlow?.dateSelectionLeadDays,
      dateCount: orderFlow?.dateSelectionCount,
      otherDateLabel: orderFlow?.otherDateLabel,
      otherDateInputAriaLabel: orderFlow?.otherDateInputAriaLabel,
      otherDateRequiredMessage: orderFlow?.otherDateRequiredMessage,
    },
    deliveryDate: {
      heading: orderFlow?.delivery?.heading,
      accessibleHeading: orderFlow?.delivery?.dateSelection?.accessibleHeading,
      changeLabel,
      changeHref,
      dateHeading: orderFlow?.delivery?.dateSelection?.dateSectionHeading,
      helperNote: orderFlow?.leadTimeNote,
      nextLabel,
      nextHref: orderFlow?.dateSelectionNextHref,
      leadDays: orderFlow?.dateSelectionLeadDays,
      dateCount: orderFlow?.dateSelectionCount,
      otherDateLabel: orderFlow?.otherDateLabel,
      otherDateInputAriaLabel: orderFlow?.otherDateInputAriaLabel,
      otherDateRequiredMessage: orderFlow?.otherDateRequiredMessage,
    },
    loading: {
      loadingLabel: orderFlow?.loading?.loadingLabel,
      continueLabel: orderFlow?.loading?.continueLabel,
      redirectHref: orderFlow?.loading?.redirectHref,
      redirectAfterMs: orderFlow?.loading?.redirectAfterMs,
    },
    cart: {
      heading: orderFlow?.cart?.heading,
      productHeading: orderFlow?.cart?.tableHeadings?.productHeading,
      flavorHeading: orderFlow?.cart?.tableHeadings?.flavorHeading,
      occasionHeading: orderFlow?.cart?.tableHeadings?.occasionHeading,
      priceHeading: orderFlow?.cart?.tableHeadings?.priceHeading,
      qtyHeading: orderFlow?.cart?.tableHeadings?.qtyHeading,
      quantityOptionLabel: orderFlow?.cart?.tableHeadings?.quantityOptionLabel,
      editLabel: orderFlow?.cart?.actions?.editLabel,
      saveLabel: orderFlow?.cart?.actions?.saveLabel,
      cancelLabel: orderFlow?.cart?.actions?.cancelLabel,
      removeLabel: orderFlow?.cart?.actions?.removeLabel,
      removingLabel: orderFlow?.cart?.actions?.removingLabel,
      subtotalLabel: orderFlow?.cart?.subtotalLabel,
      checkoutLabel: orderFlow?.cart?.checkoutLabel,
      emptyMessage: orderFlow?.cart?.emptyMessage,
    },
  });
}
