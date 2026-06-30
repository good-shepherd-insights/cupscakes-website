// Wires an order-step <form>'s inputs to the persistent draft store and the
// external sink, and turns the step's submit into client-side navigation.
// There is no method="post": nothing 405s on Vercel and no PII rides a page
// navigation. Data is captured AS IT'S ENTERED (input), not on submit.
import { navigate } from 'astro:transitions/client';
import { getDraft, updateDraft, type OrderDraft } from './draftStore';
import { syncDraft } from './draftSink';

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

interface Options {
  /** Where NEXT navigates once the step is valid. */
  nextHref: string;
  /** Optional extra validation run after native reportValidity(); return
   *  false (after showing your own messages) to block navigation. */
  validate?: () => boolean;
  /** Static context to record on bind, e.g. { fulfillment: 'delivery' }.
   *  Kept generic so this module needs no knowledge of the URL scheme. */
  seed?: OrderDraft;
}

// Capture cadence. We deliberately do NOT write on every keystroke — that's
// wasteful and there's no value in a half-typed field. Instead we debounce so
// capture fires shortly after the customer stops typing, collapsing a field's
// worth of input into a single store write + sink push. The timer resets on
// each keystroke, so it must be longer than the gap between keystrokes (so it
// doesn't fire mid-field) but short enough to fire as soon as they pause or
// move to the next field — a couple of seconds. Entering a simple text field
// takes only a few seconds, so ~3s captures right after a field is finished.
const FIELD_FILL_DEBOUNCE_MS = 3_000;

/** The current value of a field, or undefined for an unchecked radio/checkbox
 *  (so we never record an option the customer didn't actually pick). */
function valueOf(el: Field): string | undefined {
  if (el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox') && !el.checked) {
    return undefined;
  }
  return el.value;
}

export function bindOrderCapture(form: HTMLFormElement, opts: Options): void {
  // astro:page-load can fire twice on initial load; bind each form once.
  if (form.dataset.captureBound === 'true') return;
  form.dataset.captureBound = 'true';

  const fields = Array.from(
    form.querySelectorAll<Field>('input[name], select[name], textarea[name]')
  );

  // Hydrate inputs from the store so navigating back/forward keeps what was
  // entered.
  const draft = getDraft();
  for (const el of fields) {
    const saved = draft[el.name];
    if (saved === undefined) continue;
    if (el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox')) {
      el.checked = el.value === saved;
    } else {
      el.value = saved;
    }
  }

  // A snapshot of every currently-filled field.
  const snapshot = (): OrderDraft => {
    const patch: OrderDraft = {};
    for (const el of fields) {
      const v = valueOf(el);
      if (v !== undefined) patch[el.name] = v;
    }
    return patch;
  };

  // Persist the snapshot to the store and push it to the sink, in one go.
  const commit = () => syncDraft(updateDraft(snapshot()));

  // Record the step's static context (e.g. pickup vs delivery) in the store
  // now. No sink push here — it rides the next commit/flush so a bare page
  // load with no input doesn't transmit.
  if (opts.seed) updateDraft(opts.seed);

  // Capture on a pause, not per keystroke: every input resets a single timer;
  // when the customer stops for ~one field's worth of time, commit once.
  let commitTimer: ReturnType<typeof setTimeout> | undefined;
  const scheduleCommit = () => {
    clearTimeout(commitTimer);
    commitTimer = setTimeout(commit, FIELD_FILL_DEBOUNCE_MS);
  };
  for (const el of fields) {
    el.addEventListener('input', scheduleCommit);
  }

  // Submit = validate + client navigate. Never POSTs. Cancel any pending
  // debounce and flush the final snapshot immediately before leaving.
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    if (opts.validate && !opts.validate()) return;
    clearTimeout(commitTimer);
    commit();
    navigate(opts.nextHref);
  });
}
