// Wires an order-step <form>: restores prior values, captures input to the
// draft store, and turns NEXT into client-side navigation. No method="post",
// so nothing 405s on Vercel and no PII rides a page navigation.
import { navigate } from 'astro:transitions/client';
import { getDraft, updateDraft, type OrderDraft } from './draftStore';
import { syncDraft } from './draftSink';

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

interface Options {
  nextHref: string;
  /** Extra validation after native reportValidity(); return false to block NEXT. */
  validate?: () => boolean;
  /** Static context recorded on bind, e.g. { fulfillment: 'delivery' }. */
  seed?: OrderDraft;
}

// Capture on a pause rather than per keystroke: longer than the gap between
// keystrokes, short enough to fire as the customer finishes a field.
const COMMIT_DEBOUNCE_MS = 3_000;

function valueOf(el: Field): string | undefined {
  const toggle = el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox');
  return toggle && !el.checked ? undefined : el.value;
}

export function bindOrderCapture(form: HTMLFormElement, opts: Options): void {
  if (form.dataset.captureBound) return; // astro:page-load can fire twice
  form.dataset.captureBound = 'true';

  const fields = Array.from(
    form.querySelectorAll<Field>('input[name], select[name], textarea[name]')
  );

  // Restore prior values so navigating back keeps what was entered.
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

  const commit = () => {
    const patch: OrderDraft = {};
    for (const el of fields) {
      const v = valueOf(el);
      if (v !== undefined) patch[el.name] = v;
    }
    syncDraft(updateDraft(patch));
  };

  if (opts.seed) updateDraft(opts.seed); // local only; rides the next commit

  let timer: ReturnType<typeof setTimeout> | undefined;
  for (const el of fields) {
    el.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(commit, COMMIT_DEBOUNCE_MS);
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    if (opts.validate && !opts.validate()) return;
    clearTimeout(timer);
    commit();
    navigate(opts.nextHref);
  });
}
