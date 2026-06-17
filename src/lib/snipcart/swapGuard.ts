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

export function installSnipcartSwapGuard(): void {
  document.addEventListener('astro:before-swap', (event) => {
    event.swap = () => {
      swapFunctions.deselectScripts(event.newDocument);
      swapFunctions.swapRootAttributes(event.newDocument);
      swapFunctions.swapHeadElements(event.newDocument);
      const restoreFocus = swapFunctions.saveFocus();

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
