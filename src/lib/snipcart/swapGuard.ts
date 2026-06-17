/**
 * Astro's ClientRouter replaces the entire <body> element on every soft
 * navigation (see Astro's own swap-functions.ts: `oldBody.replaceWith(newBody)`).
 * Its built-in transition:persist mechanism keeps marked elements alive
 * across that by lifting them out to <html> immediately before the swap
 * and back into the new body immediately after — but that is still two
 * real DOM reparenting operations. Snipcart's own MutationObserver
 * reports each of those as "the #snipcart div was removed from the
 * document," even though Astro's own contract ("never removed from
 * `document`") is technically satisfied. That lift exists specifically to
 * stop Safari from losing a <canvas> element's WebGL context during a
 * brief detachment — a narrower guarantee than "never moved at all,"
 * which is what a third-party widget with its own removal-detecting
 * observer (like Snipcart) actually needs.
 *
 * This replaces the default swap with one that never touches #snipcart
 * at all — it is not lifted, not reparented, not part of the diff in any
 * way, for the entire lifetime of the page. Every other piece of the
 * default swap behavior (head elements, root attributes, focus,
 * deselecting scripts) is reused via Astro's own exported helpers from
 * `astro:transitions/client`, so nothing else about transitions changes.
 */
import { swapFunctions } from 'astro:transitions/client';

// Snipcart's loader (lib/snipcart/loader.ts) injects its own <link
// rel="stylesheet"> and <script> into <head> at runtime, the first time
// Snipcart loads. Those tags only ever exist in the live document — the
// freshly-fetched newDocument for the next page never had Snipcart's
// loader run on it, so it has neither tag. swapHeadElements() diffs old
// head against newDocument's head and removes anything not present in
// the new one, which means it would delete Snipcart's CSS/JS on the very
// first navigation after Snipcart has loaded, leaving its DOM rendering
// completely unstyled (it keeps working — its in-memory app state
// survives — just with no stylesheet applied). Lifted out of head before
// the diff and restored after, exactly like #snipcart itself, so the
// diff never sees them and can't remove them.
const SNIPCART_HEAD_SELECTOR = 'link[href*="snipcart.css"], script[src*="snipcart.js"]';

export function installSnipcartSwapGuard(): void {
  document.addEventListener('astro:before-swap', (event) => {
    event.swap = () => {
      const snipcartHeadElements = Array.from(
        document.head.querySelectorAll(SNIPCART_HEAD_SELECTOR)
      );
      snipcartHeadElements.forEach((el) => el.remove());

      swapFunctions.deselectScripts(event.newDocument);
      swapFunctions.swapRootAttributes(event.newDocument);
      swapFunctions.swapHeadElements(event.newDocument);
      const restoreFocus = swapFunctions.saveFocus();

      snipcartHeadElements.forEach((el) => document.head.appendChild(el));

      const oldBody = document.body;
      const newBody = event.newDocument.body;

      Array.from(oldBody.children).forEach((child) => {
        if (child.id !== 'snipcart') child.remove();
      });
      Array.from(newBody.children).forEach((child) => {
        if (child.id !== 'snipcart') oldBody.appendChild(child);
      });

      restoreFocus();
    };
  });
}
